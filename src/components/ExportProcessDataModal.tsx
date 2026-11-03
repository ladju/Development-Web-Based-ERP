import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { FactoryProcessKey, ExportDateRange, ProcessProductionRecord } from '../types/factoryOutput';
import { mockProductionRecords } from '../data/mockFactoryOutput';
import { 
  X, 
  Download, 
  Calendar, 
  Layers, 
  FileSpreadsheet, 
  Filter, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3, 
  Clock 
} from 'lucide-react';

interface ExportProcessDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProcessKey?: FactoryProcessKey | 'all';
}

export const ExportProcessDataModal: React.FC<ExportProcessDataModalProps> = ({
  isOpen,
  onClose,
  defaultProcessKey = 'all',
}) => {
  const [selectedRange, setSelectedRange] = useState<ExportDateRange>('daily');
  const [selectedProcess, setSelectedProcess] = useState<FactoryProcessKey | 'all'>(defaultProcessKey);
  const [selectedSeason, setSelectedSeason] = useState<string>('all');

  if (!isOpen) return null;

  // Filter records based on Range and Process
  const filteredRecords = useMemo(() => {
    let records = [...mockProductionRecords];

    // Filter by process
    if (selectedProcess !== 'all') {
      records = records.filter((r) => r.processKey === selectedProcess);
    }

    // Filter by season
    if (selectedSeason !== 'all') {
      records = records.filter((r) => r.season === selectedSeason);
    }

    // Filter by range logic
    if (selectedRange === 'daily') {
      records = records.filter((r) => r.date === '2026-11-01');
    } else if (selectedRange === 'weekly') {
      records = records.filter((r) => r.date >= '2026-10-26');
    } else if (selectedRange === 'monthly') {
      // Month to date
      records = records.filter((r) => r.date.startsWith('2026-10') || r.date.startsWith('2026-11'));
    }

    return records;
  }, [selectedRange, selectedProcess, selectedSeason]);

  // Summaries
  const totalPlanned = filteredRecords.reduce((sum, r) => sum + r.dailyPlan, 0);
  const totalActual = filteredRecords.reduce((sum, r) => sum + r.actualOutput, 0);
  const totalTargetCap = filteredRecords.reduce((sum, r) => sum + r.targetCapacity, 0);
  const totalRejects = filteredRecords.reduce((sum, r) => sum + r.rejectCount, 0);
  const avgEfficiency = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;

  // Process label helper
  const getProcessLabel = (key: FactoryProcessKey | 'all') => {
    switch (key) {
      case 'material_setting': return 'Material Setting';
      case 'cutting': return 'Cutting';
      case 'subcont': return 'Subcont Process';
      case 'preparation': return 'Preparation';
      case 'sewing': return 'Sewing';
      case 'assembling': return 'Assembling';
      case 'all': return 'All Processes';
    }
  };

  const handleExportExcel = () => {
    const headers = [
      'Record ID',
      'Date',
      'Shift',
      'Process',
      'Style Name',
      'Product Code',
      'Season',
      'Target Capacity (Pairs)',
      'Planned Target (Pairs)',
      'Actual Output (Pairs)',
      'Efficiency %',
      'Rejection / Scrap Count',
      'Supervisor',
      'Quality & Production Notes'
    ];

    const dataRows = filteredRecords.map((r) => [
      r.id,
      r.date,
      r.shift,
      r.processName,
      r.styleName,
      r.productCode,
      r.season,
      r.targetCapacity,
      r.dailyPlan,
      r.actualOutput,
      `${r.efficiencyPercent}%`,
      r.rejectCount,
      r.supervisor,
      r.notes || ''
    ]);

    // Summary Row
    const summaryRow = [
      'TOTAL / AGGREGATE',
      selectedRange.toUpperCase(),
      '-',
      selectedProcess === 'all' ? 'ALL 6 PROCESSES' : getProcessLabel(selectedProcess).toUpperCase(),
      '-',
      '-',
      selectedSeason,
      totalTargetCap,
      totalPlanned,
      totalActual,
      `${avgEfficiency}%`,
      totalRejects,
      '-',
      `Export Generated for ${filteredRecords.length} record(s)`
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows, summaryRow]);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 25 },
      { wch: 15 },
      { wch: 10 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 14 },
      { wch: 22 },
      { wch: 20 },
      { wch: 40 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Factory_Output_Report');
    const filename = `PWI2_Output_${selectedRange}_${selectedProcess}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const handleExportCSV = () => {
    const headers = [
      'Record ID',
      'Date',
      'Shift',
      'Process',
      'Style Name',
      'Product Code',
      'Season',
      'Target Capacity',
      'Planned Target',
      'Actual Output',
      'Efficiency Percent',
      'Reject Count',
      'Supervisor',
      'Notes'
    ];

    const rows = filteredRecords.map((r) => [
      r.id,
      r.date,
      r.shift,
      `"${r.processName}"`,
      `"${r.styleName}"`,
      r.productCode,
      r.season,
      r.targetCapacity,
      r.dailyPlan,
      r.actualOutput,
      r.efficiencyPercent,
      r.rejectCount,
      `"${r.supervisor}"`,
      `"${r.notes || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PWI2_Output_${selectedRange}_${selectedProcess}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Export Factory Production &amp; Output Data</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {filteredRecords.length} records
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Export capacity, daily planned targets, actual output, and scrap metrics by time range and process.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export modal"
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          {/* Time Range Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Time Range:</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              {[
                { id: 'daily', label: 'Daily (Today)' },
                { id: 'weekly', label: 'Weekly (7 Days)' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'season', label: 'Season Full' },
              ].map((range) => (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => setSelectedRange(range.id as ExportDateRange)}
                  className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                    selectedRange === range.id
                      ? 'bg-slate-800 border-emerald-500 text-white font-bold shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Process Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Process Scope:</span>
            </label>
            <select
              value={selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value as any)}
              aria-label="Select process scope"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">★ All Processes (Consolidated 6 Steps)</option>
              <option value="material_setting">1. Material Setting</option>
              <option value="cutting">2. Cutting</option>
              <option value="subcont">3. Subcont Process</option>
              <option value="preparation">4. Preparation</option>
              <option value="sewing">5. Sewing</option>
              <option value="assembling">6. Assembling</option>
            </select>
          </div>

          {/* Season Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Season Filter:</span>
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              aria-label="Select season filter"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="all">All Seasons</option>
              <option value="S1-27">S1-27 (2027 Season 1)</option>
              <option value="S2-26">S2-26 (2026 Season 2)</option>
              <option value="S1-26">S1-26 (2026 Season 1)</option>
              <option value="S2-24">S2-24 (Older Season XTR)</option>
            </select>
          </div>
        </div>

        {/* Aggregated Output Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Planned Target</span>
            <span className="text-base font-bold text-cyan-400 mt-0.5 block">{totalPlanned.toLocaleString()} prs</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Actual Output</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5 block">{totalActual.toLocaleString()} prs</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Efficiency Achievement</span>
            <span className={`text-base font-bold mt-0.5 block ${avgEfficiency >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {avgEfficiency}%
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Scrap / Defect Count</span>
            <span className="text-base font-bold text-rose-400 mt-0.5 block">{totalRejects.toLocaleString()} prs</span>
          </div>
        </div>

        {/* Preview Data Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Process</th>
                <th className="p-2.5">Style / Code</th>
                <th className="p-2.5 text-right">Plan</th>
                <th className="p-2.5 text-right">Actual</th>
                <th className="p-2.5 text-right">Eff %</th>
                <th className="p-2.5 text-right">Rejects</th>
                <th className="p-2.5">Supervisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No production records matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-2.5 text-slate-300">{r.date}</td>
                    <td className="p-2.5 text-emerald-400 font-bold">{r.processName}</td>
                    <td className="p-2.5">
                      <span className="text-white font-sans font-medium block truncate max-w-[160px]">{r.styleName}</span>
                      <span className="text-[10px] text-slate-500">{r.productCode}</span>
                    </td>
                    <td className="p-2.5 text-right text-slate-300">{r.dailyPlan.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-emerald-300 font-bold">{r.actualOutput.toLocaleString()}</td>
                    <td className="p-2.5 text-right">
                      <span className={`px-1.5 py-0.2 rounded ${r.efficiencyPercent >= 80 ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-300'}`}>
                        {r.efficiencyPercent}%
                      </span>
                    </td>
                    <td className="p-2.5 text-right text-rose-400">{r.rejectCount}</td>
                    <td className="p-2.5 text-slate-400 truncate max-w-[120px]">{r.supervisor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 font-mono">
            Exporting <strong className="text-white">{filteredRecords.length} records</strong> for <strong className="text-emerald-400">{getProcessLabel(selectedProcess)}</strong> ({selectedRange.toUpperCase()})
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportExcel}
              disabled={filteredRecords.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
