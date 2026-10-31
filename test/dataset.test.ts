import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PCCase, CPUCooler, GPU, CaseFan } from '../src/types';
import { searchItems } from '../src/services/datasetService';

describe('AeroFlow Comprehensive Market Dataset & Search Engine', () => {
  const dataDir = path.resolve(process.cwd(), 'public/data');
  const cases: PCCase[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'cases.json'), 'utf-8'));
  const cpuCoolers: CPUCooler[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'cpu-coolers.json'), 'utf-8'));
  const gpus: GPU[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'video-cards.json'), 'utf-8'));
  const fans: CaseFan[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'case-fans.json'), 'utf-8'));

  it('validates comprehensive dataset size and real market coverage', () => {
    expect(cases.length).toBeGreaterThan(6000);
    expect(cpuCoolers.length).toBeGreaterThan(2500);
    expect(gpus.length).toBeGreaterThan(6000);
    expect(fans.length).toBeGreaterThan(2500);

    const totalParts = cases.length + cpuCoolers.length + gpus.length + fans.length;
    expect(totalParts).toBeGreaterThan(18000);
  });

  it('validates PCCase schema and Side mount support', () => {
    const sampleCase = cases[0];
    expect(sampleCase).toHaveProperty('id');
    expect(sampleCase).toHaveProperty('name');
    expect(sampleCase).toHaveProperty('formFactor');
    expect(sampleCase).toHaveProperty('volumeLiters');
    expect(sampleCase).toHaveProperty('frontPanelType');
    expect(sampleCase.mountCapacities).toHaveProperty('front');
    expect(sampleCase.mountCapacities).toHaveProperty('side');
    expect(sampleCase.mountCapacities).toHaveProperty('top');
    expect(sampleCase.mountCapacities).toHaveProperty('rear');
    expect(sampleCase.mountCapacities).toHaveProperty('bottom');

    const casesWithSide = cases.filter(c => c.mountCapacities.side.max120 > 0);
    expect(casesWithSide.length).toBeGreaterThan(1000);
  });

  it('validates CPUCooler schema separating AIOs and Air towers', () => {
    const aios = cpuCoolers.filter(c => c.type === 'aio');
    const airCoolers = cpuCoolers.filter(c => c.type === 'air');

    expect(aios.length).toBeGreaterThan(500);
    expect(airCoolers.length).toBeGreaterThan(500);

    const rad360 = aios.find(c => c.radiatorSizeMm === 360);
    expect(rad360).toBeDefined();
    expect(rad360?.fanCount).toBe(3);
  });

  it('validates GPU schema with TDP and cooling types', () => {
    const sampleGpu = gpus.find(g => g.name.includes('4090') || g.name.includes('5090'));
    expect(sampleGpu).toBeDefined();
    expect(sampleGpu?.tdpWatts).toBeGreaterThanOrEqual(450);
    expect(['open-air-triple', 'open-air-dual', 'blower', 'hybrid-aio']).toContain(sampleGpu?.coolingType);
  });

  it('validates CaseFan schema with CFM, static pressure, and acoustics', () => {
    const sampleFan = fans[0];
    expect(sampleFan).toHaveProperty('maxCfm');
    expect(sampleFan).toHaveProperty('staticPressure');
    expect(sampleFan).toHaveProperty('noiseDba');
    expect(sampleFan).toHaveProperty('maxRpm');
    expect(sampleFan.maxCfm).toBeGreaterThan(0);
  });

  it('executes multi-token fuzzy and exact search with scoring rank', () => {
    const results = searchItems(cases, 'Lian Li O11');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name.toLowerCase()).toContain('lian li');
    expect(results[0].name.toLowerCase()).toContain('o11');

    const emptyQuery = searchItems(cases, '');
    expect(emptyQuery.length).toBe(60); // default limit
  });
});
