import { create } from 'zustand';
import {
  PCCase,
  CPUCooler,
  GPU,
  CaseFan,
  GranularFanSlot,
  MountLocation,
  AirflowPhysicsResult,
  DiagnosticItem,
  PresetBuild,
} from '../types';
import { loadAllDatasets } from '../services/datasetService';
import { calculateAirflowPhysics } from '../physics/airflowEngine';
import { runAirflowDiagnostics } from '../physics/diagnosticsEngine';

interface AirflowState {
  // Comprehensive Market Dataset
  cases: PCCase[];
  cpuCoolers: CPUCooler[];
  gpus: GPU[];
  fans: CaseFan[];
  isLoadingData: boolean;
  dataError: string | null;

  // Fresh Slate Selected Hardware (Starts 100% empty)
  selectedCase: PCCase | null;
  selectedCooler: CPUCooler | null;
  selectedGpu: GPU | null;
  defaultFan: CaseFan | null;

  // Granular Fan Slots by ID (e.g. "front-1", "side-2", "top-1")
  slots: Record<string, GranularFanSlot>;

  // Paced Beginner Stepper & View Mode
  activeStep: number;
  isProView: boolean;
  isPresetsOpen: boolean;

  // Actions
  fetchData: () => Promise<void>;
  selectCase: (c: PCCase | null) => void;
  selectCooler: (c: CPUCooler | null) => void;
  selectGpu: (g: GPU | null) => void;
  selectDefaultFan: (f: CaseFan | null) => void;
  setActiveStep: (step: number) => void;
  setIsProView: (isPro: boolean) => void;
  setIsPresetsOpen: (isOpen: boolean) => void;

  // Slot Controls
  toggleSlotOccupied: (slotId: string) => void;
  setSlotFan: (slotId: string, fan: CaseFan | null) => void;
  setSlotDirection: (slotId: string, direction: 'intake' | 'exhaust') => void;
  toggleSlotDirection: (slotId: string) => void;
  setSlotPwm: (slotId: string, pwmPercent: number) => void;
  toggleSlotRadiator: (slotId: string) => void;
  syncPanelDirection: (panel: MountLocation, direction: 'intake' | 'exhaust') => void;
  applyDefaultFanToPanel: (panel: MountLocation) => void;
  applyDefaultFanToAllActiveSlots: () => void;

  // Quick Fixes & Presets
  executeQuickFix: (quickFix: NonNullable<DiagnosticItem['quickFix']>) => void;
  loadPreset: (preset: PresetBuild) => void;
  resetToBlankSlate: () => void;

  // Computed Selectors
  getPhysics: () => AirflowPhysicsResult;
  getDiagnostics: () => DiagnosticItem[];
}

function generateInitialSlotsForCase(
  caseItem: PCCase,
  preferredFan: CaseFan | null
): Record<string, GranularFanSlot> {
  const result: Record<string, GranularFanSlot> = {};
  const panels: MountLocation[] = ['front', 'side', 'top', 'rear', 'bottom'];

  panels.forEach((panel) => {
    const cap = caseItem.mountCapacities[panel];
    const slotCount = Math.max(cap.max120, cap.max140);
    const defaultDir = (panel === 'front' || panel === 'bottom' || panel === 'side') ? 'intake' : 'exhaust';

    for (let i = 1; i <= slotCount; i++) {
      const slotId = `${panel}-${i}`;
      result[slotId] = {
        id: slotId,
        panel,
        slotNumber: i,
        isOccupied: false, // Starts empty
        fanId: null,
        fanName: undefined,
        fanSizeMm: 120,
        maxCfm: preferredFan ? preferredFan.maxCfm : 60.0,
        direction: defaultDir,
        pwmPercent: 0, // Starts at 0% PWM
        hasRadiator: false,
        liveCfm: 0,
      };
    }
  });

  return result;
}

