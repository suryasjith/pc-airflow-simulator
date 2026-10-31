import React, { useRef, useEffect, useState } from 'react';
import {
  PCCase,
  CPUCooler,
  GPU,
  GranularFanSlot,
  AirflowPhysicsResult,
} from '../types';
import { Play, Pause, Flame } from 'lucide-react';

interface ChassisVisualizerProps {
  selectedCase: PCCase | null;
  cpuCooler: CPUCooler | null;
  gpu: GPU | null;
  slots: Record<string, GranularFanSlot>;
  physics: AirflowPhysicsResult;
  onToggleSlotDirection: (slotId: string) => void;
}

interface StreamlineParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  temp: number; // 0.0 (ambient) to 1.0 (hot)
  life: number;
  maxLife: number;
  size: number;
  isDust?: boolean;
}

export const ChassisVisualizer: React.FC<ChassisVisualizerProps> = ({
  selectedCase,
  cpuCooler,
  gpu,
  slots,
  physics,
  onToggleSlotDirection,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showThermalOverlay, setShowThermalOverlay] = useState(true);

  const particlesRef = useRef<StreamlineParticle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const width = 800;
    const height = 520;
    canvas.width = width;
    canvas.height = height;

    const caseBounds = {
      x: 170,
      y: 70,
      w: 480,
      h: 380,
    };

    const cpuCenter = { x: 380, y: 170 };
    const gpuBounds = { x: 300, y: 280, w: 260, h: 55 };

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      if (!isPlaying) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const particles = particlesRef.current;

      // Particle spawn logic for each active slot
      Object.values(slots).forEach((slot) => {
        if (!slot.isOccupied || slot.pwmPercent <= 0 || slot.liveCfm <= 0) return;

        const spawnRate = (slot.liveCfm / 60) * 1.5;

        if (slot.direction === 'intake') {
          // Intake emits particles into the chassis
          for (let i = 0; i < spawnRate; i++) {
            let sx = 0, sy = 0, svx = 0, svy = 0;

            if (slot.panel === 'front') {
              sx = caseBounds.x + caseBounds.w - 12;
              sy = caseBounds.y + 70 + (slot.slotNumber - 1) * 85 + (Math.random() - 0.5) * 30;
              svx = -(110 + (slot.pwmPercent / 100) * 100);
              svy = (Math.random() - 0.5) * 20;
            } else if (slot.panel === 'side') {
              sx = caseBounds.x + caseBounds.w - 85;
              sy = caseBounds.y + 60 + (slot.slotNumber - 1) * 80 + (Math.random() - 0.5) * 25;
              svx = -(90 + (slot.pwmPercent / 100) * 80);
              svy = (Math.random() - 0.5) * 35;
            } else if (slot.panel === 'bottom') {
              sx = caseBounds.x + 120 + (slot.slotNumber - 1) * 85 + (Math.random() - 0.5) * 30;
              sy = caseBounds.y + caseBounds.h - 12;
              svx = -(20 + Math.random() * 30);
              svy = -(90 + (slot.pwmPercent / 100) * 90);
            } else if (slot.panel === 'top') {
              sx = caseBounds.x + 120 + (slot.slotNumber - 1) * 90 + (Math.random() - 0.5) * 30;
              sy = caseBounds.y + 12;
              svx = (Math.random() - 0.5) * 30;
              svy = 90 + (slot.pwmPercent / 100) * 80;
            } else if (slot.panel === 'rear') {
              sx = caseBounds.x + 12;
              sy = caseBounds.y + 80 + (Math.random() - 0.5) * 30;
              svx = 90 + (slot.pwmPercent / 100) * 80;
              svy = (Math.random() - 0.5) * 20;
            }

            particles.push({
              x: sx,
              y: sy,
              vx: svx,
              vy: svy,
              temp: slot.hasRadiator ? 0.48 : 0.0, // Radiator pre-heats incoming intake air!
              life: 0,
              maxLife: 2.2 + Math.random() * 0.8,
              size: 2.2 + Math.random() * 1.3,
            });
          }
        }
      });

      // Dust Ingress if Extreme Negative Pressure
      if (physics.pressureType === 'strong-negative') {
        for (let i = 0; i < 2; i++) {
          particles.push({
            x: caseBounds.x + 5,
            y: caseBounds.y + 220 + Math.random() * 120,
            vx: 45 + Math.random() * 50,
            vy: (Math.random() - 0.5) * 30,
            temp: 0.3,
            life: 0,
            maxLife: 2.4,
            size: 2.0,
            isDust: true,
          });
        }
      }

      // Check for Short-Looping pairs on Top or Front panel
      const topSlots = physics.panelBreakdown.top.slots.filter((s) => s.isOccupied && s.pwmPercent > 0);
      let isTopShortLooping = false;
      for (let i = 0; i < topSlots.length - 1; i++) {
        if (topSlots[i].direction !== topSlots[i + 1].direction) {
          isTopShortLooping = true;
          break;
        }
      }

      // Update & Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Convection: hot air rises
        p.vy -= p.temp * 40 * dt;

        // Short-Looping eddy force: pulls intake air directly into adjacent top exhaust
        if (isTopShortLooping && p.y < caseBounds.y + 110) {
          p.vy -= 120 * dt; // suck right back up
          p.temp += 0.3 * dt;
        }

        // Suction from active exhaust slots
        Object.values(slots).forEach((slot) => {
          if (!slot.isOccupied || slot.direction !== 'exhaust' || slot.pwmPercent <= 0) return;

          let targetX = 0, targetY = 0;
          if (slot.panel === 'rear') {
            targetX = caseBounds.x + 10;
            targetY = caseBounds.y + 80;
          } else if (slot.panel === 'top') {
            targetX = caseBounds.x + 120 + (slot.slotNumber - 1) * 90;
            targetY = caseBounds.y + 10;
          } else if (slot.panel === 'front') {
            targetX = caseBounds.x + caseBounds.w - 10;
            targetY = caseBounds.y + 70 + (slot.slotNumber - 1) * 85;
          }

          const dx = targetX - p.x;
          const dy = targetY - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 50000) {
            const force = 14000 / (distSq + 2000);
            p.vx += (dx / Math.sqrt(distSq)) * force * (slot.pwmPercent / 100);
            p.vy += (dy / Math.sqrt(distSq)) * force * (slot.pwmPercent / 100);
          }
        });

        // Heat absorption near GPU
        if (
          p.x > gpuBounds.x - 20 &&
          p.x < gpuBounds.x + gpuBounds.w + 20 &&
          p.y > gpuBounds.y - 15 &&
          p.y < gpuBounds.y + gpuBounds.h + 20
        ) {
          p.temp = Math.min(1.0, p.temp + 0.65 * dt * 4.0);
          p.vy -= 80 * dt; // GPU fans shoot air upward
        }

        // Heat absorption near CPU Cooler
        const distToCpu = Math.hypot(p.x - cpuCenter.x, p.y - cpuCenter.y);
        if (distToCpu < 55) {
          p.temp = Math.min(1.0, p.temp + 0.70 * dt * 4.0);
          if (cpuCooler?.type === 'air') p.vx -= 90 * dt;
        }

        // Move
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Render
        const lifeFraction = p.life / p.maxLife;
        const alpha = lifeFraction < 0.2 ? lifeFraction / 0.2 : 1 - (lifeFraction - 0.2) / 0.8;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        if (p.isDust) {
          ctx.fillStyle = `rgba(161, 161, 170, ${alpha * 0.85})`;
          ctx.shadowColor = '#71717a';
          ctx.shadowBlur = 4;
        } else {
          let r = 0, g = 240, b = 255;
          if (p.temp < 0.5) {
            const factor = p.temp / 0.5;
            r = Math.round(0 + (245 - 0) * factor);
            g = Math.round(240 + (158 - 240) * factor);
            b = Math.round(255 + (11 - 255) * factor);
          } else {
            const factor = (p.temp - 0.5) / 0.5;
            r = Math.round(245 + (239 - 245) * factor);
            g = Math.round(158 + (68 - 158) * factor);
            b = Math.round(11 + (68 - 11) * factor);
          }

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.85})`;
          ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
          ctx.shadowBlur = p.temp > 0.6 ? 6 : 3;
        }

        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, slots, cpuCooler, gpu, physics]);

  const hasAnyRadiatorOnTop = physics.panelBreakdown.top.slots.some((s) => s.hasRadiator);
  const hasAnyRadiatorOnSide = physics.panelBreakdown.side.slots.some((s) => s.hasRadiator);
  const hasAnyRadiatorOnFront = physics.panelBreakdown.front.slots.some((s) => s.hasRadiator);

  const activePortsCount = Object.values(slots).filter((s) => s.isOccupied && s.pwmPercent > 0).length;

  return (
    <div className="bg-[#0b0d13] border border-zinc-800 p-4 md:p-5 hard-shadow relative flex flex-col">
      {/* Top Test Chamber Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800 mb-3 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00f0ff] animate-pulse" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              Aerodynamics Wind-Tunnel & CAD Visualizer
            </h2>
            <span className="text-[10px] font-mono bg-black text-[#00f0ff] px-2 py-0.5 border border-zinc-800">
              {selectedCase ? selectedCase.name : '[ NO CHASSIS MOUNTED ]'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Real-time particle kinematics (60 FPS CFD solver). Click any port chevron to toggle directional vector.
          </p>
        </div>

        {/* Tactical Controls Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThermalOverlay(!showThermalOverlay)}
            className={`px-2.5 py-1 text-xs font-mono border flex items-center gap-1.5 btn-tactile ${
              showThermalOverlay
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-[#11131a] border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>THERMAL IR</span>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 py-1 bg-[#11131a] hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono transition-colors flex items-center gap-1.5 btn-tactile"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>STREAM: ON</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>STREAM: PAUSED</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Wind Tunnel Viewport with Engineering Rulers */}
      <div className="relative w-full aspect-[16/10] bg-[#07080b] border border-zinc-800 overflow-hidden flex items-center justify-center cad-grid">
        {/* Millimeter Coordinates Ticks (Top & Left) */}
        <div className="absolute top-0 left-0 right-0 h-4 border-b border-zinc-800/80 bg-black/60 flex items-center justify-between px-6 text-[8px] font-mono text-zinc-600 select-none pointer-events-none z-10">
          <span>0mm</span>
          <span>100mm</span>
          <span>200mm</span>
          <span>300mm</span>
          <span>400mm</span>
          <span>500mm</span>
        </div>
        <div className="absolute top-4 left-0 bottom-0 w-5 border-r border-zinc-800/80 bg-black/60 flex flex-col items-center justify-between py-6 text-[8px] font-mono text-zinc-600 select-none pointer-events-none z-10">
          <span>0</span>
          <span>100</span>
          <span>200</span>
          <span>300</span>
          <span>400</span>
        </div>

        {/* Corner Crosshairs */}
        <div className="absolute top-6 left-7 text-[10px] font-mono text-zinc-600 select-none pointer-events-none">+</div>
        <div className="absolute top-6 right-3 text-[10px] font-mono text-zinc-600 select-none pointer-events-none">+</div>
        <div className="absolute bottom-3 left-7 text-[10px] font-mono text-zinc-600 select-none pointer-events-none">+</div>
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-zinc-600 select-none pointer-events-none">+</div>

        {/* Chassis Internal SVG Drawing */}
        <svg viewBox="0 0 800 520" className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <defs>
            <pattern id="meshPattern" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.2" fill="#27272a" />
            </pattern>
            <pattern id="heatsinkFins" width="4" height="8" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#3f3f46" strokeWidth="1.2" />
            </pattern>
          </defs>

          {/* PC Outer Case Chassis Structure */}
          <rect x="170" y="70" width="480" height="380" fill="#0d0f15" stroke="#27272a" strokeWidth="2" />

          {/* Front Panel (Right side) */}
          <rect
            x="640"
            y="70"
            width="14"
            height="380"
            fill={selectedCase?.frontPanelType === 'solid-glass' ? '#00f0ff' : '#18181b'}
            opacity={selectedCase?.frontPanelType === 'solid-glass' ? 0.25 : 0.9}
            stroke="#27272a"
            strokeWidth="1.5"
          />
          {selectedCase?.frontPanelType === 'mesh' && (
            <rect x="640" y="80" width="12" height="360" fill="url(#meshPattern)" />
          )}

          {/* Side Mount Column (Vertical inner tray between motherboard & front) */}
          <rect x="545" y="85" width="22" height="260" fill="#11131c" stroke="#27272a" strokeDasharray="3 3" />
          <text x="556" y="220" fill="#52525b" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle" transform="rotate(-90, 556, 220)">
            SIDE INTAKE / RADIATOR
          </text>

          {/* Top Panel & Vent */}
          <rect x="200" y="66" width="420" height="8" fill="#18181b" stroke="#27272a" strokeWidth="1" />

          {/* PSU Shroud */}
          <rect x="170" y="370" width="240" height="80" fill="#11131c" stroke="#27272a" strokeWidth="1.5" />
          <text x="185" y="415" fill="#52525b" fontSize="11" fontFamily="JetBrains Mono" fontWeight="600">
            PSU CHAMBER
          </text>

          {/* Motherboard Tray */}
          <rect x="260" y="120" width="270" height="240" fill="#0f1118" stroke="#27272a" strokeWidth="1.5" />
          <rect x="275" y="135" width="30" height="70" fill="#18181b" stroke="#27272a" />
          <rect x="315" y="135" width="70" height="20" fill="#18181b" stroke="#27272a" />

          {/* Thermal Glow Overlay */}
          {showThermalOverlay && (
            <>
              <circle cx="380" cy="170" r="65" fill="url(#cpuThermalGrad)" opacity={cpuCooler ? 0.35 : 0.15} />
              <ellipse cx="430" cy="305" rx="120" ry="45" fill="url(#gpuThermalGrad)" opacity={gpu ? (gpu.tdpWatts > 300 ? 0.45 : 0.3) : 0.15} />
              <defs>
                <radialGradient id="cpuThermalGrad">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="gpuThermalGrad">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
              </defs>
            </>
          )}

          {/* CPU Cooler */}
          {cpuCooler ? (
            cpuCooler.type === 'air' ? (
              <g transform="translate(340, 130)">
                <rect x="0" y="0" width="75" height="80" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
                <rect x="5" y="5" width="65" height="70" fill="url(#heatsinkFins)" />
                <rect x="68" y="2" width="12" height="76" fill="#0284c7" stroke="#00f0ff" />
                <text x="38" y="44" fill="#a1a1aa" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                  AIR TOWER
                </text>
              </g>
            ) : (
              <g>
                <rect x="355" y="145" width="55" height="50" fill="#090d16" stroke="#00f0ff" strokeWidth="2" />
                <circle cx="382" cy="170" r="14" fill="#002b36" stroke="#00f0ff" strokeWidth="1.5" />
                <text x="382" y="174" fill="#00f0ff" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
                  AIO
                </text>

                {/* Tubing to Radiator */}
                {hasAnyRadiatorOnTop && (
                  <path d="M 390 145 C 400 110, 430 95, 460 85 M 375 145 C 385 115, 415 100, 445 85" fill="none" stroke="#27272a" strokeWidth="6" strokeLinecap="square" />
                )}
                {hasAnyRadiatorOnSide && (
                  <path d="M 400 160 C 450 160, 500 150, 545 160 M 400 175 C 450 175, 500 170, 545 180" fill="none" stroke="#27272a" strokeWidth="6" strokeLinecap="square" />
                )}
                {hasAnyRadiatorOnFront && (
                  <path d="M 400 160 C 470 160, 560 150, 620 180 M 400 175 C 470 175, 560 170, 620 200" fill="none" stroke="#27272a" strokeWidth="6" strokeLinecap="square" />
                )}
              </g>
            )
          ) : (
            <rect x="360" y="150" width="45" height="45" fill="#0f1118" stroke="#27272a" strokeWidth="1.5" strokeDasharray="4 3" />
          )}

          {/* GPU in PCIe Slot */}
          {gpu ? (
            <g transform="translate(300, 275)">
              <rect x="0" y="0" width="260" height="12" fill="#18181b" stroke="#27272a" />
              <rect x="15" y="12" width="240" height="42" fill="#0c0e14" stroke="#27272a" strokeWidth="1.5" />
              <circle cx="65" cy="33" r="15" fill="#18181b" stroke="#00f0ff" strokeWidth="1.5" />
              <circle cx="135" cy="33" r="15" fill="#18181b" stroke="#00f0ff" strokeWidth="1.5" />
              <circle cx="205" cy="33" r="15" fill="#18181b" stroke="#00f0ff" strokeWidth="1.5" />
              <rect x="-10" y="0" width="10" height="54" fill="#3f3f46" />
              <text x="135" y="49" fill="#a1a1aa" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                {gpu.name.slice(0, 24)}
              </text>
            </g>
          ) : (
            <rect x="300" y="285" width="240" height="18" fill="#0f1118" stroke="#27272a" strokeDasharray="4 3" />
          )}

          {/* Rear PCIe slots */}
          <rect x="168" y="270" width="4" height="90" fill="#3f3f46" />
        </svg>

        {/* Dynamic Canvas Particles Overlay */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* INTERACTIVE GRANULAR PORT ACTUATORS OVERLAYS */}

        {/* 1. FRONT SLOTS (Right Edge: x: ~635, stacked vertically) */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
          {physics.panelBreakdown.front.slots.map((slot) => {
            const isIntake = slot.direction === 'intake';
            return (
              <button
                type="button"
                key={slot.id}
                onClick={() => onToggleSlotDirection(slot.id)}
                className={`cursor-pointer px-2 py-1 border text-[10px] font-mono hard-shadow-sm flex items-center gap-1.5 btn-tactile ${
                  slot.isOccupied && slot.pwmPercent > 0
                    ? isIntake
                      ? 'bg-[#002b36] border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black'
                      : 'bg-[#3b0808] border-red-500 text-red-300 hover:bg-red-500 hover:text-black'
                    : 'bg-[#090a0f] border-zinc-800 text-zinc-600'
                }`}
                title={`Front Slot ${slot.slotNumber}: Click to flip direction`}
              >
                <span className="font-bold">F{slot.slotNumber}</span>
                {slot.isOccupied && slot.pwmPercent > 0 ? (
                  <>
                    <span>{isIntake ? '← IN' : 'OUT →'}</span>
                    <span className="text-[9px] opacity-75">({slot.liveCfm} CFM)</span>
                  </>
                ) : (
                  <span>OFF</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 2. SIDE SLOTS (Vertical column inside right side: x: ~530) */}
        <div className="absolute right-24 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
          {physics.panelBreakdown.side.slots.map((slot) => {
            const isIntake = slot.direction === 'intake';
            return (
              <button
                type="button"
                key={slot.id}
                onClick={() => onToggleSlotDirection(slot.id)}
                className={`cursor-pointer px-2 py-1 border text-[10px] font-mono hard-shadow-sm flex items-center gap-1.5 btn-tactile ${
                  slot.isOccupied && slot.pwmPercent > 0
                    ? isIntake
                      ? 'bg-[#002b36] border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black'
                      : 'bg-[#3b0808] border-red-500 text-red-300 hover:bg-red-500 hover:text-black'
                    : 'bg-[#090a0f] border-zinc-800 text-zinc-600'
                }`}
                title={`Side Slot ${slot.slotNumber}: Click to flip direction`}
              >
                <span className="font-bold">S{slot.slotNumber}</span>
                {slot.isOccupied && slot.pwmPercent > 0 ? (
                  <>
                    <span>{isIntake ? '← IN' : 'OUT →'}</span>
                    <span className="text-[9px] opacity-75">({slot.liveCfm} CFM)</span>
                  </>
                ) : (
                  <span>OFF</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. TOP SLOTS (Top edge: x: center, horizontally spaced) */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {physics.panelBreakdown.top.slots.map((slot) => {
            const isExhaust = slot.direction === 'exhaust';
            return (
              <button
                type="button"
                key={slot.id}
                onClick={() => onToggleSlotDirection(slot.id)}
                className={`cursor-pointer px-2 py-1 border text-[10px] font-mono hard-shadow-sm flex items-center gap-1.5 btn-tactile ${
                  slot.isOccupied && slot.pwmPercent > 0
                    ? isExhaust
                      ? 'bg-[#3b0808] border-red-500 text-red-300 hover:bg-red-500 hover:text-black'
                      : 'bg-[#002b36] border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black'
                    : 'bg-[#090a0f] border-zinc-800 text-zinc-600'
                }`}
                title={`Top Slot ${slot.slotNumber}: Click to flip direction`}
              >
                <span className="font-bold">T{slot.slotNumber}</span>
                {slot.isOccupied && slot.pwmPercent > 0 ? (
                  <>
                    <span>{isExhaust ? '↑ OUT' : '↓ IN'}</span>
                    <span className="text-[9px] opacity-75">({slot.liveCfm} CFM)</span>
                  </>
                ) : (
                  <span>OFF</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. REAR SLOT (Left edge: x: 175) */}
        <div className="absolute left-6 top-28 z-20 flex flex-col gap-1.5">
          {physics.panelBreakdown.rear.slots.map((slot) => {
            const isExhaust = slot.direction === 'exhaust';
            return (
              <button
                type="button"
                key={slot.id}
                onClick={() => onToggleSlotDirection(slot.id)}
                className={`cursor-pointer px-2.5 py-1.5 border text-[10px] font-mono hard-shadow-sm flex items-center gap-1.5 btn-tactile ${
                  slot.isOccupied && slot.pwmPercent > 0
                    ? isExhaust
                      ? 'bg-[#3b0808] border-red-500 text-red-300 hover:bg-red-500 hover:text-black'
                      : 'bg-[#002b36] border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black'
                    : 'bg-[#090a0f] border-zinc-800 text-zinc-600'
                }`}
                title={`Rear Slot ${slot.slotNumber}: Click to flip direction`}
              >
                <span className="font-bold">R{slot.slotNumber}</span>
                {slot.isOccupied && slot.pwmPercent > 0 ? (
                  <>
                    <span>{isExhaust ? '← OUT' : 'IN →'}</span>
                    <span className="text-[9px] opacity-75">({slot.liveCfm} CFM)</span>
                  </>
                ) : (
                  <span>OFF</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 5. BOTTOM SLOTS (Bottom edge: horizontally spaced) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {physics.panelBreakdown.bottom.slots.map((slot) => {
            const isIntake = slot.direction === 'intake';
            return (
              <button
                type="button"
                key={slot.id}
                onClick={() => onToggleSlotDirection(slot.id)}
                className={`cursor-pointer px-2 py-1 border text-[10px] font-mono hard-shadow-sm flex items-center gap-1.5 btn-tactile ${
                  slot.isOccupied && slot.pwmPercent > 0
                    ? isIntake
                      ? 'bg-[#002b36] border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black'
                      : 'bg-[#3b0808] border-red-500 text-red-300 hover:bg-red-500 hover:text-black'
                    : 'bg-[#090a0f] border-zinc-800 text-zinc-600'
                }`}
                title={`Bottom Slot ${slot.slotNumber}: Click to flip direction`}
              >
                <span className="font-bold">B{slot.slotNumber}</span>
                {slot.isOccupied && slot.pwmPercent > 0 ? (
                  <>
                    <span>{isIntake ? '↑ IN' : '↓ OUT'}</span>
                    <span className="text-[9px] opacity-75">({slot.liveCfm} CFM)</span>
                  </>
                ) : (
                  <span>OFF</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chamber Bottom Status Telemetry Line */}
      <div className="mt-3 pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-3">
          <span>PORTS ACTIVE: <strong className="text-white">{activePortsCount}</strong></span>
          <span>NET DIFFERENTIAL: <strong className={physics.netCfm > 0 ? 'text-[#00f0ff]' : physics.netCfm < 0 ? 'text-red-400' : 'text-zinc-400'}>{physics.netCfm > 0 ? `+${physics.netCfm}` : physics.netCfm} CFM</strong></span>
        </div>
        <div className="text-zinc-500 text-[10px]">
          [ BLUE = INTAKE COLD ] [ RED = EXHAUST HOT ] [ DUST INGRESS SIM: ACTIVE ]
        </div>
      </div>
    </div>
  );
};
