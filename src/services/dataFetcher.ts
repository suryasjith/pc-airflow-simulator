import { PCCase, CPUCooler, GPU, CaseFan } from '../types';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/docyx/pc-part-dataset/main/data/json';

interface RawCase {
  name: string;
  price?: number | null;
  type?: string | null;
  color?: string | null;
  psu?: number | null;
  side_panel?: string | null;
  external_volume?: number | null;
  internal_35_bays?: number | null;
}

interface RawCooler {
  name: string;
  price?: number | null;
  rpm?: number | [number, number] | null;
  noise_level?: number | [number, number] | null;
  color?: string | null;
  size?: number | null;
}

interface RawGpu {
  name: string;
  price?: number | null;
  chipset?: string | null;
  memory?: number | null;
  core_clock?: number | null;
  boost_clock?: number | null;
  color?: string | null;
  length?: number | null;
}

interface RawFan {
  name: string;
  price?: number | null;
  size?: number | null;
  color?: string | null;
  rpm?: number | [number, number] | null;
  airflow?: number | [number, number] | null;
  noise_level?: number | [number, number] | null;
  pwm?: boolean | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-');
}

async function fetchFromNetwork<T>(fileName: string): Promise<T[]> {
  // Try GitHub first, then local public/data fallback
  const githubUrl = `${GITHUB_RAW_BASE}/${fileName}`;
  try {
    const res = await fetch(githubUrl);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn(`Direct fetch from ${githubUrl} failed, trying local mirror:`, e);
  }

  // Fallback to local /data/ mirror
  const localFileName = fileName === 'case.json' ? 'cases.json'
    : fileName === 'cpu-cooler.json' ? 'cpu-coolers.json'
    : fileName === 'video-card.json' ? 'video-cards.json'
    : 'case-fans.json';

  const localRes = await fetch(`/data/${localFileName}`);
  if (!localRes.ok) {
    throw new Error(`Failed to load ${fileName} from both GitHub and local mirror`);
  }
  return await localRes.json();
}

let cachedMarketData: {
  cases: PCCase[];
  cpuCoolers: CPUCooler[];
  gpus: GPU[];
  fans: CaseFan[];
} | null = null;

