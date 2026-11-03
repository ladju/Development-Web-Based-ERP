import React, { useState, useMemo } from 'react';
import {
  FactoryProcessKey,
  ProcessHandoffLog,
  ProcessPIC,
} from '../types/factoryOutput';
import {
  PROCESS_LABELS,
  calculateProcessPerformanceAnalytics,
} from '../utils/footwearErpLogic';
import { Language, ThemeMode } from '../utils/i18n';
import {
  BarChart3,
  AlertTriangle,
  Clock,
  CheckCircle2,
  GitBranch,
  ArrowRight,
  Zap,
  TrendingUp,
  Filter,
  History,
  UserCheck,
  Layers,
  Activity,
} from 'lucide-react';

interface PerformanceDashboardProps {
  handoffLogs: ProcessHandoffLog[];
  processPICs: ProcessPIC[];
  onNavigateWorkstations?: () => void;
  lang?: Language;
  theme?: ThemeMode;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  handoffLogs,
  processPICs,
  onNavigateWorkstations,
  lang = 'en',
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [selectedProcessFilter, setSelectedProcessFilter] = useState<FactoryProcessKey | 'all'>('all');
  const [routingFilter, setRoutingFilter] = useState<
    'all' | 'bottlenecks_only' | 'cutting_to_subcont' | 'cutting_direct_prep'
  >('all');

  const analytics = useMemo(() => {
    return calculateProcessPerformanceAnalytics(handoffLogs, processPICs);
  }, [handoffLogs, processPICs]);

  const maxChartHours = useMemo(() => {
    const maxVal = Math.max(
      ...analytics.processMetrics.map((m) => Math.max(m.avgHours, m.slaTargetHours, m.maxHours)),
      36
    );
    return Math.ceil(maxVal / 5) * 5;
  }, [analytics.processMetrics]);

