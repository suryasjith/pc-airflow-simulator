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
          cardBorder: 'border-red-500/50 hover:border-red-500',
          cardBg: 'bg-red-950/20',
          badgeBg: 'bg-red-950/80 border-red-500/40 text-red-400',
          icon: <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />,
          fixBtn: 'bg-red-600 hover:bg-red-500 text-white',
        };
      case 'warning':
        return {
          cardBorder: 'border-amber-500/40 hover:border-amber-500',
          cardBg: 'bg-amber-950/15',
          badgeBg: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
          icon: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />,
          fixBtn: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold',
        };
      case 'tip':
        return {
          cardBorder: 'border-blue-500/30 hover:border-blue-500',
          cardBg: 'bg-blue-950/15',
          badgeBg: 'bg-blue-950/80 border-blue-500/40 text-blue-300',
          icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
          fixBtn: 'bg-blue-600 hover:bg-blue-500 text-white',
        };
      case 'success':
        return {
          cardBorder: 'border-emerald-500/50 hover:border-emerald-500 shadow-emerald-950/30 shadow-lg',
          cardBg: 'bg-emerald-950/20',
          badgeBg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          fixBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        };
    }
  };

  const criticalCount = diagnostics.filter((d) => d.severity === 'critical').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase font-mono">
              Diagnostic & Conflict Engine
            </h3>
            <p className="text-xs text-slate-400">Intelligent Aerodynamic & Thermal Safety Auditor</p>
          </div>
        </div>

        {/* Status Count Badges */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-950 border border-red-500/40 text-red-400 animate-pulse">
              {criticalCount} Critical Conflict{criticalCount > 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-950 border border-amber-500/40 text-amber-400">
              {warningCount} Warning{warningCount > 1 ? 's' : ''}
            </span>
          )}
          {criticalCount === 0 && warningCount === 0 && diagnostics.some((d) => d.severity === 'success') && (
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              Optimal Flow
            </span>
          )}
        </div>
      </div>

      {/* Diagnostics List */}
      <div className="space-y-3.5 overflow-y-auto max-h-[380px] pr-1">
        {sortedDiagnostics.map((item) => {
          const style = getSeverityStyles(item.severity);

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 transition-all ${style.cardBorder} ${style.cardBg}`}
            >
              <div className="flex items-start gap-3">
                {style.icon}

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-100">
                      {item.title}
                    </h4>
                    <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${style.badgeBg}`}>
                      {item.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    {item.description}
                  </p>

                  <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80 text-xs">
                    <span className="font-semibold text-slate-200">Recommendation: </span>
                    <span className="text-slate-400">{item.recommendation}</span>
                  </div>

                  {/* 1-Click Quick Fix Button if available */}
                  {item.quickFix && (
                    <div className="mt-3 flex items-center justify-end">
                      <button
                        onClick={() => onExecuteQuickFix(item.quickFix!)}
                        className={`text-xs font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all ${style.fixBtn}`}
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
