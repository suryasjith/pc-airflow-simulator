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
  Layers,
  ChevronRight,
  Info,
  Sliders,
  Box,
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
    { num: 1, title: 'Case & Hardware', icon: Box },
    { num: 2, title: 'Granular Slots & PWM', icon: Sliders },
    { num: 3, title: 'Airflow Vectors', icon: Wind },
    { num: 4, title: 'Physics & Diagnostics', icon: Layers },
  ];

  const activeSlotCount = Object.values(slots).filter((s) => s.isOccupied && s.pwmPercent > 0).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/90 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950 font-black">
              <Wind className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg font-mono">
                  AERO<span className="text-cyan-400">FLOW</span>
                </span>
                <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-800/50 px-1.5 py-0.2 rounded font-semibold">
                  Granular PWM v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
                Precision Case Airflow Simulator & Dynamic Pressure Optimizer
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <button
              onClick={() => setIsProView(!isProView)}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                isProView
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              title="Toggle between Paced Guided Stepper and Pro Dashboard View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{isProView ? 'Pro All-In-One' : 'Guided Workflow'}</span>
            </button>

            {/* Presets Modal Button */}
            <button
              onClick={() => setIsPresetsOpen(true)}
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Case Studies</span>
            </button>

            {/* Blank Slate Reset */}
            <button
              onClick={resetToBlankSlate}
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-800 hover:border-red-900/60 bg-slate-900 hover:bg-red-950/30 text-slate-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
              title="Reset everything to completely blank state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Slate</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-6">
        {/* Paced Guided Stepper (Enabled when not in Pro View) */}
        {!isProView && (
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <span className="text-xs font-mono font-medium text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                PACED BUILD PROCESS (STEP {activeStep} OF 4)
              </span>
              <span className="text-[11px] text-slate-400">
                Paced progression designed to prevent cognitive overload.
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {steps.map((s) => {
                const IconComponent = s.icon;
                const isActive = activeStep === s.num;
                const isCompleted = activeStep > s.num;

                return (
                  <button
                    key={s.num}
                    onClick={() => setActiveStep(s.num)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      isActive
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-950/40'
                        : isCompleted
                        ? 'bg-slate-950/70 border-slate-700/80 text-slate-200 hover:border-slate-600'
                        : 'bg-slate-950/30 border-slate-800/60 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCompleted ? '✓' : <IconComponent className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{s.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {s.num === 1 && (selectedCase ? selectedCase.name.slice(0, 15) : 'Empty')}
                        {s.num === 2 && `${activeSlotCount} Active Slots`}
                        {s.num === 3 && 'Kinematics'}
                        {s.num === 4 && `${physics.netCfm > 0 ? `+${physics.netCfm}` : physics.netCfm} CFM`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* GUIDED STEPPER CONTENT OR PRO VIEW */}
        {isProView ? (
          /* PRO VIEW: Expansive all-in-one matrix */
          <div className="space-y-6">
            {/* Row 1: Hardware Component Matrix */}
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

            {/* Row 2: Chassis Cross-Section Visualizer + Pressure Gauge */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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

              <div className="lg:col-span-5 space-y-6">
                <PressureGauge physics={physics} />
                <DiagnosticsPanel
                  diagnostics={diagnostics}
                  onExecuteQuickFix={executeQuickFix}
                />
              </div>
            </div>

            {/* Row 3: Granular Slot & PWM Matrix */}
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
          /* GUIDED STEPPER VIEW (Paced for beginners) */
          <div className="space-y-6">
            {activeStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
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

                <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>
                      {selectedCase
                        ? `Selected ${selectedCase.name}. Ready to configure granular fan slots.`
                        : 'Search and select a PC chassis to unlock discrete mounting slots.'}
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <span>Proceed to Granular Slots</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
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

                <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition-colors"
                  >
                    &larr; Back to Hardware
                  </button>

                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Streamline Vectors</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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

                <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition-colors"
                  >
                    &larr; Back to Slots
                  </button>

                  <button
                    onClick={() => setActiveStep(4)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <span>Inspect Diagnostics & Warnings</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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

                <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition-colors"
                  >
                    &larr; Back to Visualizer
                  </button>

                  <button
                    onClick={() => setIsProView(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <span>Switch to All-In-One Pro Dashboard</span>
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

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-400 font-mono">
        <p>AeroFlow Engine &bull; PC Airflow Simulation & Dynamic Pressure Optimizer &bull; Granular Slot PWM Controls</p>
      </footer>
    </div>
  );
};
