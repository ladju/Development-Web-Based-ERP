import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ProcessOutputMetric, FactoryProcessKey } from '../types/factoryOutput';
import { Language, ThemeMode, translations } from '../utils/i18n';
import { AlertTriangle, ShieldCheck, AlertCircle, Info, RefreshCw, Zap } from 'lucide-react';

interface D3WipBufferChartProps {
  metrics: ProcessOutputMetric[];
  dangerThreshold?: number; // Default 350 pairs
  onReplenishBuffer?: (processKey: FactoryProcessKey, addPairs: number) => void;
  lang?: Language;
  theme?: ThemeMode;
}

interface HoveredStationInfo {
  metric: ProcessOutputMetric;
  x: number;
  y: number;
}

export const D3WipBufferChart: React.FC<D3WipBufferChartProps> = ({
  metrics,
  dangerThreshold = 350,
  onReplenishBuffer,
  lang = 'en',
  theme = 'dark',
}) => {
  const t = translations[lang];
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredStation, setHoveredStation] = useState<HoveredStationInfo | null>(null);

  // Identify bottleneck processes with dangerously low buffer
  const starvedProcesses = useMemo(() => {
    return metrics.filter((m) => m.wipBufferPairs < dangerThreshold);
  }, [metrics, dangerThreshold]);

  const warningProcesses = useMemo(() => {
    return metrics.filter((m) => m.wipBufferPairs >= dangerThreshold && m.wipBufferPairs < 550);
  }, [metrics, dangerThreshold]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 700;
    const height = 280;
    const margin = { top: 35, right: 30, bottom: 45, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const isDark = theme === 'dark';

    // Clear previous elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'overflow-visible font-sans');

    // Gradients definition
    const defs = svg.append('defs');

    // Red Danger Gradient
    const dangerGrad = defs.append('linearGradient')
      .attr('id', 'danger-buffer-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    dangerGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 1);
    dangerGrad.append('stop').attr('offset', '100%').attr('stop-color', '#be123c').attr('stop-opacity', 0.85);

    // Amber Warning Gradient
    const warnGrad = defs.append('linearGradient')
      .attr('id', 'warn-buffer-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    warnGrad.append('stop').attr('offset', '0%').attr('stop-color', '#fbbf24').attr('stop-opacity', 1);
    warnGrad.append('stop').attr('offset', '100%').attr('stop-color', '#d97706').attr('stop-opacity', 0.85);

    // Emerald Safe Gradient
    const safeGrad = defs.append('linearGradient')
      .attr('id', 'safe-buffer-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    safeGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 1);
    safeGrad.append('stop').attr('offset', '100%').attr('stop-color', '#047857').attr('stop-opacity', 0.85);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: Processes
    const xScale = d3.scaleBand()
      .domain(metrics.map((d) => d.name))
      .range([0, innerWidth])
      .padding(0.32);

    // Y Scale: WIP Buffer Pairs
    const maxVal = d3.max(metrics, (d) => d.wipBufferPairs) || 800;
    const yMax = Math.max(maxVal * 1.25, dangerThreshold * 2.2);
    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([innerHeight, 0])
      .nice();

    // Horizontal Gridlines
    const yGrid = d3.axisLeft(yScale)
      .ticks(5)
      .tickSize(-innerWidth)
      .tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', isDark ? '#334155' : '#e2e8f0')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-opacity', 0.6);

    g.select('.grid .domain').remove();

    // Danger Zone background shading
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(dangerThreshold))
      .attr('width', innerWidth)
      .attr('height', innerHeight - yScale(dangerThreshold))
      .attr('fill', isDark ? '#f43f5e' : '#ffe4e6')
      .attr('fill-opacity', isDark ? 0.08 : 0.35);

    // Danger Threshold Line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(dangerThreshold))
      .attr('y2', yScale(dangerThreshold))
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,4');

    // Danger Threshold Label
    g.append('text')
      .attr('x', innerWidth - 8)
      .attr('y', yScale(dangerThreshold) - 6)
      .attr('text-anchor', 'end')
      .attr('fill', '#f43f5e')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text(lang === 'id' 
        ? `🚨 Ambang Kritis Starvation (<${dangerThreshold} prs)` 
        : `🚨 Critical Starvation Threshold (<${dangerThreshold} prs)`);

    // Draw Bars
    const barGroups = g.selectAll('.bar-group')
      .data(metrics)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('transform', (d) => `translate(${xScale(d.name)},0)`);

    // Rectangles
    barGroups.append('rect')
      .attr('class', 'wip-bar')
      .attr('x', 0)
      .attr('y', innerHeight)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', (d) => {
        if (d.wipBufferPairs < dangerThreshold) return 'url(#danger-buffer-grad)';
        if (d.wipBufferPairs < 550) return 'url(#warn-buffer-grad)';
        return 'url(#safe-buffer-grad)';
      })
      .attr('stroke', (d) => {
        if (d.wipBufferPairs < dangerThreshold) return '#f43f5e';
        if (d.wipBufferPairs < 550) return '#f59e0b';
        return '#10b981';
      })
      .attr('stroke-width', (d) => (d.wipBufferPairs < dangerThreshold ? 1.5 : 0.5))
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setHoveredStation({ metric: d, x: mx, y: my });
      })
      .on('mousemove', (event, d) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setHoveredStation({ metric: d, x: mx, y: my });
      })
      .on('mouseleave', () => {
        setHoveredStation(null);
      })
      .transition()
      .duration(750)
      .delay((_, i) => i * 70)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => yScale(d.wipBufferPairs))
      .attr('height', (d) => innerHeight - yScale(d.wipBufferPairs));

    // Value Labels on top of bars
    barGroups.append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(d.wipBufferPairs) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => {
        if (d.wipBufferPairs < dangerThreshold) return '#f43f5e';
        if (d.wipBufferPairs < 550) return isDark ? '#fbbf24' : '#d97706';
        return isDark ? '#34d399' : '#059669';
      })
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text((d) => `${d.wipBufferPairs.toLocaleString()} prs`);

    // Warning Badge / Exclamation Icon for dangerously low buffers
    barGroups.filter((d) => d.wipBufferPairs < dangerThreshold)
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(d.wipBufferPairs) - 22)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f43f5e')
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('⚠️ LOW');

    // X Axis
    const xAxis = d3.axisBottom(xScale);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', isDark ? '#cbd5e1' : '#334155')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('dy', '0.9em');

    g.select('.domain').attr('stroke', isDark ? '#475569' : '#cbd5e1');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d} p`);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', isDark ? '#94a3b8' : '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

  }, [metrics, dangerThreshold, lang, theme]);

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all shadow-sm ${
      theme === 'dark' 
        ? 'bg-slate-950/90 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Header & Bottleneck Status Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 mb-3 border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${
              starvedProcesses.length > 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {starvedProcesses.length > 0 ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <h4 className="text-sm font-bold tracking-tight flex items-center gap-2">
              <span>{lang === 'id' ? 'Visualisasi D3 Penyangga WIP & Analisis Bottleneck' : 'D3 WIP Buffer Pairs & Bottleneck Flow Visualizer'}</span>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                starvedProcesses.length > 0
                  ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                {starvedProcesses.length > 0 
                  ? (lang === 'id' ? `${starvedProcesses.length} STARVATION BOTTLENECK` : `${starvedProcesses.length} DANGEROUSLY LOW`)
                  : (lang === 'id' ? 'BUFFER AMAN OPTIMAL' : 'HEALTHY BUFFER FLOW')}
              </span>
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'id'
              ? 'Grafik D3 real-time memetakan jumlah pasang buffer WIP antar sel. Bar di bawah garis merah menunjukkan kekurangan pasang yang dapat memicu kemacetan (starvation bottleneck).'
              : 'Interactive D3 chart mapping WIP buffer pairs between manufacturing cells. Bars falling below the red line suffer critical starvation, risking complete line stall downstream.'}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span className="text-rose-400 font-bold">&lt; {dangerThreshold} prs ({lang === 'id' ? 'Kritis' : 'Danger'})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-amber-400 font-semibold">{dangerThreshold}-550 prs ({lang === 'id' ? 'Waspada' : 'Warning'})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-emerald-400 font-semibold">&gt; 550 prs ({lang === 'id' ? 'Optimal' : 'Healthy'})</span>
          </span>
        </div>
      </div>

      {/* D3 SVG Container with relative positioning for HTML Tooltip */}
      <div ref={containerRef} className="relative w-full overflow-x-auto min-h-[290px]">
        <svg ref={svgRef} className="w-full h-auto" />

        {/* Dynamic D3 Hover Tooltip */}
        {hoveredStation && (
          <div
            className={`absolute z-30 p-3 rounded-xl border shadow-2xl pointer-events-none text-xs font-mono max-w-xs transition-all ${
              theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
            }`}
            style={{
              left: Math.min(hoveredStation.x + 15, (containerRef.current?.clientWidth || 700) - 240),
              top: Math.max(hoveredStation.y - 120, 10),
            }}
          >
            <div className="flex items-center justify-between border-b pb-1.5 mb-1.5 border-slate-800">
              <span className="font-bold text-white text-sm">{hoveredStation.metric.name}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                hoveredStation.metric.wipBufferPairs < dangerThreshold
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {hoveredStation.metric.wipBufferPairs < dangerThreshold ? 'CRITICAL STARVATION' : 'BUFFER SUFFICIENT'}
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Current WIP Buffer:</span>
                <strong className={hoveredStation.metric.wipBufferPairs < dangerThreshold ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {hoveredStation.metric.wipBufferPairs.toLocaleString()} pairs
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hourly Run Rate:</span>
                <span className="text-slate-200">{hoveredStation.metric.hourlyRunRate} prs/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time to Starvation:</span>
                <span className={hoveredStation.metric.wipBufferPairs < dangerThreshold ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  {Math.round((hoveredStation.metric.wipBufferPairs / Math.max(hoveredStation.metric.hourlyRunRate, 1)) * 60)} mins
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cell Operators:</span>
                <span className="text-slate-200">{hoveredStation.metric.headcount} workers</span>
              </div>
            </div>

            {hoveredStation.metric.wipBufferPairs < dangerThreshold && (
              <div className="mt-2 pt-1.5 border-t border-rose-900/60 text-[10px] text-rose-300 flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  {lang === 'id' 
                    ? 'Stok buffer pasang rendah! Tingkatkan laju output feeder upstream segera untuk mencegah sewing/assembly terhenti.' 
                    : 'Low buffer! Upstream feeder station must increase output immediately to prevent cell starving.'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottleneck Alert Action Footnote */}
      {starvedProcesses.length > 0 && (
        <div className={`mt-3 p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          theme === 'dark' ? 'bg-rose-950/20 border-rose-900/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>{lang === 'id' ? 'Peringatan Bottleneck Terdeteksi:' : 'Bottleneck Warning Detected:'}</strong>{' '}
              {starvedProcesses.map((p) => p.name).join(', ')}{' '}
              {lang === 'id' 
                ? `memiliki buffer < ${dangerThreshold} pasang. Segera jadwalkan pengalihan operator atau lembur dev.`
                : `have buffer < ${dangerThreshold} pairs. Action required to balance line transfer.`}
            </span>
          </div>

          {onReplenishBuffer && (
            <div className="flex items-center gap-2 shrink-0">
              {starvedProcesses.map((p) => (
                <button
                  key={p.key}
                  onClick={() => onReplenishBuffer(p.key, 150)}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono text-[11px] font-bold transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3 h-3" />
                  <span>+{150} {p.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
