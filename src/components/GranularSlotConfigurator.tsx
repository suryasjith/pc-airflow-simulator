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
  physics,
  onToggleSlotOccupied,
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
      <div className="bg-[#0b0d13] border border-zinc-800 p-8 hard-shadow text-center">
        <div className="w-12 h-12 bg-black border border-zinc-700 mx-auto flex items-center justify-center text-zinc-500 mb-3">
          <Sliders className="w-6 h-6 text-[#00f0ff]" />
        </div>
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white mb-1">
          [ HARDWARE CHASSIS UNINITIALIZED ]
        </h3>
        <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto">
          Select a chassis in the Hardware Matrix to configure physical granular slots across Front, Side, Top, Rear, and Bottom arrays.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0b0d13] border border-zinc-800 p-5 hard-shadow">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff]">
              <Sliders className="w-4 h-4" />
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Granular Fan Slots & Side Mount Matrix
              </h2>
              <span className="text-[10px] font-mono bg-black text-[#00f0ff] border border-zinc-800 px-2 py-0.5">
                DISCRETE PWM CONTROL
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Independent Intake/Exhaust rockers, 0–100% PWM potentiometer sliders, and AIO static pressure impedance (–40% CFM).
          </p>
        </div>

        {defaultFan && (
          <div className="text-xs font-mono text-zinc-400 flex items-center gap-2 bg-black border border-zinc-800 px-3 py-1.5">
            <span className="text-zinc-500">GLOBAL FAN SPEC:</span>
            <span className="text-[#00f0ff] font-bold">{defaultFan.name.slice(0, 20)} ({defaultFan.maxCfm} CFM)</span>
          </div>
        )}
      </div>

      {/* Panels Layout: 5 Structural Racks */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {panelConfigs.map((panel) => {
          const breakdown = physics.panelBreakdown[panel.id];
          const panelSlots = breakdown.slots;
          const maxCapacity = selectedCase.mountCapacities[panel.id];
          const maxSupportedSlots = Math.max(maxCapacity.max120, maxCapacity.max140);

          return (
            <div
              key={panel.id}
              className={`border p-3 flex flex-col justify-between transition-all ${
                panelSlots.some((s) => s.isOccupied && s.pwmPercent > 0)
                  ? 'bg-[#0e1017] border-zinc-700 hard-shadow-sm'
                  : 'bg-[#08090d] border-zinc-900 opacity-90'
              }`}
            >
              <div>
                {/* Panel Rack Header */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2.5">
                  <div>
                    <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 ${
                        panelSlots.some((s) => s.isOccupied && s.pwmPercent > 0)
                          ? 'bg-[#00f0ff]'
                          : 'bg-zinc-700'
                      }`} />
                      {panel.name}
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                      CAPACITY: {maxSupportedSlots > 0 ? `${maxSupportedSlots}x SLOTS` : 'NONE'}
                    </p>
                  </div>

                  {/* Panel Net CFM Badge */}
                  <div className="text-right font-mono text-[11px]">
                    {breakdown.intakeCfm > 0 && (
                      <span className="text-[#00f0ff] font-bold block">
                        +{breakdown.intakeCfm} CFM
                      </span>
                    )}
                    {breakdown.exhaustCfm > 0 && (
                      <span className="text-red-400 font-bold block">
                        -{breakdown.exhaustCfm} CFM
                      </span>
                    )}
                    {breakdown.intakeCfm === 0 && breakdown.exhaustCfm === 0 && (
                      <span className="text-zinc-600">0.0 CFM</span>
                    )}
                  </div>
                </div>

                {/* Quick Panel Sync Controls */}
                {maxSupportedSlots > 0 && (
                  <div className="flex items-center justify-between gap-1 mb-2.5 text-[9px] font-mono">
                    <span className="text-zinc-500">SYNC:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSyncPanelDirection(panel.id, 'intake')}
                        className="px-1.5 py-0.5 bg-[#002b36] hover:bg-[#00f0ff] hover:text-black border border-[#00f0ff]/50 text-[#00f0ff] btn-tactile font-semibold uppercase"
                      >
                        ALL IN
                      </button>
                      <button
                        type="button"
                        onClick={() => onSyncPanelDirection(panel.id, 'exhaust')}
                        className="px-1.5 py-0.5 bg-[#3b0808] hover:bg-red-500 hover:text-black border border-red-500/50 text-red-300 btn-tactile font-semibold uppercase"
                      >
                        ALL OUT
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplyDefaultFanToPanel(panel.id)}
                        className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 btn-tactile font-semibold uppercase"
                        title="Apply default fan model to this panel"
                      >
                        RESET FAN
                      </button>
                    </div>
                  </div>
                )}

                {/* Individual Discrete Slots List */}
                <div className="space-y-2">
                  {panelSlots.length > 0 ? (
                    panelSlots.map((slot) => {
                      const isIntake = slot.direction === 'intake';

                      return (
                        <div
                          key={slot.id}
                          className={`p-2.5 border transition-all ${
                            slot.isOccupied
                              ? isIntake
                                ? 'bg-[#07131b] border-[#00f0ff]/40 shadow-[1px_1px_0px_#000]'
                                : 'bg-[#1a0a0a] border-red-500/40 shadow-[1px_1px_0px_#000]'
                              : 'bg-black border-zinc-800/80 opacity-60'
                          }`}
                        >
                          {/* Slot Header: ID + Power Toggle */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase">
                                SLOT [{slot.slotNumber.toString().padStart(2, '0')}]
                              </span>
                              {slot.isOccupied && (
                                <span className={`text-[9px] font-mono px-1 py-0.2 border uppercase ${
                                  isIntake
                                    ? 'bg-[#002b36] text-[#00f0ff] border-[#00f0ff]/50'
                                    : 'bg-[#3b0808] text-red-300 border-red-500/50'
                                }`}>
                                  {isIntake ? 'INTAKE' : 'EXHAUST'}
                                </span>
                              )}
                            </div>

                            {/* Power Toggle Button */}
                            <button
                              type="button"
                              onClick={() => onToggleSlotOccupied(slot.id)}
                              className={`p-1 border transition-colors btn-tactile ${
                                slot.isOccupied
                                  ? 'bg-[#00f0ff] text-black border-[#00f0ff]'
                                  : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                              }`}
                              title={slot.isOccupied ? 'Unmount Fan' : 'Mount Fan'}
                            >
                              <Power className="w-3 h-3" />
                            </button>
                          </div>

                          {slot.isOccupied && (
                            <div className="space-y-2">
                              {/* Direction Rocker Toggle */}
                              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!isIntake) onToggleSlotDirection(slot.id);
                                  }}
                                  className={`py-1 border text-center font-bold uppercase transition-all btn-tactile ${
                                    isIntake
                                      ? 'bg-[#00f0ff] text-black border-[#00f0ff]'
                                      : 'bg-[#090b10] border-zinc-800 text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  INTAKE ➔
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isIntake) onToggleSlotDirection(slot.id);
                                  }}
                                  className={`py-1 border text-center font-bold uppercase transition-all btn-tactile ${
                                    !isIntake
                                      ? 'bg-red-500 text-black border-red-500'
                                      : 'bg-[#090b10] border-zinc-800 text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  ➔ EXHAUST
                                </button>
                              </div>

                              {/* PWM Potentiometer Fader Slider */}
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                                  <span className="text-zinc-400">PWM DUTY:</span>
                                  <span className="font-bold text-white">
                                    {slot.pwmPercent}% <span className="text-zinc-400 font-normal">({slot.liveCfm} CFM)</span>
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={slot.pwmPercent}
                                  onChange={(e) => onSetSlotPwm(slot.id, parseInt(e.target.value))}
                                  className="fader-slider"
                                />
                                <div className="flex justify-between text-[8px] font-mono text-zinc-600 mt-1 select-none">
                                  <span>0%</span>
                                  <span>25%</span>
                                  <span>50%</span>
                                  <span>75%</span>
                                  <span>100%</span>
                                </div>
                              </div>

                              {/* AIO Radiator Mount Toggle */}
                              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                                <label className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={slot.hasRadiator}
                                    onChange={() => onToggleSlotRadiator(slot.id)}
                                    className="accent-[#00f0ff] rounded-none"
                                  />
                                  <span>AIO RADIATOR</span>
                                </label>
                                {slot.hasRadiator && (
                                  <span className="text-[9px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/50 px-1">
                                    -40% CFM RESTRICTION
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-[10px] font-mono text-zinc-600 border border-dashed border-zinc-800">
                      [ NO MOUNTING CAPACITY ]
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
