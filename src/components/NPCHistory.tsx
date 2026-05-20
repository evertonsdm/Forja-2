import React, { useState } from "react";
import { NPC } from "../types";
import { Trash2, Search, ArrowRight, Sparkles, Smile, Shield } from "lucide-react";

interface NPCHistoryProps {
  savedNpcs: NPC[];
  onSelect: (seed: string) => void;
  onDelete: (index: number) => void;
  onClearAll: () => void;
}

export const NPCHistory: React.FC<NPCHistoryProps> = ({
  savedNpcs,
  onSelect,
  onDelete,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = savedNpcs.filter((npc) => {
    const s = searchTerm.toLowerCase();
    return (
      npc.profissao.toLowerCase().includes(s) ||
      npc.demografia.descricao.toLowerCase().includes(s) ||
      npc.seed.toLowerCase().includes(s) ||
      Object.keys(npc.tagsMemoria || {}).some((t) => t.toLowerCase().includes(s))
    );
  });

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-2xl flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              Registro de NPCs ({savedNpcs.length})
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">Histórico de simulações com seeds travadas</p>
          </div>
        </div>

        {savedNpcs.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-[10px] font-mono text-rose-450 hover:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 px-2 py-1 rounded border border-rose-500/10 transition-all cursor-pointer"
          >
            Limpar Todos
          </button>
        )}
      </div>

      {savedNpcs.length > 0 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por profissão, tags, demografia ou seed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 hover:bg-slate-950 focus:bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all font-mono"
          />
        </div>
      )}

      {/* LIST OF SAVED ITEMS */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] pr-1">
        {filtered.length > 0 ? (
          filtered.map((npc, idx) => (
            <div
              key={idx}
              className="group bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 hover:border-slate-800/80 p-3 rounded-xl transition-all flex items-center justify-between gap-3 font-mono text-xs"
            >
              <div 
                onClick={() => onSelect(npc.seed)}
                className="flex-1 cursor-pointer space-y-1.5"
                title="Clique para restaurar este NPC"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                    {npc.profissao}
                  </span>
                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                    Seed: {npc.seed}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-slate-400">
                  <span>{npc.demografia.descricao} ({npc.idade}a)</span>
                  
                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <Shield className="w-2.5 h-2.5" />
                      {npc.saude}
                    </span>
                    <span className="flex items-center gap-0.5 text-cyan-400">
                      <Smile className="w-2.5 h-2.5" />
                      {npc.felicidade}
                    </span>
                    {npc.renda > 0 && (
                      <span className="text-emerald-500 font-bold">
                        {formatBRL(npc.renda)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onSelect(npc.seed)}
                  className="p-1.5 bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-amber-400 rounded-lg transition-all"
                  title="Restaurar e carregar semente"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(idx)}
                  className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
                  title="Remover registro"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-28 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-850 rounded-xl space-y-2">
            <Sparkles className="w-6 h-6 text-slate-600 animate-pulse" />
            <p className="text-xs text-slate-500 italic font-mono">
              {savedNpcs.length === 0
                ? "Nenhum NPC registrado ainda. Gere um e registre-o!"
                : "Nenhum NPC corresponde aos filtros."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
