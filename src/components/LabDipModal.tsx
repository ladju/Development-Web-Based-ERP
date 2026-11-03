import React, { useState } from 'react';
import { BOMItem, LabDipStatus } from '../types/footwear';
import { X, Check, AlertTriangle, Eye, Sparkles } from 'lucide-react';

interface LabDipModalProps {
  item: BOMItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (itemId: string, newStatus: LabDipStatus, round: number, notes?: string) => void;
}

export const LabDipModal: React.FC<LabDipModalProps> = ({
  item,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  if (!isOpen) return null;

  const [selectedRound, setSelectedRound] = useState(item.labDipRound || 1);
  const [activeLightSource, setActiveLightSource] = useState<'D65' | 'TL84' | 'A' | 'UV'>('D65');
  const [comment, setComment] = useState(item.notes || '');

  const handleApprove = () => {
    onUpdateStatus(item.id, 'approved', selectedRound, comment);
    onClose();
  };

  const handleReject = () => {
    onUpdateStatus(item.id, 'rejected', selectedRound + 1, comment || 'Color shade deviation exceeds tolerance limit.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Lab Dip &amp; Swatch Color Approval</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{item.materialCode} · {item.componentName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Material Specs */}
        <div className="bg-slate-950 rounded-lg p-3 text-xs space-y-1.5 border border-slate-800/80">
          <div className="flex justify-between">
            <span className="text-slate-400">Material:</span>
            <span className="font-semibold text-slate-200">{item.materialName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Supplier:</span>
            <span className="text-slate-200">{item.supplierName} ({item.supplierCountry})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Current Status:</span>
            <span className="font-mono uppercase font-semibold text-amber-400">{item.labDipStatus}</span>
          </div>
        </div>

        {/* Virtual Light Booth Simulation */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Color Matching Light Booth:</span>
            <span className="text-[11px] text-slate-500 font-normal">Standard: AATCC / ISO 105</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'D65', name: 'D65 Daylight', temp: '6500K' },
              { id: 'TL84', name: 'TL84 Retail', temp: '4000K' },
              { id: 'A', name: 'Incand. A', temp: '2856K' },
              { id: 'UV', name: 'UV Optical', temp: 'Fluoresc.' },
            ].map((light) => (
              <button
                key={light.id}
                type="button"
                onClick={() => setActiveLightSource(light.id as any)}
                className={`py-1.5 px-2 rounded border text-left transition-colors ${
                  activeLightSource === light.id
                    ? 'bg-slate-800 border-emerald-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div className="text-xs font-bold">{light.id}</div>
                <div className="text-[10px] text-slate-400">{light.temp}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Swatch Comparison Simulation */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-around gap-4 text-center">
          <div>
            <div className="w-16 h-16 rounded-md bg-teal-500 border border-slate-600 shadow-inner mx-auto mb-1 flex items-center justify-center text-[10px] text-teal-950 font-bold">
              Target
            </div>
            <span className="text-[11px] text-slate-400">Standard Spec</span>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            vs.
            <div className="text-[10px] text-amber-400 mt-1">ΔE: 0.82</div>
          </div>

          <div>
            <div 
              className={`w-16 h-16 rounded-md border shadow-inner mx-auto mb-1 flex items-center justify-center text-[10px] font-bold ${
                item.labDipStatus === 'rejected'
                  ? 'bg-teal-600/90 border-amber-500 text-slate-900'
                  : 'bg-teal-500/95 border-emerald-500 text-slate-900'
              }`}
            >
              R{selectedRound}
            </div>
            <span className="text-[11px] text-slate-400">Sample Strike-off</span>
          </div>
        </div>

        {/* Technical Evaluator Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Colorist &amp; Materialist Evaluation Notes:
          </label>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Swatch approved under D65 daylight; meets standard tolerance."
            className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleReject}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 transition-colors"
          >
            Reject (Require R{selectedRound + 1})
          </button>

          <button
            type="button"
            onClick={handleApprove}
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            Approve Swatch R{selectedRound}
          </button>
        </div>
      </div>
    </div>
  );
};
