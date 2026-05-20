import React, { useState, useMemo } from "react";
import { Demografia, Socioeconomico, TagDef, Estado, NomeDef, CidadeDef } from "../types";
import { Database, Plus, Trash2, RotateCcw, HelpCircle, Save, Check, Copy, Download, Search, Map } from "lucide-react";
import { TagMultiSelect } from "./TagMultiSelect";

interface MatrixEditorProps {
  demografia: Demografia[];
  setDemografia: React.Dispatch<React.SetStateAction<Demografia[]>>;
  socioeconomico: Socioeconomico[];
  setSocioeconomico: React.Dispatch<React.SetStateAction<Socioeconomico[]>>;
  tagDef: TagDef[];
  setTagDef: React.Dispatch<React.SetStateAction<TagDef[]>>;
  estados: Estado[];
  setEstados: React.Dispatch<React.SetStateAction<Estado[]>>;
  nomes: NomeDef[];
  setNomes: React.Dispatch<React.SetStateAction<NomeDef[]>>;
  cidades: CidadeDef[];
  setCidades: React.Dispatch<React.SetStateAction<CidadeDef[]>>;
  onReset: () => void;
}

export const MatrixEditor: React.FC<MatrixEditorProps> = ({
  demografia,
  setDemografia,
  socioeconomico,
  setSocioeconomico,
  tagDef,
  setTagDef,
  estados,
  setEstados,
  nomes,
  setNomes,
  cidades,
  setCidades,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<"demo" | "est" | "nom" | "cid" | "socio" | "tags">("demo");
  const [saveIndicator, setSaveIndicator] = useState<string | null>(null);
  const [nomeSearch, setNomeSearch] = useState<string>("");
  const [cidadeSearch, setCidadeSearch] = useState<string>("");
  const [demoSearch, setDemoSearch] = useState<string>("");
  const [estadoSearch, setEstadoSearch] = useState<string>("");
  const [socioSearch, setSocioSearch] = useState<string>("");
  const [tagSearch, setTagSearch] = useState<string>("");

  // Lógica de Alimentação Dinâmica: Extração de lista única e combinada de todas as tags existentes
  const allAvailableTags = useMemo(() => {
    const tagsSet = new Set<string>();

    // 1. Varre Demografia (add_tags)
    demografia.forEach((row) => {
      row.add_tags?.forEach((tag) => {
        const cleaned = tag.trim();
        if (cleaned) tagsSet.add(cleaned);
      });
    });

    // 2. Varre Estados (add_tags)
    estados.forEach((row) => {
      row.add_tags?.forEach((tag) => {
        const cleaned = tag.trim();
        if (cleaned) tagsSet.add(cleaned);
      });
    });

    // 3. Varre Nomes (req_tags)
    nomes.forEach((row) => {
      row.req_tags?.forEach((tag) => {
        const cleaned = tag.trim();
        if (cleaned) tagsSet.add(cleaned);
      });
    });

    // 4. Varre Socioeconômico (req_tags, add_tags, e as chaves de mult_tags)
    socioeconomico.forEach((row) => {
      row.req_tags?.forEach((tag) => {
        const cleaned = tag.trim();
        if (cleaned) tagsSet.add(cleaned);
      });
      row.add_tags?.forEach((tag) => {
        const cleaned = tag.trim();
        if (cleaned) tagsSet.add(cleaned);
      });
      if (row.mult_tags) {
        Object.keys(row.mult_tags).forEach((tag) => {
          const cleaned = tag.trim();
          if (cleaned) tagsSet.add(cleaned);
        });
      }
    });

    // 5. Varre Dicionário de Tags (coluna tag)
    tagDef.forEach((row) => {
      if (row.tag) {
        const cleaned = row.tag.trim();
        if (cleaned) tagsSet.add(cleaned);
      }
    });

    // 6. Varre Cidades (req_tags e add_tags)
    if (cidades) {
      cidades.forEach((row) => {
        row.req_tags?.forEach((tag) => {
          const cleaned = tag.trim();
          if (cleaned) tagsSet.add(cleaned);
        });
        row.add_tags?.forEach((tag) => {
          const cleaned = tag.trim();
          if (cleaned) tagsSet.add(cleaned);
        });
      });
    }

    // Retorna array ordenado de chaves únicas
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [demografia, estados, nomes, socioeconomico, tagDef, cidades]);

  const showSaveSuccess = (message: string) => {
    setSaveIndicator(message);
    setTimeout(() => setSaveIndicator(null), 2000);
  };

  // Export formatting helpers (TSV for Sheets / Excel pasting; CSV for file download)
  const exportToTSV = (data: any[], headers: string[]): string => {
    const headerLine = headers.join("\t");
    const rows = data.map(item => {
      return headers.map(header => {
        const val = item[header];
        if (Array.isArray(val)) {
          return val.join(", ");
        }
        if (typeof val === "object" && val !== null) {
          return Object.entries(val).map(([k, v]) => `${k}:${v}`).join(", ");
        }
        return val === undefined || val === null ? "" : String(val);
      }).join("\t");
    });
    return [headerLine, ...rows].join("\n");
  };

  const exportToCSV = (data: any[], headers: string[]): string => {
    const headerLine = headers.join(";"); // Semicolon is much safer in Portuguese Excel locales
    const rows = data.map(item => {
      return headers.map(header => {
        const val = item[header];
        let strVal = "";
        if (Array.isArray(val)) {
          strVal = val.join(", ");
        } else if (typeof val === "object" && val !== null) {
          strVal = Object.entries(val).map(([k, v]) => `${k}:${v}`).join(", ");
        } else {
          strVal = val === undefined || val === null ? "" : String(val);
        }
        // Escape semicolons or quotes if any
        if (strVal.includes(";") || strVal.includes('"') || strVal.includes("\n")) {
          strVal = `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(";");
    });
    return [headerLine, ...rows].join("\n");
  };

  const getActiveTabInfo = () => {
    switch (activeTab) {
      case "demo":
        return {
          name: "Demografia",
          headers: ["id_demo", "descricao", "idade_min", "idade_max", "peso_base", "add_tags"],
          data: demografia
        };
      case "est":
        return {
          name: "Estados_Origem",
          headers: ["id_estado", "nome_estado", "peso_base", "add_tags"],
          data: estados
        };
      case "nom":
        return {
          name: "Nomes_Procedurais",
          headers: ["id_nome", "nome", "peso_base", "req_tags"],
          data: nomes
        };
      case "cid":
        return {
          name: "Cidades",
          headers: ["id_cidade", "nome_cidade", "req_tags", "peso_base", "add_tags"],
          data: cidades
        };
      case "socio":
        return {
          name: "Profissoes_Socioeconomico",
          headers: ["id_socio", "profissao", "req_tags", "mult_tags", "peso_base", "add_tags"],
          data: socioeconomico
        };
      case "tags":
        return {
          name: "Dicionario_Tags",
          headers: ["tag", "mod_saude", "mod_felicidade", "mod_renda_mensal"],
          data: tagDef
        };
    }
  };

  const handleCopyToClipboard = () => {
    const { name, headers, data } = getActiveTabInfo();
    const tsvContent = exportToTSV(data, headers);
    
    navigator.clipboard.writeText(tsvContent)
      .then(() => {
        showSaveSuccess(`Copiado! Cole no Sheets (${name})`);
      })
      .catch((err) => {
        console.error("Falha ao copiar TSV: ", err);
        alert("Não foi possível copiar automaticamente. Use a opção de baixar o CSV!");
      });
  };

  const handleDownloadCSV = () => {
    const { name, headers, data } = getActiveTabInfo();
    const csvContent = "\uFEFF" + exportToCSV(data, headers); // UTF-8 BOM so Excel opens accents correctly
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ruleforge_${name.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSaveSuccess(`CSV baixado com sucesso!`);
  };

  // Parsing & Formatting Multipliers Helper
  const formatMultipliers = (mults: Record<string, number>): string => {
    if (!mults) return "";
    return Object.entries(mults)
      .map(([tag, val]) => `${tag}:${val}`)
      .join(", ");
  };

  const parseMultipliers = (str: string): Record<string, number> => {
    const obj: Record<string, number> = {};
    const parts = str.split(",");
    for (const part of parts) {
      const partsOfPart = part.split(":");
      if (partsOfPart.length >= 2) {
        const key = partsOfPart[0].trim();
        const val = parseFloat(partsOfPart[1].trim());
        if (key && !isNaN(val)) {
          obj[key] = val;
        }
      }
    }
    return obj;
  };

  // Demografia Handlers
  const handleDemoChange = (index: number, field: keyof Demografia, value: any) => {
    const updated = [...demografia];
    if (field === "add_tags") {
      updated[index] = {
        ...updated[index],
        add_tags: Array.isArray(value) ? value : String(value).split(",").map((t) => t.trim()).filter(Boolean),
      };
    } else if (field === "idade_min" || field === "idade_max" || field === "peso_base") {
      const num = parseInt(value, 10);
      updated[index] = {
        ...updated[index],
        [field]: isNaN(num) ? 0 : num,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setDemografia(updated);
  };

  const addDemoRow = () => {
    const newId = `DEM_0${demografia.length + 1}`;
    const newRow: Demografia = {
      id_demo: newId,
      descricao: "Novo Perfil Demográfico",
      idade_min: 18,
      idade_max: 35,
      peso_base: 25,
      add_tags: ["Adulto", "Independente"],
    };
    setDemografia([...demografia, newRow]);
    showSaveSuccess("Perfil demográfico adicionado!");
  };

  const deleteDemoRow = (index: number) => {
    setDemografia(demografia.filter((_, i) => i !== index));
    showSaveSuccess("Perfil demográfico removido!");
  };

  const handleDemoChangeById = (id: string, field: keyof Demografia, value: any) => {
    const origIdx = demografia.findIndex(d => d.id_demo === id);
    if (origIdx !== -1) {
      handleDemoChange(origIdx, field, value);
    }
  };

  const deleteDemoRowById = (id: string) => {
    const origIdx = demografia.findIndex(d => d.id_demo === id);
    if (origIdx !== -1) {
      deleteDemoRow(origIdx);
    }
  };

  // Estado Handlers
  const handleEstadoChange = (index: number, field: keyof Estado, value: any) => {
    const updated = [...estados];
    if (field === "add_tags") {
      updated[index] = {
        ...updated[index],
        add_tags: Array.isArray(value) ? value : String(value).split(",").map((t) => t.trim()).filter(Boolean),
      };
    } else if (field === "peso_base") {
      const num = parseInt(value, 10);
      updated[index] = {
        ...updated[index],
        peso_base: isNaN(num) ? 0 : num,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setEstados(updated);
  };

  const addEstadoRow = () => {
    const newId = `EST_${estados.length + 1}`;
    const newRow: Estado = {
      id_estado: newId,
      nome_estado: "Novo Estado",
      peso_base: 50,
      add_tags: ["Nova_Regiao"],
    };
    setEstados([...estados, newRow]);
    showSaveSuccess("Estado de origem adicionado!");
  };

  const deleteEstadoRow = (index: number) => {
    setEstados(estados.filter((_, i) => i !== index));
    showSaveSuccess("Estado de origem removido!");
  };

  const handleEstadoChangeById = (id: string, field: keyof Estado, value: any) => {
    const origIdx = estados.findIndex(e => e.id_estado === id);
    if (origIdx !== -1) {
      handleEstadoChange(origIdx, field, value);
    }
  };

  const deleteEstadoRowById = (id: string) => {
    const origIdx = estados.findIndex(e => e.id_estado === id);
    if (origIdx !== -1) {
      deleteEstadoRow(origIdx);
    }
  };

  // Nomes Handlers
  const handleNomeChange = (index: number, field: keyof NomeDef, value: any) => {
    const updated = [...nomes];
    if (field === "req_tags") {
      updated[index] = {
        ...updated[index],
        req_tags: Array.isArray(value) ? value : String(value).split(",").map((t) => t.trim()).filter(Boolean),
      };
    } else if (field === "peso_base") {
      const num = parseInt(value, 10);
      updated[index] = {
        ...updated[index],
        peso_base: isNaN(num) ? 0 : num,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setNomes(updated);
  };

  const addNomeRow = () => {
    const newId = `NOM_${nomes.length + 1}`;
    const newRow: NomeDef = {
      id_nome: newId,
      nome: "Novo Nome",
      req_tags: [],
      peso_base: 50,
    };
    setNomes([...nomes, newRow]);
    showSaveSuccess("Nome procedural cadastrado!");
  };

  const deleteNomeRow = (index: number) => {
    setNomes(nomes.filter((_, i) => i !== index));
    showSaveSuccess("Nome removido!");
  };

  const handleNomeChangeById = (id: string, field: keyof NomeDef, value: any) => {
    const origIdx = nomes.findIndex(n => n.id_nome === id);
    if (origIdx !== -1) {
      handleNomeChange(origIdx, field, value);
    }
  };

  const deleteNomeRowById = (id: string) => {
    const origIdx = nomes.findIndex(n => n.id_nome === id);
    if (origIdx !== -1) {
      deleteNomeRow(origIdx);
    }
  };

  // Cidades Handlers
  const handleCidadeChange = (index: number, field: keyof CidadeDef, value: any) => {
    const updated = [...cidades];
    if (field === "req_tags") {
      updated[index] = {
        ...updated[index],
        req_tags: Array.isArray(value) ? value : String(value).split(",").map((t) => t.trim()).filter(Boolean),
      };
    } else if (field === "add_tags") {
      updated[index] = {
        ...updated[index],
        add_tags: Array.isArray(value) ? value : String(value).split(",").map((t) => t.trim()).filter(Boolean),
      };
    } else if (field === "peso_base") {
      const num = parseInt(value, 10);
      updated[index] = {
        ...updated[index],
        peso_base: isNaN(num) ? 0 : num,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setCidades(updated);
  };

  const addCidadeRow = () => {
    const newId = `CID_${cidades.length + 1}`;
    const newRow: CidadeDef = {
      id_cidade: newId,
      nome_cidade: "Nova Cidade",
      req_tags: [],
      peso_base: 50,
      add_tags: [],
    };
    setCidades([...cidades, newRow]);
    showSaveSuccess("Cidade cadastrada com sucesso!");
  };

  const deleteCidadeRow = (index: number) => {
    setCidades(cidades.filter((_, i) => i !== index));
    showSaveSuccess("Cidade removida!");
  };

  const handleCidadeChangeById = (id: string, field: keyof CidadeDef, value: any) => {
    const origIdx = cidades.findIndex(c => c.id_cidade === id);
    if (origIdx !== -1) {
      handleCidadeChange(origIdx, field, value);
    }
  };

  const deleteCidadeRowById = (id: string) => {
    const origIdx = cidades.findIndex(c => c.id_cidade === id);
    if (origIdx !== -1) {
      deleteCidadeRow(origIdx);
    }
  };

  // Socioeconomico Handlers
  const handleSocioChange = (index: number, field: keyof Socioeconomico, value: any) => {
    const updated = [...socioeconomico];
    if (field === "req_tags") {
      updated[index] = {
        ...updated[index],
        req_tags: Array.isArray(value) ? value : String(value).split(",").map((t) => t.trim()).filter(Boolean),
      };
    } else if (field === "add_tags") {
      updated[index] = {
        ...updated[index],
        add_tags: Array.isArray(value) ? value : String(value).split(",").map((t) => t.trim()).filter(Boolean),
      };
    } else if (field === "mult_tags") {
      updated[index] = {
        ...updated[index],
        mult_tags: parseMultipliers(value),
      };
    } else if (field === "peso_base") {
      const num = parseInt(value, 10);
      updated[index] = {
        ...updated[index],
        peso_base: isNaN(num) ? 0 : num,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setSocioeconomico(updated);
  };

  const addSocioRow = () => {
    const newId = `SOC_0${socioeconomico.length + 1}`;
    const newRow: Socioeconomico = {
      id_socio: newId,
      profissao: "Nova Profissão",
      req_tags: [],
      mult_tags: {},
      peso_base: 15,
      add_tags: ["Classe_Baixa", "Rotina_Leve"],
    };
    setSocioeconomico([...socioeconomico, newRow]);
    showSaveSuccess("Profissão adicionada!");
  };

  const deleteSocioRow = (index: number) => {
    setSocioeconomico(socioeconomico.filter((_, i) => i !== index));
    showSaveSuccess("Profissão removida!");
  };

  const handleSocioChangeById = (id: string, field: keyof Socioeconomico, value: any) => {
    const origIdx = socioeconomico.findIndex(s => s.id_socio === id);
    if (origIdx !== -1) {
      handleSocioChange(origIdx, field, value);
    }
  };

  const deleteSocioRowById = (id: string) => {
    const origIdx = socioeconomico.findIndex(s => s.id_socio === id);
    if (origIdx !== -1) {
      deleteSocioRow(origIdx);
    }
  };

  // Tags Handlers
  const handleTagChange = (index: number, field: keyof TagDef, value: any) => {
    const updated = [...tagDef];
    if (field === "mod_saude" || field === "mod_felicidade" || field === "mod_renda_mensal") {
      const valParsed = parseInt(value, 10);
      updated[index] = {
        ...updated[index],
        [field]: isNaN(valParsed) ? 0 : valParsed,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setTagDef(updated);
  };

  const addTagRow = () => {
    const newRow: TagDef = {
      tag: "Nova_Tag",
      mod_saude: 0,
      mod_felicidade: 0,
      mod_renda_mensal: 0,
    };
    setTagDef([...tagDef, newRow]);
    showSaveSuccess("Definição de tag adicionada!");
  };

  const deleteTagRow = (index: number) => {
    setTagDef(tagDef.filter((_, i) => i !== index));
    showSaveSuccess("Definição de tag removida!");
  };

  const handleTagChangeByTag = (tag: string, field: keyof TagDef, value: any) => {
    const origIdx = tagDef.findIndex(t => t.tag === tag);
    if (origIdx !== -1) {
      handleTagChange(origIdx, field, value);
    }
  };

  const deleteTagRowByTag = (tag: string) => {
    const origIdx = tagDef.findIndex(t => t.tag === tag);
    if (origIdx !== -1) {
      deleteTagRow(origIdx);
    }
  };

  return (
    <div id="ruleforge-matrix-config" className="w-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-2xl flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight font-sans">
              Matrizes de Regras
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Bancos de dados relacionais que definem a simulação
            </p>
          </div>
        </div>

        {/* Reset / Actions */}
        <div className="flex items-center gap-2">
          {saveIndicator && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              {saveIndicator}
            </span>
          )}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-all"
            title="Restaurar valores padrão do RuleForge"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Padrão</span>
          </button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex flex-wrap gap-1 bg-slate-950/40 p-1 rounded-xl mt-4 border border-slate-800/40">
        <button
          onClick={() => setActiveTab("demo")}
          className={`flex-1 min-w-[100px] py-2 text-xs font-mono rounded-lg transition-all ${
            activeTab === "demo"
              ? "bg-slate-850 text-amber-400 font-semibold border-b-2 border-amber-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          Demografia
        </button>
        <button
          onClick={() => setActiveTab("est")}
          className={`flex-1 min-w-[100px] py-2 text-xs font-mono rounded-lg transition-all ${
            activeTab === "est"
              ? "bg-slate-850 text-amber-400 font-semibold border-b-2 border-amber-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          Origem (Estados)
        </button>
        <button
          onClick={() => setActiveTab("nom")}
          className={`flex-1 min-w-[100px] py-2 text-xs font-mono rounded-lg transition-all ${
            activeTab === "nom"
              ? "bg-slate-850 text-amber-400 font-semibold border-b-2 border-amber-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          Procedural Nomes
        </button>
        <button
          onClick={() => setActiveTab("cid")}
          className={`flex-1 min-w-[100px] py-2 text-xs font-mono rounded-lg transition-all ${
            activeTab === "cid"
              ? "bg-slate-850 text-amber-400 font-semibold border-b-2 border-amber-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          Micro-Cidades
        </button>
        <button
          onClick={() => setActiveTab("socio")}
          className={`flex-1 min-w-[100px] py-2 text-xs font-mono rounded-lg transition-all ${
            activeTab === "socio"
              ? "bg-slate-850 text-amber-400 font-semibold border-b-2 border-amber-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          Profissões
        </button>
        <button
          onClick={() => setActiveTab("tags")}
          className={`flex-1 min-w-[100px] py-2 text-xs font-mono rounded-lg transition-all ${
            activeTab === "tags"
              ? "bg-slate-850 text-amber-400 font-semibold border-b-2 border-amber-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          Dicionário Tags
        </button>
      </div>

      {/* EXPORT / SYNC WITH PLANILHA ACTIONS BAR */}
      <div className="mt-4 p-3.5 bg-slate-950/60 rounded-xl border border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-inner">
        <div className="flex items-start gap-2.5">
          <div className="p-1 px-1.5 bg-amber-500/10 text-[9px] rounded border border-amber-500/20 text-amber-400 font-bold uppercase tracking-wider font-mono shrink-0 mt-0.5">
            SINC SHEET
          </div>
          <div>
            <span className="block text-xs text-slate-300 font-sans font-medium">
              Matriz ativa para exportação: <strong className="text-amber-400 font-mono">
                {activeTab === "demo" && "Demografia"}
                {activeTab === "est" && "Origem (Estados)"}
                {activeTab === "nom" && "Procedural Nomes"}
                {activeTab === "cid" && "Micro-Cidades (Cidades)"}
                {activeTab === "socio" && "Profissões"}
                {activeTab === "tags" && "Dicionário Tags"}
              </strong>
            </span>
            <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
              Células formatadas para colar direto no Google Sheets ou exportar em CSV.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Copy cells for directly pasting to Google Sheets */}
          <button
            onClick={handleCopyToClipboard}
            className="flex-1 sm:flex-initial py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none active:scale-95"
            title="Copiar dados formatados em colunas. Vá ao Sheets, escolha a primeira célula e use Ctrl+V."
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar p/ o Sheets (Ctrl+V)</span>
          </button>

          {/* Download CSV */}
          <button
            onClick={handleDownloadCSV}
            className="flex-1 sm:flex-initial py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 rounded-lg font-mono text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar CSV</span>
          </button>
        </div>
      </div>

      {/* MATRIX CONTENT CONTAINER */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 min-h-[350px]">
        {activeTab === "demo" && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex items-start gap-2.5 text-xs text-amber-200/90 font-mono">
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Demografia:</strong> Define perfis sorteados com base no <strong>peso_base</strong>. O segredo está nas <strong>add_tags</strong>, que alimentam a cascata seguinte.
              </span>
            </div>

            {/* BARRA DE PESQUISA EXCLUSIVA PARA DEMOGRAFIA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={demoSearch}
                  onChange={(e) => setDemoSearch(e.target.value)}
                  placeholder="Pesquisar perfil, ID ou tag demográfica..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-705 focus:border-amber-500 outline-none rounded-xl text-xs font-mono text-slate-200 transition-all focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 self-center bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                Mostrando <strong className="text-amber-500">{
                  (() => {
                    const query = demoSearch.toLowerCase().trim();
                    const list = query 
                      ? demografia.filter(d => d.descricao.toLowerCase().includes(query) || d.id_demo.toLowerCase().includes(query) || d.add_tags.some(t => t.toLowerCase().includes(query)))
                      : demografia;
                    return list.length > 20 ? 20 : list.length;
                  })()
                }</strong> de <strong className="text-amber-500">{
                  (() => {
                    const query = demoSearch.toLowerCase().trim();
                    const list = query 
                      ? demografia.filter(d => d.descricao.toLowerCase().includes(query) || d.id_demo.toLowerCase().includes(query) || d.add_tags.some(t => t.toLowerCase().includes(query)))
                      : demografia;
                    return list.length;
                  })()
                }</strong> cadastrados {demoSearch && <span className="text-amber-400">(filtrados)</span>}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                    <th className="p-3 font-semibold">ID</th>
                    <th className="p-3 font-semibold">Descrição</th>
                    <th className="p-3 font-semibold">Idades</th>
                    <th className="p-3 font-semibold">Peso Base</th>
                    <th className="p-3 font-semibold">Tags Adicionadas</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {(() => {
                    const query = demoSearch.toLowerCase().trim();
                    const filteredList = query 
                      ? demografia.filter(d => 
                          d.descricao.toLowerCase().includes(query) || 
                          d.id_demo.toLowerCase().includes(query) ||
                          d.add_tags.some(t => t.toLowerCase().includes(query))
                        )
                      : demografia;
                    const displayList = filteredList.slice(0, 20);

                    if (displayList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            Nenhum perfil demográfico localizado para "{demoSearch}".
                          </td>
                        </tr>
                      );
                    }

                    return displayList.map((row) => (
                      <tr key={row.id_demo} className="hover:bg-slate-850/40 transition-colors">
                        <td className="p-2 text-amber-500 font-semibold">{row.id_demo}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.descricao}
                            onChange={(e) => handleDemoChangeById(row.id_demo, "descricao", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded px-2 py-1 text-slate-100 placeholder-slate-500"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={row.idade_min}
                              onChange={(e) => handleDemoChangeById(row.id_demo, "idade_min", e.target.value)}
                              className="w-12 bg-slate-900 border border-slate-800 text-center rounded py-1 text-slate-100"
                            />
                            <span className="text-slate-500">-</span>
                            <input
                              type="number"
                              value={row.idade_max}
                              onChange={(e) => handleDemoChangeById(row.id_demo, "idade_max", e.target.value)}
                              className="w-12 bg-slate-900 border border-slate-800 text-center rounded py-1 text-slate-100"
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.peso_base}
                            onChange={(e) => handleDemoChangeById(row.id_demo, "peso_base", e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-800 text-center rounded py-1 text-slate-100"
                          />
                        </td>
                        <td className="p-2 min-w-[185px]">
                          <TagMultiSelect
                            selectedTags={row.add_tags}
                            onChange={(tags) => handleDemoChangeById(row.id_demo, "add_tags", tags)}
                            allTags={allAvailableTags}
                            placeholder="Escolher tags..."
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteDemoRowById(row.id_demo)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <button
              onClick={addDemoRow}
              className="flex items-center gap-1.5 text-xs font-mono text-amber-500 hover:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl transition-all w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Perfil Demográfico</span>
            </button>
          </div>
        )}

        {activeTab === "est" && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex items-start gap-2.5 text-xs text-amber-200/90 font-mono">
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Estados:</strong> Primeira fase da cascata de simetria regional. Define estados sorteados pelo <strong>peso_base</strong> e adiciona as tags geográficas ao ator.
              </span>
            </div>

            {/* BARRA DE PESQUISA EXCLUSIVA PARA ESTADOS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={estadoSearch}
                  onChange={(e) => setEstadoSearch(e.target.value)}
                  placeholder="Pesquisar estado, ID ou tag geográfica..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-705 focus:border-amber-500 outline-none rounded-xl text-xs font-mono text-slate-200 transition-all focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 self-center bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                Mostrando <strong className="text-amber-500">{
                  (() => {
                    const query = estadoSearch.toLowerCase().trim();
                    const list = query 
                      ? estados.filter(e => e.nome_estado.toLowerCase().includes(query) || e.id_estado.toLowerCase().includes(query) || e.add_tags.some(t => t.toLowerCase().includes(query)))
                      : estados;
                    return list.length > 20 ? 20 : list.length;
                  })()
                }</strong> de <strong className="text-amber-500">{
                  (() => {
                    const query = estadoSearch.toLowerCase().trim();
                    const list = query 
                      ? estados.filter(e => e.nome_estado.toLowerCase().includes(query) || e.id_estado.toLowerCase().includes(query) || e.add_tags.some(t => t.toLowerCase().includes(query)))
                      : estados;
                    return list.length;
                  })()
                }</strong> cadastrados {estadoSearch && <span className="text-amber-400">(filtrados)</span>}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                    <th className="p-3 font-semibold">ID Estado</th>
                    <th className="p-3 font-semibold">Nome do Estado</th>
                    <th className="p-3 font-semibold">Peso Base</th>
                    <th className="p-3 font-semibold">Região / Tags Geográficas</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {(() => {
                    const query = estadoSearch.toLowerCase().trim();
                    const filteredList = query 
                      ? estados.filter(e => 
                          e.nome_estado.toLowerCase().includes(query) || 
                          e.id_estado.toLowerCase().includes(query) ||
                          e.add_tags.some(t => t.toLowerCase().includes(query))
                        )
                      : estados;
                    const displayList = filteredList.slice(0, 20);

                    if (displayList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">
                            Nenhum estado localizado para "{estadoSearch}".
                          </td>
                        </tr>
                      );
                    }

                    return displayList.map((row) => (
                      <tr key={row.id_estado} className="hover:bg-slate-850/40 transition-colors">
                        <td className="p-2 text-emerald-400 font-semibold">{row.id_estado}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.nome_estado}
                            onChange={(e) => handleEstadoChangeById(row.id_estado, "nome_estado", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded px-2 py-1 text-slate-100"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.peso_base}
                            onChange={(e) => handleEstadoChangeById(row.id_estado, "peso_base", e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-800 text-center rounded py-1 text-slate-100"
                          />
                        </td>
                        <td className="p-2 min-w-[185px]">
                          <TagMultiSelect
                            selectedTags={row.add_tags}
                            onChange={(tags) => handleEstadoChangeById(row.id_estado, "add_tags", tags)}
                            allTags={allAvailableTags}
                            placeholder="Escolher tags..."
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteEstadoRowById(row.id_estado)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <button
              onClick={addEstadoRow}
              className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl transition-all w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Estado</span>
            </button>
          </div>
        )}

        {activeTab === "nom" && (
          <div className="space-y-3 animate-fade-in">
            <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex items-start gap-2.5 text-xs text-amber-200/90 font-mono">
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Nomes:</strong> Sorteio de nomes dependente de tags requeridas. Filtra os nomes cujas <strong>req_tags</strong> estão contidas no histórico de tags acumuladas pelo NPC.
              </span>
            </div>

            {/* BARRA DE PESQUISA EXCLUSIVA PARA NOMES */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={nomeSearch}
                  onChange={(e) => setNomeSearch(e.target.value)}
                  placeholder="Pesquisar nome ou tag requerida..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-705 focus:border-indigo-500 outline-none rounded-xl text-xs font-mono text-slate-200 transition-all focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 self-center bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                Mostrando <strong className="text-indigo-400">{
                  (() => {
                    const query = nomeSearch.toLowerCase().trim();
                    const list = query 
                      ? nomes.filter(n => n.nome.toLowerCase().includes(query) || n.id_nome.toLowerCase().includes(query) || n.req_tags.some(t => t.toLowerCase().includes(query)))
                      : nomes;
                    return list.length > 20 ? 20 : list.length;
                  })()
                }</strong> de <strong className="text-indigo-400">{
                  (() => {
                    const query = nomeSearch.toLowerCase().trim();
                    const list = query 
                      ? nomes.filter(n => n.nome.toLowerCase().includes(query) || n.id_nome.toLowerCase().includes(query) || n.req_tags.some(t => t.toLowerCase().includes(query)))
                      : nomes;
                    return list.length;
                  })()
                }</strong> cadastrados {nomeSearch && <span className="text-amber-400">(filtrados)</span>}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                    <th className="p-3 font-semibold">ID</th>
                    <th className="p-3 font-semibold">Nome Procedural</th>
                    <th className="p-3 font-semibold">Peso Base</th>
                    <th className="p-3 font-semibold">Tags Requeridas (E.g. Homem, Origem_Amazonia)</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {(() => {
                    const query = nomeSearch.toLowerCase().trim();
                    const filteredList = query 
                      ? nomes.filter(n => 
                          n.nome.toLowerCase().includes(query) || 
                          n.id_nome.toLowerCase().includes(query) ||
                          n.req_tags.some(tag => tag.toLowerCase().includes(query))
                        )
                      : nomes;
                    const displayList = filteredList.slice(0, 20);

                    if (displayList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">
                            Nenhum nome cadastrado ou encontrado para "{nomeSearch}".
                          </td>
                        </tr>
                      );
                    }

                    return displayList.map((row, idx) => (
                      <tr key={row.id_nome || idx} className="hover:bg-slate-850/40 transition-colors">
                        <td className="p-2 text-indigo-400 font-semibold">{row.id_nome}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.nome}
                            onChange={(e) => handleNomeChangeById(row.id_nome, "nome", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded px-2 py-1 text-slate-100"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.peso_base}
                            onChange={(e) => handleNomeChangeById(row.id_nome, "peso_base", e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-800 text-center rounded py-1 text-slate-100"
                          />
                        </td>
                        <td className="p-2 min-w-[185px]">
                          <TagMultiSelect
                            selectedTags={row.req_tags}
                            onChange={(tags) => handleNomeChangeById(row.id_nome, "req_tags", tags)}
                            allTags={allAvailableTags}
                            placeholder="Deixe em branco p/ livre..."
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteNomeRowById(row.id_nome)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <button
              onClick={addNomeRow}
              className="flex items-center gap-1.5 text-xs font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl transition-all w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Nome</span>
            </button>
          </div>
        )}

        {activeTab === "cid" && (
          <div className="space-y-3 animate-fade-in">
            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-start gap-2.5 text-xs text-emerald-250/90 font-mono">
              <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Micro-Geografia (Cidades):</strong> Sorteio de cidades dependente de tags requeridas. Filtra as cidades cujas <strong>req_tags</strong> (como UF_AM ou UF_SP) existem na memória de tags acumuladas pelo NPC na Fase 0 (Estado).
              </span>
            </div>

            {/* BARRA DE PESQUISA EXCLUSIVA PARA CIDADES */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={cidadeSearch}
                  onChange={(e) => setCidadeSearch(e.target.value)}
                  placeholder="Pesquisar cidade ou tag requerida..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-705 focus:border-emerald-500 outline-none rounded-xl text-xs font-mono text-slate-200 transition-all focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 self-center bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                Mostrando <strong className="text-emerald-400">{
                  (() => {
                    const query = cidadeSearch.toLowerCase().trim();
                    const list = query 
                      ? cidades.filter(c => c.nome_cidade.toLowerCase().includes(query) || c.id_cidade.toLowerCase().includes(query) || (c.req_tags && c.req_tags.some(t => t.toLowerCase().includes(query))))
                      : cidades;
                    return list.length > 20 ? 20 : list.length;
                  })()
                }</strong> de <strong className="text-emerald-400">{
                  (() => {
                    const query = cidadeSearch.toLowerCase().trim();
                    const list = query 
                      ? cidades.filter(c => c.nome_cidade.toLowerCase().includes(query) || c.id_cidade.toLowerCase().includes(query) || (c.req_tags && c.req_tags.some(t => t.toLowerCase().includes(query))))
                      : cidades;
                    return list.length;
                  })()
                }</strong> cadastradas {cidadeSearch && <span className="text-amber-400">(filtrados)</span>}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                    <th className="p-3 font-semibold">ID</th>
                    <th className="p-3 font-semibold">Nome da Cidade</th>
                    <th className="p-3 font-semibold text-center">Peso Base</th>
                    <th className="p-3 font-semibold">Tags Requeridas (E.g. UF_SP, UF_AM)</th>
                    <th className="p-3 font-semibold">Tags Adicionadas</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {(() => {
                    const query = cidadeSearch.toLowerCase().trim();
                    const filteredList = query 
                      ? cidades.filter(c => 
                          c.nome_cidade.toLowerCase().includes(query) || 
                          c.id_cidade.toLowerCase().includes(query) ||
                          (c.req_tags && c.req_tags.some(tag => tag.toLowerCase().includes(query))) ||
                          (c.add_tags && c.add_tags.some(tag => tag.toLowerCase().includes(query)))
                        )
                      : cidades;
                    const displayList = filteredList.slice(0, 20);

                    if (displayList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 animate-pulse">
                            Nenhuma cidade localizada para "{cidadeSearch}".
                          </td>
                        </tr>
                      );
                    }

                    return displayList.map((row, idx) => (
                      <tr key={row.id_cidade || idx} className="hover:bg-slate-850/40 transition-colors">
                        <td className="p-2 text-emerald-400 font-semibold">{row.id_cidade}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.nome_cidade}
                            onChange={(e) => handleCidadeChangeById(row.id_cidade, "nome_cidade", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-705 focus:border-emerald-500 rounded px-2 py-1 text-slate-100"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex justify-center">
                            <input
                              type="number"
                              value={row.peso_base}
                              onChange={(e) => handleCidadeChangeById(row.id_cidade, "peso_base", parseInt(e.target.value) || 0)}
                              className="w-16 bg-slate-900 border border-slate-800 text-center rounded py-1 text-slate-100 font-bold"
                            />
                          </div>
                        </td>
                        <td className="p-2 min-w-[185px]">
                          <TagMultiSelect
                            selectedTags={row.req_tags || []}
                            onChange={(tags) => handleCidadeChangeById(row.id_cidade, "req_tags", tags)}
                            allTags={allAvailableTags}
                            placeholder="Deixe em branco p/ livre..."
                          />
                        </td>
                        <td className="p-2 min-w-[185px]">
                          <TagMultiSelect
                            selectedTags={row.add_tags || []}
                            onChange={(tags) => handleCidadeChangeById(row.id_cidade, "add_tags", tags)}
                            allTags={allAvailableTags}
                            placeholder="Adicione tags extras..."
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteCidadeRowById(row.id_cidade)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-all"
                            title="Remover Cidade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <button
              onClick={addCidadeRow}
              className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl transition-all w-full justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Cidade</span>
            </button>
          </div>
        )}

        {activeTab === "socio" && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex items-start gap-2.5 text-xs text-amber-200/90 font-mono">
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Socioeconômico:</strong> O ator deve preencher todas as <strong>req_tags</strong> para se candidatar. Os pesos base são ajustados multiplicativamente por tags em sua memória via <strong>mult_tags</strong>.
              </span>
            </div>

            {/* BARRA DE PESQUISA EXCLUSIVA PARA SOCIOECONOMICO */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={socioSearch}
                  onChange={(e) => setSocioSearch(e.target.value)}
                  placeholder="Pesquisar profissão, ID ou tag..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-705 focus:border-indigo-500 outline-none rounded-xl text-xs font-mono text-slate-200 transition-all focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 self-center bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                Mostrando <strong className="text-indigo-400">{
                  (() => {
                    const query = socioSearch.toLowerCase().trim();
                    const list = query 
                      ? socioeconomico.filter(s => s.profissao.toLowerCase().includes(query) || s.id_socio.toLowerCase().includes(query) || s.req_tags.some(t => t.toLowerCase().includes(query)) || s.add_tags.some(t => t.toLowerCase().includes(query)))
                      : socioeconomico;
                    return list.length > 20 ? 20 : list.length;
                  })()
                }</strong> de <strong className="text-indigo-400">{
                  (() => {
                    const query = socioSearch.toLowerCase().trim();
                    const list = query 
                      ? socioeconomico.filter(s => s.profissao.toLowerCase().includes(query) || s.id_socio.toLowerCase().includes(query) || s.req_tags.some(t => t.toLowerCase().includes(query)) || s.add_tags.some(t => t.toLowerCase().includes(query)))
                      : socioeconomico;
                    return list.length;
                  })()
                }</strong> cadastradas {socioSearch && <span className="text-amber-400">(filtrados)</span>}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                    <th className="p-3 font-semibold">ID</th>
                    <th className="p-3 font-semibold">Profissão</th>
                    <th className="p-3 font-semibold">Tags Requeridas</th>
                    <th className="p-3 font-semibold">Multiplicadores (Tag:Mult)</th>
                    <th className="p-3 font-semibold">Peso Base</th>
                    <th className="p-3 font-semibold">Tags Adicionadas</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {(() => {
                    const query = socioSearch.toLowerCase().trim();
                    const filteredList = query 
                      ? socioeconomico.filter(s => 
                          s.profissao.toLowerCase().includes(query) || 
                          s.id_socio.toLowerCase().includes(query) ||
                          s.req_tags.some(t => t.toLowerCase().includes(query)) ||
                          s.add_tags.some(t => t.toLowerCase().includes(query))
                        )
                      : socioeconomico;
                    const displayList = filteredList.slice(0, 20);

                    if (displayList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            Nenhuma profissão localizada para "{socioSearch}".
                          </td>
                        </tr>
                      );
                    }

                    return displayList.map((row) => (
                      <tr key={row.id_socio} className="hover:bg-slate-850/40 transition-colors">
                        <td className="p-2 text-amber-500 font-semibold">{row.id_socio}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.profissao}
                            onChange={(e) => handleSocioChangeById(row.id_socio, "profissao", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 min-w-[110px]"
                          />
                        </td>
                        <td className="p-2 min-w-[185px]">
                          <TagMultiSelect
                            selectedTags={row.req_tags}
                            onChange={(tags) => handleSocioChangeById(row.id_socio, "req_tags", tags)}
                            allTags={allAvailableTags}
                            placeholder="Deixe livre..."
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={formatMultipliers(row.mult_tags)}
                            onChange={(e) => handleSocioChangeById(row.id_socio, "mult_tags", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-amber-300 font-mono min-w-[100px]"
                            placeholder="E.g., Jovem:0.1, Idoso:2.0"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.peso_base}
                            onChange={(e) => handleSocioChangeById(row.id_socio, "peso_base", e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-800 text-center rounded py-1 text-slate-100"
                          />
                        </td>
                        <td className="p-2 min-w-[185px]">
                          <TagMultiSelect
                            selectedTags={row.add_tags}
                            onChange={(tags) => handleSocioChangeById(row.id_socio, "add_tags", tags)}
                            allTags={allAvailableTags}
                            placeholder="Sem tags extras..."
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteSocioRowById(row.id_socio)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <button
              onClick={addSocioRow}
              className="flex items-center gap-1.5 text-xs font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl transition-all w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Profissão</span>
            </button>
          </div>
        )}

        {activeTab === "tags" && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-start gap-2.5 text-xs text-emerald-250/90 font-mono">
              <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Modificadores de Tags:</strong> O dicionário lógico de efeitos. Modificadores somam-se aos atributos base do NPC {"("}Saúde Base: 100, Felicidade Base: 50{")"}.
              </span>
            </div>

            {/* BARRA DE PESQUISA EXCLUSIVA PARA MODIFICADORES DE TAGS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Pesquisar tag modificadora..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-705 focus:border-emerald-500 outline-none rounded-xl text-xs font-mono text-slate-200 transition-all focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 self-center bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                Mostrando <strong className="text-emerald-400">{
                  (() => {
                    const query = tagSearch.toLowerCase().trim();
                    const list = query 
                      ? tagDef.filter(t => t.tag.toLowerCase().includes(query))
                      : tagDef;
                    return list.length > 20 ? 20 : list.length;
                  })()
                }</strong> de <strong className="text-emerald-400">{
                  (() => {
                    const query = tagSearch.toLowerCase().trim();
                    const list = query 
                      ? tagDef.filter(t => t.tag.toLowerCase().includes(query))
                      : tagDef;
                    return list.length;
                  })()
                }</strong> cadastradas {tagSearch && <span className="text-amber-400">(filtrados)</span>}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                    <th className="p-3 font-semibold">Nome da Tag</th>
                    <th className="p-3 font-semibold text-center">Mod. Saúde</th>
                    <th className="p-3 font-semibold text-center">Mod. Felicidade</th>
                    <th className="p-3 font-semibold">Mod. Renda Mensal</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {(() => {
                    const query = tagSearch.toLowerCase().trim();
                    const filteredList = query 
                      ? tagDef.filter(t => t.tag.toLowerCase().includes(query))
                      : tagDef;
                    const displayList = filteredList.slice(0, 20);

                    if (displayList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">
                            Nenhuma tag localizada para "{tagSearch}".
                          </td>
                        </tr>
                      );
                    }

                    return displayList.map((row) => (
                      <tr key={row.tag} className="hover:bg-slate-850/40 transition-colors">
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.tag}
                            onChange={(e) => handleTagChangeByTag(row.tag, "tag", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-amber-400 font-bold min-w-[130px]"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex justify-center">
                            <input
                              type="number"
                              value={row.mod_saude}
                              onChange={(e) => handleTagChangeByTag(row.tag, "mod_saude", e.target.value)}
                              className="w-16 bg-slate-900 border border-slate-800 text-center rounded py-1 font-semibold text-slate-200"
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex justify-center">
                            <input
                              type="number"
                              value={row.mod_felicidade}
                              onChange={(e) => handleTagChangeByTag(row.tag, "mod_felicidade", e.target.value)}
                              className="w-16 bg-slate-900 border border-slate-800 text-center rounded py-1 font-semibold text-slate-200"
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1 min-w-[110px]">
                            <span className="text-slate-500 text-[10px]">R$</span>
                            <input
                              type="number"
                              value={row.mod_renda_mensal}
                              onChange={(e) => handleTagChangeByTag(row.tag, "mod_renda_mensal", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-emerald-400 font-bold"
                            />
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteTagRowByTag(row.tag)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <button
              onClick={addTagRow}
              className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl transition-all w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Tag Modificadora</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
