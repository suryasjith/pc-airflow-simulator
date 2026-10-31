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
      {/* Top Label & Status Header */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-semibold">
          {icon}
          <span>{label}</span>
        </label>
        {selectedItem && renderItemBadge && renderItemBadge(selectedItem)}
      </div>

      {/* Main Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[40px] px-3 py-2 border transition-all cursor-pointer flex items-center justify-between gap-2 btn-tactile ${
          selectedItem
            ? 'bg-[#0f121a] border-[#00f0ff]/60 text-zinc-100 shadow-[2px_2px_0px_#000]'
            : 'bg-[#0a0c10] border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {selectedItem ? (
            <span className="font-mono font-medium text-xs text-white truncate">
              {selectedItem.name}
            </span>
          ) : (
            <span className="text-xs text-zinc-500 font-mono truncate">
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
              className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-zinc-500 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#00f0ff]' : ''
            }`}
          />
        </div>
      </div>

      {/* Selected Item Quick Specs */}
      {selectedItem && renderDetails && !isOpen && (
        <div className="mt-2">
          {renderDetails(selectedItem)}
        </div>
      )}

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#0c0e14] border border-zinc-700 shadow-[4px_4px_0px_#000] overflow-hidden">
          {/* Search Box Header */}
          <div className="p-2 border-b border-zinc-800 bg-[#08090d]">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${items.length.toLocaleString()} parts by name or brand...`}
                className="w-full bg-[#11131a] border border-zinc-700 focus:border-[#00f0ff] pl-8 pr-8 py-1.5 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 font-mono rounded-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {categoryFilter && categoryFilter.length > 0 && (
              <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setActiveFilter(null)}
                  className={`text-[10px] font-mono px-2 py-0.5 border whitespace-nowrap transition-colors ${
                    activeFilter === null
                      ? 'bg-[#00f0ff] text-black font-bold border-[#00f0ff]'
                      : 'bg-[#11131a] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  ALL ({items.length})
                </button>
                {categoryFilter.map((cat, idx) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setActiveFilter(idx)}
                    className={`text-[10px] font-mono px-2 py-0.5 border whitespace-nowrap transition-colors uppercase ${
                      activeFilter === idx
                        ? 'bg-[#00f0ff] text-black font-bold border-[#00f0ff]'
                        : 'bg-[#11131a] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800/80 p-0.5">
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
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-[#00f0ff]/10 border-l-2 border-[#00f0ff] text-white'
                        : 'hover:bg-zinc-800/60 text-zinc-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono font-medium truncate">{item.name}</span>
                        {item.brand && (
                          <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1 font-mono uppercase shrink-0">
                            {item.brand}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[10px] text-zinc-500 font-mono truncate">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#00f0ff] shrink-0" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-zinc-500 font-mono">
                [ NO SPECIFICATIONS MATCHING "{query}" ]
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="px-3 py-1.5 border-t border-zinc-800 bg-[#08090d] text-[10px] font-mono text-zinc-500 flex items-center justify-between">
            <span>INDEX: {searchResults.length} OF {filteredByCategory.length} UNITS</span>
            <span className="text-[#00f0ff]">ONLINE REPO VERIFIED</span>
          </div>
        </div>
      )}
    </div>
  );
}
