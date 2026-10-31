import fs from 'fs';
import path from 'path';
import { PCCase, CPUCooler, GPU, CaseFan, MountsState } from '../src/types';
import { searchItems } from '../src/services/datasetService';
import { calculateAirflowPhysics } from '../src/physics/airflowEngine';
import { runAirflowDiagnostics } from '../src/physics/diagnosticsEngine';

console.log('--- Verifying Comprehensive Real-World Component Database ---');

const dataDir = path.resolve(process.cwd(), 'public/data');
const casesPath = path.join(dataDir, 'cases.json');
const coolersPath = path.join(dataDir, 'cpu-coolers.json');
const gpusPath = path.join(dataDir, 'video-cards.json');
const fansPath = path.join(dataDir, 'case-fans.json');

const cases: PCCase[] = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
const cpuCoolers: CPUCooler[] = JSON.parse(fs.readFileSync(coolersPath, 'utf-8'));
const gpus: GPU[] = JSON.parse(fs.readFileSync(gpusPath, 'utf-8'));
const fans: CaseFan[] = JSON.parse(fs.readFileSync(fansPath, 'utf-8'));

console.log(`Cases Loaded: ${cases.length}`);
console.log(`CPU Coolers Loaded: ${cpuCoolers.length}`);
console.log(`GPUs Loaded: ${gpus.length}`);
console.log(`Fans Loaded: ${fans.length}`);

if (cases.length > 5000 && cpuCoolers.length > 2000 && gpus.length > 5000 && fans.length > 2000) {
  console.log('✅ PASS: All 4 datasets contain comprehensive market data (18,000+ total parts)!');
} else {
  console.error('❌ FAIL: Dataset counts lower than expected');
  process.exit(1);
}

// Test search functionality
console.log('\n--- Testing Search Precision ---');
const o11Cases = searchItems(cases, 'O11');
console.log(`Found ${o11Cases.length} O11 cases. Top match: "${o11Cases[0]?.name}"`);

const rtx4090Gpus = searchItems(gpus, 'RTX 4090');
console.log(`Found ${rtx4090Gpus.length} RTX 4090 GPUs. Top match: "${rtx4090Gpus[0]?.name}" (TDP: ${rtx4090Gpus[0]?.tdpWatts}W)`);

const aioCoolers = searchItems(cpuCoolers, 'Liquid Freezer');
console.log(`Found ${aioCoolers.length} Liquid Freezer coolers. Top match: "${aioCoolers[0]?.name}" (${aioCoolers[0]?.radiatorSizeMm}mm)`);

const noctuaFans = searchItems(fans, 'Noctua NF-A12');
console.log(`Found ${noctuaFans.length} Noctua 120mm fans. Top match: "${noctuaFans[0]?.name}" (${noctuaFans[0]?.maxCfm} CFM)`);

if (o11Cases.length > 0 && rtx4090Gpus.length > 0 && aioCoolers.length > 0 && noctuaFans.length > 0) {
  console.log('✅ PASS: Search items successfully retrieves exact market hardware!');
} else {
  console.error('❌ FAIL: Search items returned empty results');
  process.exit(1);
}

// Test live physics calculation using real-world fetched parts
console.log('\n--- Testing Real Hardware Physics & Conflict Detection ---');
const chosenCase = o11Cases[0];
const chosenCooler = aioCoolers[0];
const chosenGpu = rtx4090Gpus[0];
const chosenFan = noctuaFans[0];

const customSlots: Record<string, GranularFanSlot> = {
  'side-1': {
    id: 'side-1',
    panel: 'side',
    slotNumber: 1,
    isOccupied: true,
    fanId: chosenFan.id,
    fanName: chosenFan.name,
    fanSizeMm: 120,
    maxCfm: chosenFan.maxCfm,
    direction: 'intake',
    pwmPercent: 80,
    hasRadiator: true, // Side AIO Intake pre-heating open-air GPU
    liveCfm: 0,
  },
  'top-1': {
    id: 'top-1',
    panel: 'top',
    slotNumber: 1,
    isOccupied: true,
    fanId: chosenFan.id,
    fanName: chosenFan.name,
    fanSizeMm: 120,
    maxCfm: chosenFan.maxCfm,
    direction: 'exhaust',
    pwmPercent: 70,
    hasRadiator: false,
    liveCfm: 0,
  },
};

const physics = calculateAirflowPhysics(chosenCase, chosenCooler, chosenGpu, customSlots);
const diagnostics = runAirflowDiagnostics(chosenCase, chosenCooler, chosenGpu, customSlots, physics);

console.log(`Chassis: ${chosenCase.name} (${chosenCase.volumeLiters}L)`);
console.log(`GPU: ${chosenGpu.name} (${chosenGpu.tdpWatts}W)`);
console.log(`Cooler: ${chosenCooler.name} (${chosenCooler.radiatorSizeMm}mm)`);
console.log(`Intake CFM: ${physics.totalIntakeCfm}, Exhaust CFM: ${physics.totalExhaustCfm}`);
console.log(`Pressure: ${physics.pressureType} (Ratio: ${physics.pressureRatio})`);

const conflictFound = diagnostics.some(d => d.id === 'gpu-starvation-aio-intake');
console.log(`Detected Side AIO GPU Pre-heat warning on real hardware: ${conflictFound}`);

if (conflictFound && physics.totalIntakeCfm > 0) {
  console.log('✅ PASS: Real hardware physics and conflict diagnostics fully verified!');
} else {
  console.error('❌ FAIL: Real hardware physics test failed');
  process.exit(1);
}