  const filteredLogs = useMemo(() => {
    return handoffLogs.filter((log) => {
      if (selectedProcessFilter !== 'all' && log.fromProcess !== selectedProcessFilter) {
        return false;
      }
      if (routingFilter === 'bottlenecks_only') {
        const sla = log.slaTargetHours || 16;
        return log.durationHours > sla;
      }
      if (routingFilter === 'cutting_to_subcont') {
        return log.fromProcess === 'cutting' && log.toProcess === 'subcont';
      }
      if (routingFilter === 'cutting_direct_prep') {
        return log.fromProcess === 'cutting' && log.toProcess === 'preparation';
      }
      return true;
    });
  }, [handoffLogs, selectedProcessFilter, routingFilter]);

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. PERFORMANCE DASHBOARD HEADER & BOTTLENECK EXECUTIVE SUMMARY
         ===================================================================== */}
      <div
        className={`rounded-xl border p-5 shadow-sm transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>PIPELINE CYCLE TIME &amp; BOTTLENECK ANALYTICS</span>
              </span>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                Live Hand-Off Telemetry ({analytics.totalHandoffsAnalyzed} Events)
              </span>
            </div>

            <h2 className={`text-lg font-bold tracking-tight mt-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {lang === 'id'
                ? 'Performance Dashboard: Rata-Rata Waktu Proses & Identifikasi Bottleneck'
                : 'Performance Dashboard: Average Process Cycle Time & Bottleneck Analyzer'}
            </h2>
            <p className={`text-xs mt-0.5 max-w-3xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Visualizes real-time <code className="font-mono text-emerald-400">handoffLogs</code> cycle durations across all 6 manufacturing stages, pinpoints pipeline bottlenecks against target SLA hours, and tracks <strong>Cutting &rarr; Subcont (2nd Process)</strong> vs. <strong>Cutting &rarr; Straight to Preparation</strong> routing efficiency.
            </p>
          </div>

          {onNavigateWorkstations && (
            <button
              onClick={onNavigateWorkstations}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Open Process PIC Workstations &rarr;</span>
            </button>
          )}
        </div>

        {/* 4 Key Performance & Bottleneck Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* Card 1: Primary Bottleneck Detected */}
          <div
            className={`p-4 rounded-xl border ${
              analytics.primaryBottleneck?.isBottleneck
                ? isLight
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-rose-950/30 border-rose-800/80 text-white'
                : isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-rose-400">
                Primary Pipeline Bottleneck
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            {analytics.primaryBottleneck ? (
              <>
                <div className="text-base font-extrabold mt-1">
                  {analytics.primaryBottleneck.stepNumber}. {analytics.primaryBottleneck.processName}
                </div>
                <div className="flex items-baseline gap-2 mt-1 font-mono">
                  <span className="text-xl font-black text-rose-400">
                    {analytics.primaryBottleneck.avgHours}h
                  </span>
                  <span className="text-xs text-slate-400">
                    avg vs {analytics.primaryBottleneck.slaTargetHours}h SLA (
                    {analytics.primaryBottleneck.varianceHours >= 0 ? '+' : ''}
                    {analytics.primaryBottleneck.varianceHours}h / +
                    {analytics.primaryBottleneck.variancePercent}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  PIC: {analytics.primaryBottleneck.picName} ({analytics.primaryBottleneck.badgeId})
                </p>
              </>
            ) : (
              <div className="text-xs text-slate-400 mt-2">No bottlenecks detected</div>
            )}
          </div>

          {/* Card 2: Full Pipeline Avg Cycle Time (With Subcont 2nd Process) */}
          <div
            className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400">
                Full Pipeline Cycle (With Subcont)
              </span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1.5 font-mono">
              <span className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {analytics.totalPipelineAvgHoursWithSubcont} hrs
              </span>
              <span className="text-xs text-slate-400">
                (~{(analytics.totalPipelineAvgHoursWithSubcont / 24).toFixed(1)} days)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Includes <strong>3. Subcont Process</strong> for components needing HF welding, print, or embroidery.
            </p>
          </div>

          {/* Card 3: Direct-to-Prep Fast Path (Skipping Subcont) */}
          <div
            className={`p-4 rounded-xl border ${
              isLight
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-emerald-950/20 border-emerald-800/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-400">
                Direct Route (Cutting &rarr; Prep)
              </span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1.5 font-mono">
              <span className="text-2xl font-black text-emerald-400">
                {analytics.totalPipelineAvgHoursDirectPrep} hrs
              </span>
              <span className="text-xs text-emerald-300 font-bold">
                (-{analytics.cuttingBranching.avgHoursSavedWhenSkippingSubcont}h saved)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              When components need no 2nd process, Cutting hands off straight to <strong>4. Preparation</strong>.
            </p>
          </div>

          {/* Card 4: Cutting Routing Split */}
          <div
            className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-sky-400">
                Cutting Branching Ratio
              </span>
              <GitBranch className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1.5 font-mono">
              <span className="text-2xl font-black text-sky-400">
                {analytics.cuttingBranching.directToPrepPercent}%
              </span>
              <span className="text-xs text-slate-400">Direct to Preparation</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5">
              <span>To Subcont: {analytics.cuttingBranching.toSubcontCount}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">
                Straight to Prep: {analytics.cuttingBranching.directToPrepCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. VISUAL CHART: AVERAGE TIME SPENT BY EACH PROCESS VS TARGET SLA
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Bar Chart of Average Time Spent per Process & Bottleneck Thresholds */}
        <div
          className={`lg:col-span-8 rounded-xl border p-5 shadow-sm space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Average Time Spent by Process vs. Target SLA (Hours)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any process bar to filter its hand-off logs. Red/Amber bars indicate bottleneck stages exceeding target SLA cycle hours.
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                <span>Within SLA</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                <span>Minor Overrun</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
                <span>Critical Bottleneck</span>
              </span>
            </div>
          </div>

          {/* Horizontal Bar Chart with SLA Target Markers */}
          <div className="space-y-4 pt-1">
            {analytics.processMetrics.map((m) => {
              const isSelected = selectedProcessFilter === m.processKey;
              const avgWidthPct = Math.min(100, Math.round((m.avgHours / maxChartHours) * 100));
              const slaLeftPct = Math.min(98, Math.round((m.slaTargetHours / maxChartHours) * 100));

              const barColor =
                m.status === 'critical_bottleneck'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500'
                  : m.status === 'minor_delay'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400';

              return (
                <div
                  key={m.processKey}
                  onClick={() =>
                    setSelectedProcessFilter((prev) => (prev === m.processKey ? 'all' : m.processKey))
                  }
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-slate-800/90 border-emerald-500 ring-1 ring-emerald-500/30'
                      : m.isBottleneck
                      ? isLight
                        ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                        : 'bg-rose-950/15 border-rose-900/50 hover:border-rose-700'
                      : isLight
                      ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                        0{m.stepNumber}
                      </span>
                      <span className="font-bold text-sm">{m.processName}</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        (PIC: {m.picName} · {m.handoffCount} hand-offs)
                      </span>
                      {m.processKey === 'subcont' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Conditional 2nd Process
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      {m.isBottleneck ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                            m.status === 'critical_bottleneck'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            BOTTLENECK (+{m.varianceHours}h / +{m.variancePercent}%)
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>OPTIMAL ({m.varianceHours}h vs SLA)</span>
                        </span>
                      )}

                      <span className="text-sm font-black">
                        {m.avgHours} hrs{' '}
                        <span className="text-[11px] font-normal text-slate-400">
                          / {m.slaTargetHours}h SLA
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Bar Track + SLA Marker Line */}
                  <div className="relative h-6 rounded-lg bg-slate-900/90 border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all duration-500 ${barColor}`}
                      style={{ width: `${avgWidthPct}%` }}
                    />
                    {/* Target SLA Vertical Marker */}
                    <div
                      title={`Target SLA: ${m.slaTargetHours} hours`}
                      className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-sm"
                      style={{ left: `${slaLeftPct}%` }}
                    />
                    <span
                      className="absolute top-1 text-[9px] font-mono text-white/90 bg-slate-950/80 px-1 rounded pointer-events-none"
                      style={{ left: `${Math.max(2, slaLeftPct - 6)}%` }}
                    >
                      SLA {m.slaTargetHours}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Cols: Cutting Branching & 2nd Process Routing Architecture Card */}
        <div
          className={`lg:col-span-4 rounded-xl border p-5 shadow-sm flex flex-col justify-between space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Cutting Hand-Off Routing &amp; Bottleneck Bypass
                </h3>
                <p className="text-[11px] text-slate-400">
                  Conditional 2nd Process (Subcont) vs. Direct to Preparation
                </p>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="font-bold text-sky-400 flex items-center gap-1.5">
                <span>Why Cutting Has Two Hand-Off Paths:</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Not every footwear component requires a 2nd process after <strong>2. Cutting</strong>. The Cutting PIC (<strong className="text-white">Joko Susilo</strong>) or Super Admin can route styles along two paths:
              </p>

              {/* Path A */}
              <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-800/60 space-y-1">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-purple-300">
                    Path A: 2. Cutting &rarr; 3. Subcont
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                    {analytics.cuttingBranching.toSubcontCount} hand-offs
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Used when cut upper panels require <strong>2nd process</strong> works (TPU HF welding, screen printing, embroidery, or debossing).
                </p>
              </div>

              {/* Path B */}
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/60 space-y-1">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-emerald-300">
                    Path B: 2. Cutting &rarr; 4. Preparation (Direct)
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    {analytics.cuttingBranching.directToPrepCount} hand-offs
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Used when cut components need <strong>no 2nd process</strong> — goes straight to skiving, splitting &amp; taping, bypassing the <strong>{analytics.cuttingBranching.avgHoursSavedWhenSkippingSubcont}h Subcont bottleneck</strong>!
                </p>
              </div>
            </div>

            {/* Quick Filter Buttons for Routing Inspection */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Quick Inspect Hand-Off Logs by Routing:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSelectedProcessFilter('all');
                    setRoutingFilter((prev) =>
                      prev === 'cutting_to_subcont' ? 'all' : 'cutting_to_subcont'
                    );
                  }}
                  className={`px-2.5 py-2 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                    routingFilter === 'cutting_to_subcont'
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-950 text-purple-300 border-slate-800 hover:border-purple-700'
                  }`}
                >
                  Cutting &rarr; Subcont ({analytics.cuttingBranching.toSubcontCount})
                </button>
                <button
                  onClick={() => {
                    setSelectedProcessFilter('all');
                    setRoutingFilter((prev) =>
                      prev === 'cutting_direct_prep' ? 'all' : 'cutting_direct_prep'
                    );
                  }}
                  className={`px-2.5 py-2 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                    routingFilter === 'cutting_direct_prep'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-emerald-300 border-slate-800 hover:border-emerald-700'
                  }`}
                >
                  Cutting &rarr; Prep ({analytics.cuttingBranching.directToPrepCount})
                </button>
              </div>
            </div>
          </div>

          {/* Bottleneck Recommendation Box */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ERP Bottleneck Action Recommendation</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong>3. Subcont Process</strong> is averaging{' '}
              <strong className="text-rose-400">
                {analytics.processMetrics.find((m) => m.processKey === 'subcont')?.avgHours || 32.8}h
              </strong>{' '}
              (vs. 24h SLA). Route all non-embellished components directly from{' '}
              <strong>2. Cutting &rarr; 4. Preparation</strong> to prevent downstream starvation at Sewing.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. HAND-OFF CYCLE TIME & BOTTLENECK AUDIT TABLE (FROM handoffLogs)
         ===================================================================== */}
      <div
        className={`rounded-xl border p-5 shadow-sm space-y-4 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Hand-Off Cycle Time &amp; Routing Telemetry Log ({filteredLogs.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Complete record of process hand-offs, cycle time spent (<code className="font-mono">durationHours</code>), and Cutting branching decisions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              aria-label="Filter handoff logs by process"
              value={selectedProcessFilter}
              onChange={(e) => setSelectedProcessFilter(e.target.value as FactoryProcessKey | 'all')}
              className={`rounded-lg px-2.5 py-1.5 border font-mono text-xs cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            >
              <option value="all">Process: All 6 Processes</option>
              {analytics.processMetrics.map((m) => (
                <option key={m.processKey} value={m.processKey}>
                  {m.stepNumber}. {m.processName} (Avg: {m.avgHours}h)
                </option>
              ))}
            </select>

            <select
              aria-label="Filter handoff logs by routing or bottleneck status"
              value={routingFilter}
              onChange={(e) => setRoutingFilter(e.target.value as any)}
              className={`rounded-lg px-2.5 py-1.5 border font-mono text-xs cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            >
              <option value="all">Filter: All Hand-Offs</option>
              <option value="bottlenecks_only">⚠️ Bottleneck SLA Overruns Only</option>
              <option value="cutting_to_subcont">Cutting &rarr; 3. Subcont (2nd Process)</option>
              <option value="cutting_direct_prep">Cutting &rarr; 4. Preparation (Direct Skip Subcont)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b font-mono text-[11px] uppercase ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <th className="py-2.5 px-3">Timestamp (WIB)</th>
                <th className="py-2.5 px-3">Style &amp; Component Scope</th>
                <th className="py-2.5 px-3">Process Hand-Off Path</th>
                <th className="py-2.5 px-3">Time Spent vs SLA</th>
                <th className="py-2.5 px-3">Authorized PIC</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
              {filteredLogs.map((log) => {
                const sla = log.slaTargetHours || 16;
                const isOverrun = log.durationHours > sla;
                const isDirectSkip =
                  log.fromProcess === 'cutting' && log.toProcess === 'preparation';
                const isSubcontRoute =
                  log.fromProcess === 'cutting' && log.toProcess === 'subcont';

                return (
                  <tr key={log.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}>
                    <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap text-emerald-400">
                      {log.timestampWib}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold">
                        {log.projectName}{' '}
                        <span className="font-mono text-[11px] text-slate-400">
                          ({log.productCode})
                        </span>
                      </div>
                      {log.componentScope && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          Scope: {log.componentScope}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                          {PROCESS_LABELS[log.fromProcess]}
                        </span>
                        <span className="text-emerald-400 font-bold">&rarr;</span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold border ${
                            isDirectSkip
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isSubcontRoute
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          }`}
                        >
                          {PROCESS_LABELS[log.toProcess]}
                        </span>
                      </div>
                      {isDirectSkip && (
                        <span className="inline-block mt-1 text-[10px] font-mono text-emerald-400">
                          ★ Direct to Preparation (Skipped Subcont 2nd Process)
                        </span>
                      )}
                      {isSubcontRoute && (
                        <span className="inline-block mt-1 text-[10px] font-mono text-purple-300">
                          ◆ Routed to Subcont for 2nd Process
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-bold border ${
                          isOverrun
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {log.durationHours}h
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1.5">/ {sla}h SLA</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-semibold">{log.authorizedByName}</span>{' '}
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {log.authorizedByBadge}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-xs">{log.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
