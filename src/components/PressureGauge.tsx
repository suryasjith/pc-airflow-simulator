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
          label: 'Optimal Positive Pressure',
          sub: 'Gold Standard for Cooling & Dust Defense',
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400',
        };
      case 'strong-positive':
        return {
          label: 'Strong Positive Pressure',
          sub: 'High Dust Rejection / Passive Outflow',
          border: 'border-cyan-500/40',
          bg: 'bg-cyan-500/10',
          text: 'text-cyan-400',
          dot: 'bg-cyan-400',
        };
      case 'neutral':
        return {
          label: 'Neutral Pressure',
          sub: 'Balanced CFM / Minimal Gradient',
          border: 'border-yellow-500/40',
          bg: 'bg-yellow-500/10',
          text: 'text-yellow-400',
          dot: 'bg-yellow-400',
        };
      case 'slight-negative':
        return {
          label: 'Slight Negative Pressure',
          sub: 'Minor Dust Vacuum Tendency',
          border: 'border-amber-500/40',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          dot: 'bg-amber-400',
        };
      case 'strong-negative':
        return {
          label: 'Critical Negative Pressure',
          sub: 'Severe Dust Magnet / Air Starvation',
          border: 'border-red-500/40',
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          dot: 'bg-red-400 animate-ping',
        };
      default:
        return {
          label: 'Chassis Inactive',
          sub: 'Configure fans to measure internal pressure',
          border: 'border-slate-700',
          bg: 'bg-slate-900/50',
          text: 'text-slate-400',
          dot: 'bg-slate-500',
        };
    }
  };

  const badge = getPressureBadge();

  // Needle angle for analog visual gauge:
  // Range: Net CFM from -100 to +100 CFM maps to -75deg to +75deg
  const clampedNet = Math.max(-100, Math.min(100, netCfm));
  const needleAngle = (clampedNet / 100) * 75;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase font-mono">
              Pressure Dynamics Engine
            </h3>
            <p className="text-xs text-slate-400">CFM Differential & Thermal Telemetry</p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-2 ${badge.border} ${badge.bg} ${badge.text}`}>
          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
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
                  <stop offset="70%" stopColor="#10b981" />  {/* Optimal Positive */}
                  <stop offset="100%" stopColor="#06b6d4" /> {/* Strong Positive */}
                </linearGradient>
              </defs>
              
              {/* Background Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#1e293b"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Color Gradient Track */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* Center Pivot Point */}
              <circle cx="100" cy="100" r="7" fill="#38bdf8" />
              
              {/* Needle Indicator */}
              <g transform={`rotate(${needleAngle}, 100, 100)`} className="transition-transform duration-500 ease-out">
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="30"
                  stroke="#f8fafc"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <polygon points="100,22 96,32 104,32" fill="#38bdf8" />
              </g>
            </svg>
          </div>

          {/* Value Display */}
          <div className="text-center mt-1">
            <div className="text-2xl font-bold font-mono tracking-tight flex items-center justify-center gap-1">
              <span className={netCfm > 0 ? 'text-cyan-400' : netCfm < 0 ? 'text-red-400' : 'text-slate-400'}>
                {netCfm > 0 ? `+${netCfm}` : netCfm}
              </span>
              <span className="text-xs font-normal text-slate-400 uppercase">Net CFM</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 max-w-[210px] leading-tight">
              {pressureDescription}
            </div>
          </div>
        </div>

        {/* CFM Breakdown Cards */}
        <div className="md:col-span-7 grid grid-cols-2 gap-3">
          {/* Intake CFM */}
          <div className="bg-slate-950/60 border border-cyan-500/20 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                TOTAL INTAKE
              </span>
              <span className="text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                COLD
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {totalIntakeCfm}
              </span>
              <span className="text-xs text-slate-400">CFM</span>
            </div>
            <div className="mt-1 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalIntakeCfm / 250) * 100)}%` }}
              />
            </div>
          </div>

          {/* Exhaust CFM */}
          <div className="bg-slate-950/60 border border-red-500/20 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                TOTAL EXHAUST
              </span>
              <span className="text-[10px] bg-red-950/60 text-red-300 border border-red-800/40 px-1.5 py-0.5 rounded">
                WARM
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-red-300">
                {totalExhaustCfm}
              </span>
              <span className="text-xs text-slate-400">CFM</span>
            </div>
            <div className="mt-1 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-red-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalExhaustCfm / 250) * 100)}%` }}
              />
            </div>
          </div>

          {/* Air turnover rate */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-sky-400" />
              <div>
                <p className="text-xs font-mono text-slate-300">Air Turnover</p>
                <p className="text-[11px] text-slate-400">Chassis Vol Refresh</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-slate-100">
                {airExchangesPerMinute}x
              </span>
              <span className="text-[10px] text-slate-400 ml-1">/ min</span>
            </div>
          </div>

          {/* Dust Ingress Risk */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-4 h-4 ${dustTrapRisk >= 4 ? 'text-red-400' : dustTrapRisk === 1 ? 'text-emerald-400' : 'text-amber-400'}`} />
              <div>
                <p className="text-xs font-mono text-slate-300">Dust Vulnerability</p>
                <p className="text-[11px] text-slate-400">
                  {dustTrapRisk === 1 ? 'Zero Seam Suction' : dustTrapRisk >= 4 ? 'High Vacuum Trap' : 'Moderate Ingress'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-2 h-4 rounded-xs transition-colors ${
                    level <= dustTrapRisk
                      ? dustTrapRisk >= 4
                        ? 'bg-red-500'
                        : dustTrapRisk >= 3
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Thermal Impact Estimation Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center justify-between bg-slate-950/50 rounded-lg px-3 py-2 border border-slate-800/60">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-medium">Estimated CPU &Delta;T:</span>
          </div>
          <span className="font-mono font-semibold text-cyan-300">
            +{estimatedCpuDeltaT}°C <span className="text-[10px] text-slate-400">above ambient</span>
          </span>
        </div>

        <div className="flex items-center justify-between bg-slate-950/50 rounded-lg px-3 py-2 border border-slate-800/60">
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${gpuAirflowSufficiency === 'optimal' ? 'text-emerald-400' : gpuAirflowSufficiency === 'starved' ? 'text-red-400' : 'text-amber-400'}`} />
            <span className="text-slate-300 font-medium">Estimated GPU &Delta;T:</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className={gpuAirflowSufficiency === 'optimal' ? 'text-emerald-300' : gpuAirflowSufficiency === 'starved' ? 'text-red-300' : 'text-amber-300'}>
              +{estimatedGpuDeltaT}°C
            </span>
            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${
              gpuAirflowSufficiency === 'optimal'
                ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
                : gpuAirflowSufficiency === 'starved'
                ? 'border-red-500/30 bg-red-950/40 text-red-400'
                : 'border-amber-500/30 bg-amber-950/40 text-amber-400'
            }`}>
              {gpuAirflowSufficiency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
