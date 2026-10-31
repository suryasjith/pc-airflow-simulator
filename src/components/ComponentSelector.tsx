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
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
              <Box className="w-4 h-4" />
            </span>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Hardware Component Matrix
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-[10px] font-mono text-cyan-300">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Loading Real Market Dataset...
                  </span>
                ) : (
                  `${(cases.length + cpuCoolers.length + gpus.length + fans.length).toLocaleString()} Verified Market Parts`
                )}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-world dataset from <code className="text-cyan-400 font-mono">docyx/pc-part-dataset</code>. Search and select what you own or test hypothetical builds.
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
            className="text-xs font-mono text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-md hover:bg-red-950/30 border border-transparent hover:border-red-900/50"
          >
            <X className="w-3.5 h-3.5" />
            Clear Components
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. PC CASE SEARCHABLE PICKER */}
        <div className={`p-4 rounded-xl border transition-all ${
          selectedCase
            ? 'bg-slate-950/80 border-cyan-500/30 shadow-sm'
            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
        }`}>
          <SearchablePartPicker<PCCase>
            label="1. PC CASE"
            placeholder={`Select PC Case (${cases.length.toLocaleString()} items)...`}
            icon={<Box className="w-3.5 h-3.5 text-cyan-400" />}
            items={cases}
            selectedItem={selectedCase}
            onSelect={onSelectCase}
            categoryFilter={[
              { name: 'Mesh Front', filterFn: (c) => c.frontPanelType === 'mesh' },
              { name: 'Glass Panel', filterFn: (c) => c.frontPanelType === 'solid-glass' },
              { name: 'ATX Standard', filterFn: (c) => c.formFactor === 'ATX' || c.formFactor === 'E-ATX' },
              { name: 'Compact/ITX', filterFn: (c) => c.formFactor === 'Micro-ATX' || c.formFactor === 'Mini-ITX' },
            ]}
            renderItemBadge={(c) => (
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-mono">
                {c.formFactor}
              </span>
            )}
            renderDetails={(c) => (
              <div className="text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span className="font-mono text-slate-200">{c.volumeLiters} Liters</span>
                </div>
                <div className="flex justify-between">
                  <span>Front Intake:</span>
                  <span className="font-mono text-cyan-300 capitalize">{c.frontPanelType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Front Capacity:</span>
                  <span className="font-mono text-slate-300">{c.mountCapacities.front.max120}x 120mm</span>
                </div>
              </div>
            )}
          />
        </div>

        {/* 2. CPU COOLER SEARCHABLE PICKER */}
        <div className={`p-4 rounded-xl border transition-all ${
          cpuCooler
            ? 'bg-slate-950/80 border-cyan-500/30 shadow-sm'
            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
        }`}>
          <SearchablePartPicker<CPUCooler>
            label="2. CPU COOLER"
            placeholder={`Select Cooler (${cpuCoolers.length.toLocaleString()} items)...`}
            icon={<Cpu className="w-3.5 h-3.5 text-cyan-400" />}
            items={cpuCoolers}
            selectedItem={cpuCooler}
            onSelect={onSelectCpuCooler}
            categoryFilter={[
              { name: 'Liquid AIO', filterFn: (c) => c.type === 'aio' },
              { name: 'Air Tower', filterFn: (c) => c.type === 'air' },
              { name: '360mm Rad', filterFn: (c) => c.radiatorSizeMm === 360 },
              { name: '240mm Rad', filterFn: (c) => c.radiatorSizeMm === 240 },
            ]}
            renderItemBadge={(c) => (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${
                c.type === 'aio'
                  ? 'bg-purple-950 border-purple-800 text-purple-300'
                  : 'bg-blue-950 border-blue-800 text-blue-300'
              }`}>
                {c.type === 'aio' ? `${c.radiatorSizeMm}mm AIO` : 'Air Tower'}
              </span>
            )}
            renderDetails={(c) => (
              <div className="text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex justify-between">
                  <span>TDP Rating:</span>
                  <span className="font-mono text-slate-200">{c.tdpRating}W</span>
                </div>
                <div className="flex justify-between">
                  <span>Cooler Type:</span>
                  <span className="font-mono text-cyan-300 uppercase">{c.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fan Spec:</span>
                  <span className="font-mono text-slate-300">{c.fanCount}x {c.fanSizeMm}mm</span>
                </div>
              </div>
            )}
          />
        </div>

        {/* 3. GPU SEARCHABLE PICKER */}
        <div className={`p-4 rounded-xl border transition-all ${
          gpu
            ? 'bg-slate-950/80 border-cyan-500/30 shadow-sm'
            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
        }`}>
          <SearchablePartPicker<GPU>
            label="3. GRAPHICS CARD (GPU)"
            placeholder={`Select GPU (${gpus.length.toLocaleString()} items)...`}
            icon={<Flame className="w-3.5 h-3.5 text-cyan-400" />}
            items={gpus}
            selectedItem={gpu}
            onSelect={onSelectGpu}
            categoryFilter={[
              { name: 'RTX 40/50', filterFn: (g) => g.name.includes('40') || g.name.includes('50') },
              { name: 'Radeon RX', filterFn: (g) => g.name.includes('RX') || g.name.includes('Radeon') },
              { name: 'Triple Fan', filterFn: (g) => g.coolingType === 'open-air-triple' },
              { name: 'Blower Slot', filterFn: (g) => g.coolingType === 'blower' },
            ]}
            renderItemBadge={(g) => (
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded font-mono">
                {g.tdpWatts}W
              </span>
            )}
            renderDetails={(g) => (
              <div className="text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex justify-between">
                  <span>Thermal Output:</span>
                  <span className="font-mono text-amber-300">{g.tdpWatts}W TDP</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Length:</span>
                  <span className="font-mono text-slate-200">{g.lengthMm}mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Internal Exhaust:</span>
                  <span className="font-mono text-slate-300">{Math.round((1 - g.exhaustRatio) * 100)}% into case</span>
                </div>
              </div>
            )}
          />
        </div>

        {/* 4. DEFAULT CASE FAN SEARCHABLE PICKER */}
        <div className={`p-4 rounded-xl border transition-all ${
          defaultFan
            ? 'bg-slate-950/80 border-cyan-500/30 shadow-sm'
            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
        }`}>
          <SearchablePartPicker<CaseFan>
            label="4. PREFERRED CASE FAN"
            placeholder={`Select Fan (${fans.length.toLocaleString()} items)...`}
            icon={<Fan className="w-3.5 h-3.5 text-cyan-400" />}
            items={fans}
            selectedItem={defaultFan}
            onSelect={onSelectDefaultFan}
            categoryFilter={[
              { name: '120mm Fans', filterFn: (f) => f.sizeMm === 120 },
              { name: '140mm Fans', filterFn: (f) => f.sizeMm === 140 },
              { name: 'High CFM (>=75)', filterFn: (f) => f.maxCfm >= 75 },
            ]}
            renderItemBadge={(f) => (
              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.2 rounded font-mono">
                {f.sizeMm}mm
              </span>
            )}
            renderDetails={(f) => (
              <div className="text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex justify-between">
                  <span>Airflow:</span>
                  <span className="font-mono text-cyan-300">{f.maxCfm} CFM</span>
                </div>
                <div className="flex justify-between">
                  <span>Static Pressure:</span>
                  <span className="font-mono text-slate-200">{f.staticPressure} mm H2O</span>
                </div>
                <div className="flex justify-between">
                  <span>Acoustics:</span>
                  <span className="font-mono text-slate-300">{f.noiseDba} dBA @ {f.maxRpm} RPM</span>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};
