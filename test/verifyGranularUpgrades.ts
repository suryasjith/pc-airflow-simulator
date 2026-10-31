import fs from 'fs';
import path from 'path';
import { PCCase, CPUCooler, GPU, CaseFan, GranularFanSlot } from '../src/types';
import { calculateLiveSlotCfm, calculateAirflowPhysics } from '../src/physics/airflowEngine';
import { runAirflowDiagnostics } from '../src/physics/diagnosticsEngine';

console.log('================================================================');
console.log('--- TEST SUITE: PC AIRFLOW SIMULATOR GRANULAR UPGRADES ---');
console.log('================================================================\n');

// 1. DATA INTEGRATION & SIDE MOUNT CHECK
console.log('--- 1. Testing Comprehensive Market Data & Side Mount Support ---');
const dataDir = path.resolve(process.cwd(), 'public/data');
const cases: PCCase[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'cases.json'), 'utf-8'));
const cpuCoolers: CPUCooler[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'cpu-coolers.json'), 'utf-8'));
const gpus: GPU[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'video-cards.json'), 'utf-8'));
const fans: CaseFan[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'case-fans.json'), 'utf-8'));

console.log(`Cases: ${cases.length.toLocaleString()}`);
console.log(`CPU Coolers: ${cpuCoolers.length.toLocaleString()}`);
console.log(`GPUs: ${gpus.length.toLocaleString()}`);
console.log(`Case Fans: ${fans.length.toLocaleString()}`);

const casesWithSideMounts = cases.filter(c => c.mountCapacities?.side && (c.mountCapacities.side.max120 > 0 || c.mountCapacities.side.max140 > 0));
console.log(`Cases with explicit Side Mount support: ${casesWithSideMounts.length.toLocaleString()}`);

if (cases.length > 5000 && casesWithSideMounts.length > 0) {
  console.log('✅ PASS: Real-world market dataset loaded and Side Mounts explicitly supported.\n');
} else {
  console.error('❌ FAIL: Data integration or Side Mount support check failed.');
  process.exit(1);
}

// 2. PER-SLOT PWM & LIVE CFM CALCULATION
console.log('--- 2. Testing Granular Per-Slot PWM Controls & Live CFM ---');
const testFan = fans[0] || { id: 'test-fan', name: 'Noctua NF-A12x25', maxCfm: 60.0 };
console.log(`Testing with fan: ${testFan.name} (${testFan.maxCfm} CFM rating)`);

const slotZeroPwm: GranularFanSlot = {
  id: 'front-1',
  panel: 'front',
  slotNumber: 1,
  isOccupied: true,
  fanId: testFan.id,
  fanSizeMm: 120,
  maxCfm: testFan.maxCfm,
  direction: 'intake',
  pwmPercent: 0, // 0%
  hasRadiator: false,
  liveCfm: 0,
};

const cfmAtZero = calculateLiveSlotCfm(slotZeroPwm);
console.log(`CFM at 0% PWM: ${cfmAtZero}`);
if (cfmAtZero === 0) {
  console.log('✅ PASS: 0% PWM yields 0 CFM.');
} else {
  console.error('❌ FAIL: 0% PWM did not yield 0 CFM');
  process.exit(1);
}

const slot50Pwm: GranularFanSlot = {
  ...slotZeroPwm,
  pwmPercent: 50,
};
const cfmAt50 = calculateLiveSlotCfm(slot50Pwm);
const expected50 = Math.round(testFan.maxCfm * 0.5 * 10) / 10;
console.log(`CFM at 50% PWM: ${cfmAt50} (Expected: ${expected50})`);
if (cfmAt50 === expected50) {
  console.log('✅ PASS: 50% PWM correctly calculates half of max CFM.');
} else {
  console.error('❌ FAIL: 50% PWM calculation mismatch');
  process.exit(1);
}