export const useAirflowStore = create<AirflowState>((set, get) => ({
  cases: [],
  cpuCoolers: [],
  gpus: [],
  fans: [],
  isLoadingData: true,
  dataError: null,

  // FRESH STATE: completely blank on launch
  selectedCase: null,
  selectedCooler: null,
  selectedGpu: null,
  defaultFan: null,
  slots: {},

  activeStep: 1,
  isProView: false,
  isPresetsOpen: false,

  fetchData: async () => {
    try {
      set({ isLoadingData: true, dataError: null });
      const data = await loadAllDatasets();
      set({
        cases: data.cases,
        cpuCoolers: data.cpuCoolers,
        gpus: data.gpus,
        fans: data.fans,
        isLoadingData: false,
      });
    } catch (err: any) {
      console.error('Failed to load real market dataset:', err);
      set({ isLoadingData: false, dataError: err?.message || 'Failed to load dataset' });
    }
  },

  selectCase: (caseItem) => {
    if (!caseItem) {
      set({ selectedCase: null, slots: {} });
      return;
    }

    const { defaultFan } = get();
    const newSlots = generateInitialSlotsForCase(caseItem, defaultFan);
    set({ selectedCase: caseItem, slots: newSlots });
  },

  selectCooler: (cooler) => set({ selectedCooler: cooler }),
  selectGpu: (gpu) => set({ selectedGpu: gpu }),

  selectDefaultFan: (fan) => {
    set({ defaultFan: fan });
  },

  setActiveStep: (step) => set({ activeStep: step }),
  setIsProView: (isPro) => set({ isProView: isPro }),
  setIsPresetsOpen: (isOpen) => set({ isPresetsOpen: isOpen }),

  toggleSlotOccupied: (slotId) => {
    const { slots, defaultFan, fans } = get();
    const slot = slots[slotId];
    if (!slot) return;

    const fallbackFan = defaultFan || (fans.length > 0 ? fans[0] : null);
    const nextOccupied = !slot.isOccupied;

    set({
      slots: {
        ...slots,
        [slotId]: {
          ...slot,
          isOccupied: nextOccupied,
          fanId: nextOccupied ? (slot.fanId || fallbackFan?.id || 'standard-fan') : slot.fanId,
          fanName: nextOccupied ? (slot.fanName || fallbackFan?.name || '120mm PWM Fan') : slot.fanName,
          maxCfm: nextOccupied ? (fallbackFan ? fallbackFan.maxCfm : slot.maxCfm || 60) : slot.maxCfm,
          pwmPercent: nextOccupied ? (slot.pwmPercent > 0 ? slot.pwmPercent : 75) : 0,
        },
      },
    });
  },

  setSlotFan: (slotId, fan) => {
    const { slots } = get();
    const slot = slots[slotId];
    if (!slot || !fan) return;

    set({
      slots: {
        ...slots,
        [slotId]: {
          ...slot,
          isOccupied: true,
          fanId: fan.id,
          fanName: fan.name,
          fanSizeMm: fan.sizeMm,
          maxCfm: fan.maxCfm,
          pwmPercent: slot.pwmPercent > 0 ? slot.pwmPercent : 75,
        },
      },
    });
  },

  setSlotDirection: (slotId, direction) => {
    const { slots } = get();
    const slot = slots[slotId];
    if (!slot) return;

    set({
      slots: {
        ...slots,
        [slotId]: {
          ...slot,
          direction,
        },
      },
    });
  },

  toggleSlotDirection: (slotId) => {
    const { slots } = get();
    const slot = slots[slotId];
    if (!slot) return;

    const nextDir = slot.direction === 'intake' ? 'exhaust' : 'intake';
    set({
      slots: {
        ...slots,
        [slotId]: {
          ...slot,
          direction: nextDir,
        },
      },
    });
  },

  setSlotPwm: (slotId, pwmPercent) => {
    const { slots } = get();
    const slot = slots[slotId];
    if (!slot) return;

    set({
      slots: {
        ...slots,
        [slotId]: {
          ...slot,
          pwmPercent: Math.max(0, Math.min(100, pwmPercent)),
          isOccupied: pwmPercent > 0 ? true : slot.isOccupied,
        },
      },
    });
  },

  toggleSlotRadiator: (slotId) => {
    const { slots } = get();
    const slot = slots[slotId];
    if (!slot) return;

    set({
      slots: {
        ...slots,
        [slotId]: {
          ...slot,
          hasRadiator: !slot.hasRadiator,
        },
      },
    });
  },

  syncPanelDirection: (panel, direction) => {
    const { slots } = get();
    const nextSlots = { ...slots };

    Object.keys(nextSlots).forEach((id) => {
      if (nextSlots[id].panel === panel) {
        nextSlots[id] = {
          ...nextSlots[id],
          direction,
        };
      }
    });

    set({ slots: nextSlots });
  },

  applyDefaultFanToPanel: (panel) => {
    const { slots, defaultFan, fans } = get();
    const fan = defaultFan || (fans.length > 0 ? fans[0] : null);
    if (!fan) return;

    const nextSlots = { ...slots };
    Object.keys(nextSlots).forEach((id) => {
      if (nextSlots[id].panel === panel) {
        nextSlots[id] = {
          ...nextSlots[id],
          isOccupied: true,
          fanId: fan.id,
          fanName: fan.name,
          fanSizeMm: fan.sizeMm,
          maxCfm: fan.maxCfm,
          pwmPercent: nextSlots[id].pwmPercent > 0 ? nextSlots[id].pwmPercent : 75,
        };
      }
    });

    set({ slots: nextSlots });
  },

  applyDefaultFanToAllActiveSlots: () => {
    const { slots, defaultFan } = get();
    if (!defaultFan) return;

    const nextSlots = { ...slots };
    Object.keys(nextSlots).forEach((id) => {
      if (nextSlots[id].isOccupied) {
        nextSlots[id] = {
          ...nextSlots[id],
          fanId: defaultFan.id,
          fanName: defaultFan.name,
          fanSizeMm: defaultFan.sizeMm,
          maxCfm: defaultFan.maxCfm,
        };
      }
    });

    set({ slots: nextSlots });
  },

  executeQuickFix: (quickFix) => {
    const { slots } = get();

    switch (quickFix.action) {
      case 'SYNC_PANEL_DIRECTION': {
        if (quickFix.targetPanel && quickFix.targetValue) {
          get().syncPanelDirection(
            quickFix.targetPanel,
            quickFix.targetValue as 'intake' | 'exhaust'
          );
        }
        break;
      }
      case 'MOVE_AIO_TO_TOP': {
        // Remove radiator from front/side and add to top
        const nextSlots = { ...slots };
        Object.keys(nextSlots).forEach((id) => {
          if (nextSlots[id].panel === 'front' || nextSlots[id].panel === 'side') {
            nextSlots[id] = { ...nextSlots[id], hasRadiator: false };
          }
          if (nextSlots[id].panel === 'top') {
            nextSlots[id] = {
              ...nextSlots[id],
              isOccupied: true,
              direction: 'exhaust',
              hasRadiator: true,
              pwmPercent: nextSlots[id].pwmPercent > 0 ? nextSlots[id].pwmPercent : 75,
            };
          }
        });
        set({ slots: nextSlots });
        break;
      }
      case 'FLIP_EXHAUST_TO_INTAKE': {
        // Flip front and side exhaust fans to intake
        const nextSlots = { ...slots };
        Object.keys(nextSlots).forEach((id) => {
          if (
            (nextSlots[id].panel === 'front' || nextSlots[id].panel === 'side' || nextSlots[id].panel === 'bottom') &&
            nextSlots[id].isOccupied &&
            nextSlots[id].direction === 'exhaust'
          ) {
            nextSlots[id] = { ...nextSlots[id], direction: 'intake' };
          }
        });
        set({ slots: nextSlots });
        break;
      }
      case 'SET_REAR_EXHAUST': {
        const nextSlots = { ...slots };
        Object.keys(nextSlots).forEach((id) => {
          if (nextSlots[id].panel === 'rear') {
            nextSlots[id] = {
              ...nextSlots[id],
              isOccupied: true,
              direction: 'exhaust',
              pwmPercent: nextSlots[id].pwmPercent > 0 ? nextSlots[id].pwmPercent : 75,
            };
          }
        });
        set({ slots: nextSlots });
        break;
      }
      case 'ASSIGN_RADIATOR_TO_TOP': {
        const nextSlots = { ...slots };
        Object.keys(nextSlots).forEach((id) => {
          if (nextSlots[id].panel === 'top') {
            nextSlots[id] = {
              ...nextSlots[id],
              isOccupied: true,
              hasRadiator: true,
              direction: 'exhaust',
              pwmPercent: nextSlots[id].pwmPercent > 0 ? nextSlots[id].pwmPercent : 75,
            };
          }
        });
        set({ slots: nextSlots });
        break;
      }
      default:
        break;
    }
  },

  loadPreset: (preset) => {
    const { cases, cpuCoolers, gpus } = get();
    const c = cases.find((item) => item.id === preset.caseId) || null;
    const cpu = cpuCoolers.find((item) => item.id === preset.cpuCoolerId) || null;
    const g = gpus.find((item) => item.id === preset.gpuId) || null;

    if (c) {
      const generatedSlots = generateInitialSlotsForCase(c, null);
      // Merge preset slots
      Object.entries(preset.slots).forEach(([slotId, slotData]) => {
        if (generatedSlots[slotId]) {
          generatedSlots[slotId] = {
            ...generatedSlots[slotId],
            ...slotData,
          };
        }
      });
      set({
        selectedCase: c,
        selectedCooler: cpu,
        selectedGpu: g,
        slots: generatedSlots,
      });
    }
  },

  resetToBlankSlate: () => {
    set({
      selectedCase: null,
      selectedCooler: null,
      selectedGpu: null,
      defaultFan: null,
      slots: {},
      activeStep: 1,
    });
  },

  getPhysics: () => {
    const { selectedCase, selectedCooler, selectedGpu, slots } = get();
    return calculateAirflowPhysics(selectedCase, selectedCooler, selectedGpu, slots);
  },

  getDiagnostics: () => {
    const { selectedCase, selectedCooler, selectedGpu, slots, getPhysics } = get();
    const physics = getPhysics();
    return runAirflowDiagnostics(selectedCase, selectedCooler, selectedGpu, slots, physics);
  },
}));
