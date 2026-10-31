import React from 'react';
import {
  GranularFanSlot,
  MountLocation,
  PCCase,
  CPUCooler,
  CaseFan,
  AirflowPhysicsResult,
} from '../types';
import {
  Sliders,
  Layers,
  Flame,
  Snowflake,
  Power,
} from 'lucide-react';

interface GranularSlotConfiguratorProps {
  selectedCase: PCCase | null;
  cpuCooler?: CPUCooler | null;
  defaultFan: CaseFan | null;
  fans: CaseFan[];
  slots?: Record<string, GranularFanSlot>;
  physics: AirflowPhysicsResult;
  onToggleSlotOccupied: (slotId: string) => void;
  onSetSlotFan: (slotId: string, fan: CaseFan) => void;
  onToggleSlotDirection: (slotId: string) => void;
  onSetSlotPwm: (slotId: string, pwm: number) => void;
  onToggleSlotRadiator: (slotId: string) => void;
  onSyncPanelDirection: (panel: MountLocation, direction: 'intake' | 'exhaust') => void;
  onApplyDefaultFanToPanel: (panel: MountLocation) => void;
}

export const GranularSlotConfigurator: React.FC<GranularSlotConfiguratorProps> = ({
  selectedCase,
  defaultFan,
  fans,
  physics,
  onToggleSlotOccupied,
  onSetSlotFan,
  onToggleSlotDirection,
  onSetSlotPwm,
  onToggleSlotRadiator,
  onSyncPanelDirection,
  onApplyDefaultFanToPanel,
}) => {
  const panelConfigs: {
    id: MountLocation;
    name: string;
    description: string;
    defaultDirection: 'intake' | 'exhaust';
  }[] = [
    {
      id: 'front',
      name: 'Front Mount',
      description: 'Chassis face intake receiving room ambient air',
      defaultDirection: 'intake',
    },
    {
      id: 'side',
      name: 'Side Mount',
      description: 'Vertical inner chamber intake/exhaust for dual-chamber showcase cases',
      defaultDirection: 'intake',
    },
    {
      id: 'top',
      name: 'Top Mount',
      description: 'Aids natural thermal convection and top AIO radiator exhaust',
      defaultDirection: 'exhaust',
    },
    {
      id: 'rear',
      name: 'Rear Mount',
      description: 'Primary exhaust corridor aligned with CPU tower heatsinks',
      defaultDirection: 'exhaust',
    },
    {
      id: 'bottom',
      name: 'Bottom Mount',
      description: 'Direct cool floor air intake firing into the GPU intake fans',
      defaultDirection: 'intake',
    },
  ];

  if (!selectedCase) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-400 mb-3">
          <Sliders className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-100 mb-1">
          Select a PC Chassis in Step 1
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Chassis selection determines available granular slots across Front, Side, Top, Rear, and Bottom panels.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Sliders className="w-4 h-4" />
            </span>
            <h2 className="text-base font-semibold text-slate-100">
              Granular Fan Slots & Side Mount Matrix
            </h2>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
              Discrete Slot Control
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure independent Intake/Exhaust, 0–100% PWM sliders, and AIO static pressure impedance (–40% CFM) per slot.
          </p>
        </div>

        {defaultFan && (
          <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-slate-500">Default Model:</span>
            <span className="text-cyan-300 font-semibold">{defaultFan.name.slice(0, 22)} ({defaultFan.maxCfm} CFM)</span>
          </div>
        )}
      </div>

      {/* Panels Layout: 5 Panels (Front, Side, Top, Rear, Bottom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {panelConfigs.map((panel) => {
          const breakdown = physics.panelBreakdown[panel.id];
          const panelSlots = breakdown.slots;
          const maxCapacity = selectedCase.mountCapacities[panel.id];
          const maxSupportedSlots = Math.max(maxCapacity.max120, maxCapacity.max140);

          return (
            <div
              key={panel.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                panelSlots.some((s) => s.isOccupied && s.pwmPercent > 0)
                  ? 'bg-slate-950/90 border-slate-700 shadow-lg'
                  : 'bg-slate-950/40 border-slate-800/80'
              }`}
            >
              <div>
                {/* Panel Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <div>
                    <h3 className="text-xs font-mono font-bold tracking-wide text-slate-100 uppercase flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        panelSlots.some((s) => s.isOccupied && s.pwmPercent > 0)
                          ? 'bg-cyan-400 animate-pulse'
                          : 'bg-slate-700'
                      }`} />
                      {panel.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Max: {maxSupportedSlots > 0 ? `${maxSupportedSlots}x Slots` : 'Not supported'}
                    </p>
                  </div>

                  {/* Panel Net CFM Badge */}
                  <div className="text-right font-mono text-[11px]">
                    {breakdown.intakeCfm > 0 && (
                      <span className="text-cyan-400 font-semibold block">
                        +{breakdown.intakeCfm} CFM
                      </span>
                    )}
                    {breakdown.exhaustCfm > 0 && (
                      <span className="text-red-400 font-semibold block">
                        -{breakdown.exhaustCfm} CFM
                      </span>
                    )}
                    {breakdown.intakeCfm === 0 && breakdown.exhaustCfm === 0 && (
                      <span className="text-slate-500">0.0 CFM</span>
                    )}
                  </div>
                </div>

                {/* Quick Panel Sync Controls */}
                {maxSupportedSlots > 0 && (
                  <div className="flex items-center justify-between gap-1 mb-3 text-[10px] font-mono">
                    <span className="text-slate-400">Sync:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSyncPanelDirection(panel.id, 'intake')}
                        className="px-1.5 py-0.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 rounded"
                      >
                        All In
                      </button>
                      <button
                        type="button"
                        onClick={() => onSyncPanelDirection(panel.id, 'exhaust')}
                        className="px-1.5 py-0.5 bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 rounded"
                      >
                        All Out
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplyDefaultFanToPanel(panel.id)}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded"
                        title="Fill all slots with default fan model"
                      >
                        Fill
                      </button>
                    </div>
                  </div>
                )}

                {/* Granular Individual Discrete Slots */}
                {maxSupportedSlots > 0 ? (
                  <div className="space-y-3">
                    {panelSlots.map((slot) => {
                      const isIntake = slot.direction === 'intake';
                      const isExhaust = slot.direction === 'exhaust';

                      return (
                        <div
                          key={slot.id}
                          className={`rounded-lg border p-2.5 transition-all ${
                            slot.isOccupied
                              ? isIntake
                                ? 'bg-cyan-950/20 border-cyan-500/40 shadow-xs'
                                : 'bg-red-950/20 border-red-500/40 shadow-xs'
                              : 'bg-slate-900/40 border-slate-800/80 opacity-70 hover:opacity-100'
                          }`}
                        >
                          {/* Slot Header: ID & Occupied Toggle */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1">
                              <span>Slot {slot.slotNumber}</span>
                              {slot.hasRadiator && (
                                <span className="text-[9px] bg-purple-950 border border-purple-500/50 text-purple-300 px-1 py-0.2 rounded">
                                  RAD
                                </span>
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={() => onToggleSlotOccupied(slot.id)}
                              className={`p-1 rounded text-xs transition-colors ${
                                slot.isOccupied
                                  ? 'text-cyan-400 bg-cyan-950/80 border border-cyan-800'
                                  : 'text-slate-400 bg-slate-800 hover:text-slate-200'
                              }`}
                              title={slot.isOccupied ? 'Uninstall fan from slot' : 'Install fan in slot'}
                            >
                              <Power className="w-3 h-3" />
                            </button>
                          </div>

                          {slot.isOccupied ? (
                            <div className="space-y-2">
                              {/* Fan Model Selector */}
                              <div>
                                <select
                                  value={slot.fanId || ''}
                                  onChange={(e) => {
                                    const found = fans.find((f) => f.id === e.target.value);
                                    if (found) onSetSlotFan(slot.id, found);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700/80 text-slate-200 text-[10px] rounded px-1.5 py-1 outline-none truncate font-mono"
                                >
                                  {slot.fanId && (
                                    <option value={slot.fanId}>
                                      {slot.fanName || 'Installed Fan'} ({slot.maxCfm} CFM)
                                    </option>
                                  )}
                                  {fans.slice(0, 40).map((f) => (
                                    <option key={f.id} value={f.id}>
                                      {f.name} ({f.maxCfm} CFM)
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Direction Toggle (Independent Intake vs Exhaust) */}
                              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-900 rounded border border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => onToggleSlotDirection(slot.id)}
                                  className={`py-1 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
                                    isIntake
                                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <Snowflake className="w-2.5 h-2.5" />
                                  <span>IN</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onToggleSlotDirection(slot.id)}
                                  className={`py-1 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
                                    isExhaust
                                      ? 'bg-red-500 text-white shadow-sm'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <Flame className="w-2.5 h-2.5" />
                                  <span>OUT</span>
                                </button>
                              </div>

                              {/* PWM Slider (0% to 100%) */}
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                                  <span>PWM Speed</span>
                                  <span className="font-bold text-cyan-300">{slot.pwmPercent}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={slot.pwmPercent}
                                  onChange={(e) => onSetSlotPwm(slot.id, Number(e.target.value))}
                                  className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded"
                                />
                              </div>

                              {/* AIO Radiator Toggle (with 40% Static Pressure Penalty) */}
                              <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-slate-800/80">
                                <span className="text-[10px] text-slate-300 flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-purple-400" />
                                  Radiator
                                </span>
                                <input
                                  type="checkbox"
                                  checked={slot.hasRadiator}
                                  onChange={() => onToggleSlotRadiator(slot.id)}
                                  className="accent-purple-500 w-3.5 h-3.5 rounded cursor-pointer"
                                />
                              </label>

                              {slot.hasRadiator && (
                                <p className="text-[9px] text-purple-400 font-mono leading-tight">
                                  -40% static pressure penalty applied
                                </p>
                              )}

                              {/* Live CFM Output */}
                              <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                                <span className="text-slate-400">Live Output:</span>
                                <span className={`font-bold ${
                                  slot.pwmPercent > 0
                                    ? isIntake ? 'text-cyan-400' : 'text-red-400'
                                    : 'text-slate-500'
                                }`}>
                                  {slot.liveCfm} CFM
                                </span>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onToggleSlotOccupied(slot.id)}
                              className="w-full py-3 border border-dashed border-slate-800 hover:border-slate-600 rounded text-[11px] text-slate-500 hover:text-slate-300 font-mono transition-colors"
                            >
                              + Install Fan in Slot {slot.slotNumber}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500 text-xs font-mono">
                    No physical mounting slots supported on this chassis.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
