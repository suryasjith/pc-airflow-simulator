import React, { useEffect, useMemo } from 'react';
import { useAirflowStore } from './store/useAirflowStore';
import { ComponentSelector } from './components/ComponentSelector';
import { GranularSlotConfigurator } from './components/GranularSlotConfigurator';
import { ChassisVisualizer } from './components/ChassisVisualizer';
import { PressureGauge } from './components/PressureGauge';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { PresetsModal } from './components/PresetsModal';
import {
  Wind,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Info,
  LayoutGrid,
} from 'lucide-react';

export const App: React.FC = () => {
  const store = useAirflowStore();

  const {
    cases,
    cpuCoolers,
    gpus,
    fans,
    isLoadingData,
    selectedCase,
    selectedCooler,
    selectedGpu,
    defaultFan,
    slots,
    activeStep,
    isProView,
    isPresetsOpen,
    fetchData,
    selectCase,
    selectCooler,
    selectGpu,
    selectDefaultFan,
    setActiveStep,
    setIsProView,
    setIsPresetsOpen,
    toggleSlotOccupied,
    setSlotFan,
    toggleSlotDirection,
    setSlotPwm,
    toggleSlotRadiator,
    syncPanelDirection,
    applyDefaultFanToPanel,
    executeQuickFix,
    loadPreset,
    resetToBlankSlate,
  } = store;

  // Fetch real market dataset from GitHub on app mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reactive live physics & diagnostics calculated instantly upon state changes
  const physics = useMemo(() => {
    return store.getPhysics();
  }, [selectedCase, selectedCooler, selectedGpu, slots]);

  const diagnostics = useMemo(() => {
    return store.getDiagnostics();
  }, [selectedCase, selectedCooler, selectedGpu, slots, physics]);

  const steps = [
    { num: 1, title: 'Case & Hardware Spec', code: 'HW_SPEC' },
    { num: 2, title: 'Granular Slots & PWM', code: 'PWM_RACK' },
    { num: 3, title: 'Wind-Tunnel Vectors', code: 'CFD_FLOW' },
    { num: 4, title: 'Telemetry & Safety', code: 'AUDIT_HUD' },
  ];

  const activeSlotCount = Object.values(slots).filter((s) => s.isOccupied && s.pwmPercent > 0).length;

  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100 flex flex-col selection:bg-[#00f0ff] selection:text-black">
      {/* Top Industrial Avionics Header */}
      <header className="sticky top-0 z-40 bg-[#08090d]/95 backdrop-blur-xs border-b border-zinc-800 px-4 md:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand & System Status */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00f0ff] flex items-center justify-center text-black font-mono font-black text-sm hard-shadow-sm">
              <Wind className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tracking-tight text-base text-white">
                  AERO<span className="text-[#00f0ff]">FLOW</span>
                </span>
                <span className="text-[9px] font-mono uppercase bg-black text-[#00f0ff] border border-zinc-700 px-1.5 py-0.2 font-bold tracking-wider">
                  CFD-3000 // PROD
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono hidden sm:block">
                Precision PC Chassis Aerodynamics & Dynamic Pressure Optimizer
              </p>
            </div>
          </div>

          {/* Quick Telemetry Strip in Center Header */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-black border border-zinc-800 text-[10px] font-mono">
            <span className="text-zinc-500">CABIN STATUS:</span>
            <span className={physics.netCfm > 0 ? 'text-[#00f0ff] font-bold' : physics.netCfm < 0 ? 'text-red-400 font-bold' : 'text-zinc-400'}>
              [ {physics.netCfm > 0 ? `+${physics.netCfm}` : physics.netCfm} CFM ]
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500">ACTIVE PORTS:</span>
            <span className="text-white font-bold">{activeSlotCount}</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500">TURNOVER:</span>
            <span className="text-zinc-300 font-bold">{physics.airExchangesPerMinute}X / MIN</span>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <button
              onClick={() => setIsProView(!isProView)}
              className={`text-xs font-mono px-3 py-1.5 border flex items-center gap-1.5 btn-tactile ${
                isProView
                  ? 'bg-[#00f0ff] text-black font-bold border-[#00f0ff]'
                  : 'bg-[#10121a] border-zinc-700 text-zinc-300 hover:border-zinc-500'
              }`}
              title="Toggle between Paced Guided Lab and Unified Workbench Matrix"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{isProView ? 'WORKBENCH MATRIX' : 'PACED LAB TOUR'}</span>
            </button>

            {/* Presets Modal Button */}
            <button
              onClick={() => setIsPresetsOpen(true)}
              className="text-xs font-mono px-3 py-1.5 border border-purple-500/50 bg-[#160c24] hover:bg-purple-900/30 text-purple-300 flex items-center gap-1.5 btn-tactile"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CASE STUDIES</span>
            </button>

            {/* Blank Slate Reset */}
            <button
              onClick={resetToBlankSlate}
              className="text-xs font-mono px-2.5 py-1.5 border border-zinc-700 hover:border-red-500 bg-[#10121a] hover:bg-red-950/40 text-zinc-400 hover:text-red-300 flex items-center gap-1.5 btn-tactile"
              title="Reset everything to completely blank state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">RESET SLATE</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-5">
        {/* Paced Guided Lab Stepper (Enabled when not in Pro View) */}
        {!isProView && (
          <div className="bg-[#0b0d13] border border-zinc-800 p-3.5 hard-shadow">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-800">
              <span className="text-[11px] font-mono font-bold text-zinc-300 flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 bg-[#00f0ff]" />
                PACED BUILD LAB // STATION [0{activeStep} / 04]
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                STAGED CALIBRATION TO PREVENT COGNITIVE OVERLOAD
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {steps.map((s) => {
                const isActive = activeStep === s.num;
                const isCompleted = activeStep > s.num;

                return (
                  <button
                    key={s.num}
                    onClick={() => setActiveStep(s.num)}
                    className={`p-2.5 border text-left flex items-center gap-2.5 transition-all btn-tactile ${
                      isActive
                        ? 'bg-[#00f0ff]/10 border-[#00f0ff] text-white hard-shadow-cyan'
                        : isCompleted
                        ? 'bg-[#0f1418] border-zinc-700 text-zinc-300'
                        : 'bg-black border-zinc-800/80 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 flex items-center justify-center font-mono text-[11px] font-bold border ${
                        isActive
                          ? 'bg-[#00f0ff] text-black border-[#00f0ff]'
                          : isCompleted
                          ? 'bg-[#00ff9d]/20 text-[#00ff9d] border-[#00ff9d]/50'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {isCompleted ? '✓' : `0${s.num}`}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-bold truncate uppercase">{s.title}</p>
                      <p className="text-[10px] font-mono text-zinc-500">
                        {s.num === 1 && (selectedCase ? selectedCase.name.slice(0, 15) : '[ EMPTY ]')}
                        {s.num === 2 && `${activeSlotCount} SLOTS ARMED`}
                        {s.num === 3 && 'STREAMLINES'}
                        {s.num === 4 && `${physics.netCfm > 0 ? `+${physics.netCfm}` : physics.netCfm} CFM`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* GUIDED STEPPER CONTENT OR WORKBENCH MATRIX */}
        {isProView ? (
          /* WORKBENCH MATRIX: Unified industrial engineering view */
          <div className="space-y-5">
            {/* Row 1: Hardware Component Rack */}
            <ComponentSelector
              cases={cases}
              cpuCoolers={cpuCoolers}
              gpus={gpus}
              fans={fans}
              isLoading={isLoadingData}
              selectedCase={selectedCase}
              cpuCooler={selectedCooler}
              gpu={selectedGpu}
              defaultFan={defaultFan}
              onSelectCase={selectCase}
              onSelectCpuCooler={selectCooler}
              onSelectGpu={selectGpu}
              onSelectDefaultFan={selectDefaultFan}
            />

            {/* Row 2: Wind Tunnel & Telemetry HUD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-7">
                <ChassisVisualizer
                  selectedCase={selectedCase}
                  cpuCooler={selectedCooler}
                  gpu={selectedGpu}
                  slots={slots}
                  physics={physics}
                  onToggleSlotDirection={toggleSlotDirection}
                />
              </div>

              <div className="lg:col-span-5 space-y-5">
                <PressureGauge physics={physics} />
                <DiagnosticsPanel
                  diagnostics={diagnostics}
                  onExecuteQuickFix={executeQuickFix}
                />
              </div>
            </div>

            {/* Row 3: Granular Fan Slots & PWM Console */}
            <GranularSlotConfigurator
              selectedCase={selectedCase}
              cpuCooler={selectedCooler}
              defaultFan={defaultFan}
              fans={fans}
              slots={slots}
              physics={physics}
              onToggleSlotOccupied={toggleSlotOccupied}
              onSetSlotFan={setSlotFan}
              onToggleSlotDirection={toggleSlotDirection}
              onSetSlotPwm={setSlotPwm}
              onToggleSlotRadiator={toggleSlotRadiator}
              onSyncPanelDirection={syncPanelDirection}
              onApplyDefaultFanToPanel={applyDefaultFanToPanel}
            />
          </div>
        ) : (
          /* PACED LAB TOUR (Step-by-step for beginners) */
          <div className="space-y-5">
            {activeStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <ComponentSelector
                  cases={cases}
                  cpuCoolers={cpuCoolers}
                  gpus={gpus}
                  fans={fans}
                  isLoading={isLoadingData}
                  selectedCase={selectedCase}
                  cpuCooler={selectedCooler}
                  gpu={selectedGpu}
                  defaultFan={defaultFan}
                  onSelectCase={selectCase}
                  onSelectCpuCooler={selectCooler}
                  onSelectGpu={selectGpu}
                  onSelectDefaultFan={selectDefaultFan}
                />

                <div className="flex items-center justify-between bg-[#0b0d13] p-3.5 border border-zinc-800 hard-shadow-sm font-mono text-xs">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Info className="w-4 h-4 text-[#00f0ff]" />
                    <span>
                      {selectedCase
                        ? `MOUNTED: ${selectedCase.name}. READY FOR FAN SLOT CONFIGURATION.`
                        : 'SELECT A PC CHASSIS IN BAY 01 TO INITIALIZE MOUNTING CAPACITIES.'}
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-black font-bold uppercase flex items-center gap-1.5 transition-colors btn-tactile border border-[#00f0ff]"
                  >
                    <span>GO TO SLOTS & PWM</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <GranularSlotConfigurator
                  selectedCase={selectedCase}
                  cpuCooler={selectedCooler}
                  defaultFan={defaultFan}
                  fans={fans}
                  slots={slots}
                  physics={physics}
                  onToggleSlotOccupied={toggleSlotOccupied}
                  onSetSlotFan={setSlotFan}
                  onToggleSlotDirection={toggleSlotDirection}
                  onSetSlotPwm={setSlotPwm}
                  onToggleSlotRadiator={toggleSlotRadiator}
                  onSyncPanelDirection={syncPanelDirection}
                  onApplyDefaultFanToPanel={applyDefaultFanToPanel}
                />

                <div className="flex items-center justify-between bg-[#0b0d13] p-3.5 border border-zinc-800 hard-shadow-sm font-mono text-xs">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="px-4 py-2 bg-black hover:bg-zinc-900 border border-zinc-700 text-zinc-300 uppercase transition-colors btn-tactile"
                  >
                    &larr; BACK TO HARDWARE
                  </button>

                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-4 py-2 bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-black font-bold uppercase flex items-center gap-1.5 transition-colors btn-tactile border border-[#00f0ff]"
                  >
                    <span>VIEW WIND-TUNNEL VECTORS</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  <div className="lg:col-span-8">
                    <ChassisVisualizer
                      selectedCase={selectedCase}
                      cpuCooler={selectedCooler}
                      gpu={selectedGpu}
                      slots={slots}
                      physics={physics}
                      onToggleSlotDirection={toggleSlotDirection}
                    />
                  </div>
                  <div className="lg:col-span-4">
                    <PressureGauge physics={physics} />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#0b0d13] p-3.5 border border-zinc-800 hard-shadow-sm font-mono text-xs">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 bg-black hover:bg-zinc-900 border border-zinc-700 text-zinc-300 uppercase transition-colors btn-tactile"
                  >
                    &larr; BACK TO SLOTS
                  </button>

                  <button
                    onClick={() => setActiveStep(4)}
                    className="px-4 py-2 bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-black font-bold uppercase flex items-center gap-1.5 transition-colors btn-tactile border border-[#00f0ff]"
                  >
                    <span>INSPECT DIAGNOSTICS & SAFETY</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  <div className="lg:col-span-6">
                    <PressureGauge physics={physics} />
                  </div>
                  <div className="lg:col-span-6">
                    <DiagnosticsPanel
                      diagnostics={diagnostics}
                      onExecuteQuickFix={executeQuickFix}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#0b0d13] p-3.5 border border-zinc-800 hard-shadow-sm font-mono text-xs">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-4 py-2 bg-black hover:bg-zinc-900 border border-zinc-700 text-zinc-300 uppercase transition-colors btn-tactile"
                  >
                    &larr; BACK TO WIND-TUNNEL
                  </button>

                  <button
                    onClick={() => setIsProView(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase flex items-center gap-1.5 transition-colors btn-tactile border border-purple-500"
                  >
                    <span>OPEN ALL-IN-ONE WORKBENCH MATRIX</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Preset Modal */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onLoadPreset={loadPreset}
        onResetBlankSlate={resetToBlankSlate}
      />

      {/* Industrial Engineering Footer */}
      <footer className="mt-auto border-t border-zinc-800 bg-black/90 py-3 px-6 text-center text-[11px] text-zinc-500 font-mono flex flex-wrap items-center justify-between">
        <div>
          <span>AEROFLOW CFD ENGINE // VERIFIED WITH </span>
          <a
            href="https://github.com/docyx/pc-part-dataset"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:text-[#00f0ff] underline"
          >
            docyx/pc-part-dataset
          </a>
          <span> (18,800+ PARTS)</span>
        </div>
        <div>
          <span>CALIBRATION: EMPIRICAL AIRFLOW DYNAMICS // 60 FPS KINEMATICS</span>
        </div>
      </footer>
    </div>
  );
};
