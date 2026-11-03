import React, { useState } from 'react';
import { OvertimeRecord } from '../types/footwear';
import { 
  Clock, 
  Calendar, 
  Users, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Building2, 
  ShieldCheck, 
  Flame,
  Briefcase
} from 'lucide-react';

interface OvertimeScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: OvertimeRecord[];
  onAddSchedule: (newRecord: OvertimeRecord) => void;
  onUpdateStatus: (id: string, newStatus: 'active' | 'scheduled' | 'completed') => void;
}

export const OvertimeScheduleModal: React.FC<OvertimeScheduleModalProps> = ({
  isOpen,
  onClose,
  schedules,
  onAddSchedule,
  onUpdateStatus,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form fields
  const [department, setDepartment] = useState('Sample Room Upper Stitching & Assembly');
  const [cellOrLine, setCellOrLine] = useState('Stitching Cell 4B');
  const [shiftHours, setShiftHours] = useState('17:00 - 21:00 (4.0 hrs OT)');
  const [headcount, setHeadcount] = useState(16);
  const [targetTask, setTargetTask] = useState('Rush FSC Golden Samples & SS Upper Stitching');
  const [supervisor, setSupervisor] = useState('Pak Sugeng (Dev Production Lead)');
  const [status, setStatus] = useState<'active' | 'scheduled'>('active');

  if (!isOpen) return null;

  const totalHeadcount = schedules.reduce((acc, curr) => acc + curr.headcount, 0);
  const activeShiftsCount = schedules.filter((s) => s.status === 'active').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: OvertimeRecord = {
      id: `ot-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      department,
      cellOrLine,
      shiftHours,
      headcount,
      targetTask,
      supervisor,
      status,
    };
    onAddSchedule(newRecord);
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                PWI2 Dev Plant 4 — Overtime Schedule
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Dev Center OT
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live monitoring and shift planning for footwear development sample room & testing cells.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/50 border-b border-slate-800/80 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-slate-400 text-[11px]">Total OT Headcount</p>
              <p className="text-base font-bold text-white">{totalHeadcount} Technicians</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
            <Flame className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-slate-400 text-[11px]">Active Running Shifts</p>
              <p className="text-base font-bold text-amber-400">{activeShiftsCount} Shifts In Progress</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-slate-400 text-[11px]">Schedule Date</p>
              <p className="text-sm font-bold text-slate-200">Today • Plant 4 (WIB)</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300">
              Active &amp; Scheduled Shifts ({schedules.length})
            </h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Cancel' : 'Add Overtime Shift'}</span>
            </button>
          </div>

          {/* Inline Add Shift Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 font-mono">Plan New Overtime Shift</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cell / Line Location</label>
                  <input
                    type="text"
                    required
                    value={cellOrLine}
                    onChange={(e) => setCellOrLine(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Shift Hours Window</label>
                  <input
                    type="text"
                    required
                    value={shiftHours}
                    onChange={(e) => setShiftHours(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Approved Headcount</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={headcount}
                    onChange={(e) => setHeadcount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Target Task / Output</label>
                  <input
                    type="text"
                    required
                    value={targetTask}
                    onChange={(e) => setTargetTask(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Supervisor On Duty</label>
                  <input
                    type="text"
                    required
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="active">Active Now</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Save Shift to Schedule
                </button>
              </div>
            </form>
          )}

          {/* List of Shifts */}
          <div className="space-y-3">
            {schedules.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{item.department}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {item.cellOrLine}
                    </span>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                        item.status === 'active'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                          : item.status === 'completed'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{item.targetTask}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 pt-1">
                    <span className="text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.shiftHours}
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {item.headcount} Operators
                    </span>
                    <span className="text-slate-400">Supervisor: {item.supervisor}</span>
                  </div>
                </div>

                {/* Status Toggle Quick Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onUpdateStatus(item.id, 'active')}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      item.status === 'active'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => onUpdateStatus(item.id, 'scheduled')}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      item.status === 'scheduled'
                        ? 'bg-blue-500 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Scheduled
                  </button>
                  <button
                    onClick={() => onUpdateStatus(item.id, 'completed')}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      item.status === 'completed'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end bg-slate-950/70">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
