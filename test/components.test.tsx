import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PressureGauge } from '../src/components/PressureGauge';
import { DiagnosticsPanel } from '../src/components/DiagnosticsPanel';
import { SearchablePartPicker } from '../src/components/SearchablePartPicker';
import { AirflowPhysicsResult, DiagnosticItem } from '../src/types';

describe('AeroFlow React Components', () => {
  const dummyPhysics: AirflowPhysicsResult = {
    totalIntakeCfm: 120.0,
    totalExhaustCfm: 80.0,
    netCfm: 40.0,
    pressureRatio: 1.5,
    pressureType: 'slight-positive',
    pressureDescription: 'Optimal slightly positive pressure.',
    dustTrapRisk: 1,
    caseVolumeLiters: 48.0,
    airExchangesPerMinute: 55.0,
    estimatedCpuDeltaT: 32.5,
    estimatedGpuDeltaT: 35.0,
    gpuAirflowSufficiency: 'optimal',
    panelBreakdown: {
      front: { intakeCfm: 120, exhaustCfm: 0, slots: [] },
      side: { intakeCfm: 0, exhaustCfm: 0, slots: [] },
      top: { intakeCfm: 0, exhaustCfm: 50, slots: [] },
      rear: { intakeCfm: 0, exhaustCfm: 30, slots: [] },
      bottom: { intakeCfm: 0, exhaustCfm: 0, slots: [] },
    },
  };

  it('renders PressureGauge with net CFM, intake/exhaust stats, and thermal telemetry', () => {
    render(<PressureGauge physics={dummyPhysics} />);

    expect(screen.getByText('Pressure Dynamics Engine')).toBeInTheDocument();
    expect(screen.getByText('+40')).toBeInTheDocument();
    expect(screen.getByText('Net CFM')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText(/Optimal slightly positive pressure/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated CPU ΔT:/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated GPU ΔT:/i)).toBeInTheDocument();
  });

  it('renders DiagnosticsPanel with severity badges and triggers quick fixes', () => {
    const onQuickFix = vi.fn();
    const diagnostics: DiagnosticItem[] = [
      {
        id: 'test-critical',
        severity: 'critical',
        title: 'Thermal Hazard: GPU Starvation',
        description: 'Front AIO intake is pre-heating open-air GPU.',
        recommendation: 'Move AIO radiator to top exhaust.',
        quickFix: {
          label: 'Move Radiator to Top',
          action: 'MOVE_AIO_TO_TOP',
        },
      },
    ];

    render(
      <DiagnosticsPanel
        diagnostics={diagnostics}
        onExecuteQuickFix={onQuickFix}
      />
    );

    expect(screen.getByText('Diagnostic & Conflict Engine')).toBeInTheDocument();
    expect(screen.getByText('Thermal Hazard: GPU Starvation')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();

    const fixBtn = screen.getByRole('button', { name: /Quick Fix: Move Radiator to Top/i });
    expect(fixBtn).toBeInTheDocument();
    fireEvent.click(fixBtn);
    expect(onQuickFix).toHaveBeenCalledTimes(1);
    expect(onQuickFix).toHaveBeenCalledWith(diagnostics[0].quickFix);
  });

  it('renders SearchablePartPicker and allows searching and selecting components', () => {
    const onSelect = vi.fn();
    const items = [
      { id: 'case-1', name: 'Corsair 4000D Airflow', brand: 'Corsair' },
      { id: 'case-2', name: 'Lian Li O11 Vision', brand: 'Lian Li' },
      { id: 'case-3', name: 'NZXT H5 Flow', brand: 'NZXT' },
    ];

    render(
      <SearchablePartPicker
        label="Select Chassis"
        placeholder="Choose your case..."
        icon={<span>📦</span>}
        items={items}
        selectedItem={null}
        onSelect={onSelect}
      />
    );

    // Initial trigger button
    expect(screen.getByText('Choose your case...')).toBeInTheDocument();

    // Click trigger to open dropdown
    fireEvent.click(screen.getByText('Choose your case...'));

    // Verify search input is rendered
    const input = screen.getByPlaceholderText(/Search 3 parts/i);
    expect(input).toBeInTheDocument();

    // Type query
    fireEvent.change(input, { target: { value: 'O11' } });

    // Click option
    const option = screen.getByText('Lian Li O11 Vision');
    expect(option).toBeInTheDocument();
    fireEvent.click(option);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(items[1]);
  });
});