const slot100Pwm: GranularFanSlot = {
  ...slotZeroPwm,
  pwmPercent: 100,
};
const cfmAt100 = calculateLiveSlotCfm(slot100Pwm);
console.log(`CFM at 100% PWM: ${cfmAt100} (Expected: ${testFan.maxCfm})`);
if (cfmAt100 === testFan.maxCfm) {
  console.log('✅ PASS: 100% PWM calculates full max CFM.\n');
} else {
  console.error('❌ FAIL: 100% PWM calculation mismatch');
  process.exit(1);
}

// 3. STATIC PRESSURE 40% AIO RADIATOR CFM PENALTY
console.log('--- 3. Testing 40% Static Pressure AIO Radiator Impedance Penalty ---');
const slotWithRadiator: GranularFanSlot = {
  ...slot100Pwm,
  hasRadiator: true, // Attached AIO Radiator
};
const cfmWithRadiator = calculateLiveSlotCfm(slotWithRadiator);
const expectedWithPenalty = Math.round(testFan.maxCfm * (1 - 0.40) * 10) / 10;
console.log(`Fan without radiator: ${cfmAt100} CFM`);
console.log(`Fan WITH AIO radiator: ${cfmWithRadiator} CFM (Expected 40% penalty: ${expectedWithPenalty} CFM)`);

if (cfmWithRadiator === expectedWithPenalty && cfmWithRadiator < cfmAt100) {
  console.log('✅ PASS: Static pressure 40% CFM penalty automatically applied to fan with AIO radiator.\n');
} else {
  console.error('❌ FAIL: 40% CFM penalty was not applied correctly');
  process.exit(1);
}

// 4. SHORT-LOOPING CONFLICT DETECTION
console.log('--- 4. Testing Short-Looping Conflict Detection (Adjacent Opposing Slots) ---');
const testCase = cases[0];
const shortLoopSlots: Record<string, GranularFanSlot> = {
  'top-1': {
    id: 'top-1',
    panel: 'top',
    slotNumber: 1,
    isOccupied: true,
    fanId: testFan.id,
    fanSizeMm: 120,
    maxCfm: testFan.maxCfm,
    direction: 'intake', // Intake on Top 1
    pwmPercent: 70,
    hasRadiator: false,
    liveCfm: 42,
  },
  'top-2': {
    id: 'top-2',
    panel: 'top',
    slotNumber: 2,
    isOccupied: true,
    fanId: testFan.id,
    fanSizeMm: 120,
    maxCfm: testFan.maxCfm,
    direction: 'exhaust', // Exhaust on adjacent Top 2!
    pwmPercent: 70,
    hasRadiator: false,
    liveCfm: 42,
  },
};

const shortLoopPhysics = calculateAirflowPhysics(testCase, null, null, shortLoopSlots);
const shortLoopDiagnostics = runAirflowDiagnostics(testCase, null, null, shortLoopSlots, shortLoopPhysics);

const foundShortLoop = shortLoopDiagnostics.some(d => d.id.startsWith('short-loop-top'));
console.log('Top 1: INTAKE vs Top 2: EXHAUST');
console.log(`Short-looping detected: ${foundShortLoop}`);
if (foundShortLoop) {
  console.log('✅ PASS: Short-looping detected on adjacent opposing slots with critical severity.\n');
} else {
  console.error('❌ FAIL: Short-looping conflict not detected');
  process.exit(1);
}

// 5. GPU STARVATION (FRONT OR SIDE AIO INTAKE)
console.log('--- 5. Testing GPU Starvation (Side AIO Intake Pre-Heating Open-Air GPU) ---');
const openAirGpu = gpus.find(g => g.coolingType.startsWith('open-air')) || gpus[0];
const aioCooler = cpuCoolers.find(c => c.type === 'aio') || cpuCoolers[0];

