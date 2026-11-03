import React, { useState } from 'react';
import { Milestone, FootwearProject } from '../types/footwear';
import { formatDateMMDDYYYY } from '../utils/dateUtils';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  SlidersHorizontal, 
  Ship, 
  Anchor, 
  Layers, 
  ArrowRight,
  Sparkles,
  Check
} from 'lucide-react';

interface MilestoneTimelineProps {
  project: FootwearProject;
  milestones: Milestone[];
  onToggleCompleteMilestone: (milestoneId: string) => void;
  onSimulateDelay: (days: number) => void;
  simulatedDelayDays: number;
}

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
  project,
  milestones,
  onToggleCompleteMilestone,
  onSimulateDelay,
  simulatedDelayDays,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');

  const filteredMilestones = milestones.filter(
    (m) => selectedPhase === 'all' || m.phase === selectedPhase
  );

  const phases = [
    { id: 'all', label: 'Full Critical Path' },
    { id: 'tooling', label: 'Tooling & Molds' },
    { id: 'sourcing', label: 'Bulk Materials' },
    { id: 'sampling', label: 'Sampling Gates' },
    { id: 'production', label: 'Cut & Assembly' },
    { id: 'logistics', label: 'Ex-Factory & Shipping' },
  ];

  const criticalCount = milestones.filter((m) => m.isCriticalPath).length;
  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="space-y-6">
      {/* Top Critical Path Health Bar & Delay Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Production Milestone &amp; Critical Path Schedule</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Tracking sequence-locked stage gates toward Ex-Factory Date (XF) and container port loading.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              Progress: <strong className="text-emerald-400">{completedCount}/{milestones.length}</strong> ({progressPercent}%)
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              Critical Nodes: <strong className="text-amber-400">{criticalCount}</strong>
            </div>
          </div>
        </div>

        {/* Interactive Delay Simulator Bar */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">
                Supply Chain Stress Simulator (What-If Scenario)
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Simulated Delay: <strong className={simulatedDelayDays > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {simulatedDelayDays > 0 ? `+${simulatedDelayDays} Days Slip` : '0 Days (Baseline Plan)'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSimulateDelay(0)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                simulatedDelayDays === 0
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Baseline (0d)
            </button>
            <button
              onClick={() => onSimulateDelay(4)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                simulatedDelayDays === 4
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              +4d (Mold CNC Slip)
            </button>
            <button
              onClick={() => onSimulateDelay(10)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                simulatedDelayDays === 10
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              +10d (Fabric Customs Hold)
            </button>
            <button
              onClick={() => onSimulateDelay(21)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                simulatedDelayDays === 21
                  ? 'bg-red-700 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              +21d (Factory Retooling)
            </button>
          </div>

          {simulatedDelayDays > 0 && (
            <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-center justify-between">
              <span>
                Projected Impact: Target Ex-Factory shifts by {simulatedDelayDays} days to approximately{' '}
                <strong className="underline font-mono">
                  {formatDateMMDDYYYY(new Date(new Date(project.targetXFDate).getTime() + simulatedDelayDays * 86400000))}
                </strong>.
              </span>
              <button
                onClick={() => onSimulateDelay(0)}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Reset Scenario
              </button>
            </div>
          )}
        </div>

        {/* Phase Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-800">
          {phases.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPhase(p.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedPhase === p.id
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt & Milestone Node List */}
      <div className="space-y-3">
        {filteredMilestones.map((milestone, idx) => {
          const isCompleted = milestone.status === 'completed';
          const isAtRisk = milestone.status === 'at_risk';
          const isDelayed = milestone.status === 'delayed' || milestone.delayDays > 0;
          const isXF = milestone.title.includes('Ex-Factory');

          return (
            <div
              key={milestone.id}
              className={`bg-slate-900 border rounded-xl p-4 transition-all shadow-sm ${
                isXF
                  ? 'border-amber-500/70 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 ring-1 ring-amber-500/30'
                  : isDelayed
                  ? 'border-red-800/80 bg-red-950/10'
                  : isAtRisk
                  ? 'border-amber-800/60'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Left: Sequence index, Title & Deliverables */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isDelayed
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : isAtRisk
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{milestone.title}</h4>
                      {milestone.isCriticalPath && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800 font-semibold">
                          CRITICAL PATH
                        </span>
                      )}
                      <span className="text-[11px] font-mono uppercase text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                        {milestone.phase}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">{milestone.description}</p>
                    
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                      <span>Owner: <strong className="text-slate-300 font-normal">{milestone.owner}</strong></span>
                      <span>·</span>
                      <span>Deliverable: <strong className="text-slate-300 font-normal">{milestone.deliverable}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Dates & Status / Completion Button */}
                <div className="flex flex-wrap items-center gap-4 lg:gap-6 self-stretch lg:self-auto justify-between lg:justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {/* Dates */}
                  <div className="text-left lg:text-right font-mono text-xs">
                    <div className="text-slate-400">
                      Planned: <strong className="text-white">{formatDateMMDDYYYY(milestone.plannedDate)}</strong>
                    </div>
                    {milestone.actualDate ? (
                      <div className="text-emerald-400 text-[11px]">Actual: {formatDateMMDDYYYY(milestone.actualDate)}</div>
                    ) : milestone.delayDays > 0 ? (
                      <div className="text-red-400 text-[11px]">+{milestone.delayDays}d slip</div>
                    ) : (
                      <div className="text-slate-500 text-[11px]">On target</div>
                    )}
                  </div>

                  {/* Complete Checkbox Button */}
                  <button
                    onClick={() => onToggleCompleteMilestone(milestone.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>{isCompleted ? 'Completed' : 'Mark Completed'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
