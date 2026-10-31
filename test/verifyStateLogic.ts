import fs from 'fs';
import path from 'path';
import { calculateAirflowPhysics } from '../src/physics/airflowEngine';
import { runAirflowDiagnostics } from '../src/physics/diagnosticsEngine';
import { PRESET_STUDIES } from '../src/components/PresetsModal';
import { PCCase, CPUCooler, GPU, CaseFan, GranularFanSlot } from '../src/types';

console.log('--- 1. Testing Fresh Blank Slate State ---');
const blankPhysics = calculateAirflowPhysics(null, null, null, {});
const blankDiagnostics = runAirflowDiagnostics(null, null, null, {}, blankPhysics);

console.log('Blank slate intake CFM:', blankPhysics.totalIntakeCfm);
console.log('Blank slate exhaust CFM:', blankPhysics.totalExhaustCfm);
console.log('Blank slate pressure type:', blankPhysics.pressureType);
console.log('Blank slate diagnostics count:', blankDiagnostics.length);
console.log('Blank slate diagnostic title:', blankDiagnostics[0]?.title);
if (blankPhysics.totalIntakeCfm === 0 && blankPhysics.totalExhaustCfm === 0 && blankPhysics.pressureType === 'inactive') {
  console.log('✅ PASS: Blank Slate is completely inactive and empty as required.');
} else {
  console.error('❌ FAIL: Blank Slate test failed');
  process.exit(1);
}

const dataDir = path.resolve(process.cwd(), 'public/data');
const cases: PCCase[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'cases.json'), 'utf-8'));
const cpuCoolers: CPUCooler[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'cpu-coolers.json'), 'utf-8'));
const gpus: GPU[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'video-cards.json'), 'utf-8'));
const fans: CaseFan[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'case-fans.json'), 'utf-8'));

console.log('\n--- 2. Testing Short-Looping Preset Conflict ---');
const shortLoopPreset = PRESET_STUDIES.find(p => p.id === 'short-looping-conflict')!;
const aioCase = cases.find(c => c.id === shortLoopPreset.caseId) || cases[0];
const aioCooler = cpuCoolers.find(c => c.id === shortLoopPreset.cpuCoolerId) || cpuCoolers[0];
const aioGpu = gpus.find(g => g.id === shortLoopPreset.gpuId) || gpus[0];

const fullSlots: Record<string, GranularFanSlot> = {};
Object.entries(shortLoopPreset.slots).forEach(([id, s]) => {
  const panel = id.split('-')[0] as any;
  const num = parseInt(id.split('-')[1], 10);
  fullSlots[id] = {
    id,
    panel,
    slotNumber: num,
    isOccupied: s.isOccupied ?? true,
    fanId: fans[0].id,
    fanSizeMm: 120,
    maxCfm: fans[0].maxCfm,
    direction: s.direction ?? 'intake',
    pwmPercent: s.pwmPercent ?? 75,
    hasRadiator: s.hasRadiator ?? false,
    liveCfm: 0,
  };
});

const slPhysics = calculateAirflowPhysics(aioCase, aioCooler, aioGpu, fullSlots);
const slDiagnostics = runAirflowDiagnostics(aioCase, aioCooler, aioGpu, fullSlots, slPhysics);

const foundShortLoop = slDiagnostics.some(d => d.id.startsWith('short-loop'));
console.log('Short-loop conflict detected:', foundShortLoop);
if (foundShortLoop) {
  console.log('✅ PASS: Short-looping conflict correctly identified on adjacent opposing slots.');
} else {
  console.error('❌ FAIL: Short-looping conflict NOT detected');
  process.exit(1);
}

console.log('\nAll state logic verification tests executed successfully!');
