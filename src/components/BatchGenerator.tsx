import React, { useState, useEffect, useRef } from "react";
// @ts-ignore
import * as reactWindow from "react-window";
import { motion, AnimatePresence } from "motion/react";

// @ts-ignore
const { FixedSizeList: List } = reactWindow || {};
import { 
  Dices, 
  Cpu, 
  Sparkles, 
  Copy, 
  Check, 
  Clock, 
  HelpCircle, 
  AlertTriangle,
  Play, 
  CheckCircle, 
  X, 
  Sliders, 
  FileSpreadsheet, 
  TrendingUp,
  Heart,
  Smile,
  DollarSign,
  Info
} from "lucide-react";
import { Demografia, Socioeconomico, TagDef, Estado, NomeDef, CidadeDef } from "../types";

interface BatchGeneratorProps {
  demografia: Demografia[];
  socioeconomico: Socioeconomico[];
  tagDef: TagDef[];
  estados: Estado[];
  nomes: NomeDef[];
  cidades: CidadeDef[];
}

// Stats Structure matching batchWorker
interface BatchMetrics {
  healthSum: number;
  happinessSum: number;
  incomeSum: number;
  minHealth: number;
  maxHealth: number;
  minHappiness: number;
  maxHappiness: number;
  minRenda: number;
  maxRenda: number;
  count: number;
}

interface CombinedStats {
  demographics: Record<string, number>;
  professions: Record<string, number>;
  states: Record<string, number>;
  cities: Record<string, number>;
  tags: Record<string, number>;
  genders: Record<string, number>;
  ageBuckets: Record<string, number>;
  metrics: BatchMetrics;
  monteCarloMatches: number;
}

