import React, { useState } from 'react';
import { FactoryProcessKey, ProcessOutputMetric } from '../types/factoryOutput';
import { Language, ThemeMode, translations } from '../utils/i18n';
import { D3WipBufferChart } from './D3WipBufferChart';
import { 
  Activity, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  ArrowRight, 
  Download, 
  Zap, 
  Layers, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  PlusCircle,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';

interface FactoryProcessOutputChartProps {
  metrics: ProcessOutputMetric[];
  onOpenExportModal?: (defaultProcess?: FactoryProcessKey) => void;
  onIncrementLiveOutput?: (processKey: FactoryProcessKey, incrementAmount: number) => void;
  onOpenBulkUpdateModal?: (selectedKeys: FactoryProcessKey[]) => void;
  lang?: Language;
  theme?: ThemeMode;
}

export const FactoryProcessOutputChart: React.FC<FactoryProcessOutputChartProps> = ({
  metrics,
  onOpenExportModal,
  onIncrementLiveOutput,
  onOpenBulkUpdateModal,
  lang = 'en',
  theme = 'dark',
}) => {
  const t = translations[lang];
  const [selectedProcessKey, setSelectedProcessKey] = useState<FactoryProcessKey | 'all'>('all');
  const [activeViewMode, setActiveViewMode] = useState<'d3_wip_bottleneck' | 'comparison_bars' | 'process_pipeline'>('d3_wip_bottleneck');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [checkedProcessKeys, setCheckedProcessKeys] = useState<FactoryProcessKey[]>([]);

  const isAllChecked = metrics.length > 0 && checkedProcessKeys.length === metrics.length;

  const handleToggleCheck = (processKey: FactoryProcessKey) => {
    setCheckedProcessKeys((prev) =>
      prev.includes(processKey) ? prev.filter((k) => k !== processKey) : [...prev, processKey]
    );
  };

  const handleSelectAll = () => {
    if (isAllChecked) {
      setCheckedProcessKeys([]);
    } else {
      setCheckedProcessKeys(metrics.map((m) => m.key));
    }
  };

  const handleOpenBulkModalWithChecked = () => {
    if (checkedProcessKeys.length > 0 && onOpenBulkUpdateModal) {
      onOpenBulkUpdateModal(checkedProcessKeys);
    }
  };

  // Aggregated totals
  const totalTargetCapacity = metrics.reduce((sum, m) => sum + m.targetCapacity, 0);
  const totalDailyPlan = metrics.reduce((sum, m) => sum + m.dailyPlan, 0);
  const totalLiveOutput = metrics.reduce((sum, m) => sum + m.liveOutput, 0);
  const overallEfficiency = totalDailyPlan > 0 ? Math.round((totalLiveOutput / totalDailyPlan) * 100) : 0;
  const bottleneckStations = metrics.filter((m) => m.status === 'bottleneck_slip');

  const selectedMetric = selectedProcessKey === 'all' 
    ? null 
    : metrics.find((m) => m.key === selectedProcessKey);

  const getStatusBadge = (status: ProcessOutputMetric['status']) => {
    switch (status) {
      case 'optimal':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Optimal Run</span>
          </span>
        );
      case 'on_track':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Activity className="w-2.5 h-2.5" />
            <span>On Track</span>
          </span>
        );
      case 'bottleneck_slip':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
            <span>Bottleneck Slip</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            <span>Standby</span>
          </span>
        );
    }
  };

  const isLight = theme === 'light';
  const dangerouslyLowWipStations = metrics.filter((m) => m.wipBufferPairs < 350);

  return (
    <div className={`border rounded-xl shadow-lg overflow-hidden transition-all ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Header Bar */}
      <div className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/40 border-slate-800'
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border ${
              isLight 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className={`text-base font-bold tracking-tight flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <span>{t.plantOutputTitle}</span>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                isLight 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                {t.liveFactoryTelemetry}
              </span>
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.plantOutputSubtitle}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: D3 WIP Buffer (Bottlenecks) | Capacity Bars | Flow Pipeline */}
          <div className={`flex items-center border rounded-lg p-0.5 text-xs ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              onClick={() => setActiveViewMode('d3_wip_bottleneck')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                activeViewMode === 'd3_wip_bottleneck'
                  ? isLight
                    ? 'bg-white text-emerald-700 font-bold shadow-sm border border-slate-200'
                    : 'bg-emerald-600/30 text-emerald-300 font-semibold shadow-sm border border-emerald-500/40'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{t.d3WipBufferView}</span>
              {dangerouslyLowWipStations.length > 0 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold animate-pulse">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>{dangerouslyLowWipStations.length}</span>
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveViewMode('comparison_bars')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeViewMode === 'comparison_bars'
                  ? isLight
                    ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200'
                    : 'bg-slate-800 text-white font-semibold shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.capacityBarsView}
            </button>
            <button
              onClick={() => setActiveViewMode('process_pipeline')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeViewMode === 'process_pipeline'
                  ? isLight
                    ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200'
                    : 'bg-slate-800 text-white font-semibold shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.flowPipelineView}
            </button>
          </div>

          {/* Bulk Action Trigger Button */}
          {onOpenBulkUpdateModal && (
            <button
              onClick={() => {
                if (checkedProcessKeys.length === 0) {
                  // If none checked, preselect all so user can immediately update
                  setCheckedProcessKeys(metrics.map((m) => m.key));
                  onOpenBulkUpdateModal(metrics.map((m) => m.key));
                } else {
                  onOpenBulkUpdateModal(checkedProcessKeys);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{t.bulkUpdateLiveOutput}</span>
              {checkedProcessKeys.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-900 text-emerald-200 text-[10px] font-mono">
                  {checkedProcessKeys.length}
                </span>
              )}
            </button>
          )}

          {/* Export Data Button */}
          {onOpenExportModal && (
            <button
              onClick={() => onOpenExportModal(selectedProcessKey === 'all' ? undefined : selectedProcessKey)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/20 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportProductionData}</span>
            </button>
          )}

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand process output chart' : 'Collapse process output chart'}
            className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Global KPI Metric Strips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className={`p-3 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <span className={`text-[10px] font-mono block uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {t.maxPlantCapacity}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {totalTargetCapacity.toLocaleString()}
                </span>
                <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t.prsDay}</span>
              </div>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>6 cells aggregated</span>
            </div>

            <div className={`p-3 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <span className={`text-[10px] font-mono block uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {t.plannedDailyTarget}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-xl font-bold font-mono ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  {totalDailyPlan.toLocaleString()}
                </span>
                <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t.prs}</span>
              </div>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Shift 1 &amp; OT scheduled</span>
            </div>

            <div className={`p-3 rounded-lg border ${
              isLight ? 'bg-emerald-50/80 border-emerald-300' : 'bg-emerald-950/10 border-emerald-900/60'
            }`}>
              <span className={`text-[10px] font-mono block uppercase font-bold ${
                isLight ? 'text-emerald-800' : 'text-emerald-400'
              }`}>{t.liveOutputProduced}</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-xl font-bold font-mono ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                  {totalLiveOutput.toLocaleString()}
                </span>
                <span className={`text-xs font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{t.prs}</span>
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] font-mono mt-0.5 ${
                isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>{t.liveFactoryTelemetry}</span>
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <span className={`text-[10px] font-mono block uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {t.plantEfficiency}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-xl font-bold font-mono ${
                  overallEfficiency >= 80 
                    ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                    : (isLight ? 'text-amber-700' : 'text-amber-400')
                }`}>
                  {overallEfficiency}%
                </span>
                <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>of plan</span>
              </div>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Live vs Planned Target</span>
            </div>

            <div className={`p-3 rounded-lg border col-span-2 sm:col-span-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <span className={`text-[10px] font-mono block uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {t.bottlenecksLabel}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {bottleneckStations.length > 0 ? (
                  <>
                    <span className="text-xl font-bold font-mono text-rose-500">{bottleneckStations.length}</span>
                    <span className={`text-xs font-mono font-semibold ${isLight ? 'text-rose-600' : 'text-rose-300'}`}>
                      {t.bottleneckSlip}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                    <span className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                      {t.clearPipeline}
                    </span>
                  </>
                )}
              </div>
              <span className={`text-[10px] font-mono truncate block ${
                bottleneckStations.length > 0 
                  ? (isLight ? 'text-rose-600 font-semibold' : 'text-rose-400') 
                  : (isLight ? 'text-slate-500' : 'text-slate-500')
              }`}>
                {bottleneckStations.length > 0 ? bottleneckStations.map((b) => b.name).join(', ') : 'All stations balancing'}
              </span>
            </div>
          </div>

          {/* Bulk Selection Floating Action Bar */}
          <div className={`p-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className={`flex items-center gap-1.5 text-xs font-mono font-semibold px-2 py-1 rounded border cursor-pointer ${
                  isLight 
                    ? 'text-slate-800 hover:text-slate-900 bg-white border-slate-300 shadow-sm' 
                    : 'text-slate-300 hover:text-white bg-slate-900 border-slate-800'
                }`}
              >
                {isAllChecked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Square className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                )}
                <span>{isAllChecked ? (lang === 'id' ? 'Batal Pilih Semua' : 'Deselect All') : (lang === 'id' ? 'Pilih Semua Proses' : 'Select All Processes')}</span>
              </button>

              <span className={`text-xs font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {checkedProcessKeys.length > 0 ? (
                  <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold`}>
                    {checkedProcessKeys.length} {lang === 'id' ? 'proses terpilih' : 'processes selected'}
                  </span>
                ) : (
                  <span>{lang === 'id' ? 'Pilih kotak centang untuk aksi massal' : 'Select checkboxes to bulk update'}</span>
                )}
              </span>
            </div>

            {checkedProcessKeys.length > 0 && onOpenBulkUpdateModal && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenBulkModalWithChecked}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{t.bulkUpdateLiveOutput} ({checkedProcessKeys.length})</span>
                </button>
                <button
                  onClick={() => setCheckedProcessKeys([])}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono ${
                    isLight 
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'id' ? 'Reset' : 'Clear'}
                </button>
              </div>
            )}
          </div>

          {/* VIEW 0: D3-BASED WIP BUFFER BOTTLENECK CHART */}
          {activeViewMode === 'd3_wip_bottleneck' && (
            <D3WipBufferChart
              metrics={metrics}
              onReplenishBuffer={(procKey, incAmount) => {
                if (onIncrementLiveOutput) {
                  onIncrementLiveOutput(procKey, incAmount);
                }
              }}
              lang={lang}
              theme={theme}
            />
          )}

          {/* VIEW 1: COMPARISON MULTI-BAR CAPACITY CHART */}
          {activeViewMode === 'comparison_bars' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800 font-mono">
                <span>Process Breakdown (Material Setting &rarr; Cutting &rarr; Subcont &rarr; Prep &rarr; Sewing &rarr; Assembling)</span>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-600 inline-block"></span>
                    <span>Target Capacity</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block"></span>
                    <span>Daily Plan Target</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
                    <span>Live Actual Output</span>
                  </span>
                </div>
              </div>

              {/* 6 Process Row Bars */}
              <div className="space-y-3">
                {metrics.map((process, idx) => {
                  const capacityPercent = 100;
                  const planPercent = Math.round((process.dailyPlan / process.targetCapacity) * 100);
                  const livePercent = Math.round((process.liveOutput / process.targetCapacity) * 100);
                  const planAchievementPercent = Math.round((process.liveOutput / process.dailyPlan) * 100);
                  const isSelected = selectedProcessKey === process.key;
                  const isChecked = checkedProcessKeys.includes(process.key);

                  return (
                    <div
                      key={process.key}
                      onClick={() => setSelectedProcessKey(isSelected ? 'all' : process.key)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-emerald-500 ring-1 ring-emerald-500/30 shadow-md'
                          : isChecked
                          ? 'bg-slate-900/90 border-emerald-500/60 shadow-sm'
                          : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Process Info Header & Checkbox */}
                        <div className="flex items-center gap-3 min-w-[260px]">
                          {/* Checkbox for bulk update */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCheck(process.key);
                            }}
                            title={isChecked ? 'Deselect process' : 'Select process for bulk update'}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>

                          <span className="w-6 h-6 rounded-md bg-slate-800 font-mono text-xs font-bold flex items-center justify-center text-slate-300">
                            0{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{process.name}</h4>
                              {getStatusBadge(process.status)}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {process.department} · {process.headcount} Staff · Sup: {process.supervisor}
                            </p>
                          </div>
                        </div>

                        {/* Comparative Triple-Bar Progress Visualization */}
                        <div className="flex-1 max-w-xl space-y-1.5">
                          {/* Target Capacity vs Daily Plan vs Live Bar Group */}
                          <div className="space-y-1">
                            {/* Live Output Bar */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-emerald-400 w-16 text-right font-bold">
                                Live Output:
                              </span>
                              <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800 flex">
                                <div
                                  className={`h-full transition-all duration-500 rounded-full ${
                                    process.status === 'bottleneck_slip'
                                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  }`}
                                  style={{ width: `${livePercent}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono font-bold text-white w-20 text-right">
                                {process.liveOutput.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{t.prs}</span>
                              </span>
                            </div>

                            {/* Daily Plan Target Bar */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-cyan-400 w-16 text-right">
                                Daily Plan:
                              </span>
                              <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 flex">
                                <div
                                  className="h-full bg-cyan-500/80 rounded-full transition-all duration-500"
                                  style={{ width: `${planPercent}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-cyan-300 w-20 text-right">
                                {process.dailyPlan.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{t.prs}</span>
                              </span>
                            </div>

                            {/* Max Capacity Ceiling Bar */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-400 w-16 text-right">
                                Capacity:
                              </span>
                              <div className="flex-1 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                <div className="h-full bg-slate-600 rounded-full w-full" />
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 w-20 text-right">
                                {process.targetCapacity.toLocaleString()} <span className="text-[10px]">{t.prs}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* KPI Metrics & Run Rate */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">{t.achievement}</span>
                            <span className={`font-bold ${planAchievementPercent >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {planAchievementPercent}% of plan
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">{t.hourlyRate}</span>
                            <span className="font-bold text-white flex items-center justify-end gap-1">
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                              <span>{process.hourlyRunRate} {t.prs}/h</span>
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">{t.wipInQueue}</span>
                            <span className={`font-bold ${process.wipBufferPairs > 700 ? 'text-rose-400' : 'text-slate-300'}`}>
                              {process.wipBufferPairs} {t.prs}
                            </span>
                          </div>

                          {/* Quick Live increment simulation button */}
                          {onIncrementLiveOutput && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onIncrementLiveOutput(process.key, 50);
                              }}
                              title="Simulate +50 pairs completed live output"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: PROCESS FLOW PIPELINE WITH WIP BUFFERS */}
          {activeViewMode === 'process_pipeline' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 font-mono pb-1 border-b border-slate-800">
                Continuous Factory Flow Pipeline (Buffer Pairs &amp; Transfer Run Rates)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                {metrics.map((process, i) => {
                  const achievement = Math.round((process.liveOutput / process.dailyPlan) * 100);
                  const isBottleneck = process.status === 'bottleneck_slip';
                  const isChecked = checkedProcessKeys.includes(process.key);

                  return (
                    <div
                      key={process.key}
                      className={`relative p-3.5 rounded-xl border flex flex-col justify-between ${
                        isBottleneck 
                          ? 'bg-rose-950/20 border-rose-500/50 shadow-md ring-1 ring-rose-500/20'
                          : isChecked
                          ? 'bg-slate-900 border-emerald-500/70 shadow-sm'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      {/* Step Indicator & Checkbox */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleCheck(process.key)}
                              className="p-0.5 rounded text-slate-400 hover:text-white"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600" />
                              )}
                            </button>
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 font-mono text-[11px] font-bold flex items-center justify-center">
                              {i + 1}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold ${isBottleneck ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {achievement}%
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white">{process.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{process.shiftHours.split(' ')[0]}</p>
                      </div>

                      {/* Station Output Stats */}
                      <div className="my-3 space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Live Output:</span>
                          <strong className="text-emerald-400 font-bold">{process.liveOutput} {t.prs}</strong>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Daily Plan:</span>
                          <span className="text-slate-200">{process.dailyPlan} {t.prs}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Capacity:</span>
                          <span className="text-slate-400">{process.targetCapacity} {t.prs}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-900">
                          <span>WIP Waiting:</span>
                          <span className={process.wipBufferPairs > 600 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {process.wipBufferPairs} {t.prs}
                          </span>
                        </div>
                      </div>

                      {/* Next Station Arrow (visual connector) */}
                      {i < metrics.length - 1 && (
                        <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{process.headcount} Workers</span>
                        <span>{process.scrapRatePercent}% Reject</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Filter Info Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Select any process row above to filter detailed export, or click <strong>Export Production Data</strong> to generate Daily, Weekly, Monthly, or Seasonal reports across processes.
              </span>
            </div>
            {onOpenExportModal && (
              <button
                onClick={() => onOpenExportModal()}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 whitespace-nowrap self-end sm:self-auto"
              >
                Launch Export Center &rarr;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
