import React, { useState } from 'react';
import { SampleRound, FitComment } from '../types/footwear';
import { evaluateSampleGateApproval } from '../utils/footwearErpLogic';
import { formatDateMMDDYYYY } from '../utils/dateUtils';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Truck, 
  RotateCcw, 
  Send, 
  Plus, 
  ChevronRight, 
  Scale, 
  Ruler, 
  Activity, 
  Layers,
  Sparkles,
  Check
} from 'lucide-react';

interface SampleRoomTrackerProps {
  samples: SampleRound[];
  activeSampleId: string;
  onSelectSample: (sampleId: string) => void;
  onToggleResolveComment: (sampleId: string, commentId: string) => void;
  onAddComment: (
    sampleId: string,
    area: FitComment['area'],
    severity: FitComment['severity'],
    comment: string,
    author: string
  ) => void;
  onUpdateSampleDecision: (sampleId: string, decision: 'approved' | 'rejected') => void;
}

export const SampleRoomTracker: React.FC<SampleRoomTrackerProps> = ({
  samples,
  activeSampleId,
  onSelectSample,
  onToggleResolveComment,
  onAddComment,
  onUpdateSampleDecision,
}) => {
  const currentSample = samples.find((s) => s.id === activeSampleId) || samples[0];

  // Add Comment Form State
  const [newArea, setNewArea] = useState<FitComment['area']>('collar');
  const [newSeverity, setNewSeverity] = useState<FitComment['severity']>('moderate');
  const [newComment, setNewComment] = useState('');
  const [newAuthor, setNewAuthor] = useState('Footwear Tech Inspector');

  const gateEvaluation = currentSample ? evaluateSampleGateApproval(currentSample) : { canProceed: false, unresolvedCriticalComments: 0, reason: '' };

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentSample) return;
    onAddComment(currentSample.id, newArea, newSeverity, newComment, newAuthor);
    setNewComment('');
  };

  if (!currentSample) {
    return <div className="p-8 text-center text-slate-400">No samples configured for this project.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Sample Stage Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {samples.map((sample) => {
          const isSelected = sample.id === currentSample.id;
          const unresolved = sample.fitComments.filter((c) => !c.resolved).length;
          const isApproved = sample.decision === 'approved' || sample.status === 'approved';

          return (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample.id)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/80 border-slate-800 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-white">{sample.version}</span>
                {isApproved ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : unresolved > 0 ? (
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-red-950 border border-red-800 text-red-300">
                    {unresolved} bug{unresolved > 1 ? 's' : ''}
                  </span>
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate">{sample.stageName.split('(')[0]}</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1 capitalize">
                {sample.status.replace('_', ' ')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Sample Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sample Specifications & Photo */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="h-56 bg-slate-950 relative">
              <img
                src={currentSample.imageUrl}
                alt={currentSample.stageName}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-mono text-white border border-slate-700">
                {currentSample.version} · {currentSample.shoeSize}
              </div>
              <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-mono text-emerald-400 border border-slate-700">
                Weight: {currentSample.weightGrams}g
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">{currentSample.stageName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sample Room: {currentSample.factory}</p>
              </div>

              {/* Courier & Tracking Stepper */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Truck className="w-4 h-4 text-sky-400" />
                    <span className="font-semibold">{currentSample.courier}</span>
                  </div>
                  <span className="font-mono text-slate-400">{currentSample.trackingNumber}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 text-slate-400 font-mono">
                  <div>
                    <span className="text-slate-500 block">Dispatched:</span>
                    <span>{formatDateMMDDYYYY(currentSample.dispatchedDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Received:</span>
                    <span>{formatDateMMDDYYYY(currentSample.receivedDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Review By:</span>
                    <span className="text-slate-300">{formatDateMMDDYYYY(currentSample.targetReviewDate)}</span>
                  </div>
                </div>
              </div>

              {/* Quality & Flex Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Fit Score (1-10)</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">
                    {currentSample.fitScore > 0 ? `${currentSample.fitScore}/10` : 'Pending'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Bally Flex Test</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {currentSample.testFlexCycles ? `${currentSample.testFlexCycles.toLocaleString()} cyc` : 'Waived'}
                  </div>
                </div>
              </div>

              {/* Stage-Gate Signoff Panel */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Stage Gate Decision:</span>
                  <span
                    className={`font-mono text-xs uppercase px-2 py-0.5 rounded font-bold ${
                      currentSample.decision === 'approved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : currentSample.decision === 'rejected'
                        ? 'bg-red-950 text-red-300 border border-red-700'
                        : 'bg-amber-950 text-amber-300 border border-amber-700'
                    }`}
                  >
                    {currentSample.decision}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {gateEvaluation.reason}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onUpdateSampleDecision(currentSample.id, 'rejected')}
                    className="flex-1 py-1.5 px-2 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold transition-colors"
                  >
                    Reject (Resample)
                  </button>

                  <button
                    disabled={!gateEvaluation.canProceed}
                    onClick={() => onUpdateSampleDecision(currentSample.id, 'approved')}
                    className={`flex-1 py-1.5 px-2 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                      gateEvaluation.canProceed
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Stage</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Fit Comments & Defect Tracking Log */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Technician Fit Comments &amp; Tooling Revisions</h3>
              <p className="text-xs text-slate-400">
                Log critical feedback on last, collar, arch, and mold tooling tolerances.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {currentSample.fitComments.filter((c) => !c.resolved).length} unresolved defect(s)
            </span>
          </div>

          {/* Comments List */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {currentSample.fitComments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No fit comments recorded for this sample stage yet.
              </div>
            ) : (
              currentSample.fitComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg border transition-all ${
                    comment.resolved
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : comment.severity === 'critical'
                      ? 'bg-red-950/20 border-red-900/60'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        {comment.area}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          comment.severity === 'critical'
                            ? 'bg-red-950 text-red-300 border border-red-800 font-bold'
                            : comment.severity === 'moderate'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {comment.severity}
                      </span>
                    </div>

                    <button
                      onClick={() => onToggleResolveComment(currentSample.id, comment.id)}
                      className={`text-xs flex items-center gap-1 font-mono transition-colors cursor-pointer ${
                        comment.resolved
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-400 hover:text-emerald-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{comment.resolved ? 'Resolved' : 'Mark Resolved'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-200 mt-2 leading-relaxed">{comment.comment}</p>

                  <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center gap-2">
                    <span>{comment.author} ({comment.role})</span>
                    <span>·</span>
                    <span>{formatDateMMDDYYYY(comment.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add New Defect / Fit Comment Form */}
          <form onSubmit={handleAddCommentSubmit} className="pt-3 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300">Log New Fit / Tooling Comment</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Footwear Anatomical Area</label>
                <select
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="collar">Collar &amp; Achilles</option>
                  <option value="vamp">Vamp &amp; Toe Box</option>
                  <option value="heel">Heel Counter &amp; Bevel</option>
                  <option value="midsole">Midsole Cushion &amp; Rocker</option>
                  <option value="outsole">Outsole Lug &amp; Traction</option>
                  <option value="tongue">Tongue Gusset</option>
                  <option value="lacing">Eyestay &amp; Lacing Tension</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Defect Severity</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="minor">Minor Aesthetic Polish</option>
                  <option value="moderate">Moderate Comfort Defect</option>
                  <option value="critical">Critical Gate Blocker</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Inspector Name</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Feedback Description</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Lateral collar biting into ankle; reduce collar foam durometer by 5 Asker C."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit Comment</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
