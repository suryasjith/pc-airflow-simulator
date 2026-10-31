import React from 'react';
import { AirflowPhysicsResult } from '../types';
import { Wind, Gauge, ShieldAlert, Cpu, Flame } from 'lucide-react';

interface PressureGaugeProps {
  physics: AirflowPhysicsResult;
}

export const PressureGauge: React.FC<PressureGaugeProps> = ({ physics }) => {
  const {
    totalIntakeCfm,
    totalExhaustCfm,
    netCfm,
    pressureType,
    pressureDescription,
    dustTrapRisk,
    airExchangesPerMinute,
    estimatedCpuDeltaT,
    estimatedGpuDeltaT,
    gpuAirflowSufficiency,
  } = physics;

  // Pressure badge styling
  const getPressureBadge = () => {
    switch (pressureType) {
      case 'slight-positive':
        return {
          label: 'OPTIMAL POSITIVE EQUILIBRIUM',
          sub: 'Gold standard for laminar flow & continuous dust rejection.',
          border: 'border-[#00ff9d]/50',
          bg: 'bg-[#00ff9d]/10',
          text: 'text-[#00ff9d]',
        };
      case 'strong-positive':
        return {
          label: 'STRONG POSITIVE PRESSURE',
          sub: 'High dust rejection. Verify exhaust velocity is adequate.',
          border: 'border-[#00f0ff]/50',
          bg: 'bg-[#00f0ff]/10',
          text: 'text-[#00f0ff]',
        };
      case 'neutral':
        return {
          label: 'NEUTRAL PRESSURE EQUILIBRIUM',
          sub: 'Balanced CFM. Ambient room drift may enter unsealed seams.',
          border: 'border-yellow-500/50',
          bg: 'bg-yellow-500/10',
          text: 'text-yellow-400',
        };
      case 'slight-negative':
        return {
          label: 'SLIGHT NEGATIVE GRADIENT',
          sub: 'Minor vacuum. Dust seeps through rear unsealed PCIe brackets.',
          border: 'border-amber-500/50',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
        };
      case 'strong-negative':
        return {
          label: 'CRITICAL VACUUM HAZARD',
          sub: 'Severe negative pressure. Starves components and ingests dust.',
          border: 'border-red-500/70',
          bg: 'bg-red-500/15',
          text: 'text-red-400',
        };
      default:
        return {
          label: 'CHASSIS INACTIVE',
          sub: 'Mount active fans to initialize telemetry calculations.',
          border: 'border-zinc-800',
          bg: 'bg-black',
          text: 'text-zinc-500',
        };
    }
  };

  const badge = getPressureBadge();

  // Needle angle for analog visual gauge:
  // Range: Net CFM from -100 to +100 CFM maps to -75deg to +75deg
  const clampedNet = Math.max(-100, Math.min(100, netCfm));
  const needleAngle = (clampedNet / 100) * 75;

  return (
    <div className="bg-[#0b0d13] border border-zinc-800 p-5 hard-shadow flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff]">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wider uppercase font-mono">
              Pressure Dynamics Engine
            </h3>
            <p className="text-xs text-zinc-400 font-mono">CFM Differential & Telemetry</p>
          </div>
        </div>

        <div className={`px-2.5 py-1 border text-[11px] font-mono font-bold flex items-center gap-2 ${badge.border} ${badge.bg} ${badge.text}`}>
          <span className="w-1.5 h-1.5 bg-current animate-pulse" />
          {badge.label}
        </div>
      </div>

      {/* Main Gauge & CFM Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Analog / Radial Pressure Dial */}
        <div className="md:col-span-5 flex flex-col items-center justify-center py-2 relative">
          <div className="relative w-48 h-28 overflow-hidden flex items-end justify-center">
            {/* Curved Gauge Arc SVG */}
            <svg viewBox="0 0 200 110" className="w-48 h-28">
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />   {/* Strong Negative */}
                  <stop offset="35%" stopColor="#f59e0b" />  {/* Slight Negative */}
                  <stop offset="50%" stopColor="#eab308" />  {/* Neutral */}
                  <stop offset="70%" stopColor="#00ff9d" />  {/* Optimal Positive */}
                  <stop offset="100%" stopColor="#00f0ff" /> {/* Strong Positive */}
                </linearGradient>
              </defs>
              
              {/* Background Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#18181b"
                strokeWidth="14"
              />

              {/* Color Gradient Track */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth="8"
                opacity="0.9"
              />

              {/* Center Pivot Point */}
              <circle cx="100" cy="100" r="7" fill="#27272a" stroke="#00f0ff" strokeWidth="1.5" />
              
              {/* Needle Indicator */}
              <g transform={`rotate(${needleAngle}, 100, 100)`} className="transition-transform duration-300 ease-out">
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="30"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
                <polygon points="100,20 96,30 104,30" fill="#00f0ff" />
              </g>

              {/* Graduation Tick Marks */}
              <text x="25" y="105" fill="#71717a" fontSize="8" fontFamily="JetBrains Mono">-100</text>
              <text x="100" y="28" fill="#71717a" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">0</text>
              <text x="175" y="105" fill="#71717a" fontSize="8" fontFamily="JetBrains Mono" textAnchor="end">+100</text>
            </svg>
          </div>

          {/* Value Display */}
          <div className="text-center mt-1">
            <div className="text-2xl font-bold font-mono tracking-tight flex items-center justify-center gap-1.5">
              <span className={netCfm > 0 ? 'text-[#00f0ff]' : netCfm < 0 ? 'text-red-400' : 'text-zinc-400'}>
                {netCfm > 0 ? `+${netCfm}` : netCfm}
              </span>
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Net CFM</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5 max-w-[240px] leading-tight">
              {pressureDescription}
            </div>
          </div>
        </div>

        {/* CFM Breakdown Telemetry Cards */}
        <div className="md:col-span-7 grid grid-cols-2 gap-3">
          {/* Intake CFM */}
          <div className="bg-black border border-[#00f0ff]/30 p-3 flex flex-col justify-between relative overflow-hidden hard-shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5 text-[#00f0ff] font-bold">
                <span className="w-1.5 h-1.5 bg-[#00f0ff]" />
                TOTAL INTAKE
              </span>
              <span className="text-[9px] bg-[#002b36] text-[#00f0ff] border border-[#00f0ff]/50 px-1 py-0.2 uppercase font-semibold">
                COLD
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-white">
                {totalIntakeCfm}
              </span>
              <span className="text-xs font-mono text-zinc-500">CFM</span>
            </div>
            <div className="mt-1.5 w-full bg-zinc-900 h-1.5 overflow-hidden">
              <div
                className="bg-[#00f0ff] h-1.5 transition-all duration-300"
                style={{ width: `${Math.min(100, (totalIntakeCfm / 250) * 100)}%` }}
              />
            </div>
          </div>

          {/* Exhaust CFM */}
          <div className="bg-black border border-red-500/30 p-3 flex flex-col justify-between relative overflow-hidden hard-shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5 text-red-400 font-bold">
                <span className="w-1.5 h-1.5 bg-red-400" />
                TOTAL EXHAUST
              </span>
              <span className="text-[9px] bg-[#3b0808] text-red-300 border border-red-500/50 px-1 py-0.2 uppercase font-semibold">
                WARM
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-white">
                {totalExhaustCfm}
              </span>
              <span className="text-xs font-mono text-zinc-500">CFM</span>
            </div>
            <div className="mt-1.5 w-full bg-zinc-900 h-1.5 overflow-hidden">
              <div
                className="bg-red-400 h-1.5 transition-all duration-300"
                style={{ width: `${Math.min(100, (totalExhaustCfm / 250) * 100)}%` }}
              />
            </div>
          </div>

          {/* Air turnover rate */}
          <div className="bg-black border border-zinc-800 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-[#00f0ff]" />
              <div>
                <p className="text-xs font-mono font-bold text-zinc-300 uppercase">Air Turnover</p>
                <p className="text-[10px] font-mono text-zinc-500">Chassis Vol Refresh</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold font-mono text-white">
                {airExchangesPerMinute}x
              </span>
              <span className="text-[10px] font-mono text-zinc-500 ml-1">/ min</span>
            </div>
          </div>

          {/* Dust Ingress Risk */}
          <div className="bg-black border border-zinc-800 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-4 h-4 ${dustTrapRisk >= 4 ? 'text-red-400' : dustTrapRisk === 1 ? 'text-[#00ff9d]' : 'text-amber-400'}`} />
              <div>
                <p className="text-xs font-mono font-bold text-zinc-300 uppercase">Dust Vulnerability</p>
                <p className="text-[10px] font-mono text-zinc-500">
                  {dustTrapRisk === 1 ? 'Zero Seam Suction' : dustTrapRisk >= 4 ? 'High Vacuum Trap' : 'Moderate Ingress'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-2 h-4 transition-colors ${
                    level <= dustTrapRisk
                      ? dustTrapRisk >= 4
                        ? 'bg-red-500'
                        : dustTrapRisk >= 3
                        ? 'bg-amber-400'
                        : 'bg-[#00ff9d]'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Thermal Impact Estimation Bar */}
      <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <div className="flex items-center justify-between bg-black px-3 py-2 border border-zinc-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#00f0ff]" />
            <span className="text-zinc-300">Estimated CPU &Delta;T:</span>
          </div>
          <span className="font-bold text-[#00f0ff]">
            +{estimatedCpuDeltaT}°C <span className="text-[10px] text-zinc-500 font-normal">above ambient</span>
          </span>
        </div>

        <div className="flex items-center justify-between bg-black px-3 py-2 border border-zinc-800">
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${gpuAirflowSufficiency === 'optimal' ? 'text-[#00ff9d]' : gpuAirflowSufficiency === 'starved' ? 'text-red-400' : 'text-amber-400'}`} />
            <span className="text-zinc-300">Estimated GPU &Delta;T:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={gpuAirflowSufficiency === 'optimal' ? 'text-[#00ff9d] font-bold' : gpuAirflowSufficiency === 'starved' ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
              +{estimatedGpuDeltaT}°C
            </span>
            <span className={`text-[10px] uppercase px-1.5 py-0.5 border ${
              gpuAirflowSufficiency === 'optimal'
                ? 'border-[#00ff9d]/40 bg-[#00ff9d]/10 text-[#00ff9d]'
                : gpuAirflowSufficiency === 'starved'
                ? 'border-red-500/40 bg-red-950/40 text-red-400'
                : 'border-amber-500/40 bg-amber-950/40 text-amber-400'
            }`}>
              {gpuAirflowSufficiency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