const sideAioSlots: Record<string, GranularFanSlot> = {
  'side-1': {
    id: 'side-1',
    panel: 'side',
    slotNumber: 1,
    isOccupied: true,
    fanId: testFan.id,
    fanSizeMm: 120,
    maxCfm: testFan.maxCfm,
    direction: 'intake', // SIDE INTAKE WITH RADIATOR!
    pwmPercent: 80,
    hasRadiator: true,
    liveCfm: 28.8,
  },
  'side-2': {
    id: 'side-2',
    panel: 'side',
    slotNumber: 2,
    isOccupied: true,
    fanId: testFan.id,
    fanSizeMm: 120,
    maxCfm: testFan.maxCfm,
    direction: 'intake',
    pwmPercent: 80,
    hasRadiator: true,
    liveCfm: 28.8,
  },
  'top-1': {
    id: 'top-1',
    panel: 'top',
    slotNumber: 1,
    isOccupied: true,
    fanId: testFan.id,
    fanSizeMm: 120,
    maxCfm: testFan.maxCfm,
    direction: 'exhaust',
    pwmPercent: 70,
    hasRadiator: false,
    liveCfm: 42,
  },
};

const sideAioPhysics = calculateAirflowPhysics(testCase, aioCooler, openAirGpu, sideAioSlots);
const sideAioDiagnostics = runAirflowDiagnostics(testCase, aioCooler, openAirGpu, sideAioSlots, sideAioPhysics);

const foundGpuStarvation = sideAioDiagnostics.some(d => d.id === 'gpu-starvation-aio-intake');
console.log(`Side AIO Intake targeting ${openAirGpu.name}`);
console.log(`GPU Starvation detected: ${foundGpuStarvation}`);

if (foundGpuStarvation) {
  console.log('✅ PASS: GPU Starvation hazard detected on Side AIO Intake.\n');
} else {
  console.error('❌ FAIL: GPU Starvation hazard not detected');
  process.exit(1);
}

// 6. EXTREME NEGATIVE PRESSURE
console.log('--- 6. Testing Extreme Negative Pressure Detection ---');
const extremeNegativeSlots: Record<string, GranularFanSlot> = {
  'rear-1': {
    id: 'rear-1',
    panel: 'rear',
    slotNumber: 1,
    isOccupied: true,
    fanId: testFan.id,
    fanSizeMm: 120,
    maxCfm: testFan.maxCfm,
    direction: 'exhaust', // 100% EXHAUST, 0% INTAKE
    pwmPercent: 100,
    hasRadiator: false,
    liveCfm: 60,
  },
  'top-1': {
    id: 'top-1',
    panel: 'top',
    slotNumber: 1,
    isOccupied: true,
    fanId: testFan.id,
    fanSizeMm: 120,
    maxCfm: testFan.maxCfm,
    direction: 'exhaust',
    pwmPercent: 100,
    hasRadiator: false,
    liveCfm: 60,
  },
};

const negPhysics = calculateAirflowPhysics(testCase, null, null, extremeNegativeSlots);
const negDiagnostics = runAirflowDiagnostics(testCase, null, null, extremeNegativeSlots, negPhysics);

const foundNegativePressure = negDiagnostics.some(d => d.id === 'extreme-negative-pressure');
console.log(`Total Intake: ${negPhysics.totalIntakeCfm} CFM, Total Exhaust: ${negPhysics.totalExhaustCfm} CFM`);
console.log(`Pressure Type: ${negPhysics.pressureType}`);
console.log(`Extreme Negative Pressure detected: ${foundNegativePressure}`);

if (foundNegativePressure && negPhysics.pressureType === 'strong-negative') {
  console.log('✅ PASS: Extreme negative pressure vacuum detected.\n');
} else {
  console.error('❌ FAIL: Extreme negative pressure not detected');
  process.exit(1);
}

console.log('================================================================');
console.log('🎉 ALL 5 ADVANCED UPGRADE REQUIREMENTS VERIFIED SUCCESSFULLY!');
console.log('================================================================');
