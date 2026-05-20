import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Search, ChevronDown } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleRemove = (tagToRemove: string) => {
    onChange(selectedTags.filter((t) => t !== tagToRemove));
  };

  const handleAdd = (tagToAdd: string) => {
    if (!selectedTags.includes(tagToAdd)) {
      onChange([...selectedTags, tagToAdd]);
    }
    // Keep open or close? Let's keep it open to quickly select multiple, but reset search
    setSearch("");
  };

  // Filter options: not already selected and matching the query
  const availableOptions = allTags.filter(
    (tag) =>
      !selectedTags.includes(tag) &&
      tag.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div ref={containerRef} className="relative w-full min-w-[150px]">
      {/* Selector Container holding badges */}
      <div 
        className="flex flex-wrap gap-1.5 p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 focus-within:border-indigo-500 rounded-xl min-h-[38px] items-center cursor-pointer transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-550/20 select-none group"
              onClick={(e) => e.stopPropagation()} // Prevent opening dropdown when clicking a tag
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                className="hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded p-[1px] transition-colors"
                title="Remover tag"
              >
                <X className="w-3 h-3" />
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
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 max-h-[220px] flex flex-col gap-1.5">
          {/* Search Box inside dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar tag disponível..."
              className="w-full bg-slate-900 text-slate-200 border border-slate-800 hover:border-slate-755 focus:border-indigo-500 rounded-lg pl-8 pr-3 py-1 text-[11px] font-mono outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Options list container */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-900 pr-0.5">
            {availableOptions.length > 0 ? (
              availableOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd(tag);
                  }}
                  className="w-full text-left font-mono text-[11px] px-2.5 py-1.5 hover:bg-indigo-550/10 text-slate-350 hover:text-white rounded-md transition-all flex items-center justify-between"
                >
                  <span>{tag}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-500 group-hover:text-indigo-400">
                    + Adicionar
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-[10px] text-slate-500 font-mono italic">
                {search ? "Nenhuma tag correspondente" : "Todas as tags já selecionadas"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
