import React from 'react';
import { PresetBuild } from '../types';
import { X, RotateCcw, Compass } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreset: (preset: PresetBuild) => void;
  onResetBlankSlate: () => void;
}

export const PRESET_STUDIES: PresetBuild[] = [
  {
    id: 'short-looping-conflict',
    name: 'Top Panel Short-Looping Conflict (Conflict)',
    badge: 'Short-Looping Hazard',
    description: 'Adjacent slots on the Top panel (Top 1 Intake vs Top 2 Exhaust) oppose each other. Warm exhaust is immediately sucked into the adjacent intake in a closed loop.',
    caseId: 'corsair-4000d-airflow',
    cpuCoolerId: 'thermalright-peerless-assassin-120-se',
    gpuId: 'msi-geforce-rtx-3060-ventus-2x-12g',
    slots: {
      'front-1': { isOccupied: true, direction: 'intake', pwmPercent: 75, hasRadiator: false },
      'front-2': { isOccupied: true, direction: 'intake', pwmPercent: 75, hasRadiator: false },
      'front-3': { isOccupied: true, direction: 'intake', pwmPercent: 75, hasRadiator: false },
      'top-1': { isOccupied: true, direction: 'intake', pwmPercent: 80, hasRadiator: false },
      'top-2': { isOccupied: true, direction: 'exhaust', pwmPercent: 80, hasRadiator: false }, // Opposing adjacent slot!
      'rear-1': { isOccupied: true, direction: 'exhaust', pwmPercent: 70, hasRadiator: false },
    },
  },
  {
    id: 'side-aio-gpu-starvation',
    name: 'Side AIO Intake GPU Starvation (Conflict)',
    badge: 'GPU Thermal Hazard',
    description: '360mm AIO Liquid Radiator mounted on Side/Front intake dumps ~45°C–50°C pre-heated exhaust air directly across an open-air 450W GPU heatsink.',
    caseId: 'lian-li-o11-vision-compact',
    cpuCoolerId: 'arctic-liquid-freezer-iii-pro-360',
    gpuId: 'msi-rtx-4090-ventus-3x-24g-oc',
    slots: {
      'side-1': { isOccupied: true, direction: 'intake', pwmPercent: 80, hasRadiator: true },
      'side-2': { isOccupied: true, direction: 'intake', pwmPercent: 80, hasRadiator: true },
      'side-3': { isOccupied: true, direction: 'intake', pwmPercent: 80, hasRadiator: true },
      'top-1': { isOccupied: true, direction: 'exhaust', pwmPercent: 70, hasRadiator: false },
      'top-2': { isOccupied: true, direction: 'exhaust', pwmPercent: 70, hasRadiator: false },
      'top-3': { isOccupied: true, direction: 'exhaust', pwmPercent: 70, hasRadiator: false },
      'rear-1': { isOccupied: true, direction: 'exhaust', pwmPercent: 70, hasRadiator: false },
      'bottom-1': { isOccupied: false, pwmPercent: 0 },
    },
  },
  {
    id: 'extreme-negative-vacuum',
    name: 'Extreme Negative Pressure Vacuum Trap',
    badge: 'Critical Vacuum',
    description: 'Every slot set to 100% Exhaust with 0% Intake. Severe vacuum sucks unfiltered room dust through every PCIe slit and panel crack.',
    caseId: 'montech-air-903-max',
    cpuCoolerId: 'noctua-nh-d15-chromaxblack',
    gpuId: 'asus-rog-astral-oc',
    slots: {
      'front-1': { isOccupied: true, direction: 'exhaust', pwmPercent: 85, hasRadiator: false },
      'front-2': { isOccupied: true, direction: 'exhaust', pwmPercent: 85, hasRadiator: false },
      'front-3': { isOccupied: true, direction: 'exhaust', pwmPercent: 85, hasRadiator: false },
      'top-1': { isOccupied: true, direction: 'exhaust', pwmPercent: 90, hasRadiator: false },
      'top-2': { isOccupied: true, direction: 'exhaust', pwmPercent: 90, hasRadiator: false },
      'rear-1': { isOccupied: true, direction: 'exhaust', pwmPercent: 80, hasRadiator: false },
    },
  },
  {
    id: 'optimal-positive-equilibrium',
    name: 'Optimal Positive Pressure (Side & Bottom Intake)',
    badge: 'Recommended Gold Standard',
    description: 'Dual-chamber case with Side & Bottom filtered intake feeding clean cool air to GPU, with Top 360mm AIO Exhaust and Rear Exhaust. Positive pressure prevents dust.',
    caseId: 'lian-li-o11-vision-compact',
    cpuCoolerId: 'arctic-liquid-freezer-iii-pro-360',
    gpuId: 'msi-rtx-4090-ventus-3x-24g-oc',
    slots: {
      'side-1': { isOccupied: true, direction: 'intake', pwmPercent: 75, hasRadiator: false },
      'side-2': { isOccupied: true, direction: 'intake', pwmPercent: 75, hasRadiator: false },
      'side-3': { isOccupied: true, direction: 'intake', pwmPercent: 75, hasRadiator: false },
      'bottom-1': { isOccupied: true, direction: 'intake', pwmPercent: 80, hasRadiator: false },
      'bottom-2': { isOccupied: true, direction: 'intake', pwmPercent: 80, hasRadiator: false },
      'bottom-3': { isOccupied: true, direction: 'intake', pwmPercent: 80, hasRadiator: false },
      'top-1': { isOccupied: true, direction: 'exhaust', pwmPercent: 70, hasRadiator: true },
      'top-2': { isOccupied: true, direction: 'exhaust', pwmPercent: 70, hasRadiator: true },
      'top-3': { isOccupied: true, direction: 'exhaust', pwmPercent: 70, hasRadiator: true },
      'rear-1': { isOccupied: true, direction: 'exhaust', pwmPercent: 65, hasRadiator: false },
    },
  },
];

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onLoadPreset,
  onResetBlankSlate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-[#0b0d13] border border-zinc-700 max-w-2xl w-full p-6 hard-shadow relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-white text-sm uppercase tracking-wider">
                Benchmark Presets & Thermal Case Studies
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Load empirical scenarios to test Short-Looping, GPU Starvation, or Optimal Positive Pressure.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors btn-tactile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Cards List */}
        <div className="space-y-2.5 mb-5 max-h-[60vh] overflow-y-auto pr-1">
          {PRESET_STUDIES.map((preset) => {
            const isConflict =
              preset.badge.includes('Hazard') ||
              preset.badge.includes('Vacuum') ||
              preset.badge.includes('Conflict');

            return (
              <div
                key={preset.id}
                onClick={() => {
                  onLoadPreset(preset);
                  onClose();
                }}
                className={`p-3.5 border cursor-pointer transition-all hard-shadow-sm btn-tactile ${
                  isConflict
                    ? 'bg-[#180a0a] border-red-500/50 hover:border-red-400'
                    : 'bg-[#0a1219] border-[#00f0ff]/40 hover:border-[#00f0ff]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    {preset.name}
                  </h4>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 border uppercase ${
                      isConflict
                        ? 'bg-red-500 text-black border-red-500'
                        : 'bg-[#00f0ff] text-black border-[#00f0ff]'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {preset.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <button
            onClick={() => {
              onResetBlankSlate();
              onClose();
            }}
            className="px-3 py-1.5 text-xs font-mono text-zinc-300 hover:text-white bg-black hover:bg-zinc-900 border border-zinc-700 flex items-center gap-2 transition-colors btn-tactile"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>RESET TO FRESH BLANK SLATE</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-black font-bold border border-[#00f0ff] transition-colors btn-tactile"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
