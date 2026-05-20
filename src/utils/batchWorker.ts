// Web Worker for high-performance batch simulation & Monte Carlo calculation
// Completely self-contained to run flawlessly in isolated browser thread

// 1. PRNG UTILS
function cyrb128(str: string): number[] {
  let h1 = 1779033703, h2 = 3024733165, h3 = 3362453659, h4 = 5024943;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

function mulberry32(a: number): () => number {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chooseWeighted(options: any[], weights: number[], rand: () => number): any {
  if (options.length === 0) {
    throw new Error("Cannot select from empty list");
  }
  const sum = weights.reduce((acc, val) => acc + val, 0);
  if (sum <= 0) {
    return options[Math.floor(rand() * options.length)];
  }
  let r = rand() * sum;
  for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      return options[i];
    }
  }
  return options[options.length - 1];
}

function randRange(min: number, max: number, rand: () => number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

// 2. ENGINE HELPER PIPELINE
function parseCleanTag(rawTag: string): { name: string; weight: number } | null {
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

function addTagsToMemory(npcMemoria: Record<string, number>, tags: string[] | undefined) {
  if (!tags) return;
  for (const rawTag of tags) {
    const parsed = parseCleanTag(rawTag);
    if (parsed) {
      npcMemoria[parsed.name] = parsed.weight;
    }
  }
}

function hasTag(npcMemoria: Record<string, number>, tagToCheck: string): boolean {
  if (!tagToCheck) return false;
  const cleanTag = tagToCheck.trim().toLowerCase();
  return Object.keys(npcMemoria).some(k => k.toLowerCase() === cleanTag);
}

function getTagWeight(npcMemoria: Record<string, number>, tagToCheck: string): number {
  if (!tagToCheck) return 1.0;
  const cleanTag = tagToCheck.trim().toLowerCase();
  const matchedKey = Object.keys(npcMemoria).find(k => k.toLowerCase() === cleanTag);
  return matchedKey ? (npcMemoria[matchedKey] !== undefined ? npcMemoria[matchedKey] : 1.0) : 1.0;
}

// 3. ENGINE GENERATION CASACADE
function generateNPC(
  seed: string,
  demografiaList: any[],
  socioeconomicoList: any[],
  tagDefList: any[],
  estadosList: any[],
  nomesList: any[],
  cidadesList: any[]
): any {
  const seedHash = cyrb128(seed);
  const rand = mulberry32(seedHash[0]);

  if (demografiaList.length === 0) {
    throw new Error("A tabela de Demografia não pode estar vazia.");
  }

  // FASE 0: ESTADO
  let estadoSorteado: any;
  if (estadosList.length > 0) {
    const weightsEst = estadosList.map((e: any) => e.peso_base);
    estadoSorteado = chooseWeighted(estadosList, weightsEst, rand);
  } else {
    estadoSorteado = { id_estado: "EST_SP", nome_estado: "São Paulo", peso_base: 100, add_tags: ["Regiao_Sudeste", "Metropole"] };
  }

  const siglaEstadoClean = (estadoSorteado.id_estado || "")
    .replace("EST_", "")
    .replace(/[\[\]"']/g, "")
    .trim()
    .toUpperCase();
  const ufTag = `UF_${siglaEstadoClean}`;

  const npcMemoria: Record<string, number> = {};
  addTagsToMemory(npcMemoria, [ufTag]);
  addTagsToMemory(npcMemoria, estadoSorteado.add_tags);

  // FASE 0.5: CIDADE
  let cidadeSorteada: any = undefined;
  if (cidadesList.length > 0) {
    const cidadesValidas = cidadesList.filter((c: any) => {
      const reqTags = (c.req_tags || [])
        .map((t: string) => parseCleanTag(t))
        .filter((t: any) => t !== null);

      if (reqTags.length === 0) return true;
      return reqTags.some((tag: any) => hasTag(npcMemoria, tag.name));
    });

    let cidadesParaSorteio = cidadesValidas.length > 0 ? cidadesValidas : cidadesList;
    if (cidadesParaSorteio.length > 0) {
      const weightsCidades = cidadesParaSorteio.map((c: any) => {
        let pesoFinal = c.peso_base;
        const reqTags = (c.req_tags || [])
          .map((t: string) => parseCleanTag(t))
          .filter((t: any) => t !== null);
        
        for (const rt of reqTags) {
          if (hasTag(npcMemoria, rt.name)) {
            pesoFinal *= getTagWeight(npcMemoria, rt.name);
          }
        }
        return pesoFinal;
      });
      cidadeSorteada = chooseWeighted(cidadesParaSorteio, weightsCidades, rand);
    }

    if (cidadeSorteada && cidadeSorteada.add_tags) {
      addTagsToMemory(npcMemoria, cidadeSorteada.add_tags);
    }
  }

  // FASE 1: DEMOGRAFIA
  const weightsDemo = demografiaList.map((d: any) => d.peso_base);
  const perfilSorteado = chooseWeighted(demografiaList, weightsDemo, rand);
  const idadeExata = randRange(perfilSorteado.idade_min, perfilSorteado.idade_max, rand);

  if (perfilSorteado.add_tags) {
    addTagsToMemory(npcMemoria, perfilSorteado.add_tags);
  }

  // FASE 1.5: PROCEDURAL NAME
  let nomeSorteado = "Cidadão";
  if (nomesList.length > 0) {
    const nomesValidos = nomesList.filter((n: any) => {
      if (!n.req_tags || n.req_tags.length === 0) return true;
      return n.req_tags.every((tag: string) => hasTag(npcMemoria, tag));
    });

    const nomesParaSorteio = nomesValidos.length > 0 ? nomesValidos : nomesList;
    const weightsNomes = nomesParaSorteio.map((n: any) => {
      let pesoFinal = n.peso_base;
      const reqTags = (n.req_tags || [])
        .map((t: string) => parseCleanTag(t))
        .filter((t: any) => t !== null);
      for (const rt of reqTags) {
        if (hasTag(npcMemoria, rt.name)) {
          pesoFinal *= getTagWeight(npcMemoria, rt.name);
        }
      }
      return pesoFinal;
    });
    const escolhido = chooseWeighted(nomesParaSorteio, weightsNomes, rand);
    nomeSorteado = escolhido.nome;
  }

  // FASE 2: SOCIOECONÔMICO
  let ocupacaoEscolhida = "Comerciante";
  let idSocio = "";
  const profissoesValidas: { row: any; pesoFinal: number }[] = [];

  for (const row of socioeconomicoList) {
    const reqTags = (row.req_tags || [])
      .map((t: string) => parseCleanTag(t))
      .filter((t: any) => t !== null);
      
    const reqsMatch = reqTags.every((req: any) => hasTag(npcMemoria, req.name));
    if (reqsMatch) {
      let pesoFinal = row.peso_base;
      for (const rt of reqTags) {
        if (hasTag(npcMemoria, rt.name)) {
          pesoFinal *= getTagWeight(npcMemoria, rt.name);
        }
      }
      if (row.mult_tags) {
        for (const [tag, mult] of Object.entries(row.mult_tags)) {
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
    idSocio = profissaoSorteada.id_socio;
    if (profissaoSorteada.add_tags) {
      addTagsToMemory(npcMemoria, profissaoSorteada.add_tags);
    }
  }

  // FASE 3: RESOLUÇÃO FINAL CONTAS
  const saudeBase = 100;
  const felicidadeBase = 50;
  
  let modSaudeSoma = 0;
  let modFelicidadeSoma = 0;
  let modRendaSoma = 0;

  for (const [tag, peso] of Object.entries(npcMemoria)) {
    const matchedDef = tagDefList.find((t: any) => t.tag.toLowerCase() === tag.toLowerCase());
    if (matchedDef) {
      modSaudeSoma += matchedDef.mod_saude * peso;
      modFelicidadeSoma += matchedDef.mod_felicidade * peso;
      modRendaSoma += matchedDef.mod_renda_mensal * peso;
    }
  }

  const isFemale = rand() > 0.5;
  const genero = isFemale ? "Feminino" : "Masculino";

  return {
    seed: seed,
    nome: nomeSorteado,
    idade: idadeExata,
    descricaoDemo: perfilSorteado.descricao,
    idDemo: perfilSorteado.id_demo,
    nomeEstado: estadoSorteado.nome_estado,
    idEstado: estadoSorteado.id_estado,
    nomeCidade: cidadeSorteada ? cidadeSorteada.nome_cidade : "Nenhuma",
    idCidade: cidadeSorteada ? cidadeSorteada.id_cidade : "",
    profissao: ocupacaoEscolhida,
    idSocio: idSocio,
    tagsMemoria: npcMemoria,
    saude: saudeBase + modSaudeSoma,
    felicidade: felicidadeBase + modFelicidadeSoma,
    renda: modRendaSoma,
    genero: genero,
  };
}

// 4. CRITERIA MATCHING FOR MONTE CARLO
interface CriteriaFilter {
  value: string;
  isNegated: boolean;
}

interface MonteCarloCriteria {
  professions: CriteriaFilter[];
  states: CriteriaFilter[];
  cities: CriteriaFilter[];
  tags: CriteriaFilter[];
}

function matchesCriteria(npc: any, criteria: MonteCarloCriteria): boolean {
  // professions
  for (const c of criteria.professions) {
    const isMatch = npc.profissao.toLowerCase().includes(c.value) || (npc.idSocio || "").toLowerCase() === c.value;
    if (c.isNegated ? isMatch : !isMatch) return false;
  }
  // states
  for (const c of criteria.states) {
    const isMatch = npc.nomeEstado.toLowerCase().includes(c.value) || npc.idEstado.toLowerCase() === c.value;
    if (c.isNegated ? isMatch : !isMatch) return false;
  }
  // cities
  for (const c of criteria.cities) {
    const isMatch = npc.nomeCidade.toLowerCase().includes(c.value) || npc.idCidade.toLowerCase() === c.value;
    if (c.isNegated ? isMatch : !isMatch) return false;
  }
  // tags
  for (const c of criteria.tags) {
    const keys = Object.keys(npc.tagsMemoria || {}).map(k => k.toLowerCase());
    const isMatch = keys.includes(c.value);
    if (c.isNegated ? isMatch : !isMatch) return false;
  }
  return true;
}

// 5. WORKER HANDLER
self.onmessage = function (e: MessageEvent) {
  const {
    type,
    demografiaList,
    socioeconomicoList,
    tagDefList,
    estadosList,
    nomesList,
    cidadesList,
    totalCount,
    startSeedIndex,
    seedPrefix,
    chunkSize = 10000,
    criteria
  } = e.data;

  if (type === "start") {
    // Stat structures
    const stats = {
      demographics: {} as Record<string, number>,
      professions: {} as Record<string, number>,
      states: {} as Record<string, number>,
      cities: {} as Record<string, number>,
      tags: {} as Record<string, number>,
      genders: {
        "Masculino": 0,
        "Feminino": 0
      } as Record<string, number>,
      ageBuckets: {
        "18-29": 0,
        "30-49": 0,
        "50-69": 0,
        "70+": 0
      } as Record<string, number>,
      metrics: {
        healthSum: 0,
        happinessSum: 0,
        incomeSum: 0,
        minHealth: Infinity,
        maxHealth: -Infinity,
        minHappiness: Infinity,
        maxHappiness: -Infinity,
        minRenda: Infinity,
        maxRenda: -Infinity,
        count: 0
      },
      monteCarloMatches: 0
    };

    // Keep some sample detailed NPCs (e.g. max 25000 for visual preview, copying, and rich BI filters)
    const samples: any[] = [];
    const MAX_SAMPLES = 25000;

    let processed = 0;

    while (processed < totalCount) {
      const remaining = totalCount - processed;
      const currentChunkSize = Math.min(chunkSize, remaining);

      for (let i = 0; i < currentChunkSize; i++) {
        const index = startSeedIndex + processed + i;
        const seed = `${seedPrefix}_${index}`;
        
        try {
          // Generate citizen
          const npc = generateNPC(
            seed,
            demografiaList,
            socioeconomicoList,
            tagDefList,
            estadosList,
            nomesList,
            cidadesList
          );

          // 1. Stats demographics
          const dKey = npc.idDemo || "DESCONHECIDO";
          stats.demographics[dKey] = (stats.demographics[dKey] || 0) + 1;

          // 2. Stats professions
          const pKey = npc.profissao || "DESCONHECIDA";
          stats.professions[pKey] = (stats.professions[pKey] || 0) + 1;

          // 3. Stats states
          const stKey = npc.idEstado || "DESCONHECIDO";
          stats.states[stKey] = (stats.states[stKey] || 0) + 1;

          // 4. Stats cities
          const ctKey = npc.nomeCidade || "Nenhuma";
          stats.cities[ctKey] = (stats.cities[ctKey] || 0) + 1;

          // 5. Stats active tags
          if (npc.tagsMemoria) {
            for (const tag of Object.keys(npc.tagsMemoria)) {
              stats.tags[tag] = (stats.tags[tag] || 0) + 1;
            }
          }

          // 5.5. Stats genders
          const gKey = npc.genero || "Masculino";
          stats.genders[gKey] = (stats.genders[gKey] || 0) + 1;

          // 6. Age buckets
          const age = npc.idade;
          if (age >= 18 && age <= 29) stats.ageBuckets["18-29"]++;
          else if (age >= 30 && age <= 49) stats.ageBuckets["30-49"]++;
          else if (age >= 50 && age <= 69) stats.ageBuckets["50-69"]++;
          else if (age >= 70) stats.ageBuckets["70+"]++;

          // 7. General metrics
          stats.metrics.healthSum += npc.saude;
          stats.metrics.happinessSum += npc.felicidade;
          stats.metrics.incomeSum += npc.renda;
          stats.metrics.count++;

          if (npc.saude < stats.metrics.minHealth) stats.metrics.minHealth = npc.saude;
          if (npc.saude > stats.metrics.maxHealth) stats.metrics.maxHealth = npc.saude;

          if (npc.felicidade < stats.metrics.minHappiness) stats.metrics.minHappiness = npc.felicidade;
          if (npc.felicidade > stats.metrics.maxHappiness) stats.metrics.maxHappiness = npc.felicidade;

          if (npc.renda < stats.metrics.minRenda) stats.metrics.minRenda = npc.renda;
          if (npc.renda > stats.metrics.maxRenda) stats.metrics.maxRenda = npc.renda;

          // 8. Monte Carlo matching evaluation
          if (criteria) {
            const isMatch = matchesCriteria(npc, criteria);
            if (isMatch) {
              stats.monteCarloMatches++;
            }
          }

          // 9. Collect preview samples dynamically
          if (samples.length < MAX_SAMPLES) {
            samples.push({
              seed,
              nome: npc.nome,
              idade: npc.idade,
              descDemo: npc.descricaoDemo,
              idDemo: npc.idDemo,
              genero: npc.genero,
              estado: npc.nomeEstado,
              idEstado: npc.idEstado,
              cidade: npc.nomeCidade,
              idCidade: npc.idCidade,
              profissao: npc.profissao,
              saude: Math.round(npc.saude),
              felicidade: Math.round(npc.felicidade),
              renda: Math.round(npc.renda),
              tags: Object.keys(npc.tagsMemoria || {}).map(t => t.toLowerCase())
            });
          }

        } catch (err: any) {
          // Silent catch or aggregate error counts
          console.error("Worker NPC Gen Error:", err);
        }
      }

      processed += currentChunkSize;

      // Report intermediate status with a small set of preview items to minimize serialization/IPC overhead
      self.postMessage({
        type: "progress",
        completed: processed,
        total: totalCount,
        stats: stats,
        samples: samples.slice(0, 200)
      });
    }

    // Finished
    self.postMessage({
      type: "done",
      stats: stats,
      samples: samples
    });
  }
};
