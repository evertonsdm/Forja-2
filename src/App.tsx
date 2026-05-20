import React, { useState, useEffect, useMemo } from "react";
import { 
  defaultDemografia, 
  defaultSocioeconomico, 
  defaultTagDef,
  defaultEstado,
  defaultNome,
  defaultCidade
} from "./data/defaultData";
import { generateNPC } from "./utils/engine";
import { generateRandomSeed } from "./utils/prng";
import { NPC, Demografia, Socioeconomico, TagDef, Estado, NomeDef, CidadeDef } from "./types";
import { NPCCard } from "./components/NPCCard";
import { MatrixEditor } from "./components/MatrixEditor";
import { NPCHistory } from "./components/NPCHistory";
import { BlockMatrixEditor } from "./components/BlockMatrixEditor";
import { BatchGenerator } from "./components/BatchGenerator";
import { parseNomesCSV, parseCidadesCSV, parseSocioeconomicoCSV, parseDemografiaCSV, parseEstadosCSV, parseTagDefCSV } from "./utils/csvParser";
import { 
  Dices, 
  Settings2, 
  Sparkles, 
  Info, 
  Database,
  ShieldAlert,
  HelpCircle,
  Copy,
  ChevronRight,
  TrendingDown,
  ArrowRightLeft,
  RotateCcw,
  Lock,
  Unlock,
  ArrowRight,
  Workflow,
  Cpu
} from "lucide-react";

// SUB-COMPONENT: PROBABILITY BAR IN CYBERPUNK MINIMALIST STYLE
const ProbabilityBar = ({ 
  label, 
  value, 
  percentage, 
  active, 
  locked, 
  disabled,
  onToggleLock 
}: { 
  label: string; 
  value: number; 
  percentage: number; 
  active: boolean; 
  locked: boolean; 
  disabled?: boolean;
  onToggleLock: () => void;
  key?: any;
}) => {
  return (
    <div 
      className={`relative p-2.5 rounded-xl border transition-all duration-200 select-none group flex items-center justify-between gap-3 ${
        active 
          ? "bg-[#FFBF00]/10 border-[#FFBF00] shadow-[0_0_12px_rgba(255,191,0,0.15)] text-white" 
          : disabled 
            ? "opacity-35 bg-slate-950/25 border-slate-900 text-slate-500" 
            : "bg-slate-950/40 border-slate-800/80 hover:border-slate-800 text-slate-300"
      }`}
    >
      {/* Percentage background progress bar */}
      {!disabled && (
        <div 
          className={`absolute left-0 top-0 bottom-0 rounded-l-xl transition-all duration-500 ${
            active ? "bg-[#FFBF00]/10" : "bg-[#FFBF00]/5"
          }`}
          style={{ width: `${percentage}%` }}
        />
      )}

      {/* Item info/details */}
      <div className="relative flex-1 min-w-0 font-mono text-left">
        <div className="flex items-center gap-1.5 justify-start">
          {active && <span className="w-1.5 h-1.5 rounded-full bg-[#FFBF00] animate-pulse" />}
          <span className={`text-xs truncate block font-bold font-sans ${active ? "text-[#FFBF00]" : "text-slate-200"}`}>
            {label}
          </span>
        </div>
        <div className="flex gap-1.5 mt-0.5 text-[9px] text-slate-500 leading-none">
          <span>W: <strong className={active ? "text-[#FFBF00]" : "text-slate-400"}>{value.toFixed(1)}</strong></span>
          {!disabled && (
            <>
              <span>•</span>
              <span className="font-semibold text-emerald-500/90">{percentage.toFixed(1)}%</span>
            </>
          )}
          {disabled && (
            <span className="text-rose-500 font-bold uppercase tracking-wider text-[8px]">Incompatível</span>
          )}
        </div>
      </div>

      {/* Lock switch */}
      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className={`relative z-10 p-1.5 rounded-lg border transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-90 ${
            locked
              ? "bg-[#FFBF00] border-[#FFBF00] text-slate-950 hover:bg-[#FFD13B]"
              : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-[#FFBF00]/50"
          }`}
          title={locked ? "Destravar esta decisão" : "Travar esta decisão"}
        >
          {locked ? (
            <Lock className="w-2.5 h-2.5 text-slate-950 stroke-[3.5px]" />
          ) : (
            <Unlock className="w-2.5 h-2.5 group-hover:text-[#FFBF00] transition-colors" />
          )}
        </button>
      )}
    </div>
  );
};