export const BatchGenerator: React.FC<BatchGeneratorProps> = ({
  demografia,
  socioeconomico,
  tagDef,
  estados,
  nomes,
  cidades
}) => {
  // Input settings
  const [totalCount, setTotalCount] = useState<number>(100000);
  const [hardwareProfile, setHardwareProfile] = useState<"eco" | "balanced" | "overdrive">("balanced");
  const [seedPrefix, setSeedPrefix] = useState<string>("forge_batch");

  // Monte Carlo criterion states
  const [mcState, setMcState] = useState<string>("");
  const [mcCity, setMcCity] = useState<string>("");
  const [mcProfession, setMcProfession] = useState<string>("");
  const [mcTag, setMcTag] = useState<string>("");

  // Process states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [threadsCount, setThreadsCount] = useState<number>(4);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Stats results
  const [results, setResults] = useState<CombinedStats | null>(null);
  const [npcSamples, setNpcSamples] = useState<any[]>([]);

  // 1. GLOBAL BI DRILL-DOWN FILTER STATES & HELPERS
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [copiedSeed, setCopiedSeed] = useState<string | null>(null);

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (next[category] === value) {
        delete next[category];
      } else {
        next[category] = value;
      }
      return next;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
  };

  // Integration of Background High-Performance Filter Worker
  const filterWorkerRef = useRef<Worker | null>(null);
  const [filteredIndices, setFilteredIndices] = useState<number[]>([]);
  const [isFilteringLoading, setIsFilteringLoading] = useState<boolean>(false);

  // Instantiate high-performance Filter Worker on mount
  useEffect(() => {
    filterWorkerRef.current = new Worker(new URL("../utils/filterWorker.ts", import.meta.url), { type: "module" });

    filterWorkerRef.current.onmessage = (event: MessageEvent) => {
      const { type, matchedIndices } = event.data;
      if (type === "init_done" || type === "filter_done") {
        setFilteredIndices(matchedIndices || []);
        setIsFilteringLoading(false);
      }
    };

    return () => {
      if (filterWorkerRef.current) {
        filterWorkerRef.current.terminate();
      }
    };
  }, []);

  // Update background Filter Worker indices when core simulation results finish loading
  useEffect(() => {
    if (filterWorkerRef.current && npcSamples.length > 0) {
      setIsFilteringLoading(true);
      filterWorkerRef.current.postMessage({
        type: "init",
        list: npcSamples
      });
    } else {
      setFilteredIndices([]);
      setIsFilteringLoading(false);
    }
  }, [npcSamples]);

  // Request high-performance filter matching when BI tags change
  useEffect(() => {
    if (filterWorkerRef.current && npcSamples.length > 0) {
      setIsFilteringLoading(true);
      filterWorkerRef.current.postMessage({
        type: "filter",
        activeFilters
      });
    }
  }, [activeFilters, npcSamples]);

  // High-performance BI metrics recalculation using direct indexed-lookup of filtered references
  const currentResults = React.useMemo(() => {
    const hasActiveFilters = Object.keys(activeFilters).length > 0;
    if (!hasActiveFilters && results) {
      return results;
    }

    const stats: CombinedStats = {
      demographics: {},
      professions: {},
      states: {},
      cities: {},
      tags: {},
      genders: {
        "Masculino": 0,
        "Feminino": 0
      },
      ageBuckets: {
        "18-29": 0,
        "30-49": 0,
        "50-69": 0,
        "70+": 0
      },
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
        count: filteredIndices.length
      },
      monteCarloMatches: 0
    };

    const len = filteredIndices.length;
    for (let i = 0; i < len; i++) {
      const idx = filteredIndices[i];
      const npc = npcSamples[idx];
      if (!npc) continue;

      // demographics
      const dKey = npc.descDemo || "DESCONHECIDO";
      stats.demographics[dKey] = (stats.demographics[dKey] || 0) + 1;

      // professions
      const pKey = npc.profissao || "DESCONHECIDA";
      stats.professions[pKey] = (stats.professions[pKey] || 0) + 1;

      // states
      const sKey = npc.estado || "DESCONHECIDO";
      stats.states[sKey] = (stats.states[sKey] || 0) + 1;

      // cities
      const cKey = npc.cidade || "Nenhuma";
      stats.cities[cKey] = (stats.cities[cKey] || 0) + 1;

      // genders
      const gKey = npc.genero || "Masculino";
      stats.genders[gKey] = (stats.genders[gKey] || 0) + 1;

      // age buckets
      const age = npc.idade;
      if (age >= 18 && age <= 29) stats.ageBuckets["18-29"]++;
      else if (age >= 30 && age <= 49) stats.ageBuckets["30-49"]++;
      else if (age >= 50 && age <= 69) stats.ageBuckets["50-69"]++;
      else if (age >= 70) stats.ageBuckets["70+"]++;

      // tags
      if (npc.tags) {
        const tagsLen = npc.tags.length;
        for (let j = 0; j < tagsLen; j++) {
          const t = npc.tags[j];
          stats.tags[t] = (stats.tags[t] || 0) + 1;
        }
      }

      // metrics
      stats.metrics.healthSum += npc.saude;
      stats.metrics.happinessSum += npc.felicidade;
      stats.metrics.incomeSum += npc.renda;

      if (npc.saude < stats.metrics.minHealth) stats.metrics.minHealth = npc.saude;
      if (npc.saude > stats.metrics.maxHealth) stats.metrics.maxHealth = npc.saude;

      if (npc.felicidade < stats.metrics.minHappiness) stats.metrics.minHappiness = npc.felicidade;
      if (npc.felicidade > stats.metrics.maxHappiness) stats.metrics.maxHappiness = npc.felicidade;

      if (npc.renda < stats.metrics.minRenda) stats.metrics.minRenda = npc.renda;
      if (npc.renda > stats.metrics.maxRenda) stats.metrics.maxRenda = npc.renda;
    }

    if (len === 0) {
      stats.metrics.minHealth = 0;
      stats.metrics.maxHealth = 0;
      stats.metrics.minHappiness = 0;
      stats.metrics.maxHappiness = 0;
      stats.metrics.minRenda = 0;
      stats.metrics.maxRenda = 0;
    }

    return stats;
  }, [filteredIndices, npcSamples, results, activeFilters]);

  const array_completa_npcs = npcSamples;
  // Map filtered reference indices back to full NPC samples list for virtualization rendering
  const currentSamples = React.useMemo(() => {
    const len = filteredIndices.length;
    const mapped = new Array(len);
    for (let i = 0; i < len; i++) {
      mapped[i] = npcSamples[filteredIndices[i]];
    }
    return mapped;
  }, [filteredIndices, npcSamples]);

  const currentTotal = currentResults ? currentResults.metrics.count : totalCount;

  // Timer Ref
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  // Active Web Worker Pool References
  const workersRef = useRef<Worker[]>([]);

  // Automatically determine default optimal threads on mount
  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 4;
    setThreadsCount(Math.max(1, Math.min(cores - 1, 4))); // Default to balanced
  }, []);

  // Sync threads selection based on Hardware Profile
  useEffect(() => {
    const maxCores = navigator.hardwareConcurrency || 4;
    if (hardwareProfile === "eco") {
      setThreadsCount(1);
    } else if (hardwareProfile === "balanced") {
      setThreadsCount(Math.max(1, Math.min(maxCores - 1, 4)));
    } else if (hardwareProfile === "overdrive") {
      setThreadsCount(maxCores);
    }
  }, [hardwareProfile]);

  // Clean workers on unmount
  useEffect(() => {
    return () => {
      terminateWorkers();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const terminateWorkers = () => {
    workersRef.current.forEach((w) => w.terminate());
    workersRef.current = [];
  };

  // Run the batch simulation
  const handleStartSimulation = () => {
    // 1. Terminate any legacy thread tasks
    terminateWorkers();
    setIsSimulating(true);
    setProgress(0);
    setElapsedTime(0);
    setResults(null);
    setNpcSamples([]);
    setActiveFilters({}); // Reset any active drill-down BI filters when starting a new sim

    startTimeRef.current = performance.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((performance.now() - startTimeRef.current) / 100));
    }, 100);

    // Parse Monte Carlo Filtering criteria
    const criteria = {
      professions: mcProfession.trim() ? [{ value: mcProfession.trim().toLowerCase(), isNegated: mcProfession.startsWith("!") }] : [],
      states: mcState.trim() ? [{ value: mcState.trim().toLowerCase(), isNegated: mcState.startsWith("!") }] : [],
      cities: mcCity.trim() ? [{ value: mcCity.trim().toLowerCase(), isNegated: mcCity.startsWith("!") }] : [],
      tags: mcTag.trim() ? [{ value: mcTag.trim().toLowerCase(), isNegated: mcTag.startsWith("!") }] : []
    };

    // Clean up negative flags prefix if specified
    if (criteria.professions[0] && mcProfession.startsWith("!")) criteria.professions[0].value = criteria.professions[0].value.replace("!", "").trim();
    if (criteria.states[0] && mcState.startsWith("!")) criteria.states[0].value = criteria.states[0].value.replace("!", "").trim();
    if (criteria.cities[0] && mcCity.startsWith("!")) criteria.cities[0].value = criteria.cities[0].value.replace("!", "").trim();
    if (criteria.tags[0] && mcTag.startsWith("!")) criteria.tags[0].value = criteria.tags[0].value.replace("!", "").trim();

    // 2. Prepare work division
    const numWorkers = threadsCount;
    const portion = Math.floor(totalCount / numWorkers);
    
    // Track workers state to combine on master thread
    const workersProgress = new Array(numWorkers).fill(0);
    const workersStats = new Array<CombinedStats | null>(numWorkers).fill(null);
    const workersSamples = new Array<any[]>(numWorkers).fill([]);

    let completedWorkersCount = 0;

    for (let c = 0; c < numWorkers; c++) {
      const isLast = c === numWorkers - 1;
      const workerCount = isLast ? totalCount - portion * c : portion;
      const startSeedIndex = portion * c;

      // Spawn native module worker
      const worker = new Worker(new URL("../utils/batchWorker.ts", import.meta.url), { type: "module" });
      workersRef.current.push(worker);

      worker.onmessage = (event: MessageEvent) => {
        const { type, completed, stats, samples } = event.data;

        if (type === "progress") {
          workersProgress[c] = completed;
          workersStats[c] = stats;
          workersSamples[c] = samples;

          // Combine results and update React state
          combineAndSetStats(workersProgress, workersStats, workersSamples);
        }

        if (type === "done") {
          completedWorkersCount++;
          if (completedWorkersCount === numWorkers) {
            // Finished!
            setIsSimulating(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Final combine pass to lock states
            combineAndSetStats(workersProgress, workersStats, workersSamples);
          }
        }
      };

      // Ship initial configurations
      worker.postMessage({
        type: "start",
        demografiaList: demografia,
        socioeconomicoList: socioeconomico,
        tagDefList: tagDef,
        estadosList: estados,
        nomesList: nomes,
        cidadesList: cidades,
        totalCount: workerCount,
        startSeedIndex: startSeedIndex,
        seedPrefix: seedPrefix,
        chunkSize: hardwareProfile === "eco" ? 3000 : hardwareProfile === "balanced" ? 10000 : 35000,
        criteria: criteria
      });
    }
  };

  // Helper code to sum dictionaries and combine stats seamlessly in real-time
  const combineAndSetStats = (
    progressList: number[],
    statsList: (CombinedStats | null)[],
    samplesList: any[][]
  ) => {
    const totalProgress = progressList.reduce((a, b) => a + b, 0);
    setProgress(totalProgress);

    // Base master stats structure
    const master: CombinedStats = {
      demographics: {},
      professions: {},
      states: {},
      cities: {},
      tags: {},
      genders: {
        "Masculino": 0,
        "Feminino": 0
      },
      ageBuckets: {
        "18-29": 0,
        "30-49": 0,
        "50-69": 0,
        "70+": 0
      },
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

    // Combine dictionaries
    statsList.forEach((stat) => {
      if (!stat) return;

      // Sum demographics
      Object.entries(stat.demographics).forEach(([key, val]) => {
        master.demographics[key] = (master.demographics[key] || 0) + val;
      });

      // Sum professions
      Object.entries(stat.professions).forEach(([key, val]) => {
        master.professions[key] = (master.professions[key] || 0) + val;
      });

      // Sum states
      Object.entries(stat.states).forEach(([key, val]) => {
        master.states[key] = (master.states[key] || 0) + val;
      });

      // Sum cities
      Object.entries(stat.cities).forEach(([key, val]) => {
        master.cities[key] = (master.cities[key] || 0) + val;
      });

      // Sum tags
      Object.entries(stat.tags).forEach(([key, val]) => {
        master.tags[key] = (master.tags[key] || 0) + val;
      });

      // Sum genders
      Object.entries(stat.genders || {}).forEach(([key, val]) => {
        master.genders[key] = (master.genders[key] || 0) + val;
      });

      // Sum ageBuckets
      Object.entries(stat.ageBuckets).forEach(([key, val]) => {
        master.ageBuckets[key] = (master.ageBuckets[key] || 0) + val;
      });

      // Combine general metrics
      master.metrics.count += stat.metrics.count;
      master.metrics.healthSum += stat.metrics.healthSum;
      master.metrics.happinessSum += stat.metrics.happinessSum;
      master.metrics.incomeSum += stat.metrics.incomeSum;

      if (stat.metrics.minHealth < master.metrics.minHealth) master.metrics.minHealth = stat.metrics.minHealth;
      if (stat.metrics.maxHealth > master.metrics.maxHealth) master.metrics.maxHealth = stat.metrics.maxHealth;

      if (stat.metrics.minHappiness < master.metrics.minHappiness) master.metrics.minHappiness = stat.metrics.minHappiness;
      if (stat.metrics.maxHappiness > master.metrics.maxHappiness) master.metrics.maxHappiness = stat.metrics.maxHappiness;

      if (stat.metrics.minRenda < master.metrics.minRenda) master.metrics.minRenda = stat.metrics.minRenda;
      if (stat.metrics.maxRenda > master.metrics.maxRenda) master.metrics.maxRenda = stat.metrics.maxRenda;

      // Sum Monte Carlo occurrences
      master.monteCarloMatches += stat.monteCarloMatches;
    });

    // Combine preview items (unique sets up to 100000)
    let combinedSamples: any[] = [];
    const MAX_SHOWN_SAMPLES = 100000;
    for (let list of samplesList) {
      if (combinedSamples.length >= MAX_SHOWN_SAMPLES) break;
      combinedSamples = [...combinedSamples, ...list].slice(0, MAX_SHOWN_SAMPLES);
    }

    setResults(master);
    setNpcSamples(combinedSamples);
  };

  const handleCancelSimulation = () => {
    terminateWorkers();
    setIsSimulating(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Convert stats to CSV report and copy to Clipboard
  const handleExportStatsToClipboard = async () => {
    if (!currentResults) return;

    let csvContent = "";
    csvContent += "=== RELATÓRIO DO LOTE DE SIMULAÇÃO (" + currentTotal + " CIDADÃOS) ===\n";
    if (Object.keys(activeFilters).length > 0) {
      csvContent += "BI FILTROS ATIVOS: " + Object.entries(activeFilters).map(([k,v]) => `${k}=${v}`).join(", ") + "\n";
    }
    csvContent += "\n";

    // Summary Metrics
    const avgHealth = currentResults.metrics.count ? currentResults.metrics.healthSum / currentResults.metrics.count : 0;
    const avgHappiness = currentResults.metrics.count ? currentResults.metrics.happinessSum / currentResults.metrics.count : 0;
    const avgIncome = currentResults.metrics.count ? currentResults.metrics.incomeSum / currentResults.metrics.count : 0;
    
    csvContent += "METRICAS GERAIS\n";
    csvContent += `Média Saúde\t${avgHealth.toFixed(1)}\n`;
    csvContent += `Média Felicidade\t${avgHappiness.toFixed(1)}\n`;
    csvContent += `Média Renda Mensal (R$)\t${avgIncome.toFixed(2)}\n`;
    csvContent += `Min Saúde\t${currentResults.metrics.minHealth}\n`;
    csvContent += `Max Saúde\t${currentResults.metrics.maxHealth}\n`;
    csvContent += `Min Felicidade\t${currentResults.metrics.minHappiness}\n`;
    csvContent += `Max Felicidade\t${currentResults.metrics.maxHappiness}\n`;
    csvContent += `Min Renda\t${currentResults.metrics.minRenda}\n`;
    csvContent += `Max Renda\t${currentResults.metrics.maxRenda}\n\n`;

    // Gender
    csvContent += "DISTRIBUIÇÃO DE GÊNERO\nGênero\tQuantidade\tPercentual\n";
    Object.entries(currentResults.genders || {}).forEach(([key, val]) => {
      const numVal = val as number;
      const pct = currentTotal ? (numVal / currentTotal) * 100 : 0;
      csvContent += `${key}\t${numVal}\t${pct.toFixed(2)}%\n`;
    });
    csvContent += "\n";

    // Age buckets
    csvContent += "DISTRIBUIÇÃO ETÁRIA\nGrupo de Idade\tQuantidade\tPercentual\n";
    Object.entries(currentResults.ageBuckets).forEach(([key, val]) => {
      const numVal = val as number;
      const pct = currentTotal ? (numVal / currentTotal) * 100 : 0;
      csvContent += `${key}\t${numVal}\t${pct.toFixed(2)}%\n`;
    });
    csvContent += "\n";

    // Demographics
    csvContent += "DISTRIBUIÇÃO DE DEMOGRAFIA (PERFIS DE IDADE)\nID Demografia\tQuantidade\tPercentual\n";
    Object.entries(currentResults.demographics).sort((a,b)=> (b[1] as number) - (a[1] as number)).forEach(([key, val]) => {
      const numVal = val as number;
      const pct = currentTotal ? (numVal / currentTotal) * 100 : 0;
      csvContent += `${key}\t${numVal}\t${pct.toFixed(2)}%\n`;
    });
    csvContent += "\n";

    // Regional/States
    csvContent += "DISTRIBUIÇÃO REGIONAL (ESTADOS)\nID Estado\tQuantidade\tPercentual\n";
    Object.entries(currentResults.states).sort((a,b)=> (b[1] as number) - (a[1] as number)).forEach(([key, val]) => {
      const numVal = val as number;
      const pct = currentTotal ? (numVal / currentTotal) * 100 : 0;
      csvContent += `${key}\t${numVal}\t${pct.toFixed(2)}%\n`;
    });
    csvContent += "\n";

    // Professions
    csvContent += "DISTRIBUIÇÃO DE PROFISSÕES (TOP 20)\nProfissão\tQuantidade\tPercentual\n";
    Object.entries(currentResults.professions).sort((a,b)=> (b[1] as number) - (a[1] as number)).slice(0, 20).forEach(([key, val]) => {
      const numVal = val as number;
      const pct = currentTotal ? (numVal / currentTotal) * 100 : 0;
      csvContent += `${key}\t${numVal}\t${pct.toFixed(2)}%\n`;
    });
    csvContent += "\n";

    // Active Tags Density
    csvContent += "DENSIDADE DE TAGS ATIVAS (TOP 25)\nTag Atributo\tOcorrências\tDensidade\n";
    Object.entries(currentResults.tags).sort((a,b)=> (b[1] as number) - (a[1] as number)).slice(0, 25).forEach(([key, val]) => {
      const numVal = val as number;
      const pct = currentTotal ? (numVal / currentTotal) * 100 : 0;
      csvContent += `${key}\t${numVal}\t${pct.toFixed(2)}%\n`;
    });

    try {
      await navigator.clipboard.writeText(csvContent);
      setExportFeedback("Relatório estatístico copiado em TSV para área de transferência!");
      setTimeout(() => setExportFeedback(null), 5000);
    } catch {
      setExportFeedback("Erro ao utilizar área de transferência.");
    }
  };

  // Convert generated Samples into fully formatted Sheets CSV
  const handleExportSamplesToClipboard = async () => {
    if (currentSamples.length === 0) return;

    let csvContent = "Seed\tNome\tIdade\tDemografia\tEstado\tCidade\tProfissão\tGênero\tSaúde\tFelicidade\tRenda\n";
    currentSamples.forEach((item) => {
      csvContent += `${item.seed}\t${item.nome}\t${item.idade}\t${item.descDemo}\t${item.estado}\t${item.cidade}\t${item.profissao}\t${item.genero}\t${item.saude}\t${item.felicidade}\t${item.renda}\n`;
    });

    try {
      await navigator.clipboard.writeText(csvContent);
      setExportFeedback(`Exportadas ${currentSamples.length} fichas detalhadas em formato de planilha TSV!`);
      setTimeout(() => setExportFeedback(null), 5000);
    } catch {
      setExportFeedback("Erro ao utilizar área de transferência.");
    }
  };

  // Pre-configured sizes buttons helpers
  const sizes = [10000, 50000, 100000, 1000000, 5000000, 10000000];

  return (
    <div id="batch-generator-dashboard-pane" className="space-y-6 text-slate-100/90 text-left animate-fade-in select-none">
      
      {/* HEADER SECTION */}
      <div className="bg-[#0e1017]/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#FFBF00] shrink-0 font-mono text-xs font-bold uppercase">
              BATCH GENERATOR
            </div>
            <h2 className="text-sm font-black font-display text-white uppercase tracking-wider">
              Painel de Rolagem em Massa e Monte Carlo
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono max-w-2xl leading-relaxed">
            Execute milhões de gerações sem consumo excessivo de RAM. A simulação funciona em threads de processamento paralelo e reporta dados de dispersão determinística sob as mesmas tabelas regionais do simulador.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          {isSimulating ? (
            <button
              onClick={handleCancelSimulation}
              className="w-full md:w-auto py-2 px-5 bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 font-bold font-mono text-xs uppercase border border-rose-800/40 rounded-xl hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <X className="w-4 h-4 cursor-pointer" />
              <span>Abortar</span>
            </button>
          ) : (
            <button
              onClick={handleStartSimulation}
              className="w-full md:w-auto py-2 px-5 bg-gradient-to-r from-amber-500 to-[#FFBF00] text-slate-950 font-black font-display text-xs uppercase rounded-xl hover:brightness-110 shadow-[0_0_15px_rgba(255,191,0,0.2)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Play className="w-4 h-4 stroke-[3px]" />
              <span>Rodar Lote</span>
            </button>
          )}
        </div>
      </div>

      {/* SEED/HARDWARE CONFIGURATION & MONTE CARLO COMBINATOR CRITERIA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PARAMENTERS RENDER (COLS 5) */}
        <div className="lg:col-span-5 bg-[#0e1017]/90 border border-slate-800/70 rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-1">
            <Sliders className="w-4 h-4 text-[#FFBF00]" />
            <span className="text-xs font-mono font-black text-white uppercase tracking-widest">Configuração do Lote</span>
          </div>

          {/* Volume input with quick shortcuts */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Volume Geral do Lote</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={100}
                max={10000000}
                step={5000}
                value={totalCount}
                onChange={(e) => setTotalCount(Math.max(100, parseInt(e.target.value) || 1000))}
                className="flex-1 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[#FFBF00] text-xs font-mono rounded-xl p-2 text-white font-bold outline-none outline-0"
              />
              <span className="bg-slate-950 border border-slate-850 px-3 flex items-center text-xs font-mono font-bold text-slate-400 rounded-xl">
                NPCs
              </span>
            </div>

            {/* Quick shortcuts buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {sizes.map((size) => {
                const label = size >= 1000000 ? `${size/1000000}M` : `${size/1000}k`;
                const isSelected = totalCount === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setTotalCount(size)}
                    className={`py-1 px-1 rounded-lg border text-[9px] font-mono transition-all font-black cursor-pointer ${
                      isSelected 
                        ? "bg-amber-500/10 border-amber-500 text-[#FFBF00] font-bold"
                        : "bg-slate-950/60 border-slate-850 text-slate-450 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hardware profiles picker */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Perfil de Processamento</label>
            <div className="grid grid-cols-3 gap-2">
              {(["eco", "balanced", "overdrive"] as const).map((profile) => {
                const label = profile === "eco" ? "Eco (Mobile)" : profile === "balanced" ? "Balançado" : "Overdrive 🔥";
                const isSelected = hardwareProfile === profile;
                return (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => setHardwareProfile(profile)}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-mono transition-all font-black flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/8 border-amber-500 text-white font-bold shadow-md"
                        : "bg-slate-950/50 border-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{label}</span>
                    <span className="text-[8px] text-slate-500">
                      {profile === "eco" ? "1 núcleo/leve" : profile === "balanced" ? `${threadsCount} núcleos` : `${threadsCount} núcleos (máx)`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prefix seed text */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Fórmula de Semente Base</label>
            <input
              type="text"
              value={seedPrefix}
              onChange={(e) => setSeedPrefix(e.target.value.trim().replace(/\s+/g, "_"))}
              placeholder="Ex: batch_seed"
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-850 focus:border-[#FFBF00] text-xs font-mono rounded-xl p-2 text-white font-black outline-none outline-0"
            />
          </div>
        </div>

        {/* MONTE CARLO CONFIGURATOR (COLS 7) */}
        <div className="lg:col-span-7 bg-[#0e1017]/90 border border-[#884df2]/20 rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-1 justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#884df2]" />
              <span className="text-xs font-mono font-black text-white uppercase tracking-widest">Filtros Probabilidade de Monte Carlo</span>
            </div>
            <span className="text-[8px] bg-[#884df2]/10 border border-[#884df2]/20 text-[#aa84fe] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
              100% Preciso
            </span>
          </div>

          <p className="text-[10px] font-mono text-slate-400 leading-normal">
            Defina um perfil de busca demográfico para rastrearmos a probabilidade exata de ocorrência matemática dele sobre o lote total executado (insira <span className="text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded font-bold">!</span> na frente para negação do critério, ex: !Comerciante).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Estado ID ou Nome</span>
              <input
                type="text"
                placeholder="Ex: EST_PR"
                value={mcState}
                onChange={(e) => setMcState(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-[#884df2] text-xs font-mono rounded-xl p-2 text-white font-medium outline-none outline-0"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Cidade ID ou Nome</span>
              <input
                type="text"
                placeholder="Ex: Curitiba"
                value={mcCity}
                onChange={(e) => setMcCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-[#884df2] text-xs font-mono rounded-xl p-2 text-white font-medium outline-none outline-0"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Ocupação ou Profissão</span>
              <input
                type="text"
                placeholder="Ex: Policial"
                value={mcProfession}
                onChange={(e) => setMcProfession(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-[#884df2] text-xs font-mono rounded-xl p-2 text-white font-medium outline-none outline-0"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Tag na Memória</span>
              <input
                type="text"
                placeholder="Ex: rico ou !marginalizado"
                value={mcTag}
                onChange={(e) => setMcTag(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-[#884df2] text-xs font-mono rounded-xl p-2 text-white font-medium outline-none outline-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK CLUTTER BOX COPYS */}
      {exportFeedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2 animate-pulse shadow-md">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{exportFeedback}</span>
        </div>
      )}

      {/* PROGRESS HUD BAR */}
      {(isSimulating || progress > 0) && (
        <div className="bg-[#0e1017]/95 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 animate-spin" />
              <span className="text-xs font-mono font-black text-white uppercase tracking-wider">
                Simulação em Andamento
              </span>
            </div>

            <div className="text-[10px] font-mono text-slate-400 flex flex-wrap gap-2.5 leading-none">
              <span>Processados: <strong className="text-white">{progress.toLocaleString()}</strong> de <strong className="text-white">{totalCount.toLocaleString()}</strong></span>
              <span>•</span>
              <span>Tempo: <strong className="text-white">{(elapsedTime / 10).toFixed(1)}s</strong></span>
              <span>•</span>
              <span>Velocidade: <strong className="text-amber-400 font-bold">{elapsedTime > 0 ? Math.round((progress / (elapsedTime / 10))).toLocaleString() : 0} NPCs/s</strong></span>
            </div>
          </div>

          {/* Clean glassprogress bar */}
          <div className="w-full h-2.5 bg-slate-955 rounded-full border border-slate-850 relative overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-500 via-[#FFBF00] to-yellow-300 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalCount ? (progress / totalCount) * 100 : 0}%` }}
              transition={{ ease: "easeOut", duration: 0.1 }}
            />
          </div>

          {/* MONTE CARLO LIVE EXPOSURE BARS */}
          {results && (mcState || mcCity || mcProfession || mcTag) && (
            <div className="p-3.5 bg-[#884df2]/12 border border-[#884df2]/20 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] uppercase tracking-wider text-[#aa84fe] font-mono font-extrabold flex items-center gap-1 leading-none">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Resultado Probabilidade Monte Carlo</span>
                </span>
                <p className="text-xs text-white tracking-tight font-black leading-tight mt-1">
                  Encontrados <span className="text-[#FFBF00]">{results.monteCarloMatches.toLocaleString()}</span> cidadãos com o perfil desejado das sementes testadas.
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Filtro: {[mcState, mcCity, mcProfession, mcTag].filter(Boolean).join(" + ")}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-[#884df2]/30 px-5 py-3 rounded-xl text-center shrink-0 w-full md:w-auto relative overflow-hidden">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none font-bold">Frequência Estatística</div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tracking-tight leading-tight mt-1">
                  {progress > 0 ? ((results.monteCarloMatches / progress) * 100).toFixed(4) : "0.0000"}%
                </div>
                <div className="text-[9px] font-mono text-[#aa84fe] leading-none mt-1">
                  {results.monteCarloMatches > 0 && progress > 0 
                    ? `1 ocorrência a cada ${Math.round(progress / results.monteCarloMatches).toLocaleString()} NPCs`
                    : "Raridade alta ou 0 combinatórias"
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATS BREAKDOWN GRID PANELS */}
      {results && currentResults && (
        <div className="space-y-6 animate-fade-in select-none">
          
          {/* ACTIVE BI FILTERS CHIPS HUD BAR */}
          {Object.keys(activeFilters).length > 0 && (
            <div className="bg-slate-950/90 border border-amber-500/25 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-black text-[#FFBF00] tracking-wider shrink-0 flex items-center gap-1.5 mr-2">
                  <div className="w-1.5 h-1.5 bg-[#FFBF00] rounded-full animate-ping" />
                  BI FILTROS ATIVOS:
                </span>
                
                {Object.entries(activeFilters).map(([category, value]) => {
                  const valStr = value as string;
                  let label = "";
                  switch (category) {
                    case "demography": label = `Demografia: ${valStr}`; break;
                    case "ageGroup": label = `Faixa: ${valStr} anos`; break;
                    case "state": label = `Estado: ${valStr}`; break;
                    case "city": label = `Cidade: ${valStr}`; break;
                    case "profession": label = `Profissão: ${valStr}`; break;
                    case "tag": label = `Tag: #${valStr}`; break;
                    case "genero": label = `Gênero: ${valStr}`; break;
                  }
                  return (
                    <span
                      key={category}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono rounded-lg bg-amber-500/15 border border-amber-500/40 text-[#FFBF00] font-bold"
                    >
                      <span>{label}</span>
                      <button
                        onClick={() => toggleFilter(category, valStr)}
                        className="hover:bg-amber-500/25 rounded p-0.5 text-[#FFBF00] hover:text-white transition-colors cursor-pointer"
                        title="Remover filtro"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>

              <button
                onClick={clearAllFilters}
                className="w-full md:w-auto py-1.5 px-4 bg-[#FFBF00] hover:bg-yellow-400 text-slate-950 font-black font-display text-[10px] uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 self-stretch md:self-auto hover:shadow-[0_0_10px_rgba(255,191,0,0.15)] active:scale-95 text-center"
              >
                <X className="w-3.5 h-3.5 stroke-[3px]" />
                <span>Limpar Filtros</span>
              </button>
            </div>
          )}

          {/* STATS HEROES SUMMARY ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* HEALTH CARD */}
            <div className="bg-[#0e1017]/90 border border-slate-800/80 p-4 rounded-2xl shadow-xl flex items-center gap-3.5 relative overflow-hidden text-left">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl shrink-0">
                <Heart className="w-5 h-5 fill-rose-500/5 text-rose-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono uppercase font-black text-rose-400 block tracking-wider">Média Saúde</span>
                <div className="text-xl font-black text-white tracking-tight leading-tight mt-0.5 font-mono">
                  {currentResults.metrics.count ? (currentResults.metrics.healthSum / currentResults.metrics.count).toFixed(1) : "0.0"}
                  <span className="text-slate-500 text-[10px] font-normal ml-1">pts</span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono block">mín: {currentResults.metrics.count ? currentResults.metrics.minHealth : 0} • máx: {currentResults.metrics.count ? currentResults.metrics.maxHealth : 0}</span>
              </div>
            </div>

            {/* HAPPINESS CARD */}
            <div className="bg-[#0e1017]/95 border border-slate-800/80 p-4 rounded-2xl shadow-xl flex items-center gap-3.5 relative overflow-hidden text-left">
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl shrink-0">
                <Smile className="w-5 h-5 text-sky-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono uppercase font-black text-sky-400 block tracking-wider">Média Felicidade</span>
                <div className="text-xl font-black text-white tracking-tight leading-tight mt-0.5 font-mono">
                  {currentResults.metrics.count ? (currentResults.metrics.happinessSum / currentResults.metrics.count).toFixed(1) : "0.0"}
                  <span className="text-slate-500 text-[10px] font-normal ml-1">pts</span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono block">mín: {currentResults.metrics.count ? currentResults.metrics.minHappiness : 0} • máx: {currentResults.metrics.count ? currentResults.metrics.maxHappiness : 0}</span>
              </div>
            </div>

            {/* INCOME CARD */}
            <div className="bg-[#0e1017]/90 border border-slate-800/80 p-4 rounded-2xl shadow-xl flex items-center gap-3.5 relative overflow-hidden text-left">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono uppercase font-black text-emerald-400 block tracking-wider">Média Renda</span>
                <div className="text-xl font-black text-white tracking-tight leading-tight mt-0.5 font-mono">
                  R$ {currentResults.metrics.count ? (currentResults.metrics.incomeSum / currentResults.metrics.count).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}
                </div>
                <span className="text-[9px] text-slate-500 font-mono block">mín: R$ {currentResults.metrics.count ? currentResults.metrics.minRenda : 0} • máx: R$ {currentResults.metrics.count ? currentResults.metrics.maxRenda.toLocaleString() : 0}</span>
              </div>
            </div>

          </div>

          {/* DISTRIBUTION SECTIONS BAR GRIDS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* LEFT SIDE BAR PANELS (COLS 6) */}
            <div className="lg:col-span-6 bg-[#0e1017]/95 border border-slate-800/80 rounded-2xl p-4.5 space-y-5">
              
              {/* Demographics count bar charts */}
              <div className="space-y-3 text-left">
                <span className="text-[10px] font-mono uppercase text-[#FFBF00] font-black tracking-widest block border-b border-slate-800 pb-1.5 mb-1 select-none">
                  1. Distribuição de Demografia (Idades)
                </span>
                <div className="space-y-1.5">
                  {Object.entries(currentResults.demographics).sort((a,b)=> (b[1] as number) - (a[1] as number)).map(([key, val]) => {
                    const numVal = val as number;
                    const pct = currentTotal ? (numVal / currentTotal) * 100 : 0;
                    const isSelected = activeFilters.demography === key;
                    return (
                      <div
                        key={key}
                        id={`filter-demo-${key.replace(/\s+/g, "-").toLowerCase()}`}
                        onClick={() => toggleFilter("demography", key)}
                        className={`space-y-1 p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500/80 text-white ring-1 ring-amber-500/50 shadow-[0_0_8px_rgba(255,191,0,0.15)] active-filter"
                            : "border-transparent hover:bg-slate-900/40 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold leading-none select-none">
                          <span className="truncate">{key}</span>
                          <span>{numVal.toLocaleString()} <span className="text-[#FFBF00] font-black ml-1 font-sans">{pct.toFixed(2)}%</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${isSelected ? "bg-amber-400" : "bg-amber-600/80"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Age buckets count bar charts */}
              <div className="space-y-3 text-left">
                <span className="text-[10px] font-mono uppercase text-[#FFBF00] font-black tracking-widest block border-b border-slate-800 pb-1.5 mb-1 select-none">
                  2. Faixas Etárias Agrupadas
                </span>
                <div className="space-y-1.5">
                  {Object.entries(currentResults.ageBuckets).map(([key, val]) => {
                    const numVal = val as number;
                    const pct = currentTotal ? (numVal / currentTotal) * 100 : 0;
                    const isSelected = activeFilters.ageGroup === key;
                    return (
                      <div
                        key={key}
                        id={`filter-agebucket-${key}`}
                        onClick={() => toggleFilter("ageGroup", key)}
                        className={`space-y-1 p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500/80 text-white ring-1 ring-amber-500/50 shadow-[0_0_8px_rgba(255,191,0,0.15)] active-filter"
                            : "border-transparent hover:bg-slate-900/40 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold leading-none select-none">
                          <span className="truncate">{key} Anos</span>
                          <span>{numVal.toLocaleString()} <span className="text-[#aa84fe] font-black ml-1 font-sans">{pct.toFixed(2)}%</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${isSelected ? "bg-[#884df2]" : "bg-[#884df2]/70"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Regional states count bar charts */}
              <div className="space-y-3 text-left">
                <span className="text-[10px] font-mono uppercase text-[#FFBF00] font-black tracking-widest block border-b border-slate-800 pb-1.5 mb-1 select-none">
                  3. Distribuição Regional (Estados)
                </span>
                <div className="space-y-1.5">
                  {Object.entries(currentResults.states).sort((a,b)=> (b[1] as number) - (a[1] as number)).map(([key, val]) => {
                    const numVal = val as number;
                    const pct = currentTotal ? (numVal / currentTotal) * 100 : 0;
                    const isSelected = activeFilters.state === key;
                    return (
                      <div
                        key={key}
                        id={`filter-state-${key.toLowerCase()}`}
                        onClick={() => toggleFilter("state", key)}
                        className={`space-y-1 p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500/80 text-white ring-1 ring-amber-500/50 shadow-[0_0_8px_rgba(255,191,0,0.15)] active-filter"
                            : "border-transparent hover:bg-slate-900/40 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold leading-none select-none">
                          <span className="truncate">{key}</span>
                          <span>{numVal.toLocaleString()} <span className="text-sky-450 font-black ml-1 font-sans">{pct.toFixed(2)}%</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${isSelected ? "bg-sky-400" : "bg-sky-600/80"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT SIDE BAR PANELS (COLS 6 - PROP COMPLEMENT) */}
            <div className="lg:col-span-6 bg-[#0e1017]/95 border border-slate-800/80 rounded-2xl p-4.5 space-y-5">
              
              {/* Professions counts bar charts */}
              <div className="space-y-3 text-left">
                <span className="text-[10px] font-mono uppercase text-[#FFBF00] font-black tracking-widest block border-b border-slate-800 pb-1.5 mb-1 select-none">
                  4. Top Ocupações & Profissões (Máximo 10)
                </span>
                <div className="space-y-1.5">
                  {Object.entries(currentResults.professions).sort((a,b)=> (b[1] as number) - (a[1] as number)).slice(0, 10).map(([key, val]) => {
                    const numVal = val as number;
                    const pct = currentTotal ? (numVal / currentTotal) * 100 : 0;
                    const isSelected = activeFilters.profession === key;
                    return (
                      <div
                        key={key}
                        id={`filter-job-${key.replace(/\s+/g, "-").toLowerCase()}`}
                        onClick={() => toggleFilter("profession", key)}
                        className={`space-y-1 p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500/80 text-white ring-1 ring-amber-500/50 shadow-[0_0_8px_rgba(255,191,0,0.15)] active-filter"
                            : "border-transparent hover:bg-slate-900/40 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold leading-none select-none">
                          <span className="truncate">{key}</span>
                          <span>{numVal.toLocaleString()} <span className="text-emerald-450 font-black ml-1 font-sans">{pct.toFixed(2)}%</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${isSelected ? "bg-emerald-400" : "bg-emerald-600/85"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tags/Memory density occurrences bar charts */}
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1">
                  <span className="text-[10px] font-mono uppercase text-[#FFBF00] font-black tracking-widest block leading-none select-none">
                    5. Visibilidade & Densidade de Tags (Top 12)
                  </span>
                  <span className="shrink-0 cursor-help" title="Mostra a densidade de ocorrência acumulada de cada tag nos NPC memories do lote simulado.">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                </div>
                <div className="space-y-1.5 hidden-scroll-bar max-h-[220px] overflow-y-auto pr-1">
                  {Object.entries(currentResults.tags).sort((a,b)=> (b[1] as number) - (a[1] as number)).slice(0, 12).map(([key, val]) => {
                    const numVal = val as number;
                    const pct = currentTotal ? (numVal / currentTotal) * 100 : 0;
                    const isSelected = activeFilters.tag === key;
                    return (
                      <div
                        key={key}
                        id={`filter-tag-${key}`}
                        onClick={() => toggleFilter("tag", key)}
                        className={`space-y-1 p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500/80 text-white ring-1 ring-amber-500/50 shadow-[0_0_8px_rgba(255,191,0,0.15)] active-filter"
                            : "border-transparent hover:bg-slate-900/40 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold leading-none select-none">
                          <span className="truncate text-[#FFBF00]">#{key}</span>
                          <span>{numVal.toLocaleString()} <span className="text-slate-400 font-sans">{pct.toFixed(1)}%</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${isSelected ? "bg-yellow-400" : "bg-yellow-600/80"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. Gênero Ratio Distribution Dashboard Widget */}
              <div className="space-y-3 text-left">
                <span className="text-[10px] font-mono uppercase text-[#FFBF00] font-black tracking-widest block border-b border-slate-800 pb-1.5 mb-1 select-none">
                  6. Distribuição de Gênero
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(currentResults.genders || {}).map(([key, val]) => {
                    const numVal = val as number;
                    const pct = currentTotal ? (numVal / currentTotal) * 100 : 0;
                    const isSelected = activeFilters.genero === key;
                    return (
                      <button
                        key={key}
                        id={`filter-gender-${key.toLowerCase()}`}
                        onClick={() => toggleFilter("genero", key)}
                        className={`p-3.5 rounded-xl border transition-all duration-300 text-left cursor-pointer flex flex-col justify-between h-[84px] w-full select-none ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/50 shadow-[0_0_12px_rgba(255,191,0,0.25)] active-filter"
                            : "bg-[#0e1017] border border-slate-900 text-slate-400 hover:text-white hover:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-black text-slate-300">
                            {key === "Masculino" ? "♂ Homens" : "♀ Mulheres"}
                          </span>
                          <span className="text-[10px] font-black text-amber-400 font-mono">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="space-y-1.5 w-full">
                          <div className="text-xs font-black font-mono text-white leading-none">
                            {numVal.toLocaleString()} <span className="text-[9px] font-normal text-slate-500">NPCs</span>
                          </div>
                          <div className="w-full h-1 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                key === "Masculino" ? "bg-sky-500/80" : "bg-pink-500/80"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          {/* EXPORTING TSV/CSV SECTOR & DETAIL SAMPLES */}
          <div className="bg-[#0e1017]/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-xs font-black text-white uppercase tracking-wider block font-display">
                Exportar Lote de Simulação para o Planilhas
              </span>
              <p className="text-[10px] text-slate-400 font-mono">
                Converta dados consolidados de estatísticas ou fichas detalhadas para colar no Google Sheets do seu sistema RuleForge.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto overflow-hidden">
              <button
                onClick={handleExportStatsToClipboard}
                className="flex-1 sm:flex-initial py-2 px-4 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 font-mono text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:text-[#FFBF00]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#FFBF00]" />
                <span>Copiar Estatísticas (Tabs)</span>
              </button>

              <button
                onClick={handleExportSamplesToClipboard}
                className="flex-1 sm:flex-initial py-2 px-4 bg-[#FFBF00] text-slate-950 font-black font-mono text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:bg-yellow-400"
              >
                <Copy className="w-3.5 h-3.5 text-slate-950 stroke-[3px]" />
                <span>Copiar {currentSamples.length} Fichas TSV</span>
              </button>
            </div>

          </div>

          {/* DETAIL SAMPLES TABLE SHOWCASE WITH REACT-WINDOW VIRTUALIZATION */}
          <div className="bg-[#0e1017]/80 border border-slate-800/60 rounded-2xl p-4 space-y-3.5 select-none animate-fade-in text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2 gap-2">
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-black text-white uppercase tracking-widest block">
                  Amostragem Virtualizada de Fichas ({currentSamples.length} de {currentTotal})
                </span>
                <span className="text-[9px] font-mono text-slate-500 block">
                  Renderizando apenas as linhas visíveis sob demanda para evitar travamentos de UI.
                </span>
              </div>
              {isFilteringLoading && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-[#FFBF00] rounded-xl font-mono text-[9px] animate-pulse">
                  <Cpu className="w-3 h-3 animate-spin" />
                  <span>Filtrando via Web Worker...</span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/40 custom-scrollbar w-full">
              <div className="min-w-[1240px]">
                {/* STATIC HEADER FOR VIRTUALIZED TABLE */}
                <div className="bg-slate-900 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-800 select-none text-[8.5px] font-mono flex items-center py-2.5 px-3">
                  <div className="w-[12%] shrink-0">Semente</div>
                  <div className="w-[14%] shrink-0 pl-2">Nome</div>
                  <div className="w-[8%] shrink-0 text-center">Idade</div>
                  <div className="w-[14%] shrink-0 pl-1">Demografia</div>
                  <div className="w-[11%] shrink-0 pl-1">Estado</div>
                  <div className="w-[11%] shrink-0 pl-1">Cidade</div>
                  <div className="w-[15%] shrink-0 pl-1">Profissão / Ocupação</div>
                  <div className="w-[9%] shrink-0 text-center">Gênero</div>
                  <div className="w-[5%] shrink-0 text-center">Saúde</div>
                  <div className="w-[5%] shrink-0 text-center">Felicidade</div>
                  <div className="w-[12%] shrink-0 text-right pr-2">Renda</div>
                </div>

                {/* VIRTUALIZED ROWS */}
                {currentSamples.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-mono text-[10px]">
                    Nenhum cidadão atende aos critérios de filtragem selecionados.
                  </div>
                ) : (
                  <List
                    height={400}
                    itemCount={currentSamples.length}
                    itemSize={36}
                    width="100%"
                    className="custom-scrollbar"
                  >
                    {({ index, style }) => {
                      const item = currentSamples[index];
                      if (!item) return null;
                      const isGenderSelected = activeFilters.genero === item.genero;
                      return (
                        <div 
                          style={style} 
                          className="hover:bg-slate-900/30 text-slate-300 border-b border-slate-850/40 text-[10px] font-mono flex items-center px-3"
                        >
                          <div className="w-[12%] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap pr-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.seed);
                                setCopiedSeed(item.seed);
                                setTimeout(() => setCopiedSeed(null), 2000);
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 active:scale-95 text-slate-300 hover:text-white rounded text-[8px] font-bold cursor-pointer transition-all"
                              title="Copiar Semente"
                            >
                              {copiedSeed === item.seed ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  <span className="text-emerald-400 text-[8px]">Copiada</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5 text-slate-500" />
                                  <span className="truncate">{item.seed}</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="w-[14%] shrink-0 pl-2 text-white font-bold overflow-hidden text-ellipsis whitespace-nowrap pr-2">{item.nome}</div>
                          <div className="w-[8%] shrink-0 text-center font-bold text-[#FFBF00]">
                            <button
                              onClick={() => toggleFilter("ageGroup", item.idade >= 18 && item.idade <= 29 ? "18-29" : item.idade >= 30 && item.idade <= 49 ? "30-49" : item.idade >= 50 && item.idade <= 69 ? "50-69" : "70+")}
                              className="hover:underline hover:text-white cursor-pointer"
                            >
                              {item.idade} anos
                            </button>
                          </div>
                          <div className="w-[14%] shrink-0 pl-1 text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap pr-2">
                            <button
                              onClick={() => toggleFilter("demography", item.descDemo)}
                              className={`font-mono px-1.5 py-0.5 rounded text-[9px] cursor-pointer transition-all truncate max-w-full block ${
                                activeFilters.demography === item.descDemo
                                  ? "bg-amber-500/15 text-[#FFBF00] border border-amber-500/40 font-bold active-filter shadow-[0_0_6px_rgba(255,191,0,0.1)]"
                                  : "hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              {item.descDemo}
                            </button>
                          </div>
                          <div className="w-[11%] shrink-0 pl-1 text-slate-400 font-bold overflow-hidden text-ellipsis whitespace-nowrap pr-2">
                            <button
                              onClick={() => toggleFilter("state", item.estado)}
                              className={`px-1.5 py-0.5 rounded text-[9px] cursor-pointer transition-all truncate max-w-full block ${
                                activeFilters.state === item.estado
                                  ? "bg-amber-500/15 text-[#FFBF00] border border-amber-500/40 font-bold active-filter shadow-[0_0_6px_rgba(255,191,0,0.1)]"
                                  : "hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              {item.estado}
                            </button>
                          </div>
                          <div className="w-[11%] shrink-0 pl-1 text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap pr-2">
                            <button
                              onClick={() => toggleFilter("city", item.cidade)}
                              className={`px-1.5 py-0.5 rounded text-[9px] cursor-pointer transition-all truncate max-w-full block ${
                                activeFilters.city === item.cidade
                                  ? "bg-amber-500/15 text-[#FFBF00] border border-amber-500/40 font-bold active-filter shadow-[0_0_6px_rgba(255,191,0,0.1)]"
                                  : "hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              {item.cidade === "Nenhuma" ? "Nenhuma" : item.cidade}
                            </button>
                          </div>
                          <div className="w-[15%] shrink-0 pl-1 text-[#aa84fe] font-black overflow-hidden text-ellipsis whitespace-nowrap pr-2">
                            <button
                              onClick={() => toggleFilter("profession", item.profissao)}
                              className={`px-1.5 py-0.5 rounded text-[9px] cursor-pointer transition-all truncate max-w-full block ${
                                activeFilters.profession === item.profissao
                                  ? "bg-amber-500/15 text-[#FFBF00] border border-amber-500/40 font-bold active-filter shadow-[0_0_6px_rgba(255,191,0,0.1)]"
                                  : "hover:bg-slate-800 hover:text-slate-250"
                              }`}
                            >
                              {item.profissao}
                            </button>
                          </div>
                          <div className="w-[9%] shrink-0 text-center pr-2">
                            <button
                              onClick={() => toggleFilter("genero", item.genero)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black cursor-pointer transition-all font-mono uppercase truncate block w-full text-center ${
                                item.genero === "Masculino" 
                                  ? isGenderSelected ? "bg-sky-500/15 text-sky-400 border border-sky-500/40 active-filter font-bold animate-pulse" : "text-sky-455 hover:bg-slate-800/60"
                                  : isGenderSelected ? "bg-pink-500/15 text-pink-400 border border-pink-500/40 active-filter font-bold animate-pulse" : "text-pink-455 hover:bg-slate-800/60"
                              }`}
                            >
                              {item.genero === "Masculino" ? "♂ Homem" : "♀ Mulher"}
                            </button>
                          </div>
                          <div className="w-[5%] shrink-0 text-center text-rose-450 font-bold">{item.saude}</div>
                          <div className="w-[5%] shrink-0 text-center text-sky-400 font-bold">{item.felicidade}</div>
                          <div className="w-[12%] shrink-0 text-right pr-2 text-emerald-400 font-extrabold font-mono">R$ {item.renda.toLocaleString()}</div>
                        </div>
                      );
                    }}
                  </List>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
