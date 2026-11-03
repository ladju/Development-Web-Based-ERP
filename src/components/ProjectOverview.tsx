import React from 'react';
import { FootwearProject, BOMItem, SampleRound, Milestone, ErpAlert } from '../types/footwear';
import { 
  SourcingReadinessReport, 
  CriticalPathReport 
} from '../utils/footwearErpLogic';
import { formatDateMMDDYYYY } from '../utils/dateUtils';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Package, 
  Ship, 
  ArrowUpRight, 
  ChevronRight, 
  Factory, 
  Calendar,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface ProjectOverviewProps {
  project: FootwearProject;
  sourcingReport: SourcingReadinessReport;
  criticalPath: CriticalPathReport;
  alerts: ErpAlert[];
  onNavigateTab: (tab: 'materials' | 'samples' | 'milestones') => void;
  onSelectAlert: (alert: ErpAlert) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  sourcingReport,
  criticalPath,
  alerts,
  onNavigateTab,
  onSelectAlert,
}) => {
  // Find current active sample
  const activeSample = project.samples.find(
    (s) => s.status === 'received_reviewing' || s.status === 'in_transit' || s.status === 'cutting_stitching'
  ) || project.samples[project.samples.length - 1];

  const currentSampleUnresolvedDefects = activeSample?.fitComments.filter(c => !c.resolved).length || 0;

  return (
    <div className="space-y-6">
      {/* Hero Style Card & Quick Identity */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Shoe Photo & Colorway */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4 items-center">
            <div className="w-full sm:w-56 lg:w-full h-44 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 relative group">
              <img
                src={project.heroImage || activeSample?.imageUrl}
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-sm px-2 py-1 rounded text-[11px] font-mono text-slate-300 border border-slate-700">
                {project.season} · {project.gender}
              </div>
              <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-sm px-2 py-1 rounded text-[11px] font-mono text-emerald-400 border border-slate-700">
                {project.colorwayCode}
              </div>
            </div>

            <div className="w-full text-left space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">{project.name}</h2>
              <p className="text-xs text-slate-400">{project.silhouette}</p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs text-slate-400 font-mono">
                <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">Last: {project.lastCode}</span>
                <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">{project.category}</span>
                <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">{project.orderVolumePairs.toLocaleString()} pairs</span>
              </div>
            </div>
          </div>

          {/* 4 Core Footwear ERP Metric Pillars */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Sourcing Readiness */}
            <div 
              onClick={() => onNavigateTab('materials')}
              className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-slate-400">Material Sourcing</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white font-mono">{sourcingReport.readinessPercentage}%</span>
                <span className="text-xs text-slate-400">readiness</span>
              </div>
              
              {/* Mini progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full my-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    sourcingReport.readinessPercentage > 80 ? 'bg-emerald-500' : sourcingReport.readinessPercentage > 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${sourcingReport.readinessPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>{sourcingReport.approvedCount} of {sourcingReport.totalComponents} approved</span>
                {sourcingReport.atRiskCount > 0 ? (
                  <span className="text-red-400 font-semibold">{sourcingReport.atRiskCount} at risk</span>
                ) : (
                  <span className="text-emerald-400 font-semibold">On track</span>
                )}
              </div>
            </div>

            {/* 2. Factory Sample Gate Status */}
            <div 
              onClick={() => onNavigateTab('samples')}
              className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-slate-400">Sample Stage-Gate</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white truncate">{activeSample ? activeSample.stageName.split(' ')[0] : 'Proto 1'}</span>
                <span className="text-xs font-mono text-slate-400">{activeSample?.version}</span>
              </div>

              <div className="my-2.5 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
                  {activeSample?.status.replace('_', ' ').toUpperCase()}
                </span>
                {currentSampleUnresolvedDefects > 0 && (
                  <span className="text-xs text-red-400 font-semibold">
                    {currentSampleUnresolvedDefects} defect{currentSampleUnresolvedDefects > 1 ? 's' : ''} blocking
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Courier: <strong className="text-slate-300">{activeSample?.courier.split(' ')[0]}</strong></span>
                <span className="font-mono text-slate-300">Score: {activeSample?.fitScore || 0}/10</span>
              </div>
            </div>

            {/* 3. Shipment Deadlines & XF Countdown */}
            <div 
              onClick={() => onNavigateTab('milestones')}
              className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-slate-400">Ex-Factory (XF) Window</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {criticalPath.daysUntilXF >= 0 ? `T-${criticalPath.daysUntilXF}` : `+${Math.abs(criticalPath.daysUntilXF)}d`}
                </span>
                <span className="text-xs text-slate-400">
                  {criticalPath.daysUntilXF >= 0 ? 'days to factory dispatch' : 'days overdue past XF'}
                </span>
              </div>

              <div className="my-2.5 flex items-center gap-2 text-xs">
                <span className="text-slate-400">XF Date:</span>
                <span className="font-mono text-slate-200 font-medium">{formatDateMMDDYYYY(project.targetXFDate)}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Cut:</span>
                <span className="font-mono text-slate-200">{project.bulkMaterialCutWeek}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Status:</span>
                <span className={`font-semibold capitalize ${criticalPath.overallStatus === 'on_track' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {criticalPath.overallStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* 4. FST Lab & Mold Tooling Readiness */}
            <div 
              onClick={() => onNavigateTab('samples')}
              className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-slate-400">FST Lab &amp; Mold Tooling</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono text-white uppercase">
                  {project.fstTest?.status ? project.fstTest.status.replace('_', ' ') : 'Standard'}
                </span>
                <span className="text-xs text-slate-400">lab validation</span>
              </div>

              <div className="my-2.5 flex items-center gap-2 text-xs">
                <span className="text-slate-400">Bond Peel:</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {project.fstTest?.bondStrengthKgPerCm ? `${project.fstTest.bondStrengthKgPerCm} kg/cm` : '≥ 3.0 kg/cm'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 font-mono">
                <span>Outsole: {project.outsoleMoldId}</span>
                <span>Midsole: {project.midsoleMoldId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage-Gate Pipeline Horizontal Stepper */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Footwear Commercialization Stage-Gates</h3>
          </div>
          <button
            onClick={() => onNavigateTab('samples')}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
          >
            <span>Open Sample Room</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { key: 'proto_1', label: '1. Proto 1', sub: 'Pattern / Last Check', status: 'approved' },
            { key: 'proto_2', label: '2. Proto 2', sub: 'Molded Tooling Flex', status: 'approved' },
            { key: 'fit_wear_test', label: '3. Wear Testing', sub: '100km Athlete Test', status: 'approved' },
            { key: 'sms', label: '4. SMS (Salesman)', sub: 'Global Line Review', status: 'active' },
            { key: 'pps', label: '5. PPS (Golden)', sub: 'Factory Master Signoff', status: 'pending' },
          ].map((stage, idx) => {
            const isApproved = stage.status === 'approved';
            const isActive = stage.status === 'active';
            return (
              <div
                key={stage.key}
                className={`p-3 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-sm'
                    : isApproved
                    ? 'bg-slate-950/40 border-emerald-900/40'
                    : 'bg-slate-950/20 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white">{stage.label}</span>
                  {isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {isActive && <Clock className="w-4 h-4 text-amber-400 animate-pulse" />}
                  {!isApproved && !isActive && <span className="text-[10px] font-mono text-slate-500">Upcoming</span>}
                </div>
                <p className="text-[11px] text-slate-400">{stage.sub}</p>
                <div className="mt-2 text-[10px] font-mono text-slate-500">
                  {isApproved ? 'Signoff Complete' : isActive ? 'In Inspection' : 'Awaiting SMS'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Section: Immediate Production Risks & Sourcing Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active ERP Risks & Critical Bottlenecks */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-white">Critical Path Risks &amp; Action Items</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{alerts.length} active flags</span>
          </div>

          <div className="space-y-2.5">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                All material sourcing and sampling stage-gates are currently on track.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onSelectAlert(alert)}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="pt-0.5">
                      {alert.type === 'critical' ? (
                        <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{alert.message}</p>
                    </div>
                  </div>

                  <button className="shrink-0 text-xs font-medium text-emerald-400 group-hover:underline flex items-center gap-1">
                    <span>{alert.actionText || 'Resolve'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Footwear Tooling & Factory Quick Specs */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Commercialization Specs</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{project.season}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Tier-1 Assembly Factory</span>
              <span className="font-semibold text-slate-200 text-right">{project.tier1Factory}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Sample Room Technical Lead</span>
              <span className="font-mono text-slate-200">{project.sampleRoomLead}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Outsole Mold Tooling ID</span>
              <span className="font-mono text-emerald-400">{project.outsoleMoldId}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Midsole Mold Tooling ID</span>
              <span className="font-mono text-emerald-400">{project.midsoleMoldId}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Bulk Material Cut Window</span>
              <span className="font-mono text-slate-200">{project.bulkMaterialCutWeek}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Target Ex-Factory (XF)</span>
              <span className="font-mono text-amber-300 font-semibold">{formatDateMMDDYYYY(project.targetXFDate)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Target ETA at USWC Port</span>
              <span className="font-mono text-slate-200">{formatDateMMDDYYYY(project.targetETA)}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('milestones')}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inspect Critical Path Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
