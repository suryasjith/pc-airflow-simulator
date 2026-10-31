import React from 'react';
import { DiagnosticItem } from '../types';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Wrench,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface DiagnosticsPanelProps {
  diagnostics: DiagnosticItem[];
  onExecuteQuickFix: (quickFix: NonNullable<DiagnosticItem['quickFix']>) => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  diagnostics,
  onExecuteQuickFix,
}) => {
  // Sort diagnostics so Critical comes first, then Warning, then Tip, then Success
  const severityOrder = {
    critical: 0,
    warning: 1,
    tip: 2,
    success: 3,
  };

  const sortedDiagnostics = [...diagnostics].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  const getSeverityStyles = (severity: DiagnosticItem['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          cardBorder: 'border-red-500/80',
          cardBg: 'bg-[#1a0808]',
          badgeBg: 'bg-red-500 text-black border-red-500',
          icon: <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />,
          fixBtn: 'bg-red-500 hover:bg-red-400 text-black font-bold border-red-400',
          stripeClass: 'hazard-stripe',
        };
      case 'warning':
        return {
          cardBorder: 'border-amber-500/70',
          cardBg: 'bg-[#181106]',
          badgeBg: 'bg-amber-400 text-black border-amber-400',
          icon: <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />,
          fixBtn: 'bg-amber-400 hover:bg-amber-300 text-black font-bold border-amber-300',
          stripeClass: 'hazard-stripe-amber',
        };
      case 'tip':
        return {
          cardBorder: 'border-sky-500/50',
          cardBg: 'bg-[#06101c]',
          badgeBg: 'bg-sky-500 text-black border-sky-400',
          icon: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
          fixBtn: 'bg-sky-500 hover:bg-sky-400 text-black font-bold border-sky-400',
          stripeClass: '',
        };
      case 'success':
        return {
          cardBorder: 'border-[#00ff9d]/50',
          cardBg: 'bg-[#061811]',
          badgeBg: 'bg-[#00ff9d] text-black border-[#00ff9d]',
          icon: <CheckCircle2 className="w-4 h-4 text-[#00ff9d] shrink-0" />,
          fixBtn: 'bg-[#00ff9d] hover:bg-[#00ff9d]/90 text-black font-bold border-[#00ff9d]',
          stripeClass: '',
        };
    }
  };

  const criticalCount = diagnostics.filter((d) => d.severity === 'critical').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <div className="bg-[#0b0d13] border border-zinc-800 p-5 hard-shadow flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/40 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wider uppercase font-mono">
              Diagnostic & Conflict Engine
            </h3>
            <p className="text-xs text-zinc-400 font-mono">Aerodynamic & Thermal Annunciator Panel</p>
          </div>
        </div>

        {/* Status Count Badges */}
        <div className="flex items-center gap-2 font-mono">
          {criticalCount > 0 && (
            <span className="px-2.5 py-0.5 text-xs font-bold bg-red-600 text-black uppercase tracking-wider animate-pulse">
              {criticalCount} CRITICAL CONFLICT{criticalCount > 1 ? 'S' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-400 text-black uppercase">
              {warningCount} WARNING{warningCount > 1 ? 'S' : ''}
            </span>
          )}
          {criticalCount === 0 && warningCount === 0 && diagnostics.some((d) => d.severity === 'success') && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-[#00ff9d] text-black uppercase">
              ALL VECTORS OPTIMAL
            </span>
          )}
        </div>
      </div>

      {/* Diagnostics List */}
      <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
        {sortedDiagnostics.map((item) => {
          const style = getSeverityStyles(item.severity);

          return (
            <div
              key={item.id}
              className={`border p-3.5 transition-all hard-shadow-sm relative overflow-hidden ${style.cardBorder} ${style.cardBg}`}
            >
              {style.stripeClass && (
                <div className={`absolute top-0 left-0 right-0 h-1 ${style.stripeClass}`} />
              )}

              <div className="flex items-start gap-3">
                <div className="mt-0.5">{style.icon}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider truncate">
                      {item.title}
                    </h4>
                    <span className={`text-[9px] uppercase font-mono font-extrabold px-1.5 py-0.2 border shrink-0 ${style.badgeBg}`}>
                      {item.severity}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-2.5">
                    {item.description}
                  </p>

                  <div className="bg-black/80 p-2 border border-zinc-800 text-[11px] font-mono">
                    <span className="font-bold text-zinc-300">RECOMMENDATION: </span>
                    <span className="text-zinc-400">{item.recommendation}</span>
                  </div>

                  {/* 1-Click Quick Fix Button if available */}
                  {item.quickFix && (
                    <div className="mt-3 flex items-center justify-end">
                      <button
                        onClick={() => onExecuteQuickFix(item.quickFix!)}
                        className={`text-xs font-mono px-3 py-1.5 border flex items-center gap-1.5 btn-tactile ${style.fixBtn}`}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Quick Fix: {item.quickFix.label}</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
