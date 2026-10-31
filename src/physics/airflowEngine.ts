import {
  PCCase,
  CPUCooler,
  GPU,
  GranularFanSlot,
  AirflowPhysicsResult,
  PressureType,
  MountLocation,
} from '../types';

export function calculateLiveSlotCfm(slot: GranularFanSlot): number {
  if (!slot.isOccupied || !slot.fanId || slot.pwmPercent <= 0) {
    return 0;
  }

  // Base CFM from PWM percentage (0% to 100%)
  const pwmRatio = Math.max(0, Math.min(100, slot.pwmPercent)) / 100;
  const baseCfm = slot.maxCfm * pwmRatio;

  // Requirement 4: If occupied by both a fan and an AIO radiator, apply a 40% CFM penalty
  if (slot.hasRadiator) {
    const penaltyRatio = 0.40;
    return Math.round(baseCfm * (1 - penaltyRatio) * 10) / 10;
  }

  return Math.round(baseCfm * 10) / 10;
}

export function calculateAirflowPhysics(
  selectedCase: PCCase | null,
  cpuCooler: CPUCooler | null,
  gpu: GPU | null,
  slots: Record<string, GranularFanSlot>
): AirflowPhysicsResult {
  const panels: MountLocation[] = ['front', 'side', 'top', 'rear', 'bottom'];

  const panelBreakdown: AirflowPhysicsResult['panelBreakdown'] = {
    front: { intakeCfm: 0, exhaustCfm: 0, slots: [] },
    side: { intakeCfm: 0, exhaustCfm: 0, slots: [] },
    top: { intakeCfm: 0, exhaustCfm: 0, slots: [] },
    rear: { intakeCfm: 0, exhaustCfm: 0, slots: [] },
    bottom: { intakeCfm: 0, exhaustCfm: 0, slots: [] },
  };

  let totalIntakeCfm = 0;
  let totalExhaustCfm = 0;

  // Calculate live CFM for all slots
  Object.values(slots).forEach((slot) => {
    const liveCfm = calculateLiveSlotCfm(slot);
    // ensure liveCfm property is updated
    slot.liveCfm = liveCfm;

    if (panelBreakdown[slot.panel]) {
      panelBreakdown[slot.panel].slots.push(slot);

      if (slot.isOccupied && slot.pwmPercent > 0 && liveCfm > 0) {
        if (slot.direction === 'intake') {
          panelBreakdown[slot.panel].intakeCfm += liveCfm;
          totalIntakeCfm += liveCfm;
        } else {
          panelBreakdown[slot.panel].exhaustCfm += liveCfm;
          totalExhaustCfm += liveCfm;
        }
      }
    }
  });

  // Sort slots inside each panel by slotNumber
  panels.forEach((p) => {
    panelBreakdown[p].slots.sort((a, b) => a.slotNumber - b.slotNumber);
    panelBreakdown[p].intakeCfm = Math.round(panelBreakdown[p].intakeCfm * 10) / 10;
    panelBreakdown[p].exhaustCfm = Math.round(panelBreakdown[p].exhaustCfm * 10) / 10;
  });

  totalIntakeCfm = Math.round(totalIntakeCfm * 10) / 10;
  totalExhaustCfm = Math.round(totalExhaustCfm * 10) / 10;
  const netCfm = Math.round((totalIntakeCfm - totalExhaustCfm) * 10) / 10;

  let pressureRatio = 1.0;
  if (totalExhaustCfm > 0) {
    pressureRatio = Math.round((totalIntakeCfm / totalExhaustCfm) * 100) / 100;
  } else if (totalIntakeCfm > 0) {
    pressureRatio = 99.0;
  }

  // Determine pressure classification
  let pressureType: PressureType = 'inactive';
  let pressureDescription = 'No active fans configured.';
  let dustTrapRisk: 1 | 2 | 3 | 4 | 5 = 3;

  if (totalIntakeCfm === 0 && totalExhaustCfm === 0) {
    pressureType = 'inactive';
    pressureDescription = 'Chassis inactive. Add fans or increase PWM above 0% to measure pressure.';
    dustTrapRisk = 3;
  } else if (totalIntakeCfm > 0 && totalExhaustCfm === 0) {
    pressureType = 'strong-positive';
    pressureDescription = 'All-intake over-pressurization. Zero dedicated exhaust corridors; heat relies on passive cracks.';
    dustTrapRisk = 2;
  } else if (totalIntakeCfm === 0 && totalExhaustCfm > 0) {
    pressureType = 'strong-negative';
    pressureDescription = 'Extreme negative vacuum! Air & room dust are sucked in through unsealed chassis seams.';
    dustTrapRisk = 5;
  } else if (totalIntakeCfm > totalExhaustCfm) {
    // Total Intake > Exhaust equals Positive Pressure
    if (pressureRatio > 1.45) {
      pressureType = 'strong-positive';
      pressureDescription = 'Strong positive pressure. Air actively pushes outward through gaps, rejecting ambient dust.';
      dustTrapRisk = 1;
    } else {
      pressureType = 'slight-positive';
      pressureDescription = 'Optimal slightly positive pressure. Benchmark laminar flow with positive dust rejection.';
      dustTrapRisk = 1;
    }
  } else if (totalIntakeCfm === totalExhaustCfm) {
    pressureType = 'neutral';
    pressureDescription = 'Balanced neutral pressure. Equal intake and exhaust volume.';
    dustTrapRisk = 2;
  } else {
    // Intake < Exhaust equals Negative Pressure
    if (totalExhaustCfm >= 1.4 * totalIntakeCfm) {
      pressureType = 'strong-negative';
      pressureDescription = 'Extreme negative pressure. Exhaust drastically outpaces intake, turning case into a dust vacuum.';
      dustTrapRisk = 5;
    } else {
      pressureType = 'slight-negative';
      pressureDescription = 'Slight negative pressure. Minor dust ingress through expansion slots.';
      dustTrapRisk = 3;
    }
  }

  // Air Exchange Rate
  const volumeLiters = selectedCase?.volumeLiters || 48.0;
  const volumeCuFt = volumeLiters * 0.0353147;
  const throughFlowCfm = Math.min(totalIntakeCfm, totalExhaustCfm) + Math.abs(netCfm) * 0.4;
  const airExchangesPerMinute = volumeCuFt > 0 ? Math.round((throughFlowCfm / volumeCuFt) * 10) / 10 : 0;

  // Thermal impact estimations
  const gpuTdp = gpu?.tdpWatts || 220;
  let baseGpuDelta = 38.0 + (gpuTdp / 450) * 18.0;
  let gpuAirflowSufficiency: 'optimal' | 'adequate' | 'starved' = 'adequate';

  const directGpuIntakeCfm = panelBreakdown.bottom.intakeCfm + panelBreakdown.front.intakeCfm * 0.4;
  if (directGpuIntakeCfm > 45) {
    baseGpuDelta -= 6.0;
    gpuAirflowSufficiency = 'optimal';
  } else if (directGpuIntakeCfm < 15 && (totalIntakeCfm > 0 || totalExhaustCfm > 0)) {
    baseGpuDelta += 6.0;
    gpuAirflowSufficiency = 'starved';
  }

  // Check if Front or Side has AIO Radiator Intake hitting open-air GPU
  const hasAioIntakeFrontOrSide =
    panelBreakdown.front.slots.some((s) => s.isOccupied && s.hasRadiator && s.direction === 'intake' && s.pwmPercent > 0) ||
    panelBreakdown.side.slots.some((s) => s.isOccupied && s.hasRadiator && s.direction === 'intake' && s.pwmPercent > 0);

  if (hasAioIntakeFrontOrSide && gpu && gpu.coolingType.startsWith('open-air')) {
    baseGpuDelta += 6.5; // Radiator dumps warm exhaust directly into GPU
  }

  const cpuTdp = cpuCooler?.tdpRating || 200;
  let baseCpuDelta = 34.0 + (cpuTdp < 180 ? 4.0 : 0.0);
  if (totalIntakeCfm > 40 && panelBreakdown.rear.exhaustCfm > 15) {
    baseCpuDelta -= 4.0;
  }

  return {
    totalIntakeCfm,
    totalExhaustCfm,
    netCfm,
    pressureRatio,
    pressureType,
    pressureDescription,
    dustTrapRisk,
    caseVolumeLiters: volumeLiters,
    airExchangesPerMinute,
    estimatedCpuDeltaT: Math.round(Math.max(20, baseCpuDelta) * 10) / 10,
    estimatedGpuDeltaT: Math.round(Math.max(25, baseGpuDelta) * 10) / 10,
    gpuAirflowSufficiency,
    panelBreakdown,
  };
}
