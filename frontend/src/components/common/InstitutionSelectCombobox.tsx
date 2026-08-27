import React, { useState, useRef, useEffect } from "react";
import { Building2, Search, ChevronDown, Check, X, MapPin } from "lucide-react";

export interface InstitutionOption {
  id: number;
  name: string;
  code?: string;
  location?: string;
  verification_status?: string;
}

interface InstitutionSelectComboboxProps {
  institutions: InstitutionOption[];
  selectedId: number | string | null | undefined;
  onSelect: (inst: InstitutionOption | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const InstitutionSelectCombobox: React.FC<InstitutionSelectComboboxProps> = ({
  institutions,
  selectedId,
  onSelect,
  placeholder = "Search and select registered university...",
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedInst = institutions.find((i) => String(i.id) === String(selectedId));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredInstitutions = institutions.filter((inst) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      inst.name.toLowerCase().includes(q) ||
      (inst.code && inst.code.toLowerCase().includes(q)) ||
      (inst.location && inst.location.toLowerCase().includes(q))
    );
  });

  const handleSelect = (inst: InstitutionOption) => {
    onSelect(inst);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchQuery("");
  };

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      {/* Target Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
          disabled
            ? "bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed"
            : isOpen
            ? "bg-slate-900/90 border-indigo-500/70 shadow-[0_0_20px_rgba(99,102,241,0.25)] text-slate-100"
            : "bg-slate-900/70 border-slate-700/60 hover:border-slate-500 text-slate-200 hover:bg-slate-900/90"
        }`}
        style={{
          backdropFilter: "blur(12px)",
          minHeight: "46px",
        }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Building2
            size={18}
            className={selectedInst ? "text-indigo-400 shrink-0" : "text-slate-400 shrink-0"}
          />
          {selectedInst ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-sm text-slate-100 truncate">
                {selectedInst.name}
              </span>
              {selectedInst.code && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-semibold shrink-0">
                  {selectedInst.code}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedInst && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-indigo-400" : ""
            }`}
          />
        </div>
      </div>

      {/* Hidden Native Input for HTML5 form validation */}
      {required && (
        <input
          type="text"
          value={selectedId ? String(selectedId) : ""}
          required={required}
          onChange={() => {}}
          tabIndex={-1}
          className="opacity-0 absolute inset-0 pointer-events-none w-full h-full"
        />
      )}

      {/* Dropdown Popup Menu */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-full rounded-xl border border-slate-700/80 bg-slate-900/95 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{
            maxHeight: "320px",
          }}
        >
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700/70 focus-within:border-indigo-500/80 transition-colors">
              <Search size={15} className="text-indigo-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type university name, code or city..."
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Institution List */}
          <div className="overflow-y-auto p-1.5 max-h-[240px] custom-scrollbar space-y-1">
            {filteredInstitutions.length === 0 ? (
              <div className="py-6 px-4 text-center text-slate-400 text-xs space-y-1">
                <Building2 size={24} className="mx-auto text-slate-600 mb-1" />
                <p className="font-semibold text-slate-300">No approved institution found</p>
                <p className="text-[11px] text-slate-500">
                  Try searching with a different university name or location.
                </p>
              </div>
            ) : (
              filteredInstitutions.map((inst) => {
                const isSelected = String(inst.id) === String(selectedId);
                return (
                  <div
                    key={inst.id}
                    onClick={() => handleSelect(inst)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-medium"
                        : "text-slate-200 hover:bg-slate-800/80 hover:text-slate-100"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-100 truncate">{inst.name}</span>
                        {inst.code && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-semibold">
                            {inst.code}
                          </span>
                        )}
                      </div>
                      {inst.location && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin size={10} className="text-slate-500" />
                          {inst.location}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check size={15} className="text-indigo-400 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer count note */}
          <div className="py-1.5 px-3 border-t border-slate-800/80 bg-slate-950/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Showing {filteredInstitutions.length} approved institutions</span>
            <span className="text-indigo-400 font-medium">Database Verified</span>
          </div>
        </div>
      )}
    </div>
  );
};
