import { describe, it, expect } from 'vitest';
import { runAirflowDiagnostics } from '../src/physics/diagnosticsEngine';
import { calculateAirflowPhysics } from '../src/physics/airflowEngine';
import { GranularFanSlot, PCCase, CPUCooler, GPU } from '../src/types';

describe('AeroFlow Diagnostics & Conflict Engine', () => {
  const dummyCase: PCCase = {
    id: 'test-case-o11',
    name: 'Lian Li O11 Vision',
    brand: 'Lian Li',
    formFactor: 'ATX',
    volumeLiters: 58.0,
    frontPanelType: 'solid-glass',
    filterImpedance: { front: false, side: true, top: true, bottom: true },
    mountCapacities: {
      front: { max120: 0, max140: 0, maxRadMm: 0 },
      side: { max120: 3, max140: 2, maxRadMm: 360 },
      top: { max120: 3, max140: 2, maxRadMm: 360 },
      rear: { max120: 1, max140: 0, maxRadMm: 120 },
      bottom: { max120: 3, max140: 2, maxRadMm: 360 },
    },
    description: 'Dual chamber case',
  };

  const aioCooler: CPUCooler = {
    id: 'arctic-lf3-360',
    name: 'ARCTIC Liquid Freezer III 360',
    brand: 'ARCTIC',
    type: 'aio',
    radiatorSizeMm: 360,
    fanSizeMm: 120,
    fanCount: 3,
    fanCfm: 56.3,
    tdpRating: 300,
    description: '360mm AIO liquid cooler',
  };

  const openAirGpu: GPU = {
    id: 'rtx-4090-triple',
    name: 'GeForce RTX 4090 24GB',
    brand: 'NVIDIA',
    coolingType: 'open-air-triple',
    tdpWatts: 450,
    lengthMm: 320,
    exhaustRatio: 0.18,
    description: 'Flagship 450W open-air graphics card',
  };

  const createSlot = (
    id: string,
    panel: any,
    slotNumber: number,
    direction: 'intake' | 'exhaust',
    pwm: number,
    hasRadiator: boolean = false
  ): GranularFanSlot => ({
    id,
    panel,
    slotNumber,
    isOccupied: true,
    fanId: 'fan-120',
    fanSizeMm: 120,
    maxCfm: 60.0,
    direction,
    pwmPercent: pwm,
    hasRadiator,
    liveCfm: (60.0 * (pwm / 100)) * (hasRadiator ? 0.6 : 1.0),
  });

  it('reports Fresh Slate Ready-to-Configure tip on initial unconfigured state', () => {
    const physics = calculateAirflowPhysics(null, null, null, {});
    const diagnostics = runAirflowDiagnostics(null, null, null, {}, physics);

    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].id).toBe('blank-slate-guide');
    expect(diagnostics[0].severity).toBe('tip');
  });

  it('detects SHORT-LOOPING conflict when adjacent slots on same panel have opposing directions', () => {
    const slots: Record<string, GranularFanSlot> = {
      'top-1': createSlot('top-1', 'top', 1, 'intake', 80),   // Top 1 Intake
      'top-2': createSlot('top-2', 'top', 2, 'exhaust', 80),  // Top 2 Exhaust (opposing adjacent slot!)
      'top-3': createSlot('top-3', 'top', 3, 'exhaust', 80),
    };

    const physics = calculateAirflowPhysics(dummyCase, null, null, slots);
    const diagnostics = runAirflowDiagnostics(dummyCase, null, null, slots, physics);

    const shortLoopConflict = diagnostics.find(d => d.id.startsWith('short-loop-top'));
    expect(shortLoopConflict).toBeDefined();
    expect(shortLoopConflict?.severity).toBe('critical');
    expect(shortLoopConflict?.title).toContain('Short-Looping Conflict: Top Slot 1 vs Slot 2');
    expect(shortLoopConflict?.quickFix?.action).toBe('SYNC_PANEL_DIRECTION');
  });

  it('detects GPU STARVATION when Side or Front mount with AIO radiator is set to Intake', () => {
    const slots: Record<string, GranularFanSlot> = {
      // Side slots with AIO Radiator set to INTAKE
      'side-1': createSlot('side-1', 'side', 1, 'intake', 80, true),
      'side-2': createSlot('side-2', 'side', 2, 'intake', 80, true),
      'side-3': createSlot('side-3', 'side', 3, 'intake', 80, true),
      'top-1': createSlot('top-1', 'top', 1, 'exhaust', 70, false),
      'top-2': createSlot('top-2', 'top', 2, 'exhaust', 70, false),
      'rear-1': createSlot('rear-1', 'rear', 1, 'exhaust', 70, false),
      // No bottom intake
    };

    const physics = calculateAirflowPhysics(dummyCase, aioCooler, openAirGpu, slots);
    const diagnostics = runAirflowDiagnostics(dummyCase, aioCooler, openAirGpu, slots, physics);

    const gpuStarvation = diagnostics.find(d => d.id === 'gpu-starvation-aio-intake');
    expect(gpuStarvation).toBeDefined();
    expect(gpuStarvation?.severity).toBe('critical');
    expect(gpuStarvation?.title).toContain('GPU Starvation: Pre-Heated SIDE AIO Intake Air');
    expect(gpuStarvation?.description).toContain('rises to ~40°C–50°C before blowing directly across your open-air');
    expect(gpuStarvation?.quickFix?.action).toBe('MOVE_AIO_TO_TOP');
  });

  it('downgrades GPU starvation to warning if dedicated bottom intake fans are present', () => {
    const slots: Record<string, GranularFanSlot> = {
      'side-1': createSlot('side-1', 'side', 1, 'intake', 80, true),
      'bottom-1': createSlot('bottom-1', 'bottom', 1, 'intake', 80, false), // Bottom intake supplying floor air
      'bottom-2': createSlot('bottom-2', 'bottom', 2, 'intake', 80, false),
      'top-1': createSlot('top-1', 'top', 1, 'exhaust', 70, false),
    };

    const physics = calculateAirflowPhysics(dummyCase, aioCooler, openAirGpu, slots);
    const diagnostics = runAirflowDiagnostics(dummyCase, aioCooler, openAirGpu, slots, physics);

    const mitigatedNotice = diagnostics.find(d => d.id === 'gpu-preheat-mitigated');
    expect(mitigatedNotice).toBeDefined();
    expect(mitigatedNotice?.severity).toBe('warning');
  });

  it('detects EXTREME NEGATIVE PRESSURE when exhaust drastically outpaces intake', () => {
    const slots: Record<string, GranularFanSlot> = {
      'top-1': createSlot('top-1', 'top', 1, 'exhaust', 100, false),
      'top-2': createSlot('top-2', 'top', 2, 'exhaust', 100, false),
      'rear-1': createSlot('rear-1', 'rear', 1, 'exhaust', 100, false),
    };

    const physics = calculateAirflowPhysics(dummyCase, null, null, slots);
    const diagnostics = runAirflowDiagnostics(dummyCase, null, null, slots, physics);

    const negativePressureConflict = diagnostics.find(d => d.id === 'extreme-negative-pressure');
    expect(negativePressureConflict).toBeDefined();
    expect(negativePressureConflict?.severity).toBe('critical');
    expect(negativePressureConflict?.title).toContain('Extreme Negative Pressure');
  });

  it('detects ALL-INTAKE trapped heat hazard when exhaust is 0', () => {
    const slots: Record<string, GranularFanSlot> = {
      'front-1': createSlot('front-1', 'front', 1, 'intake', 80, false),
      'front-2': createSlot('front-2', 'front', 2, 'intake', 80, false),
    };

    const physics = calculateAirflowPhysics(dummyCase, null, null, slots);
    const diagnostics = runAirflowDiagnostics(dummyCase, null, null, slots, physics);

    const allIntakeConflict = diagnostics.find(d => d.id === 'all-intake-trapped-heat');
    expect(allIntakeConflict).toBeDefined();
    expect(allIntakeConflict?.severity).toBe('critical');
  });

  it('detects AIO cooler selected with no slots having radiator assigned', () => {
    const slots: Record<string, GranularFanSlot> = {
      'top-1': createSlot('top-1', 'top', 1, 'exhaust', 80, false), // No radiator checked
    };

    const physics = calculateAirflowPhysics(dummyCase, aioCooler, null, slots);
    const diagnostics = runAirflowDiagnostics(dummyCase, aioCooler, null, slots, physics);

    const aioUnassigned = diagnostics.find(d => d.id === 'aio-missing-radiator-assignment');
    expect(aioUnassigned).toBeDefined();
    expect(aioUnassigned?.severity).toBe('warning');
  });

  it('awards OPTIMAL AERODYNAMIC EQUILIBRIUM for balanced laminar positive setups', () => {
    const slots: Record<string, GranularFanSlot> = {
      'side-1': createSlot('side-1', 'side', 1, 'intake', 80, false), // 48 CFM
      'side-2': createSlot('side-2', 'side', 2, 'intake', 80, false), // 48 CFM
      'bottom-1': createSlot('bottom-1', 'bottom', 1, 'intake', 75, false), // 45 CFM
      'top-1': createSlot('top-1', 'top', 1, 'exhaust', 70, true), // 25.2 CFM
      'top-2': createSlot('top-2', 'top', 2, 'exhaust', 70, true), // 25.2 CFM
      'rear-1': createSlot('rear-1', 'rear', 1, 'exhaust', 70, false), // 42 CFM
    };

    const physics = calculateAirflowPhysics(dummyCase, aioCooler, openAirGpu, slots);
    const diagnostics = runAirflowDiagnostics(dummyCase, aioCooler, openAirGpu, slots, physics);

    const optimalAward = diagnostics.find(d => d.id === 'optimal-airflow-award');
    expect(optimalAward).toBeDefined();
    expect(optimalAward?.severity).toBe('success');
    expect(optimalAward?.title).toContain('Optimal Aerodynamic Equilibrium Achieved');
  });
});
