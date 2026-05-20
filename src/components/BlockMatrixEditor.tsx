import React, { useState, useEffect } from "react";
import { Demografia, Socioeconomico, TagDef, Estado, NomeDef, CidadeDef } from "../types";
import { 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Lock, 
  Unlock, 
  Plus, 
  Check, 
  RotateCcw, 
  Workflow, 
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  Search,
  Sliders,
  Sparkles,
  Tag,
  Briefcase,
  MapPin,
  Map,
  User,
  Info
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
  // Active rule tab being shown as Scratch Jigsaw Blocks
  const [activeSubTab, setActiveSubTab] = useState<"demo" | "socio" | "cid" | "est" | "nom" | "tags">("demo");

  // Local rule databases isolated from the simulation engine until external copy and sheets re-import
  const [localDemo, setLocalDemo] = useState<Demografia[]>([]);
  const [localSocio, setLocalSocio] = useState<Socioeconomico[]>([]);
  const [localCid, setLocalCid] = useState<CidadeDef[]>([]);
  const [localEst, setLocalEst] = useState<Estado[]>([]);
  const [localNom, setLocalNom] = useState<NomeDef[]>([]);
  const [localTags, setLocalTags] = useState<TagDef[]>([]);

  // Search filter query targeting 'propriedade > chave' or simple match
  const [searchQuery, setSearchQuery] = useState("");

  // Input weight error validations
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});

  // Local locks state for independent tracking of custom locks on weight options
  const [localLocks, setLocalLocks] = useState<Record<string, boolean>>({});

  // Clipboard copy-paste status action tracker
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Sync state arrays when original data sources are synchronized or refreshed
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

  // Handle local soft resets from source master values
  const handleResetLocalMatrix = async () => {
    if (window.confirm("Deseja realmente perder as modificações locais deste Editor de Blocos e re-sincronizar os originais da planilha?")) {
      await onResetFromSheets();
    }
  };

  // Helper to determine whether a given property input should be shown inside a block
  const shouldShowProperty = (propertyName: string, itemKeyOrId: string): boolean => {
    if (!searchQuery) return false;
    
    const query = searchQuery.toLowerCase().trim();
    if (query === "*" || query === "all" || query === "tudo") return true;

    // Check if the query specifically targets this specific property
    const propMatches = propertyName.toLowerCase().includes(query) || query.includes(propertyName.toLowerCase());
    if (propMatches) return true;

    // Check if user is searching for a specific Key/ID inside blocks to edit
    const keyMatches = itemKeyOrId.toLowerCase().includes(query) || query.includes(itemKeyOrId.toLowerCase());
    if (keyMatches) return true;

    // Handle "propriedade > chave" format e.g., "Demografia > peso_base"
    if (query.includes(">")) {
      const parts = query.split(">").map(p => p.trim());
      const queryPart1 = parts[0];
      const queryPart2 = parts[1];

      const match1 = (propertyName.toLowerCase().includes(queryPart1) || activeSubTab.toLowerCase().includes(queryPart1) || itemKeyOrId.toLowerCase().includes(queryPart1)) &&
                     (propertyName.toLowerCase().includes(queryPart2) || itemKeyOrId.toLowerCase().includes(queryPart2) || queryPart2 === "");
      const match2 = (propertyName.toLowerCase().includes(queryPart2) || activeSubTab.toLowerCase().includes(queryPart2) || itemKeyOrId.toLowerCase().includes(queryPart2)) &&
                     (propertyName.toLowerCase().includes(queryPart1) || itemKeyOrId.toLowerCase().includes(queryPart1) || queryPart1 === "");
      return match1 || match2;
    }

    return false;
  };

  // weight normalization helper supporting floats, commas, and dots
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

  // Tag list parser & builders
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

  // Custom Tag badges renderer
  const renderTagPill = (tag: string, onRemove: () => void, colorHex: string) => {
    return (
      <span 
        key={tag} 
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono leading-none font-bold text-stone-900 border border-black/10 shadow-sm transition-all bg-white/70 hover:bg-white"
      >
        <span>{tag}</span>
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-red-650 font-black focus:outline-none text-[11px] leading-none px-0.5 -mt-0.5 cursor-pointer"
          title="Remover Tag"
        >
          ×
        </button>
      </span>
    );
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    
    if (activeSubTab === "demo") {
      const copy = [...localDemo];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setLocalDemo(copy);
    } else if (activeSubTab === "socio") {
      const copy = [...localSocio];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setLocalSocio(copy);
    } else if (activeSubTab === "cid") {
      const copy = [...localCid];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setLocalCid(copy);
    } else if (activeSubTab === "est") {
      const copy = [...localEst];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setLocalEst(copy);
    } else if (activeSubTab === "nom") {
      const copy = [...localNom];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setLocalNom(copy);
    } else if (activeSubTab === "tags") {
      const copy = [...localTags];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setLocalTags(copy);
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

    if (activeSubTab === "demo") {
      const copy = [...localDemo];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setLocalDemo(copy);
    } else if (activeSubTab === "socio") {
      const copy = [...localSocio];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setLocalSocio(copy);
    } else if (activeSubTab === "cid") {
      const copy = [...localCid];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setLocalCid(copy);
    } else if (activeSubTab === "est") {
      const copy = [...localEst];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setLocalEst(copy);
    } else if (activeSubTab === "nom") {
      const copy = [...localNom];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setLocalNom(copy);
    } else if (activeSubTab === "tags") {
      const copy = [...localTags];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setLocalTags(copy);
    }
  };

  // Creators & Destroyers
  const createBlankBlock = () => {
    const uniqueNum = Math.floor(100 + Math.random() * 900);
    const uniqueId = `nb_${uniqueNum}`;
    
    if (activeSubTab === "demo") {
      const newItem: Demografia = {
        id_demo: `DEMO_${uniqueNum}`,
        descricao: "Nova Idade",
        idade_min: 18,
        idade_max: 50,
        peso_base: 1.0,
        add_tags: ["nova_tag"],
      };
      setLocalDemo([...localDemo, newItem]);
    } else if (activeSubTab === "socio") {
      const newItem: Socioeconomico = {
        id_socio: uniqueId,
        profissao: "Profissão Especialista",
        req_tags: [],
        mult_tags: {},
        peso_base: 1.0,
        add_tags: ["especialista"],
      };
      setLocalSocio([...localSocio, newItem]);
    } else if (activeSubTab === "cid") {
      const newItem: CidadeDef = {
        id_cidade: `cid_${uniqueNum}`,
        nome_cidade: "Nova Metrópole",
        req_tags: [],
        peso_base: 1.0,
        add_tags: [],
      };
      setLocalCid([...localCid, newItem]);
    } else if (activeSubTab === "est") {
      const newItem: Estado = {
        id_estado: `E${uniqueNum.toString().slice(0, 1)}`,
        nome_estado: "Território Geral",
        peso_base: 1.0,
        add_tags: [],
      };
      setLocalEst([...localEst, newItem]);
    } else if (activeSubTab === "nom") {
      const newItem: NomeDef = {
        id_nome: `nome_${uniqueNum}`,
        nome: "Nome Elegante",
        req_tags: [],
        peso_base: 1.0,
      };
      setLocalNom([...localNom, newItem]);
    } else if (activeSubTab === "tags") {
      const newItem: TagDef = {
        tag: `nova_tag_${uniqueNum}`,
        mod_saude: 0,
        mod_felicidade: 0,
        mod_renda_mensal: 0,
      };
      setLocalTags([...localTags, newItem]);
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
      case "demo": return "#ffb200";
      case "socio": return "#9966ff";
      case "cid": return "#0099ff";
      case "est": return "#5cb85c";
      case "nom": return "#ff6680";
      case "tags": return "#ff8c1a";
    }
  };

  const activeColor = getSubTabColor(activeSubTab);

  return (
    <div id="ruleforge-block-editor-view" className="space-y-6 text-slate-100 animate-fade-in text-left">
      
      {/* SECTION HEADER BLOCK */}
      <div className="bg-[#12141c]/95 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#FFBF00]/5 rounded-full filter blur-2xl pointer-events-none" />

        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#9966ff]/10 border border-[#9966ff]/25 shrink-0">
              <Workflow className="w-5 h-5 text-[#9966ff]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white uppercase font-display flex items-center gap-2">
                Editor Compacto de Blocos Jigsaw
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono leading-relaxed mt-0.5 max-w-2xl">
                Lógica no-code em formato quebra-cabeça Scratch, ultra-compacto no mobile. Escolha qual atributo editar através do filtro inteligente abaixo.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetLocalMatrix}
          disabled={isSyncing}
          className="w-full md:w-auto py-2 px-3.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-[#FFBF00] disabled:opacity-50 text-slate-300 font-bold font-mono text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-[#FFBF00] ${isSyncing ? "animate-spin" : ""}`} />
          <span>Resetar Originais</span>
        </button>
      </div>

      {/* MATRIX TABS BAR WITH BRIGHT SCRATCH STYLE ACCENTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {(["demo", "socio", "cid", "est", "nom", "tags"] as const).map((tab) => {
          const tabLabels: Record<string, string> = {
            demo: "Demografias",
            socio: "Profissões",
            cid: "Cidades",
            est: "Estados",
            nom: "Nomes",
            tags: "Tags/Atributos",
          };
          const tabCount = tab === "demo" ? localDemo.length :
                           tab === "socio" ? localSocio.length :
                           tab === "cid" ? localCid.length :
                           tab === "est" ? localEst.length :
                           tab === "nom" ? localNom.length : localTags.length;
                           
          const isSelected = activeSubTab === tab;
          const labelColor = getSubTabColor(tab);

          return (
            <button
              key={tab}
              onClick={() => { setActiveSubTab(tab); setExportFeedback(null); }}
              className={`py-2 px-3 rounded-xl border text-[10px] sm:text-[11px] font-mono font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSelected
                  ? `border-[${labelColor}] text-[${labelColor}] shadow-md`
                  : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
              }`}
              style={isSelected ? { 
                borderColor: labelColor, 
                color: labelColor,
                backgroundColor: `${labelColor}1a`
              } : undefined}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: labelColor }} />
              <span>{tabLabels[tab]} ({tabCount})</span>
            </button>
          );
        })}
      </div>

      {/* SEARCH PANEL: PROPRIEDADE > CHAVE SYSTEM (INTELLIGENT FOCUS ELEMENT) */}
      <div className="bg-[#12141c] border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="🔍 Buscar Propriedade > Chave (Ex: peso_base, add_tags, ou Demografia > peso_base)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-[#FFBF00] text-xs font-mono rounded-xl text-white outline-none focus:ring-1 focus:ring-[#FFBF00]/30 transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchQuery("*")}
              className={`py-2 px-3.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                searchQuery === "*" 
                  ? "bg-[#ffbf00] text-slate-950 border-[#ffbf00]"
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
              }`}
            >
              Exibir Tudo (*)
            </button>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="py-2 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-mono transition-all cursor-pointer"
              title="Limpar filtro e ocultar tudo"
            >
              Ocultar
            </button>
          </div>
        </div>

        {/* QUICK FIELD SELECTING SHORTCUT CHIPS */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[9px] font-mono text-slate-500 uppercase font-black mr-1">Atalhos rápidos:</span>
          {(["peso_base", "add_tags", "req_tags", "mult_tags", "idade", "descricao", "modificadores"] as const).map((pref) => (
            <button
              key={pref}
              type="button"
              onClick={() => setSearchQuery(pref)}
              className={`px-2 py-0.5 rounded bg-slate-900 border text-[9px] font-mono transition-all cursor-pointer ${
                searchQuery === pref
                  ? "border-[#ffbf00] text-[#ffbf00] bg-slate-900"
                  : "border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {pref}
            </button>
          ))}
        </div>

        {/* CLUTTER FREE MODE FEEDBACK CAPTION */}
        {!searchQuery && (
          <div className="py-2.5 px-3 bg-[#9966ff]/5 border border-[#9966ff]/20 text-[#a78bfa] rounded-xl text-[10px] font-mono flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#9966ff] shrink-0" />
            <span>
              <strong>Modo Sem Poluição Ativo</strong>. Os campos de textos e pesos complexos estão ocultos para manter os blocos ultracompactos no celular. Busque uma propriedade ou clique nos atalhos para editá-los!
            </span>
          </div>
        )}
      </div>

      {/* EXPORT OPTIONS AND ACTIONS */}
      <div className="bg-[#12141c]/45 border border-slate-900 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#9966ff] shrink-0" />
          <span className="text-[10px] font-mono text-slate-400 leading-none">
            Altere à vontade e clique no botão para copiar o TSV adaptado para Ctrl+V no Planilhas.
          </span>
        </div>

        <button
          type="button"
          onClick={exportCurrentTabToSheetsClipboard}
          className="w-full sm:w-auto py-2 px-4 bg-[#ffbf05] hover:bg-yellow-400 active:scale-95 text-slate-950 font-black font-mono text-[11px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-950" />
          <span>Copiar Matriz</span>
        </button>
      </div>

      {/* FEEDBACK STATUS BANNER */}
      {exportFeedback && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-xs font-mono flex items-start gap-2.5 shadow-xl animate-bounce">
          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{exportFeedback}</p>
            <p className="text-[10px] text-slate-450 mt-0.5">
              Instruções: Abra o Google Sheets correspondente à aba <strong>{activeSubTab}</strong>, faça Ctrl+V na célula A1 para sobrescrever os dados originais se desejado.
            </p>
          </div>
        </div>
      )}

      {/* THE BLOCKS WORKSPACE CANVAS */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0b0c10] border border-slate-950 shadow-inner relative overflow-hidden bg-[radial-gradient(#1e2433_1px,transparent_1px)] [background-size:20px_20px] min-h-[350px]">
        <div className="absolute left-6 top-6 w-96 h-96 bg-[#9966ff]/2 rounded-full filter blur-3xl pointer-events-none" />

        {/* Vertical alignment jigsaw layout guide */}
        <div className="absolute left-[36px] top-4 bottom-4 w-0.5 border-l border-dashed border-slate-800/30 z-0 pointer-events-none" />

        {/* Scrollable list containing blocks chain */}
        <div className="space-y-[1px] relative z-20">
          
          {/* DEMOGRAFIA ACTIVE BLOCKS LIST */}
          {activeSubTab === "demo" && localDemo.map((item, idx) => {
            const blockKey = `demo_${idx}`;
            const isLocked = !!localLocks[blockKey];
            const errorMsg = inputErrors[blockKey];
            const isFirst = idx === 0;

            // Check what properties are searched/exposed
            const isIdDemoExposed = shouldShowProperty("id_demo", item.id_demo);
            const isDescExposed = shouldShowProperty("descricao", item.id_demo);
            const isIdadeExposed = shouldShowProperty("idade", item.id_demo);
            const isPesoExposed = shouldShowProperty("peso_base", item.id_demo);
            const isAddTagsExposed = shouldShowProperty("add_tags", item.id_demo);

            return (
              <div 
                key={blockKey}
                style={{ backgroundColor: "#ffb200" }}
                className={`relative pl-10 pr-3 py-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 transition-all duration-200 select-none shadow-sm ${
                  isFirst ? "rounded-t-xl pt-3" : ""
                } ${
                  idx === localDemo.length - 1 ? "rounded-b-xl pb-3" : ""
                } border-x border-b border-black/15 text-slate-900 font-bold`}
              >
                {/* Puzzle connections */}
                {isFirst ? (
                  <div className="absolute -top-[7px] left-4 w-12 h-2 bg-[#ffb200] rounded-t-md border-t border-x border-black/15 z-10" />
                ) : (
                  <div className="absolute top-[-1px] left-8 w-6 h-1.5 bg-[#0b0c10] rounded-b-sm border-b border-x border-black/15 z-10" />
                )}
                <div 
                  style={{ backgroundColor: "#ffb200" }}
                  className="absolute bottom-[-6px] left-8 w-6 h-1.5 rounded-b-sm border-b border-x border-black/15 z-30" 
                />

                {/* Reorder actions in the jigsaw connector space for mobile accessibility */}
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-40 bg-black/5 rounded p-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveBlockUp(idx)}
                    className="p-0.5 rounded bg-black/15 hover:bg-black/35 text-stone-900 disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === localDemo.length - 1}
                    onClick={() => moveBlockDown(idx)}
                    className="p-0.5 rounded bg-black/15 hover:bg-black/35 text-stone-900 disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowDown className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Phrase description */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] leading-tight text-stone-900 font-semibold w-full">
                  <span className="flex items-center gap-1 opacity-60"><Sparkles className="w-3 h-3" /> DEMO {idx + 1}:</span>
                  
                  {/* COMPACT VIEW METRICS */}
                  {!isIdDemoExposed && !isDescExposed && !isIdadeExposed && !isPesoExposed && !isAddTagsExposed ? (
                    <div className="inline-flex flex-wrap items-center gap-1">
                      <span className="font-mono bg-black/10 px-1 rounded text-[10px]">{item.id_demo}</span>
                      <span className="font-sans font-black">"{item.descricao}"</span>
                      <span className="opacity-70">({item.idade_min}-{item.idade_max} anos)</span>
                      <span className="font-mono opacity-85 bg-black/5 px-1 rounded text-[10px]">W: {item.peso_base}</span>
                    </div>
                  ) : null}

                  {/* ID EXPOSED */}
                  {isIdDemoExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/40 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">id:</span>
                      <input
                        type="text"
                        value={item.id_demo}
                        onChange={(e) => {
                          const copy = [...localDemo];
                          copy[idx].id_demo = e.target.value;
                          setLocalDemo(copy);
                        }}
                        className="w-22 px-1 py-0.5 font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {/* DESC EXPOSED */}
                  {isDescExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/40 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">desc:</span>
                      <input
                        type="text"
                        value={item.descricao}
                        onChange={(e) => {
                          const copy = [...localDemo];
                          copy[idx].descricao = e.target.value;
                          setLocalDemo(copy);
                        }}
                        className="w-24 px-1 py-0.5 text-[10px] rounded bg-white text-stone-900 border-none outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {/* IDADE EXPOSED */}
                  {isIdadeExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/40 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">idades:</span>
                      <input
                        type="number"
                        value={item.idade_min}
                        onChange={(e) => {
                          const copy = [...localDemo];
                          copy[idx].idade_min = parseInt(e.target.value) || 0;
                          setLocalDemo(copy);
                        }}
                        className="w-9 text-center font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="opacity-50">a</span>
                      <input
                        type="number"
                        value={item.idade_max}
                        onChange={(e) => {
                          const copy = [...localDemo];
                          copy[idx].idade_max = parseInt(e.target.value) || 0;
                          setLocalDemo(copy);
                        }}
                        className="w-9 text-center font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {/* WEIGHT EXPOSED */}
                  {isPesoExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/40 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">peso:</span>
                      <input
                        type="text"
                        value={item.peso_base}
                        onChange={(e) => {
                          const parsed = getNormalizedWeight(e.target.value, blockKey);
                          const copy = [...localDemo];
                          copy[idx].peso_base = parsed.val;
                          setLocalDemo(copy);
                        }}
                        className="w-10 text-center font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {/* TAGS RENDERED AS INDIVIDUAL INTERNAL BLOCK PILLS */}
                  <div className="inline-flex flex-wrap items-center gap-1 pl-1">
                    {item.add_tags.map((tag) => 
                      renderTagPill(tag, () => {
                        const copy = [...localDemo];
                        copy[idx].add_tags = item.add_tags.filter(t => t !== tag);
                        setLocalDemo(copy);
                      }, "#ffb200")
                    )}
                    
                    {/* Compact tag insert input */}
                    <input
                      type="text"
                      placeholder="+ Tag"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const target = e.currentTarget;
                          const cleanVal = target.value.trim().toLowerCase().replace(/\s+/g, "_");
                          if (cleanVal && !item.add_tags.includes(cleanVal)) {
                            const copy = [...localDemo];
                            copy[idx].add_tags = [...item.add_tags, cleanVal];
                            setLocalDemo(copy);
                            target.value = "";
                          }
                          e.preventDefault();
                        }
                      }}
                      className="w-12 py-0.5 px-1 text-[9px] font-mono rounded bg-white/20 hover:bg-white/45 text-stone-950 border-none outline-none placeholder:text-stone-800"
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto mt-1 sm:mt-0 select-none">
                  <button
                    type="button"
                    onClick={() => toggleLocalLock(blockKey)}
                    className={`p-1 rounded transition-all cursor-pointer ${
                      isLocked ? "bg-stone-900 text-[#ffb200]" : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBlock(idx)}
                    className="p-1 hover:bg-black/10 text-stone-600 hover:text-slate-950 rounded transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* SOCIOECONOMICO / PROFISSOES ACTIVE BLOCKS LIST */}
          {activeSubTab === "socio" && localSocio.map((item, idx) => {
            const blockKey = `socio_${idx}`;
            const isLocked = !!localLocks[blockKey];
            const errorMsg = inputErrors[blockKey];
            const isFirst = idx === 0;

            const isIdSocioExposed = shouldShowProperty("id_socio", item.id_socio || "");
            const isProfExposed = shouldShowProperty("profissao", item.id_socio || "");
            const isReqTagsExposed = shouldShowProperty("req_tags", item.id_socio || "");
            const isMultExposed = shouldShowProperty("mult_tags", item.id_socio || "");
            const isPesoExposed = shouldShowProperty("peso_base", item.id_socio || "");
            const isAddTagsExposed = shouldShowProperty("add_tags", item.id_socio || "");

            return (
              <div 
                key={blockKey}
                style={{ backgroundColor: "#9966ff" }}
                className={`relative pl-10 pr-3 py-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 transition-all duration-200 select-none shadow-sm ${
                  isFirst ? "rounded-t-xl pt-3" : ""
                } ${
                  idx === localSocio.length - 1 ? "rounded-b-xl pb-3" : ""
                } border-x border-b border-black/15 text-white font-bold`}
              >
                {isFirst ? (
                  <div className="absolute -top-[7px] left-4 w-12 h-2 bg-[#9966ff] rounded-t-md border-t border-x border-black/15 z-10" />
                ) : (
                  <div className="absolute top-[-1px] left-8 w-6 h-1.5 bg-[#0b0c10] rounded-b-sm border-b border-x border-black/15 z-10" />
                )}
                <div 
                  style={{ backgroundColor: "#9966ff" }}
                  className="absolute bottom-[-6px] left-8 w-6 h-1.5 rounded-b-sm border-b border-x border-black/15 z-30" 
                />

                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-40 bg-black/5 rounded p-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveBlockUp(idx)}
                    className="p-0.5 rounded bg-black/15 hover:bg-black/35 text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === localSocio.length - 1}
                    onClick={() => moveBlockDown(idx)}
                    className="p-0.5 rounded bg-black/15 hover:bg-black/35 text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowDown className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] leading-tight text-white font-semibold w-full">
                  <span className="flex items-center gap-1 opacity-60"><Briefcase className="w-3 h-3" /> PROFISSÃO {idx + 1}:</span>

                  {!isIdSocioExposed && !isProfExposed && !isReqTagsExposed && !isMultExposed && !isPesoExposed && !isAddTagsExposed ? (
                    <div className="inline-flex flex-wrap items-center gap-1">
                      <span className="font-mono bg-black/10 px-1 rounded text-[10px] text-white">{item.id_socio}</span>
                      <span className="font-sans font-black">"{item.profissao}"</span>
                      <span className="font-mono opacity-85 bg-black/5 px-1 rounded text-[10px]">W: {item.peso_base}</span>
                    </div>
                  ) : null}

                  {/* EXPOSED ID */}
                  {isIdSocioExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">id:</span>
                      <input
                        type="text"
                        value={item.id_socio}
                        onChange={(e) => {
                          const copy = [...localSocio];
                          copy[idx].id_socio = e.target.value;
                          setLocalSocio(copy);
                        }}
                        className="w-22 px-1 py-0.5 font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* EXPOSED LABEL */}
                  {isProfExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">label:</span>
                      <input
                        type="text"
                        value={item.profissao}
                        onChange={(e) => {
                          const copy = [...localSocio];
                          copy[idx].profissao = e.target.value;
                          setLocalSocio(copy);
                        }}
                        className="w-24 px-1 py-0.5 text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* EXPOSED REQ TAGS */}
                  {isReqTagsExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded text-stone-900">
                      <span className="opacity-75 text-white">Requer tags:</span>
                      <input
                        type="text"
                        value={item.req_tags.join(", ")}
                        onChange={(e) => {
                          const copy = [...localSocio];
                          copy[idx].req_tags = parseTagsInput(e.target.value);
                          setLocalSocio(copy);
                        }}
                        className="w-28 px-1 py-0.5 font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                        placeholder="Ex: tag1, tag2"
                      />
                    </div>
                  )}

                  {/* EXPOSED MULTIPLIERS */}
                  {isMultExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">Mults:</span>
                      <input
                        type="text"
                        value={serializeMultTags(item.mult_tags)}
                        onChange={(e) => {
                          const copy = [...localSocio];
                          copy[idx].mult_tags = parseMultTagsInput(e.target.value);
                          setLocalSocio(copy);
                        }}
                        className="w-32 px-1 py-0.5 font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                        placeholder="Ex: inteligente:1.5"
                      />
                    </div>
                  )}

                  {/* EXPOSED PESO BASE */}
                  {isPesoExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">peso:</span>
                      <input
                        type="text"
                        value={item.peso_base}
                        onChange={(e) => {
                          const parsed = getNormalizedWeight(e.target.value, blockKey);
                          const copy = [...localSocio];
                          copy[idx].peso_base = parsed.val;
                          setLocalSocio(copy);
                        }}
                        className="w-10 text-center font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* EXPOSED ADD TAGS */}
                  <div className="inline-flex flex-wrap items-center gap-1 pl-1">
                    <span className="opacity-50 text-[10px]">Garante:</span>
                    {(item.add_tags || []).map((tag) => 
                      renderTagPill(tag, () => {
                        const copy = [...localSocio];
                        copy[idx].add_tags = (item.add_tags || []).filter(t => t !== tag);
                        setLocalSocio(copy);
                      }, "#9966ff")
                    )}
                    <input
                      type="text"
                      placeholder="+ Tag"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const target = e.currentTarget;
                          const cleanVal = target.value.trim().toLowerCase().replace(/\s+/g, "_");
                          if (cleanVal) {
                            const copy = [...localSocio];
                            const current = item.add_tags || [];
                            if (!current.includes(cleanVal)) {
                              copy[idx].add_tags = [...current, cleanVal];
                              setLocalSocio(copy);
                              target.value = "";
                            }
                          }
                          e.preventDefault();
                        }
                      }}
                      className="w-12 py-0.5 px-1 text-[9px] font-mono rounded bg-white/20 hover:bg-white/45 text-white border-none outline-none placeholder:text-purple-200"
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto mt-1 sm:mt-0 select-none">
                  <button
                    type="button"
                    onClick={() => toggleLocalLock(blockKey)}
                    className={`p-1 rounded transition-all cursor-pointer ${
                      isLocked ? "bg-stone-950 text-[#9966ff]" : "text-purple-200 hover:text-white"
                    }`}
                  >
                    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBlock(idx)}
                    className="p-1 hover:bg-black/10 text-purple-200 hover:text-white rounded transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* CIDADES ACTIVE BLOCKS LIST */}
          {activeSubTab === "cid" && localCid.map((item, idx) => {
            const blockKey = `cidade_${idx}`;
            const isLocked = !!localLocks[blockKey];
            const errorMsg = inputErrors[blockKey];
            const isFirst = idx === 0;

            const isIdCidadeExposed = shouldShowProperty("id_cidade", item.id_cidade);
            const isNomeExposed = shouldShowProperty("nome_cidade", item.id_cidade);
            const isReqTagsExposed = shouldShowProperty("req_tags", item.id_cidade);
            const isPesoExposed = shouldShowProperty("peso_base", item.id_cidade);
            const isAddTagsExposed = shouldShowProperty("add_tags", item.id_cidade);

            return (
              <div 
                key={blockKey}
                style={{ backgroundColor: "#0099ff" }}
                className={`relative pl-10 pr-3 py-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 transition-all duration-200 select-none shadow-sm ${
                  isFirst ? "rounded-t-xl pt-3" : ""
                } ${
                  idx === localCid.length - 1 ? "rounded-b-xl pb-3" : ""
                } border-x border-b border-black/15 text-white font-bold`}
              >
                {isFirst ? (
                  <div className="absolute -top-[7px] left-4 w-12 h-2 bg-[#0099ff] rounded-t-md border-t border-x border-black/15 z-10" />
                ) : (
                  <div className="absolute top-[-1px] left-8 w-6 h-1.5 bg-[#0b0c10] rounded-b-sm border-b border-x border-black/15 z-10" />
                )}
                <div 
                  style={{ backgroundColor: "#0099ff" }}
                  className="absolute bottom-[-6px] left-8 w-6 h-1.5 rounded-b-sm border-b border-x border-black/15 z-30" 
                />

                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-40 bg-black/5 rounded p-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveBlockUp(idx)}
                    className="p-0.5 rounded bg-black/15 hover:bg-black/35 text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === localCid.length - 1}
                    onClick={() => moveBlockDown(idx)}
                    className="p-0.5 rounded bg-black/15 hover:bg-black/35 text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowDown className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] leading-tight text-white font-semibold w-full">
                  <span className="flex items-center gap-1 opacity-60"><MapPin className="w-3 h-3" /> CIDADE {idx + 1}:</span>

                  {!isIdCidadeExposed && !isNomeExposed && !isReqTagsExposed && !isPesoExposed && !isAddTagsExposed ? (
                    <div className="inline-flex flex-wrap items-center gap-1">
                      <span className="font-mono bg-black/10 px-1 rounded text-[10px] text-white">{item.id_cidade}</span>
                      <span className="font-sans font-black">"{item.nome_cidade}"</span>
                      <span className="font-mono opacity-85 bg-black/5 px-1 rounded text-[10px]">W: {item.peso_base}</span>
                    </div>
                  ) : null}

                  {/* ID */}
                  {isIdCidadeExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">id:</span>
                      <input
                        type="text"
                        value={item.id_cidade}
                        onChange={(e) => {
                          const copy = [...localCid];
                          copy[idx].id_cidade = e.target.value;
                          setLocalCid(copy);
                        }}
                        className="w-22 px-1 py-0.5 font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* NOME */}
                  {isNomeExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">nome:</span>
                      <input
                        type="text"
                        value={item.nome_cidade}
                        onChange={(e) => {
                          const copy = [...localCid];
                          copy[idx].nome_cidade = e.target.value;
                          setLocalCid(copy);
                        }}
                        className="w-24 px-1 py-0.5 text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* REQ TAGS */}
                  {isReqTagsExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded text-stone-900">
                      <span className="opacity-75 text-white">Requer tags:</span>
                      <input
                        type="text"
                        value={item.req_tags.join(", ")}
                        onChange={(e) => {
                          const copy = [...localCid];
                          copy[idx].req_tags = parseTagsInput(e.target.value);
                          setLocalCid(copy);
                        }}
                        className="w-28 px-1 py-0.5 font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                        placeholder="Ex: tag1, tag2"
                      />
                    </div>
                  )}

                  {/* PESO BASE */}
                  {isPesoExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">peso:</span>
                      <input
                        type="text"
                        value={item.peso_base}
                        onChange={(e) => {
                          const parsed = getNormalizedWeight(e.target.value, blockKey);
                          const copy = [...localCid];
                          copy[idx].peso_base = parsed.val;
                          setLocalCid(copy);
                        }}
                        className="w-10 text-center font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* TAGS AS INDIVIDUAL SUB-BLOCK BADGES */}
                  <div className="inline-flex flex-wrap items-center gap-1 pl-1">
                    {(item.add_tags || []).map((tag) => 
                      renderTagPill(tag, () => {
                        const copy = [...localCid];
                        copy[idx].add_tags = (item.add_tags || []).filter(t => t !== tag);
                        setLocalCid(copy);
                      }, "#0099ff")
                    )}
                    <input
                      type="text"
                      placeholder="+ Tag"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const target = e.currentTarget;
                          const cleanVal = target.value.trim().toLowerCase().replace(/\s+/g, "_");
                          if (cleanVal) {
                            const copy = [...localCid];
                            const current = item.add_tags || [];
                            if (!current.includes(cleanVal)) {
                              copy[idx].add_tags = [...current, cleanVal];
                              setLocalCid(copy);
                              target.value = "";
                            }
                          }
                          e.preventDefault();
                        }
                      }}
                      className="w-12 py-0.5 px-1 text-[9px] font-mono rounded bg-white/20 hover:bg-white/45 text-white border-none outline-none placeholder:text-blue-105"
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto mt-1 sm:mt-0 select-none">
                  <button
                    type="button"
                    onClick={() => toggleLocalLock(blockKey)}
                    className={`p-1 rounded transition-all cursor-pointer ${
                      isLocked ? "bg-stone-950 text-[#0099ff]" : "text-blue-200 hover:text-white"
                    }`}
                  >
                    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBlock(idx)}
                    className="p-1 hover:bg-black/10 text-blue-200 hover:text-white rounded transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* ESTADOS ACTIVE BLOCKS LIST */}
          {activeSubTab === "est" && localEst.map((item, idx) => {
            const blockKey = `estado_${idx}`;
            const isLocked = !!localLocks[blockKey];
            const errorMsg = inputErrors[blockKey];
            const isFirst = idx === 0;

            const isIdEstadoExposed = shouldShowProperty("id_estado", item.id_estado);
            const isNomeExposed = shouldShowProperty("nome_estado", item.id_estado);
            const isPesoExposed = shouldShowProperty("peso_base", item.id_estado);
            const isAddTagsExposed = shouldShowProperty("add_tags", item.id_estado);

            return (
              <div 
                key={blockKey}
                style={{ backgroundColor: "#5cb85c" }}
                className={`relative pl-10 pr-3 py-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 transition-all duration-200 select-none shadow-sm ${
                  isFirst ? "rounded-t-xl pt-3" : ""
                } ${
                  idx === localEst.length - 1 ? "rounded-b-xl pb-3" : ""
                } border-x border-b border-black/15 text-white font-bold`}
              >
                {isFirst ? (
                  <div className="absolute -top-[7px] left-4 w-12 h-2 bg-[#5cb85c] rounded-t-md border-t border-x border-black/15 z-10" />
                ) : (
                  <div className="absolute top-[-1px] left-8 w-6 h-1.5 bg-[#0b0c10] rounded-b-sm border-b border-x border-black/15 z-10" />
                )}
                <div 
                  style={{ backgroundColor: "#5cb85c" }}
                  className="absolute bottom-[-6px] left-8 w-6 h-1.5 rounded-b-sm border-b border-x border-black/15 z-30" 
                />

                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-40 bg-black/5 rounded p-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveBlockUp(idx)}
                    className="p-0.5 rounded bg-black/15 hover:bg-black/35 text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === localEst.length - 1}
                    onClick={() => moveBlockDown(idx)}
                    className="p-0.5 rounded bg-black/15 hover:bg-black/35 text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowDown className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] leading-tight text-white font-semibold w-full">
                  <span className="flex items-center gap-1 opacity-60"><Map className="w-3 h-3" /> ESTADO {idx + 1}:</span>

                  {!isIdEstadoExposed && !isNomeExposed && !isPesoExposed && !isAddTagsExposed ? (
                    <div className="inline-flex flex-wrap items-center gap-1">
                      <span className="font-mono bg-black/10 px-1 rounded text-[10px] text-white">{item.id_estado}</span>
                      <span className="font-sans font-black">"{item.nome_estado}"</span>
                      <span className="font-mono opacity-85 bg-black/5 px-1 rounded text-[10px]">W: {item.peso_base}</span>
                    </div>
                  ) : null}

                  {/* UF SIGLA / ID */}
                  {isIdEstadoExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">id:</span>
                      <input
                        type="text"
                        value={item.id_estado}
                        maxLength={3}
                        onChange={(e) => {
                          const copy = [...localEst];
                          copy[idx].id_estado = e.target.value.toUpperCase();
                          setLocalEst(copy);
                        }}
                        className="w-14 text-center font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* NOME ESTADO */}
                  {isNomeExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">estado:</span>
                      <input
                        type="text"
                        value={item.nome_estado}
                        onChange={(e) => {
                          const copy = [...localEst];
                          copy[idx].nome_estado = e.target.value;
                          setLocalEst(copy);
                        }}
                        className="w-24 px-1 py-0.5 text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* PESO BASE */}
                  {isPesoExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">peso:</span>
                      <input
                        type="text"
                        value={item.peso_base}
                        onChange={(e) => {
                          const parsed = getNormalizedWeight(e.target.value, blockKey);
                          const copy = [...localEst];
                          copy[idx].peso_base = parsed.val;
                          setLocalEst(copy);
                        }}
                        className="w-10 text-center font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* TAGS COLLAPSED TO A PILL BLOCK CHAIN */}
                  <div className="inline-flex flex-wrap items-center gap-1 pl-1">
                    {(item.add_tags || []).map((tag) => 
                      renderTagPill(tag, () => {
                        const copy = [...localEst];
                        copy[idx].add_tags = (item.add_tags || []).filter(t => t !== tag);
                        setLocalEst(copy);
                      }, "#5cb85c")
                    )}
                    <input
                      type="text"
                      placeholder="+ Tag"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const target = e.currentTarget;
                          const cleanVal = target.value.trim().toLowerCase().replace(/\s+/g, "_");
                          if (cleanVal) {
                            const copy = [...localEst];
                            const current = item.add_tags || [];
                            if (!current.includes(cleanVal)) {
                              copy[idx].add_tags = [...current, cleanVal];
                              setLocalEst(copy);
                              target.value = "";
                            }
                          }
                          e.preventDefault();
                        }
                      }}
                      className="w-12 py-0.5 px-1 text-[9px] font-mono rounded bg-white/20 hover:bg-white/45 text-white border-none outline-none placeholder:text-green-200"
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto mt-1 sm:mt-0 select-none">
                  <button
                    type="button"
                    onClick={() => toggleLocalLock(blockKey)}
                    className={`p-1 rounded transition-all cursor-pointer ${
                      isLocked ? "bg-stone-950 text-[#5cb85c]" : "text-green-200 hover:text-white"
                    }`}
                  >
                    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBlock(idx)}
                    className="p-1 hover:bg-black/10 text-green-200 hover:text-white rounded transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* NOMES ACTIVE BLOCKS LIST */}
          {activeSubTab === "nom" && localNom.map((item, idx) => {
            const blockKey = `nome_${idx}`;
            const isLocked = !!localLocks[blockKey];
            const errorMsg = inputErrors[blockKey];
            const isFirst = idx === 0;

            const isIdNomeExposed = shouldShowProperty("id_nome", item.id_nome);
            const isNomeExposed = shouldShowProperty("nome", item.id_nome);
            const isPesoExposed = shouldShowProperty("peso_base", item.id_nome);
            const isReqTagsExposed = shouldShowProperty("req_tags", item.id_nome);

            return (
              <div 
                key={blockKey}
                style={{ backgroundColor: "#ff6680" }}
                className={`relative pl-10 pr-3 py-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 transition-all duration-200 select-none shadow-sm ${
                  isFirst ? "rounded-t-xl pt-3" : ""
                } ${
                  idx === localNom.length - 1 ? "rounded-b-xl pb-3" : ""
                } border-x border-b border-black/15 text-white font-bold`}
              >
                {isFirst ? (
                  <div className="absolute -top-[7px] left-4 w-12 h-2 bg-[#ff6680] rounded-t-md border-t border-x border-black/15 z-10" />
                ) : (
                  <div className="absolute top-[-1px] left-8 w-6 h-1.5 bg-[#0b0c10] rounded-b-sm border-b border-x border-black/15 z-10" />
                )}
                <div 
                  style={{ backgroundColor: "#ff6680" }}
                  className="absolute bottom-[-6px] left-8 w-6 h-1.5 rounded-b-sm border-b border-x border-black/15 z-30" 
                />

                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-40 bg-black/5 rounded p-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveBlockUp(idx)}
                    className="p-0.5 rounded bg-black/15 hover:bg-black/35 text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === localNom.length - 1}
                    onClick={() => moveBlockDown(idx)}
                    className="p-0.5 rounded bg-black/15 hover:bg-black/35 text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowDown className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] leading-tight text-white font-semibold w-full">
                  <span className="flex items-center gap-1 opacity-60"><User className="w-3 h-3" /> NOME {idx + 1}:</span>

                  {!isIdNomeExposed && !isNomeExposed && !isPesoExposed && !isReqTagsExposed ? (
                    <div className="inline-flex flex-wrap items-center gap-1">
                      <span className="font-mono bg-black/10 px-1 rounded text-[10px] text-white">{item.id_nome}</span>
                      <span className="font-sans font-black">"{item.nome}"</span>
                      <span className="font-mono opacity-85 bg-black/5 px-1 rounded text-[10px]">W: {item.peso_base}</span>
                    </div>
                  ) : null}

                  {/* ID */}
                  {isIdNomeExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">id:</span>
                      <input
                        type="text"
                        value={item.id_nome}
                        onChange={(e) => {
                          const copy = [...localNom];
                          copy[idx].id_nome = e.target.value;
                          setLocalNom(copy);
                        }}
                        className="w-22 px-1 py-0.5 font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* NOME VALUE */}
                  {isNomeExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">nome:</span>
                      <input
                        type="text"
                        value={item.nome}
                        onChange={(e) => {
                          const copy = [...localNom];
                          copy[idx].nome = e.target.value;
                          setLocalNom(copy);
                        }}
                        className="w-24 px-1 py-0.5 text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* PESO MAP */}
                  {isPesoExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">peso:</span>
                      <input
                        type="text"
                        value={item.peso_base}
                        onChange={(e) => {
                          const parsed = getNormalizedWeight(e.target.value, blockKey);
                          const copy = [...localNom];
                          copy[idx].peso_base = parsed.val;
                          setLocalNom(copy);
                        }}
                        className="w-10 text-center font-mono text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* REQUIRED CONTROLS AS TAG PILLS */}
                  <div className="inline-flex flex-wrap items-center gap-1 pl-1">
                    <span className="opacity-50 text-[10px]">Filtros req:</span>
                    {item.req_tags.map((tag) => 
                      renderTagPill(tag, () => {
                        const copy = [...localNom];
                        copy[idx].req_tags = item.req_tags.filter(t => t !== tag);
                        setLocalNom(copy);
                      }, "#ff6680")
                    )}
                    <input
                      type="text"
                      placeholder="+ Req"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const target = e.currentTarget;
                          const cleanVal = target.value.trim().toLowerCase().replace(/\s+/g, "_");
                          if (cleanVal) {
                            const copy = [...localNom];
                            if (!item.req_tags.includes(cleanVal)) {
                              copy[idx].req_tags = [...item.req_tags, cleanVal];
                              setLocalNom(copy);
                              target.value = "";
                            }
                          }
                          e.preventDefault();
                        }
                      }}
                      className="w-12 py-0.5 px-1 text-[9px] font-mono rounded bg-white/20 hover:bg-white/45 text-white border-none outline-none placeholder:text-rose-200"
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto mt-1 sm:mt-0 select-none">
                  <button
                    type="button"
                    onClick={() => toggleLocalLock(blockKey)}
                    className={`p-1 rounded transition-all cursor-pointer ${
                      isLocked ? "bg-stone-950 text-[#ff6680]" : "text-rose-200 hover:text-white"
                    }`}
                  >
                    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBlock(idx)}
                    className="p-1 hover:bg-black/10 text-rose-200 hover:text-white rounded transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* TAGS DEFINITIONS ACTIVE BLOCKS LIST */}
          {activeSubTab === "tags" && localTags.map((item, idx) => {
            const blockKey = `tags_${idx}`;
            const isFirst = idx === 0;

            const isTagExposed = shouldShowProperty("tag", item.tag);
            const isModsExposed = shouldShowProperty("modificadores", item.tag) || shouldShowProperty("mod_saude", item.tag) || shouldShowProperty("mod_felicidade", item.tag) || shouldShowProperty("mod_renda_mensal", item.tag);

            return (
              <div 
                key={blockKey}
                style={{ backgroundColor: "#ff8c1a" }}
                className={`relative pl-10 pr-3 py-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 transition-all duration-200 select-none shadow-sm ${
                  isFirst ? "rounded-t-xl pt-3" : ""
                } ${
                  idx === localTags.length - 1 ? "rounded-b-xl pb-3" : ""
                } border-x border-b border-black/15 text-white font-bold`}
              >
                {isFirst ? (
                  <div className="absolute -top-[7px] left-4 w-12 h-2 bg-[#ff8c1a] rounded-t-md border-t border-x border-black/15 z-10" />
                ) : (
                  <div className="absolute top-[-1px] left-8 w-6 h-1.5 bg-[#0b0c10] rounded-b-sm border-b border-x border-black/15 z-10" />
                )}
                <div 
                  style={{ backgroundColor: "#ff8c1a" }}
                  className="absolute bottom-[-6px] left-8 w-6 h-1.5 rounded-b-sm border-b border-x border-black/15 z-30" 
                />

                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-40 bg-black/5 rounded p-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveBlockUp(idx)}
                    className="p-0.5 rounded bg-black/15 hover:bg-black/35 text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === localTags.length - 1}
                    onClick={() => moveBlockDown(idx)}
                    className="p-0.5 rounded bg-black/15 hover:bg-black/35 text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowDown className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] leading-tight text-white font-semibold w-full">
                  <span className="flex items-center gap-1 opacity-60"><Tag className="w-3 h-3" /> ATRIBUTO {idx + 1}:</span>

                  {/* COMPACT VIEW */}
                  {!isTagExposed && !isModsExposed ? (
                    <div className="inline-flex flex-wrap items-center gap-1">
                      <span className="font-mono bg-black/10 px-1.5 py-0.5 rounded text-[10px] text-white">#{item.tag}</span>
                      <span className="opacity-75">Saúde: {item.mod_saude > 0 ? `+${item.mod_saude}` : item.mod_saude}</span>
                      <span className="opacity-75">Felicidade: {item.mod_felicidade > 0 ? `+${item.mod_felicidade}` : item.mod_felicidade}</span>
                      <span className="opacity-75">Renda: {item.mod_renda_mensal > 0 ? `+${item.mod_renda_mensal}` : item.mod_renda_mensal}</span>
                    </div>
                  ) : null}

                  {/* EDIT TAG NAME */}
                  {isTagExposed && (
                    <div className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                      <span className="opacity-75">nome:</span>
                      <input
                        type="text"
                        value={item.tag}
                        onChange={(e) => {
                          const copy = [...localTags];
                          copy[idx].tag = e.target.value.toLowerCase().replace(/\s+/g, "_");
                          setLocalTags(copy);
                        }}
                        className="w-24 px-1 py-0.5 text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                      />
                    </div>
                  )}

                  {/* EDIT HEALTH/HAPPINESS/INCOME MODS */}
                  {isModsExposed && (
                    <div className="inline-flex flex-wrap items-center gap-2 bg-white/20 px-2 py-0.5 rounded">
                      <div className="flex items-center gap-1">
                        <span className="opacity-75">Saúde:</span>
                        <input
                          type="number"
                          value={item.mod_saude}
                          onChange={(e) => {
                            const copy = [...localTags];
                            copy[idx].mod_saude = parseInt(e.target.value) || 0;
                            setLocalTags(copy);
                          }}
                          className="w-10 text-center text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="opacity-75">Feliz:</span>
                        <input
                          type="number"
                          value={item.mod_felicidade}
                          onChange={(e) => {
                            const copy = [...localTags];
                            copy[idx].mod_felicidade = parseInt(e.target.value) || 0;
                            setLocalTags(copy);
                          }}
                          className="w-10 text-center text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="opacity-75">Renda:</span>
                        <input
                          type="number"
                          value={item.mod_renda_mensal}
                          onChange={(e) => {
                            const copy = [...localTags];
                            copy[idx].mod_renda_mensal = parseInt(e.target.value) || 0;
                            setLocalTags(copy);
                          }}
                          className="w-12 text-center text-[10px] rounded bg-white text-stone-900 border-none outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto mt-1 sm:mt-0 select-none">
                  <button
                    type="button"
                    onClick={() => deleteBlock(idx)}
                    className="p-1 hover:bg-black/10 text-orange-200 hover:text-white rounded transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

        </div>

        {/* BOTTOM WORKSPACE BUTTON TO INLINE CUSTOM NEW BLOCKS */}
        <div className="mt-6 flex justify-center relative z-20">
          <button
            type="button"
            onClick={createBlankBlock}
            style={{ backgroundColor: activeColor }}
            className="px-6 py-2 rounded-full text-slate-950 font-black font-sans uppercase tracking-wider text-[10px] sm:text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:brightness-110 cursor-pointer border-b-2 border-black/30 text-stone-900"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
            <span>Adicionar Novo Bloco</span>
          </button>
        </div>

      </div>

      {/* DETAILED DIAGNOSTICS HELP BLOCK FOR GOOGLE SHEETS PIPELINE */}
      <div className="p-4 rounded-2xl bg-slate-950/45 border border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-4 text-left font-sans">
        <div className="space-y-1">
          <h4 className="text-[#ffbf00] font-black uppercase text-xs flex items-center gap-1.5 font-display">
            <AlertCircle className="w-3.5 h-3.5 text-[#ffbf00]" />
            <span>1. Filtre a Propriedade</span>
          </h4>
          <p className="text-[10px] leading-relaxed text-slate-400 font-mono">
            Digite ou clique nos atalhos para focar em chaves e pesos. Os blocos se adaptam mostrando apenas o necessário para edição rápida.
          </p>
        </div>

        <div className="space-y-1">
          <h4 className="text-[#9966ff] font-black uppercase text-xs flex items-center gap-1.5 font-display">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#9966ff]" />
            <span>2. Copie para Área de Transferência</span>
          </h4>
          <p className="text-[10px] leading-relaxed text-slate-400 font-mono">
            Copie a matriz gerada em formato TSV. Ela está otimizada com formatação tabular perfeita para o Google Sheets.
          </p>
        </div>

        <div className="space-y-1">
          <h4 className="text-[#0099ff] font-black uppercase text-xs flex items-center gap-1.5 font-display">
            <Plus className="w-3.5 h-3.5 text-[#0099ff]" />
            <span>3. Cole no Sheets</span>
          </h4>
          <p className="text-[10px] leading-relaxed text-slate-400 font-mono">
            Selecione tudo na aba correspondente na planilha e cole com <strong>Ctrl+V</strong>. Em seguida, reinicie o Simulador de NPCs.
          </p>
        </div>
      </div>

    </div>
  );
};
