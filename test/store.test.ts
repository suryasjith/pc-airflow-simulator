import { describe, it, expect, beforeEach } from 'vitest';
import { useAirflowStore } from '../src/store/useAirflowStore';
import { PCCase, CPUCooler, GPU, CaseFan } from '../src/types';

describe('AeroFlow Zustand State Store', () => {
  const dummyCase: PCCase = {
    id: 'store-test-case',
    name: 'Corsair 5000D Airflow',
    brand: 'Corsair',
    formFactor: 'ATX',
    volumeLiters: 66.0,
    frontPanelType: 'mesh',
    filterImpedance: { front: true, side: true, top: true, bottom: true },
    mountCapacities: {
      front: { max120: 3, max140: 2, maxRadMm: 360 },
      side: { max120: 3, max140: 0, maxRadMm: 360 },
      top: { max120: 3, max140: 2, maxRadMm: 360 },
      rear: { max120: 1, max140: 0, maxRadMm: 120 },
      bottom: { max120: 0, max140: 0, maxRadMm: 0 },
    },
    description: 'High airflow ATX case with side mount',
  };

  const dummyFan: CaseFan = {
    id: 'noctua-a12',
    name: 'Noctua NF-A12x25',
    brand: 'Noctua',
    sizeMm: 120,
    maxCfm: 60.0,
    staticPressure: 2.34,
    noiseDba: 22.6,
    maxRpm: 2000,
    description: 'High performance fan',
  };

  beforeEach(() => {
    useAirflowStore.getState().resetToBlankSlate();
  });

  it('initializes in a 100% blank slate state', () => {
    const state = useAirflowStore.getState();
    expect(state.selectedCase).toBeNull();
    expect(state.selectedCooler).toBeNull();
    expect(state.selectedGpu).toBeNull();
    expect(state.defaultFan).toBeNull();
    expect(Object.keys(state.slots).length).toBe(0);
    expect(state.activeStep).toBe(1);
  });

  it('dynamically generates discrete granular slots when a case is selected', () => {
    const store = useAirflowStore.getState();
    store.selectCase(dummyCase);

    const updated = useAirflowStore.getState();
    expect(updated.selectedCase?.id).toBe(dummyCase.id);

    // Front has max 3, Side has max 3, Top has max 3, Rear has max 1 -> 10 total slots
    expect(Object.keys(updated.slots).length).toBe(10);
    expect(updated.slots['front-1']).toBeDefined();
    expect(updated.slots['side-1']).toBeDefined();
    expect(updated.slots['top-1']).toBeDefined();
    expect(updated.slots['rear-1']).toBeDefined();

    // Verify initial slots are unoccupied (blank slate)
    expect(updated.slots['front-1'].isOccupied).toBe(false);
    expect(updated.slots['front-1'].pwmPercent).toBe(0);
  });

  it('toggles slot occupation and activates fan with default PWM', () => {
    const store = useAirflowStore.getState();
    store.selectCase(dummyCase);
    store.selectDefaultFan(dummyFan);

    store.toggleSlotOccupied('front-1');
    let state = useAirflowStore.getState();
    expect(state.slots['front-1'].isOccupied).toBe(true);
    expect(state.slots['front-1'].pwmPercent).toBe(75);
    expect(state.slots['front-1'].fanId).toBe(dummyFan.id);

    // Toggle off
    store.toggleSlotOccupied('front-1');
    state = useAirflowStore.getState();
    expect(state.slots['front-1'].isOccupied).toBe(false);
  });

  it('updates slot PWM and recalculates live CFM instantly', () => {
    const store = useAirflowStore.getState();
    store.selectCase(dummyCase);
    store.selectDefaultFan(dummyFan);
    store.toggleSlotOccupied('front-1');

    store.setSlotPwm('front-1', 50);
    const state = useAirflowStore.getState();
    expect(state.slots['front-1'].pwmPercent).toBe(50);

    const physics = store.getPhysics();
    expect(physics.totalIntakeCfm).toBe(30.0); // 60 CFM * 50%
  });

  it('applies 40% radiator penalty on toggleSlotRadiator', () => {
    const store = useAirflowStore.getState();
    store.selectCase(dummyCase);
    store.selectDefaultFan(dummyFan);
    store.toggleSlotOccupied('top-1');
    store.setSlotPwm('top-1', 100);

    let physics = store.getPhysics();
    expect(physics.totalExhaustCfm).toBe(60.0);

    store.toggleSlotRadiator('top-1');
    physics = store.getPhysics();
    // 60.0 * 0.60 = 36.0
    expect(physics.totalExhaustCfm).toBe(36.0);
  });

  it('syncs all slots on a panel to unified direction', () => {
    const store = useAirflowStore.getState();
    store.selectCase(dummyCase);
    store.toggleSlotOccupied('front-1');
    store.toggleSlotOccupied('front-2');

    // Make front-2 exhaust to create short-looping
    store.setSlotDirection('front-2', 'exhaust');
    let slots = useAirflowStore.getState().slots;
    expect(slots['front-1'].direction).toBe('intake');
    expect(slots['front-2'].direction).toBe('exhaust');

    // Sync all front slots to intake
    store.syncPanelDirection('front', 'intake');
    slots = useAirflowStore.getState().slots;
    expect(slots['front-1'].direction).toBe('intake');
    expect(slots['front-2'].direction).toBe('intake');
  });

  it('clears all state cleanly with resetToBlankSlate', () => {
    const store = useAirflowStore.getState();
    store.selectCase(dummyCase);
    store.toggleSlotOccupied('front-1');
    store.setActiveStep(3);

    store.resetToBlankSlate();
    const state = useAirflowStore.getState();
    expect(state.selectedCase).toBeNull();
    expect(Object.keys(state.slots).length).toBe(0);
    expect(state.activeStep).toBe(1);
  });
});
