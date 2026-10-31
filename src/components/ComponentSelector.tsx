import React from 'react';
import {
  PCCase,
  CPUCooler,
  GPU,
  CaseFan,
} from '../types';
import { SearchablePartPicker } from './SearchablePartPicker';
import { Box, Cpu, Flame, Fan, X, Database, Loader2 } from 'lucide-react';

interface ComponentSelectorProps {
  cases: PCCase[];
  cpuCoolers: CPUCooler[];
  gpus: GPU[];
  fans: CaseFan[];
  selectedCase: PCCase | null;
  cpuCooler: CPUCooler | null;
  gpu: GPU | null;
  defaultFan: CaseFan | null;
  onSelectCase: (c: PCCase | null) => void;
  onSelectCpuCooler: (c: CPUCooler | null) => void;
  onSelectGpu: (g: GPU | null) => void;
  onSelectDefaultFan: (f: CaseFan | null) => void;
  isLoading?: boolean;
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  cases,
  cpuCoolers,
  gpus,
  fans,
  selectedCase,
  cpuCooler,
  gpu,
  defaultFan,
  onSelectCase,
  onSelectCpuCooler,
  onSelectGpu,
  onSelectDefaultFan,
  isLoading = false,
}) => {
  return (
    <div className="bg-[#0b0d13] border border-zinc-800 p-5 hard-shadow">
      {/* Rack Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff]">
              <Box className="w-4 h-4" />
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Hardware Component Matrix
              </h2>
              <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">// SPEC_RACK_01</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black border border-zinc-800 text-[10px] font-mono text-zinc-300">
              <Database className="w-3 h-3 text-[#00f0ff]" />
              <span>
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> LOADING MARKET DATASET...
                  </span>
                ) : (
                  `${(cases.length + cpuCoolers.length + gpus.length + fans.length).toLocaleString()} VERIFIED MARKET PARTS`
                )}
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Direct feed from <code className="text-[#00f0ff]">docyx/pc-part-dataset</code>. Select hardware to populate chassis physics bounds.
          </p>
        </div>

        {/* Clear Hardware Button */}
        {(selectedCase || cpuCooler || gpu || defaultFan) && (
          <button
            onClick={() => {
              onSelectCase(null);
              onSelectCpuCooler(null);
              onSelectGpu(null);
              onSelectDefaultFan(null);
            }}
            className="text-xs font-mono text-zinc-400 hover:text-red-400 flex items-center gap-1.5 transition-colors px-2.5 py-1 bg-[#11131a] hover:bg-red-950/40 border border-zinc-800 hover:border-red-800/80 btn-tactile"
          >
            <X className="w-3.5 h-3.5" />
            <span>CLEAR COMPONENTS</span>
          </button>
        )}
      </div>

      {/* Hardware 4-Bay Rack */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. PC CASE SEARCHABLE PICKER */}
        <div className={`p-3.5 border transition-all ${
          selectedCase
            ? 'bg-[#0f121a] border-[#00f0ff]/50'
            : 'bg-[#090a0f] border-zinc-800/80 hover:border-zinc-700'
        }`}>
          <SearchablePartPicker<PCCase>
            label="[01] CHASSIS ENCLOSURE"
            placeholder={`Select PC Case (${cases.length.toLocaleString()} items)...`}
            icon={<Box className="w-3.5 h-3.5 text-[#00f0ff]" />}
            items={cases}
            selectedItem={selectedCase}
            onSelect={onSelectCase}
            renderItemBadge={(c) => (
              <span className="text-[10px] font-mono px-1.5 py-0.5 border border-[#00f0ff]/40 bg-[#00f0ff]/10 text-[#00f0ff] uppercase font-semibold">
                {c.formFactor}
              </span>
            )}
            renderDetails={(c) => (
              <div className="p-2.5 bg-black border border-zinc-800 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>VOLUME:</span>
                  <span className="text-zinc-200 font-bold">{c.volumeLiters} L</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>PANEL TYPE:</span>
                  <span className="text-zinc-200 uppercase">{c.frontPanelType}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>SIDE MOUNT:</span>
                  <span className={c.mountCapacities.side.max120 > 0 ? 'text-[#00f0ff] font-bold' : 'text-zinc-600'}>
                    {c.mountCapacities.side.max120 > 0 ? `${c.mountCapacities.side.max120}x 120mm` : 'None'}
                  </span>
                </div>
              </div>
            )}
            categoryFilter={[
              { name: 'Mesh Front', filterFn: (c) => c.frontPanelType === 'mesh' },
              { name: 'Dual Chamber / Side Mount', filterFn: (c) => c.mountCapacities.side.max120 > 0 },
              { name: 'Solid Glass Front', filterFn: (c) => c.frontPanelType === 'solid-glass' },
              { name: 'Compact ITX', filterFn: (c) => c.formFactor === 'Mini-ITX' },
            ]}
          />
        </div>

        {/* 2. CPU COOLER SEARCHABLE PICKER */}
        <div className={`p-3.5 border transition-all ${
          cpuCooler
            ? 'bg-[#0f121a] border-[#00f0ff]/50'
            : 'bg-[#090a0f] border-zinc-800/80 hover:border-zinc-700'
        }`}>
          <SearchablePartPicker<CPUCooler>
            label="[02] CPU THERMAL COOLER"
            placeholder={`Select CPU Cooler (${cpuCoolers.length.toLocaleString()} items)...`}
            icon={<Cpu className="w-3.5 h-3.5 text-[#00f0ff]" />}
            items={cpuCoolers}
            selectedItem={cpuCooler}
            onSelect={onSelectCpuCooler}
            renderItemBadge={(c) => (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 border uppercase font-semibold ${
                c.type === 'aio'
                  ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-300'
              }`}>
                {c.type === 'aio' ? `${c.radiatorSizeMm || 240}mm AIO` : 'Air Tower'}
              </span>
            )}
            renderDetails={(c) => (
              <div className="p-2.5 bg-black border border-zinc-800 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>COOLING TYPE:</span>
                  <span className="text-zinc-200 uppercase">{c.type === 'aio' ? `Liquid (${c.radiatorSizeMm || 240}mm)` : 'Air Heatsink'}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>RATED AIRFLOW:</span>
                  <span className="text-zinc-200 font-bold">{c.fanCfm} CFM</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>TDP RATING:</span>
                  <span className="text-[#00f0ff] font-bold">~{c.tdpRating}W</span>
                </div>
              </div>
            )}
            categoryFilter={[
              { name: '360mm AIO', filterFn: (c) => c.radiatorSizeMm === 360 },
              { name: '240/280mm AIO', filterFn: (c) => c.radiatorSizeMm === 240 || c.radiatorSizeMm === 280 },
              { name: 'Air Coolers', filterFn: (c) => c.type === 'air' },
            ]}
          />
        </div>

        {/* 3. GPU SEARCHABLE PICKER */}
        <div className={`p-3.5 border transition-all ${
          gpu
            ? 'bg-[#0f121a] border-amber-500/50'
            : 'bg-[#090a0f] border-zinc-800/80 hover:border-zinc-700'
        }`}>
          <SearchablePartPicker<GPU>
            label="[03] GRAPHICS ACCELERATOR"
            placeholder={`Select GPU (${gpus.length.toLocaleString()} items)...`}
            icon={<Flame className="w-3.5 h-3.5 text-amber-400" />}
            items={gpus}
            selectedItem={gpu}
            onSelect={onSelectGpu}
            renderItemBadge={(g) => (
              <span className="text-[10px] font-mono px-1.5 py-0.5 border border-amber-500/40 bg-amber-950/40 text-amber-300 uppercase font-semibold">
                {g.tdpWatts}W TDP
              </span>
            )}
            renderDetails={(g) => (
              <div className="p-2.5 bg-black border border-zinc-800 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>BRAND / LINE:</span>
                  <span className="text-zinc-200 truncate max-w-[120px]">{g.brand}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>COOLING DESIGN:</span>
                  <span className="text-zinc-200 uppercase">{g.coolingType}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>CARD LENGTH:</span>
                  <span className="text-amber-400 font-bold">{g.lengthMm} mm</span>
                </div>
              </div>
            )}
            categoryFilter={[
              { name: 'RTX 40/50 Series', filterFn: (g) => /rtx\s*(40|50)/i.test(g.name) },
              { name: 'AMD Radeon RX', filterFn: (g) => /rx\s*(7|6)/i.test(g.name) },
              { name: 'High TDP (>280W)', filterFn: (g) => g.tdpWatts >= 280 },
            ]}
          />
        </div>

        {/* 4. DEFAULT CASE FAN SEARCHABLE PICKER */}
        <div className={`p-3.5 border transition-all ${
          defaultFan
            ? 'bg-[#0f121a] border-[#00f0ff]/50'
            : 'bg-[#090a0f] border-zinc-800/80 hover:border-zinc-700'
        }`}>
          <SearchablePartPicker<CaseFan>
            label="[04] STANDARDIZED CHASSIS FAN"
            placeholder={`Select Default Fan (${fans.length.toLocaleString()} items)...`}
            icon={<Fan className="w-3.5 h-3.5 text-[#00f0ff]" />}
            items={fans}
            selectedItem={defaultFan}
            onSelect={onSelectDefaultFan}
            renderItemBadge={(f) => (
              <span className="text-[10px] font-mono px-1.5 py-0.5 border border-[#00f0ff]/40 bg-[#00f0ff]/10 text-[#00f0ff] uppercase font-semibold">
                {f.sizeMm}mm // {f.maxCfm} CFM
              </span>
            )}
            renderDetails={(f) => (
              <div className="p-2.5 bg-black border border-zinc-800 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>MAX AIRFLOW:</span>
                  <span className="text-cyan-300 font-bold">{f.maxCfm} CFM</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>STATIC PRESSURE:</span>
                  <span className="text-zinc-200 font-bold">{f.staticPressure} mm H₂O</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>MAX VELOCITY:</span>
                  <span className="text-zinc-200 font-bold">{f.maxRpm} RPM</span>
                </div>
              </div>
            )}
            categoryFilter={[
              { name: '120mm Fans', filterFn: (f) => f.sizeMm === 120 },
              { name: '140mm Fans', filterFn: (f) => f.sizeMm === 140 },
              { name: 'High CFM (>70)', filterFn: (f) => f.maxCfm >= 70 },
            ]}
          />
        </div>
      </div>
    </div>
  );
};
