import { describe, it, expect } from 'vitest';
import { calculateLiveSlotCfm, calculateAirflowPhysics } from '../src/physics/airflowEngine';
import { GranularFanSlot, PCCase, CPUCooler, GPU } from '../src/types';

describe('AeroFlow Physics Engine', () => {
  const dummyFanSlot: GranularFanSlot = {
    id: 'front-1',
    panel: 'front',
    slotNumber: 1,
    isOccupied: true,
    fanId: 'noctua-a12x25',
    fanName: 'Noctua NF-A12x25',
    fanSizeMm: 120,
    maxCfm: 60.0,
    direction: 'intake',
    pwmPercent: 100,
    hasRadiator: false,
    liveCfm: 0,
  };

  const dummyCase: PCCase = {
    id: 'test-case-4000d',
    name: 'Corsair 4000D Airflow',
    brand: 'Corsair',
    formFactor: 'ATX',
    volumeLiters: 48.0,
    frontPanelType: 'mesh',
    filterImpedance: { front: true, side: false, top: true, bottom: true },
    mountCapacities: {
      front: { max120: 3, max140: 2, maxRadMm: 360 },
      side: { max120: 0, max140: 0, maxRadMm: 0 },
      top: { max120: 2, max140: 2, maxRadMm: 280 },
      rear: { max120: 1, max140: 0, maxRadMm: 120 },
      bottom: { max120: 0, max140: 0, maxRadMm: 0 },
    },
    description: 'Mid tower case',
  };

  const dummyCpuCooler: CPUCooler = {
    id: 'peerless-assassin-120',
    name: 'Thermalright Peerless Assassin 120',
    brand: 'Thermalright',
    type: 'air',
    fanSizeMm: 120,
    fanCount: 2,
    fanCfm: 66.0,
    tdpRating: 220,
    description: 'Dual tower air cooler',
  };

  const dummyGpu: GPU = {
    id: 'rtx-4080-super',
    name: 'GeForce RTX 4080 Super',
    brand: 'NVIDIA',
    coolingType: 'open-air-triple',
    tdpWatts: 320,
    lengthMm: 300,
    exhaustRatio: 0.18,
    description: 'Triple fan GPU',
  };

  it('calculates 0 CFM when slot is unoccupied or PWM is 0%', () => {
    const unoccupiedSlot = { ...dummyFanSlot, isOccupied: false };
    expect(calculateLiveSlotCfm(unoccupiedSlot)).toBe(0);

    const zeroPwmSlot = { ...dummyFanSlot, pwmPercent: 0 };
    expect(calculateLiveSlotCfm(zeroPwmSlot)).toBe(0);
  });

  it('calculates linear CFM proportional to PWM slider percentage', () => {
    const slot50 = { ...dummyFanSlot, pwmPercent: 50 };
    expect(calculateLiveSlotCfm(slot50)).toBe(30.0);

    const slot75 = { ...dummyFanSlot, pwmPercent: 75 };
    expect(calculateLiveSlotCfm(slot75)).toBe(45.0);

    const slot100 = { ...dummyFanSlot, pwmPercent: 100 };
    expect(calculateLiveSlotCfm(slot100)).toBe(60.0);
  });

  it('automatically applies 40% static pressure impedance penalty when fan has AIO radiator attached', () => {
    const slotNoRad = { ...dummyFanSlot, pwmPercent: 100, hasRadiator: false };
    const slotWithRad = { ...dummyFanSlot, pwmPercent: 100, hasRadiator: true };

    const cfmNoRad = calculateLiveSlotCfm(slotNoRad);
    const cfmWithRad = calculateLiveSlotCfm(slotWithRad);

    expect(cfmNoRad).toBe(60.0);
    // 60.0 * (1 - 0.40) = 36.0
    expect(cfmWithRad).toBe(36.0);
    expect(cfmWithRad).toBe(cfmNoRad * 0.6);
  });

  it('correctly handles Fresh Slate state with 0 active slots', () => {
    const physics = calculateAirflowPhysics(null, null, null, {});
    expect(physics.totalIntakeCfm).toBe(0);
    expect(physics.totalExhaustCfm).toBe(0);
    expect(physics.netCfm).toBe(0);
    expect(physics.pressureType).toBe('inactive');
  });

  it('accurately calculates positive pressure when Intake CFM > Exhaust CFM', () => {
    const slots: Record<string, GranularFanSlot> = {
      'front-1': { ...dummyFanSlot, id: 'front-1', panel: 'front', direction: 'intake', pwmPercent: 100 }, // 60 CFM
      'front-2': { ...dummyFanSlot, id: 'front-2', panel: 'front', direction: 'intake', pwmPercent: 100 }, // 60 CFM
      'rear-1': { ...dummyFanSlot, id: 'rear-1', panel: 'rear', direction: 'exhaust', pwmPercent: 100 },   // 60 CFM
    };

    const physics = calculateAirflowPhysics(dummyCase, dummyCpuCooler, dummyGpu, slots);

    expect(physics.totalIntakeCfm).toBe(120.0);
    expect(physics.totalExhaustCfm).toBe(60.0);
    expect(physics.netCfm).toBe(60.0);
    expect(physics.pressureRatio).toBe(2.0);
    expect(physics.pressureType).toBe('strong-positive');
    expect(physics.dustTrapRisk).toBe(1);
  });

  it('accurately calculates negative pressure when Intake CFM < Exhaust CFM', () => {
    const slots: Record<string, GranularFanSlot> = {
      'front-1': { ...dummyFanSlot, id: 'front-1', panel: 'front', direction: 'intake', pwmPercent: 50 },  // 30 CFM
      'top-1': { ...dummyFanSlot, id: 'top-1', panel: 'top', direction: 'exhaust', pwmPercent: 100 },      // 60 CFM
      'rear-1': { ...dummyFanSlot, id: 'rear-1', panel: 'rear', direction: 'exhaust', pwmPercent: 100 },   // 60 CFM
    };

    const physics = calculateAirflowPhysics(dummyCase, dummyCpuCooler, dummyGpu, slots);

    expect(physics.totalIntakeCfm).toBe(30.0);
    expect(physics.totalExhaustCfm).toBe(120.0);
    expect(physics.netCfm).toBe(-90.0);
    expect(physics.pressureRatio).toBe(0.25);
    expect(physics.pressureType).toBe('strong-negative');
    expect(physics.dustTrapRisk).toBe(5);
  });

  it('calculates air turnover rate based on case volume', () => {
    const slots: Record<string, GranularFanSlot> = {
      'front-1': { ...dummyFanSlot, id: 'front-1', direction: 'intake', pwmPercent: 100 }, // 60 CFM
      'rear-1': { ...dummyFanSlot, id: 'rear-1', direction: 'exhaust', pwmPercent: 100 },   // 60 CFM
    };

    const physics = calculateAirflowPhysics(dummyCase, dummyCpuCooler, dummyGpu, slots);
    expect(physics.airExchangesPerMinute).toBeGreaterThan(0);
    // 48L * 0.0353147 = ~1.695 cu ft. 60 CFM / 1.695 = ~35.4 exchanges/min
    expect(physics.airExchangesPerMinute).toBeCloseTo(35.4, 0);
  });
});
