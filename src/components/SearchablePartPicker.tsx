import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { searchItems } from '../services/datasetService';

interface SearchablePartPickerProps<T extends { id: string; name: string; brand?: string; description?: string }> {
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  items: T[];
  selectedItem: T | null;
  onSelect: (item: T | null) => void;
  renderItemBadge?: (item: T) => React.ReactNode;
  renderDetails?: (item: T) => React.ReactNode;
  categoryFilter?: {
    name: string;
    filterFn: (item: T) => boolean;
  }[];
}

export function SearchablePartPicker<T extends { id: string; name: string; brand?: string; description?: string }>({
  label,
  placeholder,
  icon,
  items,
  selectedItem,
  onSelect,
  renderItemBadge,
  renderDetails,
  categoryFilter,
}: SearchablePartPickerProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setActiveFilter(null);
    }
  }, [isOpen]);

  // Filter items by category tab
  const filteredByCategory = useMemo(() => {
    if (activeFilter === null || !categoryFilter || !categoryFilter[activeFilter]) {
      return items;
    }
    return items.filter(categoryFilter[activeFilter].filterFn);
  }, [items, activeFilter, categoryFilter]);

  // Search items
  const searchResults = useMemo(() => {
    return searchItems(filteredByCategory, query, 50);
  }, [filteredByCategory, query]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Top Label & Active Badge */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        {selectedItem && renderItemBadge && renderItemBadge(selectedItem)}
      </div>

      {/* Main Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] px-3 py-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
          selectedItem
            ? 'bg-slate-900 border-cyan-500/40 text-slate-100 hover:border-cyan-400 shadow-sm'
            : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {selectedItem ? (
            <span className="font-semibold text-xs text-slate-100 truncate">
              {selectedItem.name}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic truncate font-normal">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedItem && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              className="p-1 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-800 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-cyan-400' : ''
            }`}
          />
        </div>
      </div>

      {/* Render Selected Item Quick Details when not open */}
      {selectedItem && renderDetails && !isOpen && (
        <div className="mt-2.5">
          {renderDetails(selectedItem)}
        </div>
      )}

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/70">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${items.length.toLocaleString()} parts by name or brand...`}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg pl-8 pr-8 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 font-mono"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {categoryFilter && categoryFilter.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5 pr-1">
                <button
                  type="button"
                  onClick={() => setActiveFilter(null)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border whitespace-nowrap transition-colors ${
                    activeFilter === null
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  All ({items.length})
                </button>
                {categoryFilter.map((cat, idx) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setActiveFilter(idx)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border whitespace-nowrap transition-colors ${
                      activeFilter === idx
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {searchResults.length > 0 ? (
              searchResults.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelect(item);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2.5 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-200'
                        : 'hover:bg-slate-800/70 text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium truncate">{item.name}</span>
                        {item.brand && (
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded font-mono shrink-0">
                            {item.brand}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No components found matching "{query}"
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="px-3 py-1.5 border-t border-slate-800 bg-slate-950 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Showing {searchResults.length} of {filteredByCategory.length} parts</span>
            <span className="text-cyan-400">docyx/pc-part-dataset verified</span>
          </div>
        </div>
      )}
    </div>
  );
}
