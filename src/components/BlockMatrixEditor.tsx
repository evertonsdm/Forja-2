import React, { useState, useEffect } from "react";
import { Demografia, Socioeconomico, TagDef, Estado, NomeDef, CidadeDef } from "../types";
import { 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Lock, 
  Unlock, 
  Check, 
  RotateCcw, 
  Workflow, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Info,
  FolderOpen,
  Filter,
  X,
  Sliders
} from "lucide-react";

interface BlockMatrixEditorProps {
  demografia: Demografia[];
  socioeconomico: Socioeconomico[];
  tagDef: TagDef[];
  estados: Estado[];
  nomes: NomeDef[];
  cidades: CidadeDef[];
  
  // Callback for sheets/reset sync
  onResetFromSheets: () => Promise<void>;
  isSyncing: boolean;
}

export const BlockMatrixEditor: React.FC<BlockMatrixEditorProps> = ({
  demografia,
  socioeconomico,
  tagDef,
  estados,
  nomes,
  cidades,
  onResetFromSheets,
  isSyncing,
}) => {
  // Active sub-tab target
  const [activeSubTab, setActiveSubTab] = useState<"demo" | "socio" | "cid" | "est" | "nom" | "tags">("demo");

  // Local copies of rules for isolation
  const [localDemo, setLocalDemo] = useState<Demografia[]>([]);
  const [localSocio, setLocalSocio] = useState<Socioeconomico[]>([]);
  const [localCid, setLocalCid] = useState<CidadeDef[]>([]);
  const [localEst, setLocalEst] = useState<Estado[]>([]);
  const [localNom, setLocalNom] = useState<NomeDef[]>([]);
  const [localTags, setLocalTags] = useState<TagDef[]>([]);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Input validation errors
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});

  // Local locks flags for weight options
  const [localLocks, setLocalLocks] = useState<Record<string, boolean>>({});

  // Sheet export feedback tracker
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Selected Block key state to focus editing on exactly ONE chosen block
  // Format: `${activeSubTab}_${index}` e.g., "demo_0", "nom_142"
  const [selectedBlockKey, setSelectedBlockKey] = useState<string | null>(null);

  // Sync state arrays when parents change
  useEffect(() => {
    setLocalDemo(JSON.parse(JSON.stringify(demografia)));
  }, [demografia]);

  useEffect(() => {
    setLocalSocio(JSON.parse(JSON.stringify(socioeconomico)));
  }, [socioeconomico]);

  useEffect(() => {
    setLocalCid(JSON.parse(JSON.stringify(cidades || [])));
  }, [cidades]);

  useEffect(() => {
    setLocalEst(JSON.parse(JSON.stringify(estados)));
  }, [estados]);

  useEffect(() => {
    setLocalNom(JSON.parse(JSON.stringify(nomes)));
  }, [nomes]);

  useEffect(() => {
    setLocalTags(JSON.parse(JSON.stringify(tagDef)));
  }, [tagDef]);

  // Handle local soft resets
  const handleResetLocalMatrix = async () => {
    if (window.confirm("Deseja realmente perder as modificações locais deste Editor de Blocos e re-sincronizar os originais da planilha?")) {
      await onResetFromSheets();
      setSelectedBlockKey(null);
    }
  };

  // Helper validation for floats/commas
  const getNormalizedWeight = (rawVal: string, blockKey: string): { val: number; cleanStr: string } => {
    let cleanStr = rawVal;
    const hasInvalid = /[^0-9.,]/.test(cleanStr);
    
    if (hasInvalid) {
      setInputErrors((prev) => ({ ...prev, [blockKey]: "Apenas números, . ou ," }));
      cleanStr = cleanStr.replace(/[^0-9.,]/g, "");
    } else {
      setInputErrors((prev) => {
        const copy = { ...prev };
        delete copy[blockKey];
        return copy;
      });
    }

    let normalized = cleanStr.replace(/,/g, ".");
    const parts = normalized.split(".");
    if (parts.length > 2) {
      normalized = parts[0] + "." + parts.slice(1).join("");
    }

    const floatVal = parseFloat(normalized);
    return {
      val: isNaN(floatVal) ? 1.0 : floatVal,
      cleanStr: normalized,
    };
  };

  // Input array tag parsers
  const parseTagsInput = (text: string): string[] => {
    return text.split(/[,;\s]+/).map(t => t.trim()).filter(t => t.length > 0);
  };

  const parseMultTagsInput = (text: string): Record<string, number> => {
    const records: Record<string, number> = {};
    const elements = text.split(/[,;]+/);
    for (const el of elements) {
      const parts = el.split(":");
      if (parts.length === 2) {
        const key = parts[0].trim().toLowerCase();
        const num = parseFloat(parts[1].trim().replace(/,/g, "."));
        if (key && !isNaN(num)) {
          records[key] = num;
        }
      }
    }
    return records;
  };

  const serializeMultTags = (rec: Record<string, number> | undefined | null): string => {
    if (!rec) return "";
    return Object.entries(rec).map(([k, v]) => `${k}:${v}`).join(", ");
  };

  // Tag Badge Pill render
  const renderTagPill = (tag: string, onRemove: () => void) => {
    return (
      <span 
        key={tag} 
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono leading-none font-bold text-slate-100 bg-white/20 hover:bg-white/30 border border-white/10"
      >
        <span>{tag}</span>
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-red-400 font-extrabold focus:outline-none text-[8px] leading-none px-0.5 cursor-pointer text-slate-300"
          title="Remover Tag"
        >
          ×
        </button>
      </span>
    );
  };

  // Shift block prioritization list
  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const targetKeyBase = `${activeSubTab}_`;

    if (activeSubTab === "demo") {
      const copy = [...localDemo];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setLocalDemo(copy);
      setSelectedBlockKey(`${targetKeyBase}${index - 1}`);
    } else if (activeSubTab === "socio") {
      const copy = [...localSocio];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setLocalSocio(copy);
      setSelectedBlockKey(`${targetKeyBase}${index - 1}`);
    } else if (activeSubTab === "cid") {
      const copy = [...localCid];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setLocalCid(copy);
      setSelectedBlockKey(`${targetKeyBase}${index - 1}`);
    } else if (activeSubTab === "est") {
      const copy = [...localEst];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setLocalEst(copy);
      setSelectedBlockKey(`${targetKeyBase}${index - 1}`);
    } else if (activeSubTab === "nom") {
      const copy = [...localNom];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setLocalNom(copy);
      setSelectedBlockKey(`${targetKeyBase}${index - 1}`);
    } else if (activeSubTab === "tags") {
      const copy = [...localTags];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setLocalTags(copy);
      setSelectedBlockKey(`${targetKeyBase}${index - 1}`);
    }
  };

  const moveBlockDown = (index: number) => {
    let limit = 0;
    if (activeSubTab === "demo") limit = localDemo.length;
    else if (activeSubTab === "socio") limit = localSocio.length;
    else if (activeSubTab === "cid") limit = localCid.length;
    else if (activeSubTab === "est") limit = localEst.length;
    else if (activeSubTab === "nom") limit = localNom.length;
    else if (activeSubTab === "tags") limit = localTags.length;

    if (index >= limit - 1) return;
    const targetKeyBase = `${activeSubTab}_`;

    if (activeSubTab === "demo") {
      const copy = [...localDemo];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setLocalDemo(copy);
      setSelectedBlockKey(`${targetKeyBase}${index + 1}`);
    } else if (activeSubTab === "socio") {
      const copy = [...localSocio];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setLocalSocio(copy);
      setSelectedBlockKey(`${targetKeyBase}${index + 1}`);
    } else if (activeSubTab === "cid") {
      const copy = [...localCid];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setLocalCid(copy);
      setSelectedBlockKey(`${targetKeyBase}${index + 1}`);
    } else if (activeSubTab === "est") {
      const copy = [...localEst];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setLocalEst(copy);
      setSelectedBlockKey(`${targetKeyBase}${index + 1}`);
    } else if (activeSubTab === "nom") {
      const copy = [...localNom];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setLocalNom(copy);
      setSelectedBlockKey(`${targetKeyBase}${index + 1}`);
    } else if (activeSubTab === "tags") {
      const copy = [...localTags];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setLocalTags(copy);
      setSelectedBlockKey(`${targetKeyBase}${index + 1}`);
    }
  };

  // Creators
  const createBlankBlock = () => {
    const uniqueNum = Math.floor(100 + Math.random() * 900);
    const uniqueId = `nb_${uniqueNum}`;
    
    if (activeSubTab === "demo") {
      const newItem: Demografia = {
        id_demo: `DEMO_${uniqueNum}`,
        descricao: "NovaIdade",
        idade_min: 18,
        idade_max: 50,
        peso_base: 1.0,
        add_tags: ["nova_tag"],
      };
      setLocalDemo([newItem, ...localDemo]);
      setSelectedBlockKey("demo_0");
      setSearchQuery(newItem.id_demo);
    } else if (activeSubTab === "socio") {
      const newItem: Socioeconomico = {
        id_socio: uniqueId,
        profissao: "Profissao Profissional",
        req_tags: [],
        mult_tags: {},
        peso_base: 1.0,
        add_tags: ["especialista"],
      };
      setLocalSocio([newItem, ...localSocio]);
      setSelectedBlockKey("socio_0");
      setSearchQuery(newItem.id_socio);
    } else if (activeSubTab === "cid") {
      const newItem: CidadeDef = {
        id_cidade: `cid_${uniqueNum}`,
        nome_cidade: "Nova Cidade",
        req_tags: [],
        peso_base: 1.0,
        add_tags: [],
      };
      setLocalCid([newItem, ...localCid]);
      setSelectedBlockKey("cid_0");
      setSearchQuery(newItem.id_cidade);
    } else if (activeSubTab === "est") {
      const newItem: Estado = {
        id_estado: `EST_N_${uniqueNum}`,
        nome_estado: "Novo Estado",
        peso_base: 1.0,
        add_tags: [],
      };
      setLocalEst([newItem, ...localEst]);
      setSelectedBlockKey("est_0");
      setSearchQuery(newItem.id_estado);
    } else if (activeSubTab === "nom") {
      const newItem: NomeDef = {
        id_nome: `nome_${uniqueNum}`,
        nome: "NovoNome",
        req_tags: [],
        peso_base: 1.0,
      };
      setLocalNom([newItem, ...localNom]);
      setSelectedBlockKey("nom_0");
      setSearchQuery(newItem.id_nome);
    } else if (activeSubTab === "tags") {
      const newItem: TagDef = {
        tag: `nova_tag_${uniqueNum}`,
        mod_saude: 0,
        mod_felicidade: 0,
        mod_renda_mensal: 0,
      };
      setLocalTags([newItem, ...localTags]);
      setSelectedBlockKey("tags_0");
      setSearchQuery(newItem.tag);
    }
  };

  const deleteBlock = (index: number) => {
    if (activeSubTab === "demo") {
      setLocalDemo(localDemo.filter((_, i) => i !== index));
    } else if (activeSubTab === "socio") {
      setLocalSocio(localSocio.filter((_, i) => i !== index));
    } else if (activeSubTab === "cid") {
      setLocalCid(localCid.filter((_, i) => i !== index));
    } else if (activeSubTab === "est") {
      setLocalEst(localEst.filter((_, i) => i !== index));
    } else if (activeSubTab === "nom") {
      setLocalNom(localNom.filter((_, i) => i !== index));
    } else if (activeSubTab === "tags") {
      setLocalTags(localTags.filter((_, i) => i !== index));
    }
    setSelectedBlockKey(null);
  };

  const toggleLocalLock = (blockKey: string) => {
    setLocalLocks((prev) => ({
      ...prev,
      [blockKey]: !prev[blockKey],
    }));
  };

  const exportCurrentTabToSheetsClipboard = async () => {
    let headers: string[] = [];
    let dataList: any[] = [];
    let tabLabel = "";

    if (activeSubTab === "demo") {
      tabLabel = "Democracia/Demografia";
      headers = ["id_demo", "descricao", "idade_min", "idade_max", "peso_base", "add_tags"];
      dataList = localDemo;
    } else if (activeSubTab === "socio") {
      tabLabel = "Socioeconômico / Profissões";
      headers = ["id_socio", "profissao", "req_tags", "mult_tags", "peso_base", "add_tags"];
      dataList = localSocio;
    } else if (activeSubTab === "cid") {
      tabLabel = "Cidades";
      headers = ["id_cidade", "nome_cidade", "req_tags", "peso_base", "add_tags"];
      dataList = localCid;
    } else if (activeSubTab === "est") {
      tabLabel = "Estados";
      headers = ["id_estado", "nome_estado", "peso_base", "add_tags"];
      dataList = localEst;
    } else if (activeSubTab === "nom") {
      tabLabel = "Nomes";
      headers = ["id_nome", "nome", "peso_base", "req_tags"];
      dataList = localNom;
    } else if (activeSubTab === "tags") {
      tabLabel = "Tags / Atributos básicos";
      headers = ["tag", "mod_saude", "mod_felicidade", "mod_renda_mensal"];
      dataList = localTags;
    }

    const tsvHeaderLine = headers.join("\t");
    const tsvRows = dataList.map((item) => {
      return headers.map((header) => {
        const value = item[header];
        if (Array.isArray(value)) {
          return value.join(", ");
        }
        if (typeof value === "object" && value !== null) {
          return Object.entries(value)
            .map(([k, v]) => `${k}:${v}`)
            .join(", ");
        }
        return value === undefined || value === null ? "" : String(value);
      }).join("\t");
    });

    const fullTSV = [tsvHeaderLine, ...tsvRows].join("\n");

    try {
      await navigator.clipboard.writeText(fullTSV);
      setExportFeedback(`Matriz de ${tabLabel} copiada com sucesso!`);
      setTimeout(() => setExportFeedback(null), 6000);
    } catch (e) {
      console.error(e);
      setExportFeedback("Falha ao salvar string TSV.");
    }
  };

  const getSubTabColor = (tab: "demo" | "socio" | "cid" | "est" | "nom" | "tags") => {
    switch (tab) {
      case "demo": return "#e29e00";
      case "socio": return "#884df2";
      case "cid": return "#0088e5";
      case "est": return "#4caf50";
      case "nom": return "#e91e63";
      case "tags": return "#ff6f00";
    }
  };

  const activeColor = getSubTabColor(activeSubTab);

  // Filter items in active tab according to searchQuery
  // Highly optimized: supports city-to-state logical linkage and strictly cuts off lists of large entries!
  const getFilteredItems = () => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase().trim();
    const isShowAll = query === "*" || query === "all" || query === "tudo";

    if (activeSubTab === "demo") {
      return localDemo
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => {
          if (isShowAll) return true;
          return item.id_demo.toLowerCase().includes(query) || 
                 item.descricao.toLowerCase().includes(query) ||
                 item.add_tags.some(t => t.toLowerCase().includes(query));
        });
    }

    if (activeSubTab === "socio") {
      return localSocio
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => {
          if (isShowAll) return true;
          return (item.id_socio || "").toLowerCase().includes(query) || 
                 item.profissao.toLowerCase().includes(query) ||
                 item.req_tags.some(t => t.toLowerCase().includes(query)) ||
                 (item.add_tags || []).some(t => t.toLowerCase().includes(query));
        });
    }

    if (activeSubTab === "cid") {
      return localCid
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => {
          if (isShowAll) return true;
          return item.id_cidade.toLowerCase().includes(query) || 
                 item.nome_cidade.toLowerCase().includes(query) ||
                 item.req_tags.some(t => t.toLowerCase().includes(query)) ||
                 (item.add_tags || []).some(t => t.toLowerCase().includes(query));
        });
    }

    // MANDATE REMINDER: "Estados por exemplo, eu não quero ver os blocos a partir da propriedade Estado. E sim só a partir da cidade que eu pesquisei. E ocultar as outras."
    if (activeSubTab === "est") {
      if (isShowAll) {
        return localEst.map((item, idx) => ({ item, idx }));
      }
      // Look up our cities array to find any cities matching the query name or city ID
      const matchingCityStateIds = localCid
        .filter(c => c.nome_cidade.toLowerCase().includes(query) || c.id_cidade.toLowerCase().includes(query))
        .flatMap(c => c.req_tags || []);

      return localEst
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => {
          // Direct match with matching parent state ID from cities search
          const matchesByCity = matchingCityStateIds.includes(item.id_estado);
          if (matchesByCity) return true;

          // Fallback to direct name match ONLY if no city query matched
          if (matchingCityStateIds.length === 0) {
            return item.nome_estado.toLowerCase().includes(query) || 
                   item.id_estado.toLowerCase().includes(query);
          }
          return false;
        });
    }

    if (activeSubTab === "nom") {
      return localNom
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => {
          if (isShowAll) return true;
          return item.id_nome.toLowerCase().includes(query) || 
                 item.nome.toLowerCase().includes(query);
        });
    }

    if (activeSubTab === "tags") {
      return localTags
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => {
          if (isShowAll) return true;
          return item.tag.toLowerCase().includes(query);
        });
    }

    return [];
  };

  const filteredItems = getFilteredItems();

  // Auto-focus helper: if exactly 1 result returned, auto-select it to edit
  useEffect(() => {
    if (filteredItems.length === 1) {
      setSelectedBlockKey(`${activeSubTab}_${filteredItems[0].idx}`);
    } else {
      // If active tab or query changes and multiple matches, let user choose, but keep existing selected if it stays in matches
      const isStillInMatches = filteredItems.some(({ idx }) => selectedBlockKey === `${activeSubTab}_${idx}`);
      if (!isStillInMatches) {
        setSelectedBlockKey(null);
      }
    }
  }, [searchQuery, activeSubTab]);

  // Maximum search badges to render in grid to avoid crashing the browser (highly optimized!)
  const SUGGESTS_LIMIT = 20;
  const slicedSuggests = filteredItems.slice(0, SUGGESTS_LIMIT);
  const totalMatchesCount = filteredItems.length;
  const hasMoreThanLimit = totalMatchesCount > SUGGESTS_LIMIT;

  // Retrieve focused selected indexing
  const selectedIndex = selectedBlockKey && selectedBlockKey.startsWith(`${activeSubTab}_`)
    ? parseInt(selectedBlockKey.split("_")[1], 10)
    : -1;

  return (
    <div id="ruleforge-block-editor-view" className="space-y-3.5 text-slate-100 animate-fade-in text-left">
      
      {/* 1. COMPACT INTRO HEADER */}
      <div className="bg-[#10121a]/95 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-[#884df2]/15 border border-[#884df2]/30 shrink-0">
              <Workflow className="w-4 h-4 text-[#884df2]" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black tracking-tight text-white uppercase font-display">
                Editor de Matrix por Chaves Cirúrgicas
              </h2>
              <p className="text-[9px] text-[#FFBF00] font-mono">
                Performance Máxima Otimizada. Exibição estritamente focada e leve para mobile.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 shrink-0 select-none">
          <button
            type="button"
            onClick={createBlankBlock}
            className="flex-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black font-mono text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Criar Bloco</span>
          </button>
          <button
            type="button"
            onClick={handleResetLocalMatrix}
            disabled={isSyncing}
            className="py-1 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-[#FFBF00] disabled:opacity-40 text-slate-300 font-bold font-mono text-[9px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className={`w-3 h-3 text-[#FFBF00] ${isSyncing ? "animate-spin" : ""}`} />
            <span>Resetar</span>
          </button>
        </div>
      </div>

      {/* 2. TAB TOGGLERS BAR */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 select-none">
        {(["demo", "socio", "cid", "est", "nom", "tags"] as const).map((tab) => {
          const tabLabel = tab === "demo" ? "Demog." :
                           tab === "socio" ? "Profiss." :
                           tab === "cid" ? "Cidades" :
                           tab === "est" ? "Estados" :
                           tab === "nom" ? "Nomes" : "Tags";
          const count = tab === "demo" ? localDemo.length :
                        tab === "socio" ? localSocio.length :
                        tab === "cid" ? localCid.length :
                        tab === "est" ? localEst.length :
                        tab === "nom" ? localNom.length : localTags.length;
                           
          const isSelected = activeSubTab === tab;
          const labelColor = getSubTabColor(tab);

          return (
            <button
              key={tab}
              onClick={() => { 
                setActiveSubTab(tab); 
                setExportFeedback(null); 
              }}
              className={`py-1 px-1 rounded-lg border text-[9px] font-mono font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                isSelected
                  ? "shadow-sm"
                  : "bg-slate-900/45 border-slate-900 text-slate-400 hover:text-slate-200"
              }`}
              style={isSelected ? { 
                borderColor: labelColor, 
                color: labelColor,
                backgroundColor: `${labelColor}12`
              } : undefined}
            >
              <div className="w-1 rounded-full shrink-0 h-1.5" style={{ backgroundColor: labelColor }} />
              <span>{tabLabel} <span className="opacity-55">({count})</span></span>
            </button>
          );
        })}
      </div>

      {/* 3. STRICT SEARCH CONTROL */}
      <div className="bg-[#10121a] border border-slate-800/80 rounded-xl p-2 space-y-1.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="🔍 Busque uma chave, ID ou nome de cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-850 focus:border-[#FFBF00] text-[10px] sm:text-xs font-mono rounded-lg text-white outline-none focus:ring-1 focus:ring-[#FFBF00]/20 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setSearchQuery("*")}
              className={`py-1 px-2.5 rounded-lg text-[9px] font-mono font-black border transition-all cursor-pointer ${
                searchQuery === "*" 
                  ? "bg-[#ffbf00] text-slate-950 border-[#ffbf00]"
                  : "bg-slate-900 text-slate-350 border-slate-800 hover:bg-slate-800"
              }`}
            >
              Exibir Tudo (*)
            </button>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="py-1 px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-[9px] font-mono transition-all cursor-pointer"
            >
              Ocultar
            </button>
          </div>
        </div>

        {/* CLUTTER SILENT STATE */}
        {!searchQuery ? (
          <div className="py-1.5 px-2.5 rounded-lg bg-indigo-500/5 border border-dashed border-indigo-500/10 text-slate-400 text-[9px] font-mono flex items-start gap-1.5 leading-tight">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Modo Sem Sobrecarga</strong>. Nenhum bloco é renderizado por padrão. Busque algo (ex: digite <span className="text-[#FFBF00] font-bold cursor-pointer underline" onClick={() => setSearchQuery("sp")}>sp</span> ou clique no botão acima) para trazer à tona instantaneamente apenas a chave desejada.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] font-mono text-slate-400 leading-tight">
            <span>Encontradas <strong>{totalMatchesCount}</strong> chaves correspondentes.</span>
            {hasMoreThanLimit && (
              <span className="text-amber-500 font-bold">⚠️ Exibindo as primeiras {SUGGESTS_LIMIT} linhas. Seja mais específico.</span>
            )}
          </div>
        )}
      </div>

      {/* TSV FEEDBACK BANNER */}
      {exportFeedback && (
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-mono flex items-start gap-2 shadow-sm animate-pulse">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{exportFeedback} </span>
            <span className="text-[8px] text-slate-400">Pode colar (Ctrl+V) de volta no Google Sheets correspondente.</span>
          </div>
        </div>
      )}

      {/* TSV EXPORT ACTIONS */}
      <div className="flex items-center justify-end select-none">
        <button
          onClick={exportCurrentTabToSheetsClipboard}
          className="py-1 px-2.5 bg-[#ffbf00] text-slate-950 font-black font-mono text-[9px] uppercase tracking-wider rounded-lg hover:bg-yellow-400 transition-all flex items-center gap-1 cursor-pointer"
        >
          <FileSpreadsheet className="w-3 h-3 text-slate-950" />
          <span>Copiar TSV da Aba</span>
        </button>
      </div>

      {/* MAIN WORKSYMBOL CANVAS */}
      <div className="p-2 sm:p-3 rounded-xl bg-[#08090d] border border-slate-900 shadow-inner min-h-[140px] flex flex-col gap-3">
        
        {/* Helper visual states when empty */}
        {!searchQuery && (
          <div className="py-8 flex flex-col items-center justify-center text-center text-slate-550">
            <FolderOpen className="w-7 h-7 text-slate-800 mb-1.5 opacity-35" />
            <p className="text-[10px] font-mono font-bold text-slate-500">Workspace Limpo</p>
            <p className="text-[8px] text-slate-600 font-mono mt-0.5">
              Refine a busca para editar.
            </p>
          </div>
        )}

        {searchQuery && totalMatchesCount === 0 && (
          <div className="py-8 flex flex-col items-center justify-center text-center text-slate-550">
            <Filter className="w-7 h-7 text-stone-700 mb-1.5 opacity-30" />
            <p className="text-[10px] font-mono font-bold text-slate-500">Nenhuma correspondência</p>
            <p className="text-[8px] text-slate-600 mt-0.5">
              Tente redefinir a busca no topo ou trocar de aba.
            </p>
          </div>
        )}

        {/* RESULTS SUGGESTION PILLS ARRAY (Painel de Escolhas) */}
        {searchQuery && totalMatchesCount > 0 && (
          <div className="space-y-1">
            <div className="text-[8px] uppercase tracking-wider text-slate-500 font-mono font-bold select-none">
              Passo 1: Selecione a chave para editar
            </div>
            <div className="flex flex-wrap gap-1">
              {slicedSuggests.map(({ item, idx }) => {
                const uniqueIdKey = `${activeSubTab}_${idx}`;
                const isSelected = selectedBlockKey === uniqueIdKey;
                
                // Construct labels depending on types securely
                let labelText = "";
                let itemWeight = 0;
                if (activeSubTab === "demo") {
                  const x = item as Demografia;
                  labelText = `[DEM] ${x.id_demo} - ${x.descricao}`;
                  itemWeight = x.peso_base;
                } else if (activeSubTab === "socio") {
                  const x = item as Socioeconomico;
                  labelText = `[PROF] ${x.id_socio} - ${x.profissao}`;
                  itemWeight = x.peso_base;
                } else if (activeSubTab === "cid") {
                  const x = item as CidadeDef;
                  labelText = `[CID] ${x.id_cidade} - ${x.nome_cidade}`;
                  itemWeight = x.peso_base;
                } else if (activeSubTab === "est") {
                  const x = item as Estado;
                  labelText = `[EST] ${x.id_estado} - ${x.nome_estado}`;
                  itemWeight = x.peso_base;
                } else if (activeSubTab === "nom") {
                  const x = item as NomeDef;
                  labelText = `[NOM] ${x.id_nome} - ${x.nome}`;
                  itemWeight = x.peso_base;
                } else if (activeSubTab === "tags") {
                  const x = item as TagDef;
                  labelText = `[TAG] #${x.tag}`;
                }

                const styleProps = isSelected ? {
                  borderColor: activeColor,
                  color: "#ffffff",
                  backgroundColor: `${activeColor}20`
                } : undefined;

                return (
                  <button
                    key={uniqueIdKey}
                    type="button"
                    style={styleProps}
                    onClick={() => setSelectedBlockKey(isSelected ? null : uniqueIdKey)}
                    className={`py-1 px-2 rounded-lg border text-[9px] font-mono transition-all flex items-center justify-between gap-1.5 cursor-pointer max-w-[200px] sm:max-w-[250px] ${
                      isSelected 
                        ? "shadow-[0_0_6px_rgba(255,191,0,0.15)] font-bold text-white"
                        : "bg-[#10121a]/85 border-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{labelText}</span>
                    {activeSubTab !== "tags" && (
                      <span className="opacity-45 text-[7px]">W:{itemWeight}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SELECTED ITEM HIGH-CONTRAST PUZZLE BLOCK EDITOR (Painel de Edição Focada) */}
        {selectedIndex !== -1 && (
          <div className="mt-2 space-y-1.5 animate-fade-in relative z-30">
            <div className="flex items-center justify-between select-none">
              <div className="text-[8px] uppercase tracking-wider text-slate-500 font-mono font-bold flex items-center gap-1.5">
                <Sliders className="w-2.5 h-2.5 text-slate-500" />
                <span>Passo 2: Ajuste os parâmetros do bloco</span>
              </div>
              
              <button
                type="button"
                onClick={() => setSelectedBlockKey(null)}
                className="text-[9px] font-mono text-slate-400 hover:text-white flex items-center gap-0.5 hover:bg-slate-900 px-1 py-0.5 rounded transition-all cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
                <span>Recolher</span>
              </button>
            </div>

            {/* Visual Block Element (Colored, with jigsaw physical puzzle notches) */}
            <div 
              style={{ backgroundColor: activeColor }}
              className="relative pl-6 pr-2 py-2 flex flex-col gap-2.5 rounded-lg border border-black/10 text-white font-bold text-[10px] shadow-lg animate-slide-up"
            >
              {/* Scratch physical logic alignment tabs */}
              <div className="absolute top-[-2.5px] left-8 w-4 h-1.5 bg-[#08090d] rounded-b border-b border-x border-black/15 z-10" />
              <div style={{ backgroundColor: activeColor }} className="absolute bottom-[-3px] left-8 w-4 h-1 rounded-b border-b border-x border-black/15 z-20" />

              {/* Jigsaw physical top side controls */}
              <div className="flex items-center justify-between gap-1 bg-black/15 rounded-md px-1.5 py-1">
                <div className="flex items-center gap-1">
                  <span className="font-mono bg-white/20 text-white px-1 py-0.5 rounded text-[8px] tracking-widest uppercase">
                    {activeSubTab === "demo" ? "DEMOGRAFIA" :
                     activeSubTab === "socio" ? "SOCIOPROFISSÃO" :
                     activeSubTab === "cid" ? "LOCAL_CIDADE" :
                     activeSubTab === "est" ? "LOCAL_ESTADO" :
                     activeSubTab === "nom" ? "REGISTRO_NOME" : "MOD_ATRIBUTO"}
                  </span>
                  <span className="opacity-80 text-[9px] font-mono">Índice: #{selectedIndex + 1}</span>
                </div>

                <div className="flex items-center gap-1 font-mono">
                  {/* Lock parameter to lock decision calculations */}
                  {activeSubTab !== "tags" && (
                    <button
                      type="button"
                      onClick={() => toggleLocalLock(`${activeSubTab}_${selectedIndex}`)}
                      className={`p-1 rounded cursor-pointer transition-all ${
                        localLocks[`${activeSubTab}_${selectedIndex}`]
                          ? "bg-stone-950 text-amber-400 border border-stone-800"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                      title="Forçar trava neste peso"
                    >
                      {localLocks[`${activeSubTab}_${selectedIndex}`] ? (
                        <Lock className="w-3 h-3 text-red-400" />
                      ) : (
                        <Unlock className="w-3 h-3 text-slate-100" />
                      )}
                    </button>
                  )}

                  {/* Move Up/Down to shift block prioritizations flow */}
                  <div className="flex items-center gap-0.5 bg-black/25 rounded p-0.5">
                    <button 
                      type="button" 
                      disabled={selectedIndex === 0} 
                      onClick={() => moveBlockUp(selectedIndex)} 
                      className="p-0.5 text-white disabled:opacity-20 cursor-pointer hover:bg-white/10 rounded"
                    >
                      <ArrowUp className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      type="button" 
                      disabled={
                        activeSubTab === "demo" ? selectedIndex === localDemo.length - 1 :
                        activeSubTab === "socio" ? selectedIndex === localSocio.length - 1 :
                        activeSubTab === "cid" ? selectedIndex === localCid.length - 1 :
                        activeSubTab === "est" ? selectedIndex === localEst.length - 1 :
                        activeSubTab === "nom" ? selectedIndex === localNom.length - 1 :
                        selectedIndex === localTags.length - 1
                      } 
                      onClick={() => moveBlockDown(selectedIndex)} 
                      className="p-0.5 text-white disabled:opacity-20 cursor-pointer hover:bg-white/10 rounded"
                    >
                      <ArrowDown className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Remove Block */}
                  <button 
                    type="button" 
                    onClick={() => {
                      if (window.confirm("Deseja realmente deletar esta matriz de dados?")) {
                        deleteBlock(selectedIndex);
                      }
                    }} 
                    className="p-1 text-white hover:text-black hover:bg-white/10 rounded cursor-pointer ml-1"
                    title="Remover"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Block Editable Fields Interface */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white font-semibold">
                
                {/* 3.1 DEMOGRAFIA PARAMETERS */}
                {activeSubTab === "demo" && (
                  <>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">ID Unico</span>
                      <input
                        type="text"
                        value={localDemo[selectedIndex].id_demo}
                        onChange={(e) => {
                          const copy = [...localDemo];
                          copy[selectedIndex].id_demo = e.target.value;
                          setLocalDemo(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Descrição Humanizada</span>
                      <input
                        type="text"
                        value={localDemo[selectedIndex].descricao}
                        onChange={(e) => {
                          const copy = [...localDemo];
                          copy[selectedIndex].descricao = e.target.value;
                          setLocalDemo(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Idade Limites (Mín - Máx)</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={localDemo[selectedIndex].idade_min}
                          onChange={(e) => {
                            const copy = [...localDemo];
                            copy[selectedIndex].idade_min = parseInt(e.target.value) || 0;
                            setLocalDemo(copy);
                          }}
                          className="w-full text-center px-1 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                        />
                        <span className="opacity-60 font-mono text-[8px]">a</span>
                        <input
                          type="number"
                          value={localDemo[selectedIndex].idade_max}
                          onChange={(e) => {
                            const copy = [...localDemo];
                            copy[selectedIndex].idade_max = parseInt(e.target.value) || 0;
                            setLocalDemo(copy);
                          }}
                          className="w-full text-center px-1 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Peso de Distribuição base</span>
                      <input
                        type="text"
                        value={localDemo[selectedIndex].peso_base}
                        onChange={(e) => {
                          const parsed = getNormalizedWeight(e.target.value, `demo_${selectedIndex}`);
                          const copy = [...localDemo];
                          copy[selectedIndex].peso_base = parsed.val;
                          setLocalDemo(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none font-black"
                      />
                      {inputErrors[`demo_${selectedIndex}`] && (
                        <span className="text-[7px] text-red-200 mt-0.5">{inputErrors[`demo_${selectedIndex}`]}</span>
                      )}
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Gera Atributos / Tags Aditivas ({localDemo[selectedIndex].add_tags.length})</span>
                      <div className="flex flex-wrap items-center gap-1 bg-stone-950/40 p-1.5 rounded-md border border-white/5">
                        {localDemo[selectedIndex].add_tags.map(t => 
                          renderTagPill(t, () => {
                            const copy = [...localDemo];
                            copy[selectedIndex].add_tags = localDemo[selectedIndex].add_tags.filter(tg => tg !== t);
                            setLocalDemo(copy);
                          })
                        )}
                        <input
                          type="text"
                          placeholder="Adicionar campo de tags... [Enter]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const target = e.currentTarget;
                              const cleanVal = target.value.trim().toLowerCase().replace(/\s+/g, "_");
                              if (cleanVal && !localDemo[selectedIndex].add_tags.includes(cleanVal)) {
                                const copy = [...localDemo];
                                copy[selectedIndex].add_tags = [...localDemo[selectedIndex].add_tags, cleanVal];
                                setLocalDemo(copy);
                                target.value = "";
                              }
                              e.preventDefault();
                            }
                          }}
                          className="px-2 py-0.5 bg-stone-950/70 text-white placeholder:text-stone-400 font-mono text-[8px] rounded border border-white/15 outline-none w-28 shrink-0"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 3.2 SOCIOECONOMICO / PROFISSOES PARAMETERS */}
                {activeSubTab === "socio" && (
                  <>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">ID Profissão</span>
                      <input
                        type="text"
                        value={localSocio[selectedIndex].id_socio}
                        onChange={(e) => {
                          const copy = [...localSocio];
                          copy[selectedIndex].id_socio = e.target.value;
                          setLocalSocio(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Nome da Ocupação</span>
                      <input
                        type="text"
                        value={localSocio[selectedIndex].profissao}
                        onChange={(e) => {
                          const copy = [...localSocio];
                          copy[selectedIndex].profissao = e.target.value;
                          setLocalSocio(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Peso Base</span>
                      <input
                        type="text"
                        value={localSocio[selectedIndex].peso_base}
                        onChange={(e) => {
                          const parsed = getNormalizedWeight(e.target.value, `socio_${selectedIndex}`);
                          const copy = [...localSocio];
                          copy[selectedIndex].peso_base = parsed.val;
                          setLocalSocio(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Tags Restritas Necessárias (Filtro)</span>
                      <input
                        type="text"
                        value={localSocio[selectedIndex].req_tags.join(", ")}
                        onChange={(e) => {
                          const copy = [...localSocio];
                          copy[selectedIndex].req_tags = parseTagsInput(e.target.value);
                          setLocalSocio(copy);
                        }}
                        placeholder="Tag1, Tag2 (vazio para nenhum)"
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left sm:col-span-2">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Multiplicadores Regionais (Condicional Peso)</span>
                      <input
                        type="text"
                        value={serializeMultTags(localSocio[selectedIndex].mult_tags)}
                        onChange={(e) => {
                          const copy = [...localSocio];
                          copy[selectedIndex].mult_tags = parseMultTagsInput(e.target.value);
                          setLocalSocio(copy);
                        }}
                        placeholder="NomeDaTag:1.5, OutraTag:0.5"
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Sinalizadores Aditivos ({localSocio[selectedIndex].add_tags.length})</span>
                      <div className="flex flex-wrap items-center gap-1 bg-stone-950/40 p-1.5 rounded-md border border-white/5">
                        {localSocio[selectedIndex].add_tags.map(t => 
                          renderTagPill(t, () => {
                            const copy = [...localSocio];
                            copy[selectedIndex].add_tags = localSocio[selectedIndex].add_tags.filter(tg => tg !== t);
                            setLocalSocio(copy);
                          })
                        )}
                        <input
                          type="text"
                          placeholder="+ Tag"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const target = e.currentTarget;
                              const cleanVal = target.value.trim().toLowerCase().replace(/\s+/g, "_");
                              if (cleanVal && !localSocio[selectedIndex].add_tags.includes(cleanVal)) {
                                const copy = [...localSocio];
                                copy[selectedIndex].add_tags = [...localSocio[selectedIndex].add_tags, cleanVal];
                                setLocalSocio(copy);
                                target.value = "";
                              }
                              e.preventDefault();
                            }
                          }}
                          className="px-2 py-0.5 bg-stone-950/70 text-white placeholder:text-stone-400 font-mono text-[8px] rounded border border-white/15 outline-none w-28 shrink-0"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 3.3 CIDADES PARAMETERS */}
                {activeSubTab === "cid" && (
                  <>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">ID Cidade</span>
                      <input
                        type="text"
                        value={localCid[selectedIndex].id_cidade}
                        onChange={(e) => {
                          const copy = [...localCid];
                          copy[selectedIndex].id_cidade = e.target.value;
                          setLocalCid(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Nome Comercial</span>
                      <input
                        type="text"
                        value={localCid[selectedIndex].nome_cidade}
                        onChange={(e) => {
                          const copy = [...localCid];
                          copy[selectedIndex].nome_cidade = e.target.value;
                          setLocalCid(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Peso Demográfico</span>
                      <input
                        type="text"
                        value={localCid[selectedIndex].peso_base}
                        onChange={(e) => {
                          const parsed = getNormalizedWeight(e.target.value, `cid_${selectedIndex}`);
                          const copy = [...localCid];
                          copy[selectedIndex].peso_base = parsed.val;
                          setLocalCid(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Estado Vinculado (Ex: EST_SP)</span>
                      <input
                        type="text"
                        value={localCid[selectedIndex].req_tags.join(", ")}
                        onChange={(e) => {
                          const copy = [...localCid];
                          copy[selectedIndex].req_tags = parseTagsInput(e.target.value);
                          setLocalCid(copy);
                        }}
                        placeholder="EST_UF"
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Tags Regionais Adicionais ({localCid[selectedIndex].add_tags.length})</span>
                      <div className="flex flex-wrap items-center gap-1 bg-stone-950/40 p-1.5 rounded-md border border-white/5">
                        {localCid[selectedIndex].add_tags.map(t => 
                          renderTagPill(t, () => {
                            const copy = [...localCid];
                            copy[selectedIndex].add_tags = localCid[selectedIndex].add_tags.filter(tg => tg !== t);
                            setLocalCid(copy);
                          })
                        )}
                        <input
                          type="text"
                          placeholder="+ Tag"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const target = e.currentTarget;
                              const cleanVal = target.value.trim().toLowerCase().replace(/\s+/g, "_");
                              if (cleanVal && !localCid[selectedIndex].add_tags.includes(cleanVal)) {
                                const copy = [...localCid];
                                copy[selectedIndex].add_tags = [...localCid[selectedIndex].add_tags, cleanVal];
                                setLocalCid(copy);
                                target.value = "";
                              }
                              e.preventDefault();
                            }
                          }}
                          className="px-2 py-0.5 bg-stone-950/70 text-white placeholder:text-stone-400 font-mono text-[8px] rounded border border-white/15 outline-none w-28 shrink-0"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 3.4 ESTADOS PARAMETERS */}
                {activeSubTab === "est" && (
                  <>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">UF Código</span>
                      <input
                        type="text"
                        value={localEst[selectedIndex].id_estado}
                        onChange={(e) => {
                          const copy = [...localEst];
                          copy[selectedIndex].id_estado = e.target.value;
                          setLocalEst(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Nome do Estado</span>
                      <input
                        type="text"
                        value={localEst[selectedIndex].nome_estado}
                        onChange={(e) => {
                          const copy = [...localEst];
                          copy[selectedIndex].nome_estado = e.target.value;
                          setLocalEst(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Peso Regional</span>
                      <input
                        type="text"
                        value={localEst[selectedIndex].peso_base}
                        onChange={(e) => {
                          const parsed = getNormalizedWeight(e.target.value, `est_${selectedIndex}`);
                          const copy = [...localEst];
                          copy[selectedIndex].peso_base = parsed.val;
                          setLocalEst(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Matriz de Clima / Tags aditivas ({localEst[selectedIndex].add_tags.length})</span>
                      <div className="flex flex-wrap items-center gap-1 bg-stone-950/40 p-1.5 rounded-md border border-white/5">
                        {localEst[selectedIndex].add_tags.map(t => 
                          renderTagPill(t, () => {
                            const copy = [...localEst];
                            copy[selectedIndex].add_tags = localEst[selectedIndex].add_tags.filter(tg => tg !== t);
                            setLocalEst(copy);
                          })
                        )}
                        <input
                          type="text"
                          placeholder="+ Tag"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const target = e.currentTarget;
                              const cleanVal = target.value.trim().toLowerCase().replace(/\s+/g, "_");
                              if (cleanVal && !localEst[selectedIndex].add_tags.includes(cleanVal)) {
                                const copy = [...localEst];
                                copy[selectedIndex].add_tags = [...localEst[selectedIndex].add_tags, cleanVal];
                                setLocalEst(copy);
                                target.value = "";
                              }
                              e.preventDefault();
                            }
                          }}
                          className="px-2 py-0.5 bg-stone-950/70 text-white placeholder:text-stone-400 font-mono text-[8px] rounded border border-white/15 outline-none w-28 shrink-0"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 3.5 NOMES PARAMETERS */}
                {activeSubTab === "nom" && (
                  <>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">ID Semente</span>
                      <input
                        type="text"
                        value={localNom[selectedIndex].id_nome}
                        onChange={(e) => {
                          const copy = [...localNom];
                          copy[selectedIndex].id_nome = e.target.value;
                          setLocalNom(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Nome da Pessoa</span>
                      <input
                        type="text"
                        value={localNom[selectedIndex].nome}
                        onChange={(e) => {
                          const copy = [...localNom];
                          copy[selectedIndex].nome = e.target.value;
                          setLocalNom(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Peso Base</span>
                      <input
                        type="text"
                        value={localNom[selectedIndex].peso_base}
                        onChange={(e) => {
                          const parsed = getNormalizedWeight(e.target.value, `nom_${selectedIndex}`);
                          const copy = [...localNom];
                          copy[selectedIndex].peso_base = parsed.val;
                          setLocalNom(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Tags Requeridas (Ex: Mulher)</span>
                      <input
                        type="text"
                        value={(localNom[selectedIndex].req_tags || []).join(", ")}
                        onChange={(e) => {
                          const copy = [...localNom];
                          copy[selectedIndex].req_tags = parseTagsInput(e.target.value);
                          setLocalNom(copy);
                        }}
                        placeholder="Tag, Outra"
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>
                  </>
                )}

                {/* 3.6 TAGS PARAMETERS */}
                {activeSubTab === "tags" && (
                  <>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Tag ID</span>
                      <input
                        type="text"
                        value={localTags[selectedIndex].tag}
                        onChange={(e) => {
                          const copy = [...localTags];
                          copy[selectedIndex].tag = e.target.value;
                          setLocalTags(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Mod Saúde (Inteiro +/-)</span>
                      <input
                        type="number"
                        value={localTags[selectedIndex].mod_saude}
                        onChange={(e) => {
                          const copy = [...localTags];
                          copy[selectedIndex].mod_saude = parseInt(e.target.value, 10) || 0;
                          setLocalTags(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Mod Felicidade (Inteiro +/-)</span>
                      <input
                        type="number"
                        value={localTags[selectedIndex].mod_felicidade}
                        onChange={(e) => {
                          const copy = [...localTags];
                          copy[selectedIndex].mod_felicidade = parseInt(e.target.value, 10) || 0;
                          setLocalTags(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/70">Mod Renda Mensal (+/- Valor)</span>
                      <input
                        type="number"
                        value={localTags[selectedIndex].mod_renda_mensal}
                        onChange={(e) => {
                          const copy = [...localTags];
                          copy[selectedIndex].mod_renda_mensal = parseInt(e.target.value, 10) || 0;
                          setLocalTags(copy);
                        }}
                        className="w-full px-2 py-1 bg-stone-950/65 focus:bg-stone-950 text-white font-mono text-[9px] rounded-md border border-white/10 outline-none"
                      />
                    </div>
                  </>
                )}

              </div>

              {/* Conclude Button to save/exit focus cleanly on mobile */}
              <div className="flex items-center justify-end select-none bg-black/5 p-1 rounded-md mt-1">
                <button
                  type="button"
                  onClick={() => setSelectedBlockKey(null)}
                  className="py-1 px-3 bg-white text-stone-950 rounded font-black font-mono text-[9px] cursor-pointer hover:bg-white/90 active:scale-95 transition-all"
                >
                  Concluir Edição ✓
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
