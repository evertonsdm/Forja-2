import { Demografia, Socioeconomico, TagDef, Estado, NomeDef, CidadeDef, NPC } from "../types";
import { cyrb128, mulberry32, chooseWeighted, randRange } from "./prng";

/**
 * Helper to parse a tag string into name and optional custom weight.
 * e.g., "Jovem:2.5" -> { name: "Jovem", weight: 2.5 }
 * e.g., "Homem" -> { name: "Homem", weight: 1.0 }
 */
export function parseCleanTag(rawTag: string): { name: string; weight: number } | null {
  if (!rawTag) return null;
  const cleanStr = rawTag.replace(/[\[\]"']/g, "").trim().replace(/[\r\n\t]/g, "");
  if (!cleanStr || cleanStr === "none" || cleanStr === "null") return null;

  const colonIndex = cleanStr.indexOf(":");
  let name = cleanStr;
  let weight = 1.0;
  if (colonIndex !== -1) {
    name = cleanStr.substring(0, colonIndex).trim();
    const parsedWeight = parseFloat(cleanStr.substring(colonIndex + 1).trim());
    if (!isNaN(parsedWeight)) {
      weight = parsedWeight;
    }
  }
  return { name, weight };
}

/**
 * Utility to parse and feed tags with weights into the NPC memory object.
 */
export function addTagsToMemory(npcMemoria: Record<string, number>, tags: string[] | undefined) {
  if (!tags) return;
  for (const rawTag of tags) {
    const parsed = parseCleanTag(rawTag);
    if (parsed) {
      npcMemoria[parsed.name] = parsed.weight;
    }
  }
}

/**
 * Checks if a target tag is present in the memory (case-insensitive).
 */
export function hasTag(npcMemoria: Record<string, number>, tagToCheck: string): boolean {
  if (!tagToCheck) return false;
  const cleanTag = tagToCheck.trim().toLowerCase();
  return Object.keys(npcMemoria).some(k => k.toLowerCase() === cleanTag);
}

/**
 * Retrieves the weight associated with a tag from the memory (case-insensitive).
 * Defaults to 1.0 if not present.
 */
export function getTagWeight(npcMemoria: Record<string, number>, tagToCheck: string): number {
  if (!tagToCheck) return 1.0;
  const cleanTag = tagToCheck.trim().toLowerCase();
  const matchedKey = Object.keys(npcMemoria).find(k => k.toLowerCase() === cleanTag);
  return matchedKey ? (npcMemoria[matchedKey] ?? 1.0) : 1.0;
}

/**
 * Executes the RuleForge generation cascade to build a deterministic NPC based on a seed.
 */
export function generateNPC(
  seed: string,
  demografiaList: Demografia[],
  socioeconomicoList: Socioeconomico[],
  tagDefList: TagDef[],
  estadosList: Estado[],
  nomesList: NomeDef[],
  cidadesList: CidadeDef[],
  locks?: {
    estadoId?: string | null;
    cidadeId?: string | null;
    demografiaId?: string | null;
    socioId?: string | null;
    nomeId?: string | null;
  }
): NPC {
  // 1. Initialise the PRNG with the seed hash
  const seedHash = cyrb128(seed);
  const seedInt = seedHash[0];
  const rand = mulberry32(seedInt);

  // Fallback if demografiaList is completely empty
  if (demografiaList.length === 0) {
    throw new Error("A tabela de Demografia não pode estar vazia.");
  }

  const states = estadosList && estadosList.length > 0 ? estadosList : [];
  const names = nomesList && nomesList.length > 0 ? nomesList : [];
  const cities = cidadesList && cidadesList.length > 0 ? cidadesList : [];

  // FASE 0: ESTADO (REGIONAL ORIGIN)
  let estadoSorteado: Estado;
  if (locks?.estadoId) {
    const found = states.find((e) => e.id_estado === locks.estadoId);
    if (found) {
      estadoSorteado = found;
    } else {
      if (states.length > 0) {
        const weightsEst = states.map((e) => e.peso_base);
        estadoSorteado = chooseWeighted(states, weightsEst, rand);
      } else {
        estadoSorteado = { id_estado: "EST_SP", nome_estado: "São Paulo", peso_base: 100, add_tags: ["Regiao_Sudeste", "Metropole"] };
      }
    }
  } else {
    if (states.length > 0) {
      const weightsEst = states.map((e) => e.peso_base);
      estadoSorteado = chooseWeighted(states, weightsEst, rand);
    } else {
      estadoSorteado = {
        id_estado: "EST_SP",
        nome_estado: "São Paulo",
        peso_base: 100,
        add_tags: ["Regiao_Sudeste", "Metropole"]
      };
    }
  }

  // REFORÇO NA MEMÓRIA DE TAGS (PARIDADE E DICIONÁRIO DE PESO)
  // Certificando de que a tag de identificação do estado (ex: UF_SP) seja adicionada limpa de caracteres ocultos ou quebras de linha
  const siglaEstadoClean = (estadoSorteado.id_estado || "")
    .replace("EST_", "")
    .replace(/[\[\]"']/g, "")
    .trim()
    .toUpperCase();
  const ufTag = `UF_${siglaEstadoClean}`;

  const npcMemoria: Record<string, number> = {};
  addTagsToMemory(npcMemoria, [ufTag]);
  addTagsToMemory(npcMemoria, estadoSorteado.add_tags);

  // FASE 0.5: CIDADE (MICRO-GEOGRAFIA)
  let cidadeSorteada: CidadeDef | undefined = undefined;
  if (cities.length > 0) {
    if (locks?.cidadeId) {
      cidadeSorteada = cities.find((c) => c.id_cidade === locks.cidadeId);
    } else {
      // VALIDAÇÃO ESTRITA NA FASE 0.5:
      // Converter e normalizar os itens das listas, e verificar se pelo menos um dos itens de req_tags está contido no npcMemoria
      const cidadesValidas = cities.filter((c) => {
        const reqTags = (c.req_tags || [])
          .map(t => parseCleanTag(t))
          .filter((t): t is { name: string; weight: number } => t !== null);

        if (reqTags.length === 0) return true;
        return reqTags.some((tag) => hasTag(npcMemoria, tag.name));
      });

      // DEBUGGING DE VISIBILIDADE (Logs de rastreamento)
      const tagsListForLog = Object.entries(npcMemoria).map(([k, v]) => `${k}:${v}`);
      console.log(`Tags atuais do NPC: [${tagsListForLog.join(", ")}]`);
      console.log(`Cidades filtradas pelo estado: [${cidadesValidas.map(c => c.nome_cidade).join(", ")}]`);

      let cidadesParaSorteio = cidadesValidas;
      if (cidadesValidas.length === 0) {
        console.error(
          `[RuleForge] ERRO DE PARIDADE: cidades_validas para o estado "${estadoSorteado.nome_estado}" (${ufTag}) resultou em uma lista VAZIA!\n` +
          `Nenhuma cidade de df_cidades atendeu os requisitos. Efetuando re-roll forçado com todas as cidades do sistema.`
        );
        cidadesParaSorteio = cities;
      }

      if (cidadesParaSorteio.length > 0) {
        const weightsCidades = cidadesParaSorteio.map((c) => {
          let pesoFinal = c.peso_base;
          const reqTags = (c.req_tags || [])
            .map(t => parseCleanTag(t))
            .filter((t): t is { name: string; weight: number } => t !== null);
          
          for (const rt of reqTags) {
            if (hasTag(npcMemoria, rt.name)) {
              pesoFinal *= getTagWeight(npcMemoria, rt.name);
            }
          }
          return pesoFinal;
        });
        cidadeSorteada = chooseWeighted(cidadesParaSorteio, weightsCidades, rand);
      }
    }

    if (cidadeSorteada && cidadeSorteada.add_tags) {
      addTagsToMemory(npcMemoria, cidadeSorteada.add_tags);
    }
  }

  // FASE 1: DEMOGRAFIA
  let perfilSorteado: Demografia;
  if (locks?.demografiaId) {
    perfilSorteado = demografiaList.find((d) => d.id_demo === locks.demografiaId) || demografiaList[0];
  } else {
    const weightsDemo = demografiaList.map((d) => d.peso_base);
    perfilSorteado = chooseWeighted(demografiaList, weightsDemo, rand);
  }
  
  // Random range for precise numerical age
  const idadeExata = randRange(perfilSorteado.idade_min, perfilSorteado.idade_max, rand);
  
  // Append demographic tags
  if (perfilSorteado.add_tags) {
    addTagsToMemory(npcMemoria, perfilSorteado.add_tags);
  }

  // FASE 1.5: PROCEDURAL NAME RESOLUTION
  let nomeSorteado = "Cidadão Anônimo";
  if (names.length > 0) {
    if (locks?.nomeId) {
      const found = names.find((n) => n.id_nome === locks.nomeId);
      if (found) nomeSorteado = found.nome;
    } else {
      const nomesValidos = names.filter((n) => {
        if (!n.req_tags || n.req_tags.length === 0) return true;
        return n.req_tags.every((tag) => hasTag(npcMemoria, tag));
      });

      if (nomesValidos.length > 0) {
        const weightsNomes = nomesValidos.map((n) => {
          let pesoFinal = n.peso_base;
          const reqTags = (n.req_tags || [])
            .map(t => parseCleanTag(t))
            .filter((t): t is { name: string; weight: number } => t !== null);
          
          for (const rt of reqTags) {
            if (hasTag(npcMemoria, rt.name)) {
              pesoFinal *= getTagWeight(npcMemoria, rt.name);
            }
          }
          return pesoFinal;
        });
        const escolhido = chooseWeighted(nomesValidos, weightsNomes, rand);
        nomeSorteado = escolhido.nome;
      } else {
        // Fallback: choose from any name
        const weightsNomes = names.map((n) => n.peso_base);
        const escolhido = chooseWeighted(names, weightsNomes, rand);
        nomeSorteado = escolhido.nome;
      }
    }
  }

  // FASE 2: SOCIOECONÔMICO
  let ocupacaoEscolhida = "Desempregado";

  if (locks?.socioId) {
    const found = socioeconomicoList.find((s) => s.id_socio === locks.socioId);
    if (found) {
      ocupacaoEscolhida = found.profissao;
      if (found.add_tags) {
        addTagsToMemory(npcMemoria, found.add_tags);
      }
    }
  } else {
    const profissoesValidas: { row: Socioeconomico; pesoFinal: number }[] = [];

    for (const row of socioeconomicoList) {
      // Restrictive Tag Validation (all req_tags must be present in actor memory tags)
      const reqTags = (row.req_tags || [])
        .map((t) => parseCleanTag(t))
        .filter((t): t is { name: string; weight: number } => t !== null);
        
      const reqsMatch = reqTags.every((req) => hasTag(npcMemoria, req.name));
      
      if (reqsMatch) {
        // Dynamic weight multiplication based on math multipliers
        let pesoFinal = row.peso_base;
        
        // Multiplier from req_tags in npcMemoria
        for (const rt of reqTags) {
          pesoFinal *= getTagWeight(npcMemoria, rt.name);
        }
        
        // Multiplier from mult_tags: replacing spreadsheet constant multipliers with the tag weight inside npc_memoria!
        if (row.mult_tags) {
          for (const [tag, multiplierFromCode] of Object.entries(row.mult_tags)) {
            if (hasTag(npcMemoria, tag)) {
              pesoFinal *= getTagWeight(npcMemoria, tag);
            }
          }
        }
        
        if (pesoFinal > 0) {
          profissoesValidas.push({ row, pesoFinal });
        }
      }
    }

    if (profissoesValidas.length > 0) {
      const opcoes = profissoesValidas.map((item) => item.row);
      const pesos = profissoesValidas.map((item) => item.pesoFinal);
      const profissaoSorteada = chooseWeighted(opcoes, pesos, rand);
      ocupacaoEscolhida = profissaoSorteada.profissao;
      // Append tags
      if (profissaoSorteada.add_tags) {
        addTagsToMemory(npcMemoria, profissaoSorteada.add_tags);
      }
    }
  }

  // FASE 3: RESOLUÇÃO FINAL (STATUS RESOLUTION)
  const saudeBase = 100;
  const felicidadeBase = 50;
  
  let modSaudeSoma = 0;
  let modFelicidadeSoma = 0;
  let modRendaSoma = 0;

  for (const [tag, peso] of Object.entries(npcMemoria)) {
    const matchedDef = tagDefList.find((t) => t.tag.toLowerCase() === tag.toLowerCase());
    if (matchedDef) {
      modSaudeSoma += matchedDef.mod_saude * peso;
      modFelicidadeSoma += matchedDef.mod_felicidade * peso;
      modRendaSoma += matchedDef.mod_renda_mensal * peso;
    }
  }

  const saudeFinal = saudeBase + modSaudeSoma;
  const felicidadeFinal = felicidadeBase + modFelicidadeSoma;
  const rendaFinal = modRendaSoma;

  return {
    seed,
    nome: nomeSorteado,
    idade: idadeExata,
    demografia: perfilSorteado,
    estado: estadoSorteado,
    cidade: cidadeSorteada,
    profissao: ocupacaoEscolhida,
    tagsMemoria: npcMemoria,
    saude: saudeFinal,
    felicidade: felicidadeFinal,
    renda: rendaFinal,
  };
}
