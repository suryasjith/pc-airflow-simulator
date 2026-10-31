import {
  PCCase,
  CPUCooler,
  GPU,
  GranularFanSlot,
  AirflowPhysicsResult,
  DiagnosticItem,
  MountLocation,
} from '../types';

export function runAirflowDiagnostics(
  selectedCase: PCCase | null,
  cpuCooler: CPUCooler | null,
  gpu: GPU | null,
  slots: Record<string, GranularFanSlot>,
  physics: AirflowPhysicsResult
): DiagnosticItem[] {
  const diagnostics: DiagnosticItem[] = [];

  const allSlots = Object.values(slots);
  const occupiedSlots = allSlots.filter((s) => s.isOccupied);
  const activeSlots = allSlots.filter((s) => s.isOccupied && s.pwmPercent > 0);

  // 1. Fresh Blank Slate Notice
  if (!selectedCase && !cpuCooler && !gpu && activeSlots.length === 0) {
    diagnostics.push({
      id: 'blank-slate-guide',
      severity: 'tip',
      title: 'Fresh Slate: Ready to Configure',
      description: 'Select a PC case and hardware components to begin live aerodynamic and static pressure simulation.',
      recommendation: 'Choose your chassis, assign discrete fan slots, adjust PWM curves, and observe live CFM values.',
    });
    return diagnostics;
  }

  // 2. SHORT-LOOPING CONFLICT DETECTION (Adjacent slots on the exact same panel with opposing directions)
  const panels: MountLocation[] = ['front', 'side', 'top', 'rear', 'bottom'];
  panels.forEach((panel) => {
    const panelSlots = physics.panelBreakdown[panel].slots
      .filter((s) => s.isOccupied && s.pwmPercent > 0)
      .sort((a, b) => a.slotNumber - b.slotNumber);

    for (let i = 0; i < panelSlots.length - 1; i++) {
      const slotA = panelSlots[i];
      const slotB = panelSlots[i + 1];

      // If adjacent active slots have opposing directions: Short-looping!
      if (slotA.direction !== slotB.direction) {
        const panelName = panel.charAt(0).toUpperCase() + panel.slice(1);
        diagnostics.push({
          id: `short-loop-${panel}-${slotA.slotNumber}-${slotB.slotNumber}`,
          severity: 'critical',
          title: `Short-Looping Conflict: ${panelName} Slot ${slotA.slotNumber} vs Slot ${slotB.slotNumber}`,
          description: `Adjacent slots on the exact same ${panelName} panel are set to opposing airflow directions (${slotA.slotNumber}: ${slotA.direction.toUpperCase()} @ ${slotA.pwmPercent}% PWM vs ${slotB.slotNumber}: ${slotB.direction.toUpperCase()} @ ${slotB.pwmPercent}% PWM). The exhaust fan immediately feeds warm expelled air right back into the adjacent intake fan, forming an isolated dead-zone eddy that starves internal hardware.`,
          recommendation: `Align all active fans on the ${panelName} panel to blow in the same unified direction.`,
          quickFix: {
            label: `Sync ${panelName} to ${panel === 'front' || panel === 'bottom' || panel === 'side' ? 'Intake' : 'Exhaust'}`,
            action: 'SYNC_PANEL_DIRECTION',
            targetPanel: panel,
            targetValue: panel === 'front' || panel === 'bottom' || panel === 'side' ? 'intake' : 'exhaust',
          },
        });
        break; // One warning per panel is clear and punchy
      }
    }
  });

  // 3. GPU STARVATION: Front or Side mount holding AIO radiator set to Intake
  const aioIntakeSlots = activeSlots.filter(
    (s) => (s.panel === 'front' || s.panel === 'side') && s.hasRadiator && s.direction === 'intake'
  );
  const isOpenAirGpu = gpu && gpu.coolingType.startsWith('open-air');
  const hasDedicatedBottomIntake = physics.panelBreakdown.bottom.intakeCfm > 20;

  if (aioIntakeSlots.length > 0 && isOpenAirGpu) {
    const panelNames = Array.from(new Set(aioIntakeSlots.map((s) => s.panel.toUpperCase()))).join(' & ');
    if (!hasDedicatedBottomIntake) {
      diagnostics.push({
        id: 'gpu-starvation-aio-intake',
        severity: 'critical',
        title: `GPU Starvation: Pre-Heated ${panelNames} AIO Intake Air`,
        description: `Your ${panelNames} mount is holding an AIO liquid cooler radiator configured as INTAKE. As ambient air passes through the dense fins, it absorbs CPU heat and rises to ~40°C–50°C before blowing directly across your open-air ${gpu.name}. With no cool floor air feeding the GPU, thermal throttling and fan acoustic spikes will occur.`,
        recommendation: `Relocate the AIO radiator to the Top mount as Exhaust, or add dedicated Bottom intake fans to inject cool floor air directly into the GPU intake shroud.`,
        quickFix: {
          label: 'Move Radiator to Top Exhaust',
          action: 'MOVE_AIO_TO_TOP',
        },
      });
    } else {
      diagnostics.push({
        id: 'gpu-preheat-mitigated',
        severity: 'warning',
        title: `AIO Pre-Heating Mitigated by Bottom Intake Fans`,
        description: `${panelNames} AIO intake air is warm, but your Bottom intake fans (${physics.panelBreakdown.bottom.intakeCfm} CFM) supply ambient floor air directly into the GPU shroud.`,
        recommendation: `Keep Bottom intake PWM at 75% or higher to guarantee positive displacement over the GPU heatsink.`,
      });
    }
  }

  // 4. EXTREME NEGATIVE PRESSURE: Total exhaust drastically outpaces total intake
  if (
    physics.totalExhaustCfm > 0 &&
    (physics.totalIntakeCfm === 0 || physics.totalExhaustCfm >= 1.4 * physics.totalIntakeCfm)
  ) {
    diagnostics.push({
      id: 'extreme-negative-pressure',
      severity: 'critical',
      title: 'Extreme Negative Pressure: Severe Vacuum & Dust Suction',
      description: `Total exhaust (${physics.totalExhaustCfm} CFM) drastically outpaces total intake (${physics.totalIntakeCfm} CFM, Ratio: ${physics.pressureRatio}). The case is in high negative vacuum, forcing room dust and hair in through unfiltered PCIe cutouts and chassis seams.`,
      recommendation: `Increase intake fan PWM curves or flip Front / Side fans to Intake to establish balanced or slightly positive pressure.`,
      quickFix: {
        label: 'Flip Front & Side Fans to Intake',
        action: 'FLIP_EXHAUST_TO_INTAKE',
      },
    });
  }

  // 5. ALL-INTAKE OVERPRESSURIZATION (Zero exhaust)
  if (physics.totalIntakeCfm > 0 && physics.totalExhaustCfm === 0) {
    diagnostics.push({
      id: 'all-intake-trapped-heat',
      severity: 'critical',
      title: 'Trapped Heat: All-Intake with Zero Exhaust Corridors',
      description: `All active fans are set to Intake (${physics.totalIntakeCfm} CFM) with 0 active exhaust fans. Hot air expelled by your CPU and GPU will swirl inside the chassis and fight backpressure before escaping slowly through passive grilles.`,
      recommendation: `Configure at least one Rear or Top fan as Exhaust to establish directional through-flow.`,
      quickFix: {
        label: 'Set Rear Fan to Exhaust',
        action: 'SET_REAR_EXHAUST',
      },
    });
  }

  // 6. AIO COOLER SELECTED BUT NO SLOTS ASSIGNED RADIATOR
  if (cpuCooler?.type === 'aio') {
    const hasAnyRadiatorAssigned = allSlots.some((s) => s.hasRadiator);
    if (!hasAnyRadiatorAssigned && occupiedSlots.length > 0) {
      diagnostics.push({
        id: 'aio-missing-radiator-assignment',
        severity: 'warning',
        title: 'AIO Cooler Selected: No Radiator Assigned to Slots',
        description: `You have selected the ${cpuCooler.name} (${cpuCooler.radiatorSizeMm}mm AIO), but no fan slot currently has the "Radiator" toggle checked to apply the 40% static pressure impedance penalty.`,
        recommendation: `Check the "Radiator" toggle on the Top or Front/Side slots where the radiator is physically installed.`,
        quickFix: {
          label: 'Assign Radiator to Top Slots',
          action: 'ASSIGN_RADIATOR_TO_TOP',
        },
      });
    }
  }

  // 7. SUCCESS: OPTIMAL EQUILIBRIUM
  const hasShortLooping = diagnostics.some((d) => d.id.startsWith('short-loop'));
  const hasPreHeatCritical = diagnostics.some((d) => d.id === 'gpu-starvation-aio-intake');
  const hasVacuum = diagnostics.some((d) => d.id === 'extreme-negative-pressure');

  if (
    !hasShortLooping &&
    !hasPreHeatCritical &&
    !hasVacuum &&
    (physics.pressureType === 'slight-positive' || (physics.pressureType === 'strong-positive' && physics.pressureRatio <= 1.65)) &&
    physics.totalIntakeCfm > 40 &&
    physics.totalExhaustCfm > 25
  ) {
    diagnostics.push({
      id: 'optimal-airflow-award',
      severity: 'success',
      title: 'Optimal Aerodynamic Equilibrium Achieved',
      description: `Superb configuration! Net positive pressure (+${physics.netCfm} CFM) gently repels room dust through chassis seams while maintaining smooth laminar through-flow with zero opposing short-circuits.`,
      recommendation: `Your fan curves and slot orientations are thermally optimized for peak clock speeds and quiet acoustic profiles.`,
    });
  }

  return diagnostics;
}
