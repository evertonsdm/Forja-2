import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Search, ChevronDown, Check } from "lucide-react";

interface TagMultiSelectProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  allTags: string[];
  placeholder?: string;
}

export const TagMultiSelect: React.FC<TagMultiSelectProps> = ({
  selectedTags = [],
  onChange,
  allTags = [],
  placeholder = "Adicionar...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTagFromList, setSelectedTagFromList] = useState<string>("");
  const [pendingWeight, setPendingWeight] = useState<string>("1.0");
  const [inputErrorMsg, setInputErrorMsg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse tags into structured array
  const parsedSelected = selectedTags.map((tag) => {
    const colonIdx = tag.indexOf(":");
    if (colonIdx !== -1) {
      const name = tag.substring(0, colonIdx).trim();
      const weight = parseFloat(tag.substring(colonIdx + 1).trim());
      return { raw: tag, name, weight: isNaN(weight) ? 1.0 : weight };
    }
    return { raw: tag, name: tag.trim(), weight: 1.0 };
  });

  // Close dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleRemove = (rawTagToRemove: string) => {
    onChange(selectedTags.filter((t) => t !== rawTagToRemove));
  };

  // Real-time normalizer and validation guard
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawVal = e.target.value;

    // Check for invalid characters (anything other than numbers, decimal dots and commas)
    const hasInvalidChars = /[^0-9.,]/.test(rawVal);
    if (hasInvalidChars) {
      setInputErrorMsg("Apenas números, . ou ,");
      // Strip invalid characters immediately
      rawVal = rawVal.replace(/[^0-9.,]/g, "");
    } else {
      setInputErrorMsg(null);
    }

    // Convert comma to dot
    let normalized = rawVal.replace(/,/g, ".");
    
    // Ensure only one period remains
    const parts = normalized.split(".");
    if (parts.length > 2) {
      normalized = parts[0] + "." + parts.slice(1).join("");
    }

    // Keep it as string so user can clear the field completely
    setPendingWeight(normalized);
  };

  const handleAddPair = (tag: string, weightStr: string) => {
    if (!tag) return;
    
    // Final universal normalization and float conversion before processing
    const cleanStr = weightStr.replace(/,/g, ".");
    const parsed = parseFloat(cleanStr);
    const weight = isNaN(parsed) ? 1.0 : parsed;

    // Remove if there is an existing tag with same name but different weight
    const filtered = selectedTags.filter((t) => {
      const parts = t.split(":");
      return parts[0].trim().toLowerCase() !== tag.trim().toLowerCase();
    });
    const formatted = `${tag}:${weight}`;
    onChange([...filtered, formatted]);
    setSelectedTagFromList("");
    setPendingWeight("1.0");
    setInputErrorMsg(null);
    setSearch("");
  };

  // Filter options: not already selected and matching the query
  const availableOptions = allTags.filter(
    (tag) =>
      !parsedSelected.some((p) => p.name.toLowerCase() === tag.toLowerCase()) &&
      tag.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div ref={containerRef} className="relative w-full min-w-[220px]">
      {/* Selector Container holding badges */}
      <div 
        className="flex flex-wrap gap-1.5 p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 focus-within:border-indigo-505 rounded-xl min-h-[38px] items-center cursor-pointer transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        {parsedSelected.length > 0 ? (
          parsedSelected.map((item) => (
            <span
              key={item.raw}
              className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-550/20 select-none group"
              onClick={(e) => e.stopPropagation()} // Prevent opening dropdown when clicking a tag
            >
              <span>
                {item.name}{" "}
                <span className="text-[9px] text-amber-500 font-bold">
                  [{item.weight.toFixed(1)}]
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleRemove(item.raw)}
                className="hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded p-[1px] transition-colors"
                title="Remover tag"
              >
                <X className="w-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-500 font-mono pl-1.5 italic select-none">
            {placeholder}
          </span>
        )}

        {/* Indicator button at the far end */}
        <div className="ml-auto pr-1 flex items-center gap-1 text-slate-500 group-hover:text-slate-400">
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      {/* Floating Dropdown Overlay */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2.5 max-h-[350px] flex flex-col gap-2.5" onClick={(e) => e.stopPropagation()}>
          
          {/* PAIR INPUT FORM (Campo A e Campo B) */}
          <div className="p-2 bg-slate-900/40 rounded-lg space-y-2 border border-slate-800/40">
            <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono">
              Configurar Peso de Tag (Input Duplo)
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center">
              {/* Campo A: Dropdown de tags exclusivas */}
              <div className="sm:col-span-7">
                <select
                  value={selectedTagFromList}
                  onChange={(e) => setSelectedTagFromList(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-indigo-500 rounded-lg px-2 py-1.5 text-[11px] font-mono outline-none"
                >
                  <option value="">Selecione a Tag (A)...</option>
                  {allTags
                    .filter(t => !parsedSelected.some(p => p.name.toLowerCase() === t.toLowerCase()))
                    .map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))
                  }
                </select>
              </div>

              {/* Campo B: Peso da Tag */}
              <div className="sm:col-span-3 relative">
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9.,]*"
                  value={pendingWeight}
                  onChange={handleWeightChange}
                  className={`w-full bg-slate-950 text-slate-200 border focus:border-indigo-500 rounded-lg px-2 py-1.5 text-[11px] font-mono text-center outline-none transition-all ${
                    inputErrorMsg ? "border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "border-slate-800"
                  }`}
                  placeholder="1.0"
                  title="Peso multiplicador. Aceita decimal, ex: 0.5 ou 0,5"
                />
                {inputErrorMsg && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 whitespace-nowrap bg-amber-600 text-[9px] font-bold text-slate-950 font-mono px-1.5 py-0.5 rounded shadow-lg animate-bounce">
                    {inputErrorMsg}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  disabled={!selectedTagFromList}
                  onClick={() => handleAddPair(selectedTagFromList, pendingWeight)}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-mono text-[11px] font-bold rounded-lg transition-all"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Quick Search List (To search or quickly pick) */}
          <div className="relative mt-0.5">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar tag para preencher campo A..."
              className="w-full bg-slate-900 text-slate-200 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-mono outline-none transition-all"
            />
          </div>

          {/* List of search results */}
          <div className="overflow-y-auto max-h-[140px] divide-y divide-slate-900 pr-0.5 flex-1">
            {availableOptions.length > 0 ? (
              availableOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTagFromList(tag);
                  }}
                  className={`w-full text-left font-mono text-[11px] px-2.5 py-1.5 rounded-md transition-all flex items-center justify-between ${
                    selectedTagFromList.toLowerCase() === tag.toLowerCase()
                      ? "bg-indigo-550/20 text-white"
                      : "hover:bg-indigo-550/10 text-slate-350 hover:text-white"
                  }`}
                >
                  <span>{tag}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">
                    Selecione (A)
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-[10px] text-slate-500 font-mono italic">
                {search ? "Nenhuma tag correspondente" : "Todas as tags já selecionadas ou cadastradas"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
