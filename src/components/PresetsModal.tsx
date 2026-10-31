import React from 'react';
import { PresetBuild } from '../types';
import { Sparkles, X, RotateCcw } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">
                Curated Presets & Aerodynamic Case Studies
              </h3>
              <p className="text-xs text-slate-400">
                Load granular configurations to test Short-Looping, GPU Starvation, or Optimal Positive Pressure.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-1">
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
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isConflict
                    ? 'bg-slate-950/70 border-red-900/40 hover:border-red-500/60 hover:bg-red-950/20'
                    : 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/60 hover:bg-cyan-950/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    {preset.name}
                  </h4>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isConflict
                        ? 'bg-red-950 text-red-400 border-red-800'
                        : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {preset.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              onResetBlankSlate();
              onClose();
            }}
            className="px-4 py-2 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            Reset to Fresh Blank Slate
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