export async function fetchComprehensiveMarketData(): Promise<{
  cases: PCCase[];
  cpuCoolers: CPUCooler[];
  gpus: GPU[];
  fans: CaseFan[];
}> {
  if (cachedMarketData) {
    return cachedMarketData;
  }

  const [rawCases, rawCoolers, rawGpus, rawFans] = await Promise.all([
    fetchFromNetwork<RawCase>('case.json'),
    fetchFromNetwork<RawCooler>('cpu-cooler.json'),
    fetchFromNetwork<RawGpu>('video-card.json'),
    fetchFromNetwork<RawFan>('case-fan.json'),
  ]);

  // 1. Parse Cases with Side Mount Support
  const seenCaseIds = new Set<string>();
  const parsedCases: PCCase[] = rawCases
    .filter((c) => c.name && typeof c.name === 'string')
    .map((c, idx) => {
      let id = slugify(c.name);
      if (seenCaseIds.has(id)) id = `${id}-${idx}`;
      seenCaseIds.add(id);

      const typeStr = (c.type || '').toLowerCase();
      let formFactor: 'ATX' | 'Micro-ATX' | 'Mini-ITX' | 'E-ATX' = 'ATX';
      if (typeStr.includes('full') || typeStr.includes('e-atx')) formFactor = 'E-ATX';
      else if (typeStr.includes('mini-itx') || typeStr.includes('mini itx') || typeStr.includes('desktop')) formFactor = 'Mini-ITX';
      else if (typeStr.includes('microatx') || typeStr.includes('micro-atx') || typeStr.includes('micro')) formFactor = 'Micro-ATX';

      const nameLower = c.name.toLowerCase();
      let frontPanelType: 'mesh' | 'solid-glass' | 'perforated' = 'mesh';
      const isDualGlassChamber =
        nameLower.includes('vision') ||
        nameLower.includes('o11') ||
        nameLower.includes('y70') ||
        nameLower.includes('y60') ||
        nameLower.includes('view') ||
        nameLower.includes('nv7') ||
        nameLower.includes('nv5') ||
        nameLower.includes('h9') ||
        nameLower.includes('h6') ||
        nameLower.includes('king 95') ||
        nameLower.includes('glass');

      if (isDualGlassChamber) {
        frontPanelType = 'solid-glass';
      } else if (nameLower.includes('flow') || nameLower.includes('mesh') || nameLower.includes('air') || nameLower.includes('torrent')) {
        frontPanelType = 'mesh';
      } else {
        frontPanelType = 'perforated';
      }

      const volumeLiters = typeof c.external_volume === 'number' && c.external_volume > 0
        ? c.external_volume
        : (formFactor === 'E-ATX' ? 68 : formFactor === 'Micro-ATX' ? 36 : formFactor === 'Mini-ITX' ? 18 : 48);

      // Side mounts: dual-chamber showcase cases have 3 side slots; full towers have 3; mid towers have 2
      const sideCap = isDualGlassChamber || formFactor === 'E-ATX' || nameLower.includes('5000d')
        ? { max120: 3, max140: 2, maxRadMm: 360 }
        : formFactor === 'ATX'
        ? { max120: 2, max140: 0, maxRadMm: 240 }
        : { max120: 0, max140: 0, maxRadMm: 0 };

      const frontCap = isDualGlassChamber
        ? { max120: 0, max140: 0, maxRadMm: 0 }
        : formFactor === 'E-ATX'
        ? { max120: 3, max140: 3, maxRadMm: 420 }
        : formFactor === 'ATX'
        ? { max120: 3, max140: 2, maxRadMm: 360 }
        : formFactor === 'Micro-ATX'
        ? { max120: 2, max140: 2, maxRadMm: 280 }
        : { max120: 2, max140: 0, maxRadMm: 240 };

      const topCap = formFactor === 'E-ATX' || formFactor === 'ATX' || isDualGlassChamber
        ? { max120: 3, max140: 2, maxRadMm: 360 }
        : formFactor === 'Micro-ATX'
        ? { max120: 2, max140: 2, maxRadMm: 240 }
        : { max120: 2, max140: 0, maxRadMm: 240 };

      const bottomCap = isDualGlassChamber || formFactor === 'E-ATX'
        ? { max120: 3, max140: 2, maxRadMm: 360 }
        : formFactor === 'ATX'
        ? { max120: 2, max140: 0, maxRadMm: 240 }
        : { max120: 2, max140: 0, maxRadMm: 0 };

      const rearCap = formFactor === 'Mini-ITX'
        ? { max120: 1, max140: 0, maxRadMm: 0 }
        : { max120: 1, max140: formFactor === 'E-ATX' ? 1 : 0, maxRadMm: 120 };

      const brand = c.name.split(' ')[0] || 'Generic';

      return {
        id,
        name: c.name,
        brand,
        formFactor,
        volumeLiters,
        frontPanelType,
        filterImpedance: {
          front: true,
          side: true,
          top: true,
          bottom: true,
        },
        mountCapacities: {
          front: frontCap,
          side: sideCap,
          top: topCap,
          rear: rearCap,
          bottom: bottomCap,
        },
        description: `${c.type || 'Chassis'} with ${c.side_panel || 'standard panel'}, ${volumeLiters}L external volume.`,
      };
    });

  // 2. Parse Coolers
  const seenCoolerIds = new Set<string>();
  const parsedCoolers: CPUCooler[] = rawCoolers
    .filter((c) => c.name && typeof c.name === 'string')
    .map((c, idx) => {
      let id = slugify(c.name);
      if (seenCoolerIds.has(id)) id = `${id}-${idx}`;
      seenCoolerIds.add(id);

      const nameLower = c.name.toLowerCase();
      const isAio =
        (typeof c.size === 'number' && c.size >= 120) ||
        nameLower.includes('liquid') ||
        nameLower.includes('kraken') ||
        nameLower.includes('aio') ||
        nameLower.includes('freezer') ||
        nameLower.includes('hydro') ||
        nameLower.includes('aqua') ||
        nameLower.includes('galahad') ||
        nameLower.includes('masterliquid') ||
        nameLower.includes('nautilus') ||
        nameLower.includes('ryujin');

      let radiatorSizeMm: 120 | 240 | 280 | 360 | 420 | undefined = undefined;
      let fanCount = 1;
      let fanSizeMm: 120 | 140 = 120;
      let fanCfm = 65;
      let tdpRating = 200;

      if (isAio) {
        if (typeof c.size === 'number' && [120, 240, 280, 360, 420].includes(c.size)) {
          radiatorSizeMm = c.size as any;
        } else if (nameLower.includes('420')) radiatorSizeMm = 420;
        else if (nameLower.includes('360')) radiatorSizeMm = 360;
        else if (nameLower.includes('280')) radiatorSizeMm = 280;
        else if (nameLower.includes('240')) radiatorSizeMm = 240;
        else if (nameLower.includes('120')) radiatorSizeMm = 120;
        else radiatorSizeMm = 360;

        if (radiatorSizeMm === 420) {
          fanCount = 3;
          fanSizeMm = 140;
          fanCfm = 92;
          tdpRating = 350;
        } else if (radiatorSizeMm === 360) {
          fanCount = 3;
          fanSizeMm = 120;
          fanCfm = 68;
          tdpRating = 300;
        } else if (radiatorSizeMm === 280) {
          fanCount = 2;
          fanSizeMm = 140;
          fanCfm = 88;
          tdpRating = 280;
        } else if (radiatorSizeMm === 240) {
          fanCount = 2;
          fanSizeMm = 120;
          fanCfm = 65;
          tdpRating = 240;
        } else {
          fanCount = 1;
          fanSizeMm = 120;
          fanCfm = 58;
          tdpRating = 180;
        }
      } else {
        const isDualTower =
          nameLower.includes('peerless') ||
          nameLower.includes('nh-d15') ||
          nameLower.includes('phantom spirit') ||
          nameLower.includes('dark rock pro') ||
          nameLower.includes('ak620') ||
          nameLower.includes('frozn a620') ||
          nameLower.includes('twin');

        if (isDualTower) {
          fanCount = 2;
          fanSizeMm = nameLower.includes('d15') || nameLower.includes('140') ? 140 : 120;
          fanCfm = fanSizeMm === 140 ? 82 : 68;
          tdpRating = 250;
        } else {
          fanCount = 1;
          fanSizeMm = 120;
          fanCfm = 62;
          tdpRating = 180;
        }
      }

      const brand = c.name.split(' ')[0] || 'Generic';

      return {
        id,
        name: c.name,
        brand,
        type: isAio ? ('aio' as const) : ('air' as const),
        radiatorSizeMm,
        fanSizeMm,
        fanCount,
        fanCfm,
        tdpRating,
        description: `${isAio ? `${radiatorSizeMm}mm Liquid AIO` : 'Air Tower'} Cooler, ${tdpRating}W TDP rated.`,
      };
    });

  // 3. Parse GPUs
  const seenGpuIds = new Set<string>();
  const parsedGpus: GPU[] = rawGpus
    .filter((g) => g.name && typeof g.name === 'string')
    .map((g, idx) => {
      let id = slugify(g.name);
      if (seenGpuIds.has(id)) id = `${id}-${idx}`;
      seenGpuIds.add(id);

      const nameLower = g.name.toLowerCase();
      const chipLower = (g.chipset || '').toLowerCase();

      let tdpWatts = 200;
      if (chipLower.includes('5090')) tdpWatts = 600;
      else if (chipLower.includes('4090')) tdpWatts = 450;
      else if (chipLower.includes('5080')) tdpWatts = 400;
      else if (chipLower.includes('4080')) tdpWatts = 320;
      else if (chipLower.includes('7900 xtx')) tdpWatts = 355;
      else if (chipLower.includes('7900 xt')) tdpWatts = 315;
      else if (chipLower.includes('9070 xt')) tdpWatts = 330;
      else if (chipLower.includes('9070')) tdpWatts = 280;
      else if (chipLower.includes('5070 ti')) tdpWatts = 300;
      else if (chipLower.includes('5070')) tdpWatts = 250;
      else if (chipLower.includes('4070 ti')) tdpWatts = 285;
      else if (chipLower.includes('4070')) tdpWatts = 200;
      else if (chipLower.includes('7800 xt')) tdpWatts = 263;
      else if (chipLower.includes('5060 ti')) tdpWatts = 180;
      else if (chipLower.includes('5060')) tdpWatts = 135;
      else if (chipLower.includes('4060 ti')) tdpWatts = 160;
      else if (chipLower.includes('4060')) tdpWatts = 115;
      else if (chipLower.includes('3090')) tdpWatts = 350;
      else if (chipLower.includes('3080')) tdpWatts = 320;
      else if (chipLower.includes('3070')) tdpWatts = 220;
      else if (chipLower.includes('3060')) tdpWatts = 170;
      else if (chipLower.includes('6600')) tdpWatts = 132;
      else if (typeof g.length === 'number') {
        tdpWatts = g.length > 310 ? 320 : g.length > 260 ? 220 : 160;
      }

      const lengthMm = typeof g.length === 'number' && g.length > 0 ? g.length : 280;

      let coolingType: 'open-air-triple' | 'open-air-dual' | 'blower' | 'hybrid-aio' = 'open-air-dual';
      let exhaustRatio = 0.15;

      if (nameLower.includes('waterforce') || nameLower.includes('liquid') || nameLower.includes('hybrid') || nameLower.includes('aio')) {
        coolingType = 'hybrid-aio';
        exhaustRatio = 0.65;
      } else if (nameLower.includes('blower') || nameLower.includes('turbo') || nameLower.includes('aero itx') || nameLower.includes('workstation')) {
        coolingType = 'blower';
        exhaustRatio = 0.85;
      } else if (lengthMm >= 285 || nameLower.includes('3x') || nameLower.includes('trio') || nameLower.includes('strix') || nameLower.includes('gaming oc') || nameLower.includes('aorus') || nameLower.includes('phantom')) {
        coolingType = 'open-air-triple';
        exhaustRatio = 0.18;
      }

      const brand = g.name.split(' ')[0] || 'Generic';

      return {
        id,
        name: g.name,
        brand,
        coolingType,
        tdpWatts,
        lengthMm,
        exhaustRatio,
        description: `${g.chipset || 'Graphics Card'}, ${tdpWatts}W TDP, ${lengthMm}mm length (${coolingType.replace(/-/g, ' ')}).`,
      };
    });

  // 4. Parse Fans
  const seenFanIds = new Set<string>();
  const parsedFans: CaseFan[] = rawFans
    .filter((f) => f.name && typeof f.name === 'string')
    .map((f, idx) => {
      let id = slugify(f.name);
      if (seenFanIds.has(id)) id = `${id}-${idx}`;
      seenFanIds.add(id);

      const sizeMm: 120 | 140 = (f.size === 140 ? 140 : 120) as 120 | 140;

      let maxCfm = sizeMm === 140 ? 82.0 : 62.0;
      if (Array.isArray(f.airflow) && f.airflow.length > 0) {
        const val = Math.max(...f.airflow.filter((x): x is number => typeof x === 'number'));
        if (val > 0) maxCfm = Math.round(val * 10) / 10;
      } else if (typeof f.airflow === 'number' && f.airflow > 0) {
        maxCfm = Math.round(f.airflow * 10) / 10;
      }

      let maxRpm = sizeMm === 140 ? 1800 : 2000;
      if (Array.isArray(f.rpm) && f.rpm.length > 0) {
        const val = Math.max(...f.rpm.filter((x): x is number => typeof x === 'number'));
        if (val > 0) maxRpm = val;
      } else if (typeof f.rpm === 'number' && f.rpm > 0) {
        maxRpm = f.rpm;
      }

      let noiseDba = 28.0;
      if (Array.isArray(f.noise_level) && f.noise_level.length > 0) {
        const val = Math.max(...f.noise_level.filter((x): x is number => typeof x === 'number'));
        if (val > 0) noiseDba = val;
      } else if (typeof f.noise_level === 'number' && f.noise_level > 0) {
        noiseDba = f.noise_level;
      }

      const staticPressure = Math.round((maxCfm / (sizeMm === 140 ? 30 : 25)) * 100) / 100;
      const brand = f.name.split(' ')[0] || 'Generic';

      return {
        id,
        name: f.name,
        brand,
        sizeMm,
        maxCfm,
        staticPressure,
        noiseDba,
        maxRpm,
        description: `${sizeMm}mm fan delivering ${maxCfm} CFM at ${maxRpm} RPM (${noiseDba} dBA).`,
      };
    });

  cachedMarketData = {
    cases: parsedCases,
    cpuCoolers: parsedCoolers,
    gpus: parsedGpus,
    fans: parsedFans,
  };

  return cachedMarketData;
}
