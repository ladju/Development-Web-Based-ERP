import React, { useState } from 'react';
import { FactoryProcessKey, ProcessOutputMetric } from '../types/factoryOutput';
import { Language, translations } from '../utils/i18n';
import { X, CheckCircle2, TrendingUp, Layers, Plus, ArrowRight, Zap, RefreshCw } from 'lucide-react';

interface BulkUpdateOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProcessKeys: FactoryProcessKey[];
  allMetrics: ProcessOutputMetric[];
  onApplyBulkUpdate: (updatedMap: Record<FactoryProcessKey, number>) => void;
  lang?: Language;
}

export const BulkUpdateOutputModal: React.FC<BulkUpdateOutputModalProps> = ({
  isOpen,
  onClose,
  selectedProcessKeys,
  allMetrics,
  onApplyBulkUpdate,
  lang = 'en',
}) => {
  const t = translations[lang];

  const [updateMode, setUpdateMode] = useState<'increment' | 'set_exact' | 'percent_plan'>('increment');
  const [valueInput, setValueInput] = useState<number>(100);

  if (!isOpen || selectedProcessKeys.length === 0) return null;

  const selectedMetrics = allMetrics.filter((m) => selectedProcessKeys.includes(m.key));

  // Compute preview of new live output for each selected process
  const calculateNewOutput = (currentLive: number, dailyPlan: number): number => {
    if (updateMode === 'increment') {
      return Math.max(0, currentLive + Number(valueInput || 0));
    } else if (updateMode === 'set_exact') {
      return Math.max(0, Number(valueInput || 0));
    } else if (updateMode === 'percent_plan') {
      const pct = Math.max(0, Number(valueInput || 0));
      return Math.round((dailyPlan * pct) / 100);
    }
    return currentLive;
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedMap: Record<FactoryProcessKey, number> = {} as any;
    selectedMetrics.forEach((m) => {
      updatedMap[m.key] = calculateNewOutput(m.liveOutput, m.dailyPlan);
    });
    onApplyBulkUpdate(updatedMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t.bulkModalTitle}</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {selectedProcessKeys.length} {t.selectedProcesses}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.bulkModalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close bulk action modal"
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form controls */}
        <form onSubmit={handleConfirm} className="space-y-4 text-xs">
          {/* Mode Tabs */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 font-mono">
              {t.updateMode}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUpdateMode('increment');
                  setValueInput(100);
                }}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  updateMode === 'increment'
                    ? 'bg-slate-800 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'id' ? '+ Tambah Pasang' : '+ Add Pairs'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {lang === 'id' ? 'Tambahkan ke output saat ini' : 'Add to current count'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUpdateMode('set_exact');
                  setValueInput(1500);
                }}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  updateMode === 'set_exact'
                    ? 'bg-slate-800 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang === 'id' ? 'Tetapkan Nilai Pasti' : 'Set Exact Number'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {lang === 'id' ? 'Nilai output sama untuk semua' : 'Override with fixed pairs'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUpdateMode('percent_plan');
                  setValueInput(85);
                }}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  updateMode === 'percent_plan'
                    ? 'bg-slate-800 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'id' ? '% Rencana Harian' : '% of Daily Plan'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {lang === 'id' ? 'Hitung otomatis dari target' : 'Calculate from daily target'}
                </div>
              </button>
            </div>
          </div>

          {/* Amount Input & Preset Chips */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold font-mono">
                {updateMode === 'percent_plan' 
                  ? (lang === 'id' ? 'Persentase Target Rencana (%):' : 'Percentage of Plan (%):')
                  : t.enterAmount}
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {updateMode === 'percent_plan' ? '0 - 100%' : 'Pairs (prs)'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max={updateMode === 'percent_plan' ? 150 : 100000}
                required
                value={valueInput}
                onChange={(e) => setValueInput(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 font-bold"
              />
              <span className="font-mono text-sm text-slate-400 font-bold">
                {updateMode === 'percent_plan' ? '%' : t.prs}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-mono">
              <span className="text-slate-500">{lang === 'id' ? 'Pilihan Cepat:' : 'Quick Presets:'}</span>
              {updateMode === 'increment' && (
                <>
                  {[+50, +100, +200, +500].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setValueInput(num)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700"
                    >
                      +{num}
                    </button>
                  ))}
                </>
              )}
              {updateMode === 'set_exact' && (
                <>
                  {[1000, 1500, 2000, 2500].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setValueInput(num)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                    >
                      {num}
                    </button>
                  ))}
                </>
              )}
              {updateMode === 'percent_plan' && (
                <>
                  {[75, 80, 85, 90, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setValueInput(pct)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                    >
                      {pct}%
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Live Preview of Changes across Selected Stations */}
          <div className="space-y-2">
            <span className="text-slate-400 font-mono text-[11px] block uppercase">
              {lang === 'id' ? 'Pratinjau Pembaruan Output:' : 'Simulated Output Preview:'}
            </span>
            <div className="border border-slate-800 rounded-lg divide-y divide-slate-800/80 max-h-48 overflow-y-auto bg-slate-950/60 font-mono">
              {selectedMetrics.map((process) => {
                const newLive = calculateNewOutput(process.liveOutput, process.dailyPlan);
                const newAchievement = Math.round((newLive / process.dailyPlan) * 100);

                return (
                  <div key={process.key} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{process.name}</span>
                      <span className="text-[10px] text-slate-500">
                        {lang === 'id' ? 'Target Rencana:' : 'Plan Target:'} {process.dailyPlan.toLocaleString()} {t.prs}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">{t.currentLiveOutput}</span>
                        <span className="text-slate-400">{process.liveOutput.toLocaleString()} {t.prs}</span>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />

                      <div className="text-right">
                        <span className="text-[10px] text-emerald-400 font-bold block">{t.newLiveOutput}</span>
                        <span className="text-emerald-300 font-bold text-sm">{newLive.toLocaleString()} {t.prs}</span>
                      </div>

                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        newAchievement >= 80 ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {newAchievement}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium text-xs"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-md flex items-center gap-1.5 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.confirmUpdate} ({selectedProcessKeys.length})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
