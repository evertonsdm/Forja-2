import React, { useState } from "react";
import { NPC, TagDef } from "../types";
import { NPCAvatar } from "./NPCAvatar";
import { Calendar, Briefcase, Tag, Sparkles, Shield, Heart, HelpCircle, Copy, Check, TrendingUp } from "lucide-react";

interface NPCCardProps {
  npc: NPC;
  tagDefs: TagDef[];
  onSave?: (npc: NPC) => void;
  isSaved?: boolean;
}

export const NPCCard: React.FC<NPCCardProps> = ({ npc, tagDefs, onSave, isSaved = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopySeed = () => {
    navigator.clipboard.writeText(npc.seed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe tag formatting helper
  const getTagModifiersBreakdown = () => {
    const memoryObj = npc.tagsMemoria || {};
    const uniqueTags = Object.keys(memoryObj);
    const list: { tag: string; saude: number; fel: number; renda: number }[] = [];
    
    for (const tag of uniqueTags) {
      const def = tagDefs.find((t) => t.tag.toLowerCase() === tag.toLowerCase());
      const peso = memoryObj[tag] ?? 1.0;
      if (def && (def.mod_saude !== 0 || def.mod_felicidade !== 0 || def.mod_renda_mensal !== 0)) {
        list.push({
          tag: def.tag,
          saude: def.mod_saude * peso,
          fel: def.mod_felicidade * peso,
          renda: def.mod_renda_mensal * peso,
        });
      }
    }
    return list;
  };

  const modifiersBreakdown = getTagModifiersBreakdown();

  // Status visual colors
  const getSaudeColor = (val: number) => {
    if (val >= 80) return "bg-emerald-500 text-emerald-400 border-emerald-500/20";
    if (val >= 50) return "bg-amber-500 text-amber-400 border-amber-500/20";
    return "bg-rose-500 text-rose-400 border-rose-500/20";
  };

  const getFelicidadeColor = (val: number) => {
    if (val >= 70) return "bg-cyan-500 text-cyan-400 border-cyan-500/20";
    if (val >= 40) return "bg-amber-500 text-amber-400 border-amber-500/20";
    return "bg-rose-500 text-rose-400 border-rose-500/20";
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="w-full bg-[#12141c]/95 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300">
      
      {/* HUD scanning overlay */}
      <div className="absolute top-0 right-0 p-1.5 opacity-60">
        <span className="text-[9px] uppercase tracking-widest font-mono text-amber-500/50 select-none">
          SECURE_NODE_ID: LPC_{npc.seed}
        </span>
      </div>

      {/* HEADER SECTION: Identity */}
      <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-slate-800">
        <NPCAvatar seed={npc.seed} size={110} />
        
        <div className="flex-1 text-center sm:text-left space-y-2.5">
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-950/80 text-amber-400 border border-amber-500/20 shadow-inner">
              Demo: {npc.demografia.descricao}
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-950/80 text-sky-450 border border-sky-500/20 flex items-center gap-1 shadow-inner">
              <Calendar className="w-3 h-3 text-sky-400" />
              {npc.idade} Anos
            </span>
            {npc.estado && (
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-950/80 text-emerald-400 border border-emerald-500/20 shadow-inner">
                Est: {npc.estado.id_estado.replace("EST_", "")}
              </span>
            )}
            {npc.cidade && (
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-950/80 text-teal-400 border border-teal-500/20 shadow-inner">
                Cid: {npc.cidade.nome_cidade}
              </span>
            )}
          </div>
          
          <h3 className="text-2xl font-black tracking-tight text-white font-sans sm:-ml-0.5 text-ice">
            {npc.nome}
          </h3>
          
          <div className="flex items-center justify-center sm:justify-start gap-1 py-1 px-3 rounded-lg bg-slate-950 border border-slate-800 w-fit mx-auto sm:mx-0">
            <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0 mr-1.5" />
            <span className="text-xs font-mono font-bold text-slate-300 tracking-wider">
              {npc.profissao}
            </span>
          </div>
        </div>

        {/* Action button - save */}
        {onSave && (
          <button
            onClick={() => onSave(npc)}
            disabled={isSaved}
            className={`w-full sm:w-auto px-5 py-2.5 text-xs font-mono font-black uppercase tracking-wider rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
              isSaved
                ? "bg-slate-950 text-emerald-400 border border-emerald-500/20 cursor-not-allowed"
                : "bg-[#FFBF00] hover:bg-[#FFD13B] text-slate-950 shadow-lg"
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Salvo</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-900" />
                <span>Registrar</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* MID SECTION: Status Attributes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SAUDE CARDS */}
        <div className="bg-slate-950/60 backdrop-blur-sm p-4 rounded-xl border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#FFBF00]" />
              Saúde Vital
            </span>
            <span className="text-[#FFBF00] font-bold">{npc.saude}/100</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
            <div 
              className={`h-full transition-all duration-500 bg-gradient-to-r from-amber-600 to-[#FFBF00]`}
              style={{ width: `${Math.min(Math.max(npc.saude, 0), 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>Critical</span>
            <span>Estável</span>
            <span>Vigor</span>
          </div>
        </div>

        {/* FELICIDADE CARDS */}
        <div className="bg-slate-950/60 backdrop-blur-sm p-4 rounded-xl border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-sky-400" />
              Felicidade Estoniana
            </span>
            <span className="text-sky-450 font-bold">{npc.felicidade}/100</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
            <div 
              className={`h-full transition-all duration-500 bg-gradient-to-r from-sky-600 to-sky-400`}
              style={{ width: `${Math.min(Math.max(npc.felicidade, 0), 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>Distopia</span>
            <span>Neutra</span>
            <span>Plena</span>
          </div>
        </div>

        {/* RENDA CARDS */}
        <div className="bg-slate-950/60 backdrop-blur-sm p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-450" />
            Renda Líquida
          </div>
          <div className="text-xl font-mono font-black text-emerald-400 py-1">
            {formatBRL(npc.renda)}
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Acúmulo dos modificadores
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Tags & Memória */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-[#FFBF00]" />
          Tags Acumuladas na Memória
        </h4>
        <div className="flex flex-wrap gap-2 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 min-h-[50px] backdrop-blur-sm">
          {Object.keys(npc.tagsMemoria || {}).length > 0 ? (
            Object.entries(npc.tagsMemoria || {}).map(([tag, pesoVal], idx) => {
              const peso = Number(pesoVal) || 1.0;
              const def = tagDefs.find((t) => t.tag.toLowerCase() === tag.toLowerCase());
              const bonusText = def 
                ? `${def.mod_saude ? ` Saúde: ${def.mod_saude > 0 ? "+" : ""}${def.mod_saude * peso}` : ""}${def.mod_felicidade ? ` Fel.: ${def.mod_felicidade > 0 ? "+" : ""}${def.mod_felicidade * peso}` : ""}${def.mod_renda_mensal ? ` Renda: R$ ${def.mod_renda_mensal * peso}` : ""}`
                : "";
                
              return (
                <span
                  key={idx}
                  className="group relative text-[11px] font-mono py-1 px-3 rounded-full bg-slate-900/80 hover:bg-slate-850/90 text-amber-400 border border-amber-500/20 shadow-sm backdrop-blur-sm transition-all cursor-help select-all"
                  title={bonusText ? `Efeitos: ${bonusText}` : "Sem modificadores diretos"}
                >
                  {tag} <span className="text-[9px] text-amber-500 font-bold">[{peso.toFixed(1)}]</span>
                  {bonusText && (
                    <span className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2.5 bg-[#0a0b10] border border-slate-800 text-slate-300 text-[10px] rounded-lg shadow-2xl w-52 text-center transition-all z-20 font-mono">
                      <strong className="text-ice">Modificador Tag:</strong>
                      <span className="block text-amber-400 mt-1">{bonusText}</span>
                    </span>
                  )}
                </span>
              );
            })
          ) : (
            <span className="text-xs text-slate-500 font-mono italic">Memória vazia</span>
          )}
        </div>
      </div>

      {/* EQUATION BREAKDOWN PANEL: Relatório Lógico */}
      {modifiersBreakdown.length > 0 && (
        <div className="bg-slate-950/80 rounded-xl border border-slate-850 p-4 space-y-3 font-mono text-[11px] text-slate-400">
          <h5 className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-850">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Equações de Resolução de Status (Fórmulas do Motor)
          </h5>
          
          <div className="space-y-2 divide-y divide-slate-900">
            {/* Saúde Math */}
            <div className="pt-2">
              <div className="flex justify-between text-slate-200">
                <span>Atributo Saúde:</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {npc.saude}
                </span>
              </div>
              <div className="text-slate-500 mt-0.5 whitespace-pre-wrap leading-relaxed">
                100{" (Base)"} 
                {modifiersBreakdown.map((item) => {
                  if (item.saude === 0) return null;
                  return ` ${item.saude > 0 ? "+" : ""} ${item.saude} (${item.tag})`;
                })} = <strong className="text-slate-300">{npc.saude} / 100</strong>
              </div>
            </div>

            {/* Felicidade Math */}
            <div className="pt-2">
              <div className="flex justify-between text-slate-200">
                <span>Atributo Felicidade:</span>
                <span className="font-semibold text-cyan-400 font-mono">
                  {npc.felicidade}
                </span>
              </div>
              <div className="text-slate-500 mt-0.5 whitespace-pre-wrap leading-relaxed">
                50{" (Base)"}
                {modifiersBreakdown.map((item) => {
                  if (item.fel === 0) return null;
                  return ` ${item.fel > 0 ? "+" : ""} ${item.fel} (${item.tag})`;
                })} = <strong className="text-slate-300">{npc.felicidade} / 100</strong>
              </div>
            </div>

            {/* Renda Math */}
            <div className="pt-2">
              <div className="flex justify-between text-slate-200">
                <span>Renda Mensal:</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {formatBRL(npc.renda)}
                </span>
              </div>
              <div className="text-slate-500 mt-0.5 whitespace-pre-wrap leading-relaxed">
                {modifiersBreakdown.filter(item => item.renda !== 0).length > 0 ? (
                  modifiersBreakdown.map((item, idx, arr) => {
                    if (item.renda === 0) return null;
                    return `R$ ${item.renda} (${item.tag})${idx < arr.length - 1 ? " + " : ""}`;
                  })
                ) : (
                  "Nenhuma tag de renda ativa"
                )} = <strong className="text-slate-300">{formatBRL(npc.renda)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER SEED BOX */}
      <div className="bg-slate-950/60 rounded-xl px-4 py-3 flex text-xs font-mono justify-between items-center border border-slate-850">
        <span className="text-slate-400">Semente Utilizada (Seed):</span>
        <button
          onClick={handleCopySeed}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-850 hover:border-slate-700 active:scale-95 text-slate-300 rounded transition-all font-bold"
          title="Copiar semente para a área de transferência"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copiada</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>{npc.seed}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
