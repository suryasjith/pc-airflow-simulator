export type FormFactor = 'ATX' | 'Micro-ATX' | 'Mini-ITX' | 'E-ATX';
export type FrontPanelType = 'mesh' | 'solid-glass' | 'perforated';

export interface MountCapacity {
  max120: number;
  max140: number;
  maxRadMm: number; // e.g. 360, 280, 240, 120, 0
}

export type MountLocation = 'front' | 'side' | 'top' | 'rear' | 'bottom';
export type MountDirection = 'intake' | 'exhaust';

export interface PCCase {
  id: string;
  name: string;
  brand: string;
  formFactor: FormFactor;
  volumeLiters: number;
  frontPanelType: FrontPanelType;
  filterImpedance: {
    front: boolean;
    side?: boolean;
    top: boolean;
    bottom: boolean;
  };
  mountCapacities: {
    front: MountCapacity;
    side: MountCapacity;
    top: MountCapacity;
    rear: MountCapacity;
    bottom: MountCapacity;
  };
  description: string;
  imageHint?: string;
}

export type CoolerType = 'air' | 'aio';

export interface CPUCooler {
  id: string;
  name: string;
  brand: string;
  type: CoolerType;
  radiatorSizeMm?: 120 | 240 | 280 | 360 | 420;
  fanSizeMm: 120 | 140;
  fanCount: number;
  fanCfm: number;
  tdpRating: number;
  description: string;
}

export type GPUCoolingType = 'open-air-triple' | 'open-air-dual' | 'blower' | 'hybrid-aio';

export interface GPU {
  id: string;
  name: string;
  brand: string;
  coolingType: GPUCoolingType;
  tdpWatts: number;
  lengthMm: number;
  exhaustRatio: number; // 0.15 for open air (dumps 85% into case), 0.85 for blower (dumps only 15% into case)
  description: string;
}

export interface CaseFan {
  id: string;
  name: string;
  brand: string;
  sizeMm: 120 | 140;
  maxCfm: number;
  staticPressure: number; // mm H2O
  noiseDba: number;
  maxRpm: number;
  description: string;
}

/**
 * Granular individual fan slot model
 */
export interface GranularFanSlot {
  id: string; // e.g. "front-1", "side-2", "top-1"
  panel: MountLocation;
  slotNumber: number; // 1, 2, 3
  isOccupied: boolean;
  fanId: string | null;
  fanName?: string;
  fanSizeMm: 120 | 140;
  maxCfm: number;
  direction: MountDirection;
  pwmPercent: number; // 0 to 100%
  hasRadiator: boolean;
  liveCfm: number; // Calculated live CFM with PWM and 40% radiator impedance penalty
}

export type PressureType =
  | 'strong-positive'
  | 'slight-positive'
  | 'neutral'
  | 'slight-negative'
  | 'strong-negative'
  | 'inactive';

export interface AirflowPhysicsResult {
  totalIntakeCfm: number;
  totalExhaustCfm: number;
  netCfm: number;
  pressureRatio: number;
  pressureType: PressureType;
  pressureDescription: string;
  dustTrapRisk: 1 | 2 | 3 | 4 | 5; // 1 = minimal dust (filtered positive), 5 = vacuum dust trap
  caseVolumeLiters: number;
  airExchangesPerMinute: number;
  estimatedCpuDeltaT: number; // °C over ambient
  estimatedGpuDeltaT: number; // °C over ambient
  gpuAirflowSufficiency: 'optimal' | 'adequate' | 'starved';
  panelBreakdown: Record<MountLocation, {
    intakeCfm: number;
    exhaustCfm: number;
    slots: GranularFanSlot[];
  }>;
}

export type DiagnosticSeverity = 'critical' | 'warning' | 'tip' | 'success';

export interface DiagnosticItem {
  id: string;
  severity: DiagnosticSeverity;
  title: string;
  description: string;
  recommendation: string;
  quickFix?: {
    label: string;
    action: string;
    targetSlotId?: string;
    targetPanel?: MountLocation;
    targetValue?: unknown;
  };
}

export interface PresetBuild {
  id: string;
  name: string;
  badge: string;
  description: string;
  caseId: string;
  cpuCoolerId: string;
  gpuId: string;
  slots: Record<string, Partial<GranularFanSlot>>;
}