export default function App() {
  // 1. Relational Matrix States (with lazy initialization from localStorage)
  const [demografia, setDemografia] = useState<Demografia[]>(() => {
    try {
      const saved = localStorage.getItem("ruleforge_demografia");
      return saved ? JSON.parse(saved) : defaultDemografia;
    } catch {
      return defaultDemografia;
    }
  });

  const [socioeconomico, setSocioeconomico] = useState<Socioeconomico[]>(() => {
    try {
      const saved = localStorage.getItem("ruleforge_socioeconomico");
      return saved ? JSON.parse(saved) : defaultSocioeconomico;
    } catch {
      return defaultSocioeconomico;
    }
  });

  const [tagDef, setTagDef] = useState<TagDef[]>(() => {
    try {
      const saved = localStorage.getItem("ruleforge_tagdef");
      return saved ? JSON.parse(saved) : defaultTagDef;
    } catch {
      return defaultTagDef;
    }
  });

  const [estados, setEstados] = useState<Estado[]>(() => {
    try {
      const saved = localStorage.getItem("ruleforge_estados");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 5) {
          return parsed;
        }
      }
      return defaultEstado;
    } catch {
      return defaultEstado;
    }
  });

  const [nomes, setNomes] = useState<NomeDef[]>(() => {
    try {
      const saved = localStorage.getItem("ruleforge_nomes");
      return saved ? JSON.parse(saved) : defaultNome;
    } catch {
      return defaultNome;
    }
  });

  const [cidades, setCidades] = useState<CidadeDef[]>(() => {
    try {
      const saved = localStorage.getItem("ruleforge_cidades");
      return saved ? JSON.parse(saved) : defaultCidade;
    } catch {
      return defaultCidade;
    }
  });

  // Google Sheets Auto-Sync States
  const [sheetSyncStatus, setSheetSyncStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sheetSyncMessage, setSheetSyncMessage] = useState<string>("Sincronizando banco...");

  const syncDatabaseFromGoogleSheets = async () => {
    setSheetSyncStatus("loading");
    setSheetSyncMessage("Sincronizando banco de dados completo (6 planilhas)...");
    try {
      const timestamp = Date.now();
      const demografiaUrl = `https://docs.google.com/spreadsheets/d/1cxHlvoMKiuYq8iz0_vxPEGT6WQv082MdRLrsRqEoaxk/export?format=csv&gid=0&cache_bypass=${timestamp}`;
      const estadosUrl = `https://docs.google.com/spreadsheets/d/1cxHlvoMKiuYq8iz0_vxPEGT6WQv082MdRLrsRqEoaxk/export?format=csv&gid=1321492706&cache_bypass=${timestamp}`;
      const nomesUrl = `https://docs.google.com/spreadsheets/d/1cxHlvoMKiuYq8iz0_vxPEGT6WQv082MdRLrsRqEoaxk/export?format=csv&gid=1812951774&cache_bypass=${timestamp}`;
      const cidadesUrl = `https://docs.google.com/spreadsheets/d/1cxHlvoMKiuYq8iz0_vxPEGT6WQv082MdRLrsRqEoaxk/export?format=csv&gid=933912219&cache_bypass=${timestamp}`;
      const profissoesUrl = `https://docs.google.com/spreadsheets/d/1cxHlvoMKiuYq8iz0_vxPEGT6WQv082MdRLrsRqEoaxk/export?format=csv&gid=1646832095&cache_bypass=${timestamp}`;
      const tagsUrl = `https://docs.google.com/spreadsheets/d/1cxHlvoMKiuYq8iz0_vxPEGT6WQv082MdRLrsRqEoaxk/export?format=csv&gid=2103085223&cache_bypass=${timestamp}`;

      const [resNomes, resCidades, resProfissoes, resDemografia, resEstados, resTags] = await Promise.all([
        fetch(nomesUrl),
        fetch(cidadesUrl),
        fetch(profissoesUrl),
        fetch(demografiaUrl),
        fetch(estadosUrl),
        fetch(tagsUrl)
      ]);

      if (!resNomes.ok) throw new Error(`HTTP Nomes ${resNomes.status}`);
      if (!resCidades.ok) throw new Error(`HTTP Cidades ${resCidades.status}`);
      if (!resProfissoes.ok) throw new Error(`HTTP Profissões ${resProfissoes.status}`);
      if (!resDemografia.ok) throw new Error(`HTTP Demografia ${resDemografia.status}`);
      if (!resEstados.ok) throw new Error(`HTTP Estados ${resEstados.status}`);
      if (!resTags.ok) throw new Error(`HTTP Tags ${resTags.status}`);

      const [csvNomes, csvCidades, csvProfissoes, csvDemografia, csvEstados, csvTags] = await Promise.all([
        resNomes.text(),
        resCidades.text(),
        resProfissoes.text(),
        resDemografia.text(),
        resEstados.text(),
        resTags.text()
      ]);

      const parsedNomes = parseNomesCSV(csvNomes);
      const parsedCidades = parseCidadesCSV(csvCidades);
      const parsedProfissoes = parseSocioeconomicoCSV(csvProfissoes);
      const parsedDemografia = parseDemografiaCSV(csvDemografia);
      const parsedEstados = parseEstadosCSV(csvEstados);
      const parsedTags = parseTagDefCSV(csvTags);

      if (parsedNomes.length === 0) {
        throw new Error("Planilha de nomes veio vazia ou corrompida");
      }
      if (parsedCidades.length === 0) {
        throw new Error("Planilha de cidades veio vazia ou corrompida");
      }
      if (parsedProfissoes.length === 0) {
        throw new Error("Planilha de profissões veio vazia ou corrompida");
      }
      if (parsedDemografia.length === 0) {
        throw new Error("Planilha de demografia veio vazia ou corrompida");
      }
      if (parsedEstados.length === 0) {
        throw new Error("Planilha de estados veio vazia ou corrompida");
      }
      if (parsedTags.length === 0) {
        throw new Error("Planilha de tags veio vazia ou corrompida");
      }

      setNomes(parsedNomes);
      setCidades(parsedCidades);
      setSocioeconomico(parsedProfissoes);
      setDemografia(parsedDemografia);
      setEstados(parsedEstados);
      setTagDef(parsedTags);

      setSheetSyncStatus("success");
      setSheetSyncMessage(
        `Planilhas sincronizadas! (Demografias: ${parsedDemografia.length} | Estados: ${parsedEstados.length} | Cidades: ${parsedCidades.length} | Nomes: ${parsedNomes.length} | Profissões: ${parsedProfissoes.length} | Tags: ${parsedTags.length})`
      );
    } catch (err: any) {
      console.error("Erro ao importar planilhas:", err);
      setSheetSyncStatus("error");
      setSheetSyncMessage(`Falha ao sincronizar: ${err.message || err}`);
    }
  };

  // Inicializa a sincronização automática no carregamento inicial
  useEffect(() => {
    syncDatabaseFromGoogleSheets();
  }, []);

  // 2. Control State
  const [activeSeed, setActiveSeed] = useState<string>(() => {
    const saved = localStorage.getItem("ruleforge_active_seed");
    return saved || "87295";
  });
  const [seedInputText, setSeedInputText] = useState<string>(activeSeed);
  const [activeMenu, setActiveMenu] = useState<"simulador" | "matrizes" | "editor" | "batch">("simulador");

  // 3. Saved NPC Roster History
  const [savedNpcs, setSavedNpcs] = useState<NPC[]>(() => {
    try {
      const saved = localStorage.getItem("ruleforge_saved_npcs");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State to track if the current active NPC is already registered in roster
  const [isSavedInHistory, setIsSavedInHistory] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("ruleforge_demografia", JSON.stringify(demografia));
  }, [demografia]);

  useEffect(() => {
    localStorage.setItem("ruleforge_socioeconomico", JSON.stringify(socioeconomico));
  }, [socioeconomico]);

  useEffect(() => {
    localStorage.setItem("ruleforge_tagdef", JSON.stringify(tagDef));
  }, [tagDef]);

  useEffect(() => {
    localStorage.setItem("ruleforge_estados", JSON.stringify(estados));
  }, [estados]);

  useEffect(() => {
    localStorage.setItem("ruleforge_nomes", JSON.stringify(nomes));
  }, [nomes]);

  useEffect(() => {
    localStorage.setItem("ruleforge_cidades", JSON.stringify(cidades));
  }, [cidades]);

  useEffect(() => {
    localStorage.setItem("ruleforge_saved_npcs", JSON.stringify(savedNpcs));
  }, [savedNpcs]);

  useEffect(() => {
    localStorage.setItem("ruleforge_active_seed", activeSeed);
  }, [activeSeed]);

  // 1.5 Locks for deterministic cascade steps
  const [locks, setLocks] = useState<{
    estadoId?: string | null;
    cidadeId?: string | null;
    demografiaId?: string | null;
    socioId?: string | null;
    nomeId?: string | null;
  }>(() => {
    try {
      const saved = localStorage.getItem("ruleforge_locks");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("ruleforge_locks", JSON.stringify(locks));
  }, [locks]);

  const handleToggleLock = (phase: "estadoId" | "cidadeId" | "demografiaId" | "nomeId" | "socioId", id: string) => {
    setLocks((prev) => {
      const isCurrentlyLocked = prev[phase] === id;
      return {
        ...prev,
        [phase]: isCurrentlyLocked ? null : id,
      };
    });
  };

  const handleClearAllLocks = () => {
    setLocks({});
  };

  // Recalculate deterministic NPC based on seed & matrices + locks cascade
  const { currentNpc, generationError } = useMemo(() => {
    try {
      const npc = generateNPC(activeSeed, demografia, socioeconomico, tagDef, estados, nomes, cidades, locks);
      return { currentNpc: npc, generationError: null };
    } catch (err: any) {
      return { currentNpc: null, generationError: err.message || String(err) };
    }
  }, [activeSeed, demografia, socioeconomico, tagDef, estados, nomes, cidades, locks]);

  // Math to map weights, probability distributions, active choices and incompatible matrices
  const decisionData = useMemo(() => {
    // 1. Estados (Fase 0)
    const totalEstWeight = estados.reduce((acc, e) => acc + e.peso_base, 0) || 1;
    const estOptions = estados.map((e) => ({
      id: e.id_estado,
      label: e.nome_estado,
      weight: e.peso_base,
      prob: (e.peso_base / totalEstWeight) * 100,
      active: currentNpc?.estado?.id_estado === e.id_estado,
      locked: locks.estadoId === e.id_estado,
    }));

    // 2. Cidades (Fase 0.5) - based on current state tags
    const activeStateTags = currentNpc?.estado?.add_tags || [];
    const validCids = cidades.filter(
      (c) => !c.req_tags || c.req_tags.length === 0 || c.req_tags.every((t) => activeStateTags.includes(t))
    );
    const totalCidWeight = (validCids.length > 0 ? validCids.reduce((acc, c) => acc + c.peso_base, 0) : cidades.reduce((acc, c) => acc + c.peso_base, 0)) || 1;

    const cidOptions = cidades.map((c) => {
      const isValid = !c.req_tags || c.req_tags.length === 0 || c.req_tags.every((t) => activeStateTags.includes(t));
      const displayTotalWeight = isValid ? totalCidWeight : (cidades.reduce((acc, x) => acc + x.peso_base, 0) || 1);
      return {
        id: c.id_cidade,
        label: c.nome_cidade,
        weight: c.peso_base,
        prob: isValid ? (c.peso_base / displayTotalWeight) * 100 : 0,
        active: currentNpc?.cidade?.id_cidade === c.id_cidade,
        locked: locks.cidadeId === c.id_cidade,
        disabled: !isValid,
      };
    });

    // 3. Demografia (Fase 1)
    const totalDemoWeight = demografia.reduce((acc, d) => acc + d.peso_base, 0) || 1;
    const demoOptions = demografia.map((d) => ({
      id: d.id_demo,
      label: d.descricao,
      weight: d.peso_base,
      prob: (d.peso_base / totalDemoWeight) * 100,
      active: currentNpc?.demografia?.id_demo === d.id_demo,
      locked: locks.demografiaId === d.id_demo,
    }));

    // 4. Nomes (Fase 1.5) - based on parent tags in memory
    const tagsAt15 = [
      ...(currentNpc?.estado?.add_tags || []),
      ...(currentNpc?.cidade?.add_tags || []),
      ...(currentNpc?.demografia?.add_tags || [])
    ];
    const validNms = nomes.filter(
      (n) => !n.req_tags || n.req_tags.length === 0 || n.req_tags.every((t) => tagsAt15.includes(t))
    );
    const totalNmWeight = (validNms.length > 0 ? validNms.reduce((acc, n) => acc + n.peso_base, 0) : nomes.reduce((acc, n) => acc + n.peso_base, 0)) || 1;
    
    // Sample top 30 valid names to keep rendering super efficient
    const nmOptions = validNms.slice(0, 30).map((n) => ({
      id: n.id_nome,
      label: n.nome,
      weight: n.peso_base,
      prob: (n.peso_base / totalNmWeight) * 100,
      active: currentNpc?.nome === n.nome,
      locked: locks.nomeId === n.id_nome,
    }));

    // 5. Profissões / Socioeconômico (Fase 2)
    const profsMap = socioeconomico.map((p) => {
      const isValid = p.req_tags.every((t) => tagsAt15.includes(t));
      let pesoFinal = p.peso_base;
      if (isValid && p.mult_tags) {
        for (const [tag, mult] of Object.entries(p.mult_tags)) {
          if (tagsAt15.includes(tag)) {
            pesoFinal *= Number(mult);
          }
        }
      }
      return {
        id: p.id_socio,
        label: p.profissao,
        baseWeight: p.peso_base,
        finalWeight: isValid ? pesoFinal : 0,
        isValid,
      };
    });

    const activeProfs = profsMap.filter((p) => p.isValid && p.finalWeight > 0);
    const totalProfWeight = activeProfs.reduce((acc, p) => acc + p.finalWeight, 0) || 1;

    const socioOptions = profsMap.map((p) => ({
      id: p.id,
      label: p.label,
      weight: p.finalWeight,
      baseWeight: p.baseWeight,
      prob: p.isValid && p.finalWeight > 0 ? (p.finalWeight / totalProfWeight) * 100 : 0,
      active: currentNpc?.profissao === p.label,
      locked: locks.socioId === p.id,
      disabled: !p.isValid,
    }));

    return {
      estado: estOptions,
      cidade: cidOptions,
      demografia: demoOptions,
      nome: nmOptions,
      socioeconomico: socioOptions,
    };
  }, [estados, cidades, demografia, nomes, socioeconomico, currentNpc, locks]);

  // Check if current NPC matches any already saved record
  useEffect(() => {
    if (currentNpc) {
      const exists = savedNpcs.some((item) => item.seed === currentNpc.seed);
      setIsSavedInHistory(exists);
    } else {
      setIsSavedInHistory(false);
    }
  }, [currentNpc, savedNpcs]);

  // Handle New Generator Toggles
  const handleRandomizeNPC = () => {
    const freshSeed = generateRandomSeed();
    setActiveSeed(freshSeed);
    setSeedInputText(freshSeed);
  };

  const handleApplyCustomSeed = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSeed = seedInputText.trim() || generateRandomSeed();
    setActiveSeed(finalSeed);
    setSeedInputText(finalSeed);
  };

  // Restore seed from history
  const handleRestoreFromHistory = (seed: string) => {
    setActiveSeed(seed);
    setSeedInputText(seed);
    // Smooth scroll back to top of simulation if needed
    const cardEl = document.getElementById("active-npc-result-display");
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Saved Registry actions
  const handleSaveNpc = (npc: NPC) => {
    if (savedNpcs.some((item) => item.seed === npc.seed)) return;
    setSavedNpcs([npc, ...savedNpcs]);
  };

  const handleDeleteNpc = (index: number) => {
    setSavedNpcs(savedNpcs.filter((_, i) => i !== index));
  };

  const handleClearHistory = () => {
    if (confirm("Tem certeza que deseja apagar todo o histórico de NPCs salvos?")) {
      setSavedNpcs([]);
    }
  };

  // Reset Matrices to original python relational defaults
  const handleResetToDefaults = () => {
    if (
      confirm(
        "Isso irá restaurar todas as Matrizes de Dados (Demografia, Estados, Nomes, Socioeconômico, Tags) para os valores padrão da folha Ruleforge. Deseja prosseguir?"
      )
    ) {
      setDemografia(defaultDemografia);
      setSocioeconomico(defaultSocioeconomico);
      setTagDef(defaultTagDef);
      setEstados(defaultEstado);
      setNomes(defaultNome);
      setCidades(defaultCidade);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-slate-100 flex flex-col py-8 px-4 sm:px-6 lg:px-8 selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 1. BRANDING HERO HEADER */}
      <header className="max-w-7xl mx-auto w-full mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <span className="bg-[#FFBF00]/10 text-[#FFBF00] font-extrabold px-2.5 py-0.5 text-[10px] rounded border border-[#FFBF00]/20 tracking-wider font-mono uppercase">
              ENGINE V1.5
            </span>
            <span className="text-[10px] text-slate-300 font-mono tracking-widest uppercase">
              RuleForge Sandbox Node
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans text-ice animate-pulse-glow">
            RuleForge <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBF00] to-[#FFAB00]">Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-2xl">
            Simulador de NPCs guiado por sementes determinísticas em cascata regional e econômica.
          </p>
        </div>

        {/* Deterministic Port Status Badge */}
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 px-4 py-2.5 rounded-xl shadow-inner">
          <div className="w-2 h-2 rounded-full bg-[#FFBF00] animate-pulse" />
          <div className="text-left font-mono">
            <div className="text-[9px] text-slate-500 uppercase leading-none font-bold">Resolução Lógica</div>
            <div className="text-xs font-bold text-slate-300 leading-tight">100% Determinístico</div>
          </div>
        </div>
      </header>

      {/* 2. NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto w-full mb-4">
        <div className="grid grid-cols-4 sm:flex sm:flex-row border-b border-slate-800 p-1 gap-1 bg-slate-950/40 rounded-xl sm:rounded-t-xl sm:rounded-b-none">
          <button
            onClick={() => setActiveMenu("simulador")}
            className={`py-2 px-1 sm:flex-1 sm:py-3 sm:px-6 text-[10px] sm:text-xs md:text-sm font-display font-black tracking-wide rounded-lg sm:rounded-t-lg sm:rounded-b-none transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMenu === "simulador"
                ? "bg-slate-900/40 text-[#FFBF00] border-t border-x border-slate-800/80 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${activeMenu === "simulador" ? "text-[#FFBF00]" : "text-slate-500"}`} />
            <span>Simulador</span>
          </button>

          <button
            onClick={() => setActiveMenu("matrizes")}
            className={`py-2 px-1 sm:flex-1 sm:py-3 sm:px-6 text-[10px] sm:text-xs md:text-sm font-display font-black tracking-wide rounded-lg sm:rounded-t-lg sm:rounded-b-none transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMenu === "matrizes"
                ? "bg-slate-900/40 text-[#FFBF00] border-t border-x border-slate-800/80 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
            <span>Matrizes<span className="hidden sm:inline"> de Regras</span></span>
          </button>

          <button
            onClick={() => setActiveMenu("editor")}
            className={`py-2 px-1 sm:flex-1 sm:py-3 sm:px-6 text-[10px] sm:text-xs md:text-sm font-display font-black tracking-wide rounded-lg sm:rounded-t-lg sm:rounded-b-none transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMenu === "editor"
                ? "bg-slate-900/40 text-[#FFBF00] border-t border-x border-slate-800/80 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Workflow className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${activeMenu === "editor" ? "text-[#FFBF00]" : "text-slate-500"}`} />
            <span>Editor<span className="hidden sm:inline"> de Matrizes</span></span>
          </button>

          <button
            onClick={() => setActiveMenu("batch")}
            className={`py-2 px-1 sm:flex-1 sm:py-3 sm:px-6 text-[10px] sm:text-xs md:text-sm font-display font-black tracking-wide rounded-lg sm:rounded-t-lg sm:rounded-b-none transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMenu === "batch"
                ? "bg-slate-900/40 text-[#FFBF00] border-t border-x border-slate-800/80 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${activeMenu === "batch" ? "text-[#FFBF00]" : "text-slate-550"}`} />
            <span>Gerador<span className="hidden sm:inline"> em Massa</span></span>
          </button>
        </div>
      </div>

      {/* GOOGLE SHEETS LIVE SYNC STATUS BAR */}
      <div className="max-w-7xl mx-auto w-full mb-8">
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${
              sheetSyncStatus === "loading" ? "bg-[#FFBF00] animate-pulse" :
              sheetSyncStatus === "success" ? "bg-emerald-500" :
              sheetSyncStatus === "error" ? "bg-rose-500" : "bg-slate-500"
            }`} />
            <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <span>Sincronia Sheets:</span>
              <span className={
                sheetSyncStatus === "success" ? "text-emerald-400" : 
                sheetSyncStatus === "error" ? "text-rose-400 font-bold" : "text-[#FFBF00]"
              }>
                {sheetSyncMessage}
              </span>
            </span>
          </div>
          
          <button
            onClick={syncDatabaseFromGoogleSheets}
            disabled={sheetSyncStatus === "loading"}
            className="w-full sm:w-auto py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-[11px] font-mono hover:text-white transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${sheetSyncStatus === "loading" ? "animate-spin text-[#FFBF00]" : "text-[#FFBF00]"}`} />
            <span>Sincronizar Banco de Dados Agora</span>
          </button>
        </div>
      </div>

      {/* 3. DYNAMIC CONTENT AREA BASED ON TAB VIEW */}
      <main className="max-w-7xl mx-auto w-full flex-1">
        
        {/* VIEW 1: SIMULATOR WORKSPACE */}
        {activeMenu === "simulador" && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Column 1: Generator Inputs & Saved NPC roster (Width 5) */}
            <section className="lg:col-span-5 space-y-6">
              
              {/* CLEAN SEED CONTROL CARD */}
              <div className="bg-[#12141c]/80 backdrop-blur-sm border border-slate-800/80 rounded-xl p-2 shadow-2xl">
                <form onSubmit={handleApplyCustomSeed} className="flex flex-row items-center gap-2 w-full flex-nowrap">
                  <div className="flex items-center gap-1 text-slate-300 font-bold font-mono text-[10px] uppercase tracking-wider shrink-0">
                    <Settings2 className="w-3.5 h-3.5 text-[#FFBF00]" />
                    <span className="text-ice">Sincronia:</span>
                  </div>
                  
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      value={seedInputText}
                      onChange={(e) => setSeedInputText(e.target.value)}
                      placeholder="Semente ou semente livre..."
                      className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-[#FFBF00] outline-none rounded-lg pl-2.5 pr-8 py-1.5 text-xs text-slate-200 font-mono tracking-wider focus:ring-1 focus:ring-[#FFBF00]/20 transition-all font-bold"
                    />
                    
                    <button
                      type="submit"
                      className="absolute right-0.5 top-0.5 bottom-0.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-[#FFBF00] rounded-md transition-all flex items-center justify-center cursor-pointer active:scale-95 duration-150"
                      title="Carregar Semente Digitada"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleRandomizeNPC}
                    className="py-1.5 px-3 bg-[#FFBF00] hover:bg-[#FFD13B] text-slate-950 font-black font-mono text-[11px] uppercase tracking-wider rounded-lg shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 duration-150 shrink-0"
                    title="Rolar Novo NPC com Semente Aleatória"
                  >
                    <Dices className="w-3.5 h-3.5 text-slate-950" />
                    <span>Rolar NPC</span>
                  </button>
                </form>
              </div>

            </section>
            
            {/* Column 2: Simulated NPC output panel details (Width 7) */}
            <section className="lg:col-span-7 space-y-4">
              <div id="active-npc-result-display" className="space-y-1">
                <div className="flex items-center justify-between px-1 mb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Filtro Computado do Ator
                  </h3>
                  <span className="text-[11px] font-mono text-[#FFBF00] bg-[#FFBF00]/5 px-2.5 py-0.5 rounded border border-[#FFBF00]/15 tracking-wider font-extrabold">
                    Saída Gerada
                  </span>
                </div>

                {generationError ? (
                  <div className="bg-rose-500/5 border border-rose-500/25 p-8 rounded-2xl text-center space-y-4 shadow-xl">
                    <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
                    <h4 className="text-sm font-bold text-rose-400 font-mono">Erro Crítico do Simulador</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono max-w-md mx-auto">
                      {generationError}. O motor reproduz dados com bases rígidas de probabilidade. Se faltarem dados fundamentais nas regras, o sistema falha deterministicamente.
                    </p>
                    <button
                      onClick={handleResetToDefaults}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 rounded-xl border border-rose-500/20 text-xs font-mono transition-all"
                    >
                      Restaurar Matrizes de Regras
                    </button>
                  </div>
                ) : currentNpc ? (
                  <NPCCard 
                    npc={currentNpc} 
                    tagDefs={tagDef}
                    onSave={handleSaveNpc}
                    isSaved={isSavedInHistory}
                  />
                ) : null}
              </div>
            </section>

          </div>

          {/* Row 2: Visualizer of Cascading Decisions (Col-span-16) placed horizontally scrolling! */}
          {!generationError && (
            <div className="bg-[#12141c]/65 border border-slate-800/80 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
              <div>
                <h3 className="text-lg font-black text-ice font-sans flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-[#FFBF00]" />
                  Visualizador de Cascatas Dinâmicas (Mapeamento do Motor)
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Evolução paralela de pesos e probabilidades das Fases 0 a 4 com suporte a Travas de Semente (Locks).
                </p>
              </div>
              
              {Object.values(locks).some(v => v !== null && v !== undefined) && (
                <button
                  onClick={handleClearAllLocks}
                  className="px-4 py-2 bg-[#FFBF00]/10 hover:bg-[#FFBF00] text-[#FFBF00] hover:text-slate-950 font-black font-mono text-xs rounded-xl border border-[#FFBF00]/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer duration-150"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Remover {Object.values(locks).filter(v => v !== null && v !== undefined).length} Travas</span>
                </button>
              )}
            </div>

            {/* The horizontal grid of 16 decision columns */}
            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <div className="grid grid-cols-16 gap-5 min-w-[1250px]" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
                
                {/* Estado column - Col span 3 */}
                <div className="col-span-3 bg-slate-950/45 border border-slate-850 rounded-xl p-4 flex flex-col h-[400px]">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono font-bold text-ice uppercase tracking-wider">0. Origin/Estado</span>
                    <span className="text-[10px] font-mono text-slate-555 bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-800">
                      {decisionData.estado.length} itens
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
                    {decisionData.estado.map(opt => (
                      <ProbabilityBar
                        key={opt.id}
                        label={opt.label}
                        value={opt.weight}
                        percentage={opt.prob}
                        active={opt.active}
                        locked={opt.locked}
                        onToggleLock={() => handleToggleLock("estadoId", opt.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* City column - Col span 3 */}
                <div className="col-span-3 bg-slate-950/45 border border-slate-855 rounded-xl p-4 flex flex-col h-[400px]">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono font-bold text-ice uppercase tracking-wider">0.5 Micro-Geografia</span>
                    <span className="text-[10px] font-mono text-slate-555 bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-800">
                      {decisionData.cidade.length} itens
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
                    {decisionData.cidade.map(opt => (
                      <ProbabilityBar
                        key={opt.id}
                        label={opt.label}
                        value={opt.weight}
                        percentage={opt.prob}
                        active={opt.active}
                        locked={opt.locked}
                        disabled={opt.disabled}
                        onToggleLock={() => handleToggleLock("cidadeId", opt.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Demographic column - Col span 3 */}
                <div className="col-span-3 bg-slate-950/45 border border-slate-855 rounded-xl p-4 flex flex-col h-[400px]">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono font-bold text-[#d4f2fe] uppercase tracking-wider">1. Demografia</span>
                    <span className="text-[10px] font-mono text-slate-555 bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-800">
                      {decisionData.demografia.length} itens
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
                    {decisionData.demografia.map(opt => (
                      <ProbabilityBar
                        key={opt.id}
                        label={opt.label}
                        value={opt.weight}
                        percentage={opt.prob}
                        active={opt.active}
                        locked={opt.locked}
                        onToggleLock={() => handleToggleLock("demografiaId", opt.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Name column - Col span 3 */}
                <div className="col-span-3 bg-slate-950/45 border border-slate-855 rounded-xl p-4 flex flex-col h-[400px]">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono font-bold text-ice uppercase tracking-wider">1.5 Nomes Procedurais</span>
                    <span className="text-[10px] font-mono text-slate-555 bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-800">
                      Top 30 válidos
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
                    {decisionData.nome.length === 0 ? (
                      <div className="text-center py-10 font-mono text-xs text-slate-500 italic animate-pulse">Nenhum nome válido para esta cascata de tags</div>
                    ) : (
                      decisionData.nome.map(opt => (
                        <ProbabilityBar
                          key={opt.id}
                          label={opt.label}
                          value={opt.weight}
                          percentage={opt.prob}
                          active={opt.active}
                          locked={opt.locked}
                          onToggleLock={() => handleToggleLock("nomeId", opt.id)}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Socioeconomic column - Col span 4 */}
                <div className="col-span-4 bg-slate-950/45 border border-slate-855 rounded-xl p-4 flex flex-col h-[400px]">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono font-bold text-[#d4f2fe] uppercase tracking-wider">2. Profissão/Sócio</span>
                    <span className="text-[10px] font-mono text-slate-555 bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-800">
                      Multiplicadores
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
                    {decisionData.socioeconomico.map(opt => (
                      <ProbabilityBar
                        key={opt.id}
                        label={opt.label}
                        value={opt.weight}
                        percentage={opt.prob}
                        active={opt.active}
                        locked={opt.locked}
                        disabled={opt.disabled}
                        onToggleLock={() => handleToggleLock("socioId", opt.id)}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
          )}

          {/* SAVED REGISTRY HISTORY CONTAINER */}
          <NPCHistory
            savedNpcs={savedNpcs}
            onSelect={handleRestoreFromHistory}
            onDelete={handleDeleteNpc}
            onClearAll={handleClearHistory}
          />

          {/* DYNAMIC WORKFLOW PROCESS LIST */}
          <div className="bg-[#12141c]/40 border border-slate-800/40 rounded-2xl p-4 space-y-2.5 text-xs font-mono text-slate-400 max-w-xl mx-auto shadow-xl">
            <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-slate-500 uppercase tracking-widest font-bold">
              <span>Ordem Dinâmica do Motor de Procedimentos:</span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center text-[10.5px]">
              <div className="p-1.5 px-2 bg-slate-950/80 rounded-lg border border-slate-900 shadow-inner text-[#FFBF00] font-bold">1. Seed deterministicamente</div>
              <div className="p-1.5 px-2 bg-slate-950/80 rounded-lg border border-slate-900 shadow-inner text-[#FFBF00] font-bold">2. Localização & Estado</div>
              <div className="p-1.5 px-2 bg-slate-950/80 rounded-lg border border-slate-900 shadow-inner text-[#FFBF00] font-bold">3. Matriz de Demografia</div>
              <div className="p-1.5 px-2 bg-slate-950/80 rounded-lg border border-slate-900 shadow-inner text-[#FFBF00] font-bold">4. Sócio & Status Finais</div>
            </div>
          </div>
        </div>
        )}

        {/* VIEW 2: RULE ENGINE MATRICES EDITOR */}
        {activeMenu === "matrizes" && (
          <div className="space-y-6">
            {/* Introductory Sheets info block */}
            <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200 font-sans flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-500" />
                  Visualizador de Tabelas Relacionais do RuleForge
                </h3>
                <p className="text-xs text-slate-400 font-mono max-w-3xl">
                  Simulação espelar de dados indexados das abas do Google Sheets. A cascata do simulador avalia em ordem cada linha e peso definidos aqui de forma incremental.
                </p>
              </div>
              <button
                onClick={handleResetToDefaults}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 text-xs font-mono rounded-xl transition-all cursor-pointer shadow-md self-start md:self-auto uppercase tracking-wider text-[10px] font-bold"
              >
                Injetar Valores Originais
              </button>
            </div>

            {/* Render the core relational spreadsheets editor */}
            <MatrixEditor
              demografia={demografia}
              setDemografia={setDemografia}
              socioeconomico={socioeconomico}
              setSocioeconomico={setSocioeconomico}
              tagDef={tagDef}
              setTagDef={setTagDef}
              estados={estados}
              setEstados={setEstados}
              nomes={nomes}
              setNomes={setNomes}
              cidades={cidades}
              setCidades={setCidades}
              onReset={handleResetToDefaults}
            />
          </div>
        )}

        {/* VIEW 3: BLOCK-BASED MATRIX PROGRAMMER */}
        {activeMenu === "editor" && (
          <BlockMatrixEditor
            demografia={demografia}
            socioeconomico={socioeconomico}
            tagDef={tagDef}
            estados={estados}
            nomes={nomes}
            cidades={cidades}
            onResetFromSheets={syncDatabaseFromGoogleSheets}
            isSyncing={sheetSyncStatus === "loading"}
          />
        )}

        {/* VIEW 4: BATCH SIMULATOR RUNNER */}
        {activeMenu === "batch" && (
          <BatchGenerator
            demografia={demografia}
            socioeconomico={socioeconomico}
            tagDef={tagDef}
            estados={estados}
            nomes={nomes}
            cidades={cidades}
          />
        )}



      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto w-full mt-12 pt-6 border-t border-slate-900 text-center text-xs font-mono text-slate-500 space-y-1.5">
        <p>RuleForge Agent Procedural Generation &copy; {new Date().getFullYear()} — Sandbox Ativa</p>
        <p className="text-[10px] text-slate-600">Simulação segura local sem vazamento de chaves ou telemetria redundante.</p>
      </footer>
    </div>
  );
}
