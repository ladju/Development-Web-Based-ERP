import React, { useState, useEffect, useMemo } from 'react';
import { FootwearProject } from '../types/footwear';
import {
  FactoryProcessKey,
  ProcessOutputMetric,
  ProcessPIC,
  UserRoleSession,
  ProcessHandoffLog,
} from '../types/factoryOutput';
import {
  PROCESS_SEQUENCE,
  PROCESS_LABELS,
  getProjectCurrentProcess,
  canAdvanceProjectProcess,
  canPerformAdminAction,
  doesProjectRequireSubcont,
  getProjectSubcontSummary,
} from '../utils/footwearErpLogic';
import { formatDateMMDDYYYY } from '../utils/dateUtils';
import { Language, ThemeMode } from '../utils/i18n';
import {
  ShieldCheck,
  Lock,
  Unlock,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Edit3,
  FileSpreadsheet,
  Plus,
  Clock,
  Activity,
  Layers,
  Users,
  AlertTriangle,
  History,
  Wrench,
  ChevronRight,
  GitBranch,
  Zap,
} from 'lucide-react';

interface ProcessWorkstationDashboardProps {
  projects: FootwearProject[];
  processMetrics: ProcessOutputMetric[];
  processPICs: ProcessPIC[];
  currentUser: UserRoleSession;
  handoffLogs: ProcessHandoffLog[];
  onAdvanceProjectProcess: (
    projectId: string,
    notes?: string,
    options?: { skipSubcont?: boolean }
  ) => void;
  onAdminSetProjectProcess: (
    projectId: string,
    targetProcess: FactoryProcessKey | 'completed',
    notes?: string
  ) => void;
  onUpdateProcessPIC: (
    processKey: FactoryProcessKey,
    updatedPicName: string,
    updatedBadgeId: string,
    updatedShift: string
  ) => void;
  onIncrementLiveOutput: (processKey: FactoryProcessKey, incrementAmount: number) => void;
  onOpenImportExcel: () => void;
  onOpenAddMaterial: () => void;
  onOpenCreateProject: () => void;
  onSelectProject: (projectId: string) => void;
  lang?: Language;
  theme?: ThemeMode;
}

export const ProcessWorkstationDashboard: React.FC<ProcessWorkstationDashboardProps> = ({
  projects,
  processMetrics,
  processPICs,
  currentUser,
  handoffLogs,
  onAdvanceProjectProcess,
  onAdminSetProjectProcess,
  onUpdateProcessPIC,
  onIncrementLiveOutput,
  onOpenImportExcel,
  onOpenAddMaterial,
  onOpenCreateProject,
  onSelectProject,
  lang = 'en',
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const isAdmin = canPerformAdminAction(currentUser);

  // Selected workstation tab: defaults to currentUser.processKey if PIC, or 'all' if Admin
  const [selectedStation, setSelectedStation] = useState<FactoryProcessKey | 'all'>(
    currentUser.role === 'process_pic' && currentUser.processKey ? currentUser.processKey : 'all'
  );

  // Automatically focus the workstation when the user switches to a specific Process PIC in the top bar
  useEffect(() => {
    if (currentUser.role === 'process_pic' && currentUser.processKey) {
      setSelectedStation(currentUser.processKey);
    }
  }, [currentUser.id, currentUser.role, currentUser.processKey]);

  // Hand-off notes per project
  const [handoffNotesMap, setHandoffNotesMap] = useState<Record<string, string>>({});

  // Admin Edit PIC Modal state
  const [editingPIC, setEditingPIC] = useState<ProcessPIC | null>(null);
  const [editPicName, setEditPicName] = useState('');
  const [editBadgeId, setEditBadgeId] = useState('');
  const [editShift, setEditShift] = useState('');

  const handleOpenEditPIC = (pic: ProcessPIC) => {
    if (!isAdmin) return;
    setEditingPIC(pic);
    setEditPicName(pic.picName);
    setEditBadgeId(pic.badgeId);
    setEditShift(pic.shiftHours);
  };

  const handleSavePIC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPIC || !isAdmin) return;
    onUpdateProcessPIC(
      editingPIC.processKey,
      editPicName.trim() || editingPIC.picName,
      editBadgeId.trim() || editingPIC.badgeId,
      editShift.trim() || editingPIC.shiftHours
    );
    setEditingPIC(null);
  };

  // Group projects by their active manufacturing process
  const projectsByProcess = useMemo(() => {
    const map: Record<FactoryProcessKey | 'completed', FootwearProject[]> = {
      material_setting: [],
      cutting: [],
      subcont: [],
      preparation: [],
      sewing: [],
      assembling: [],
      completed: [],
    };
    for (const proj of projects) {
      const proc = getProjectCurrentProcess(proj);
      map[proc].push(proj);
    }
    return map;
  }, [projects]);

  const activeWorkstations = useMemo(() => {
    if (selectedStation === 'all') {
      return PROCESS_SEQUENCE;
    }
    return [selectedStation];
  }, [selectedStation]);

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. RBAC & PROCESS PIC AUTHORITY HEADER BANNER
         ===================================================================== */}
      <div
        className={`rounded-xl border p-5 shadow-sm transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${
                  isAdmin
                    ? isLight
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : isLight
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                <span>
                  {isAdmin
                    ? 'SUPER ADMIN MODE (FULL ACCESS)'
                    : `ACTIVE PIC: ${currentUser.title.toUpperCase()}`}
                </span>
              </span>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                Operator: <strong>{currentUser.name}</strong> ({currentUser.badgeId})
              </span>
            </div>

            <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {lang === 'id'
                ? 'Dashboard Stasiun Kerja PIC Proses & Kontrol Hand-Off Produksi'
                : 'Process PIC Workstation Dashboard & Manufacturing Hand-Off Control'}
            </h2>
            <p className={`text-xs max-w-3xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isAdmin
                ? 'As Super Admin, you have unrestricted authority to move any project across any process, reassign Process PICs, import Line Sheets (.xlsx), and modify BOM components.'
                : `You are signed in as ${currentUser.name} (${currentUser.title}). You can ONLY approve & move styles currently sitting in your assigned process (${
                    currentUser.processKey ? PROCESS_LABELS[currentUser.processKey] : ''
                  }) to the next process. Line Sheet import, BOM edits, and other processes are locked.`}
            </p>
          </div>

          {/* Admin-Exclusive Operations Bar (Locked with clear badge when a Process PIC is active) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (isAdmin) onOpenImportExcel();
              }}
              disabled={!isAdmin}
              title={
                isAdmin
                  ? 'Import Line Sheet or BOM (.xlsx)'
                  : 'Locked: Only Super Admin can import Line Sheets or BOM spreadsheets'
              }
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                isAdmin
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 cursor-pointer shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-950/70 text-slate-500 border-slate-800 cursor-not-allowed'
              }`}
            >
              {isAdmin ? <FileSpreadsheet className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
              <span>Import Line Sheet / BOM</span>
              {!isAdmin && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Admin Only
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (isAdmin) onOpenAddMaterial();
              }}
              disabled={!isAdmin}
              title={
                isAdmin
                  ? 'Add BOM Material Component'
                  : 'Locked: Only Super Admin can add or modify BOM items'
              }
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                isAdmin
                  ? isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300 cursor-pointer'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 cursor-pointer'
                  : isLight
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-950/70 text-slate-500 border-slate-800 cursor-not-allowed'
              }`}
            >
              {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
              <span>Add BOM Item</span>
              {!isAdmin && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Admin Only
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (isAdmin) onOpenCreateProject();
              }}
              disabled={!isAdmin}
              title={isAdmin ? 'Create New Style Project' : 'Locked: Only Super Admin can create new projects'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                isAdmin
                  ? isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300 cursor-pointer'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 cursor-pointer'
                  : isLight
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-950/70 text-slate-500 border-slate-800 cursor-not-allowed'
              }`}
            >
              {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
              <span>New Style</span>
              {!isAdmin && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Admin Only
                </span>
              )}
            </button>
          </div>
        </div>

        {/* =====================================================================
            2. WORKSTATION SELECTOR TABS (All 6 Workstations + Individual PIC Stations)
           ===================================================================== */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-4 mt-4 border-t ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <button
            onClick={() => setSelectedStation('all')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              selectedStation === 'all'
                ? isLight
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600/30'
                  : 'bg-slate-800 border-emerald-500 text-white ring-1 ring-emerald-500/30'
                : isLight
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span>All 6 Processes</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              >
                {projects.length}
              </span>
            </div>
            <p className={`text-[10px] mt-1 truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Full Plant Overview
            </p>
          </button>

          {processPICs.map((pic) => {
            const isSelected = selectedStation === pic.processKey;
            const isMyStation =
              currentUser.role === 'process_pic' && currentUser.processKey === pic.processKey;
            const stylesCount = projectsByProcess[pic.processKey]?.length || 0;

            return (
              <button
                key={pic.processKey}
                onClick={() => setSelectedStation(pic.processKey)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600/30'
                      : 'bg-slate-800 border-emerald-500 text-white ring-1 ring-emerald-500/30'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-bold">
                  <span className="truncate">
                    {pic.stepNumber}. {pic.processName}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded border shrink-0 ${
                      stylesCount > 0
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                        : isLight
                        ? 'bg-white border-slate-300 text-slate-600'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {stylesCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 mt-1">
                  <span className={`text-[10px] font-mono truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    PIC: {pic.picName}
                  </span>
                  {isMyStation && (
                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-emerald-600 text-white shrink-0">
                      YOU
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          3. PROCESS WORKSTATION CARDS & GATED HAND-OFF QUEUES
         ===================================================================== */}
      <div className="space-y-6">
        {activeWorkstations.map((processKey) => {
          const pic = processPICs.find((p) => p.processKey === processKey)!;
          const metric = processMetrics.find((m) => m.key === processKey);
          const stationProjects = projectsByProcess[processKey] || [];
          const canOperateStation =
            isAdmin || (currentUser.role === 'process_pic' && currentUser.processKey === processKey);

          return (
            <div
              key={processKey}
              className={`rounded-xl border overflow-hidden shadow-sm transition-all ${
                canOperateStation
                  ? isLight
                    ? 'bg-white border-emerald-500/70'
                    : 'bg-slate-900 border-emerald-500/50'
                  : isLight
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              {/* Workstation Header: Process Info + Designated PIC Profile + Output Telemetry */}
              <div
                className={`p-4 sm:p-5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  canOperateStation
                    ? isLight
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-emerald-950/20 border-slate-800'
                    : isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm shrink-0 border ${
                      canOperateStation
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : isLight
                        ? 'bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    0{pic.stepNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {pic.stepNumber}. {pic.processName} Workstation
                      </h3>
                      {canOperateStation ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <Unlock className="w-3 h-3" />
                          <span>
                            {isAdmin ? 'ADMIN OVERRIDE UNLOCKED' : 'YOUR ASSIGNED WORKSTATION (UNLOCKED)'}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Lock className="w-3 h-3" />
                          <span>LOCKED — ONLY {pic.picName.toUpperCase()} OR ADMIN CAN MOVE</span>
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {pic.department} · Shift: <span className="font-mono">{pic.shiftHours}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Designated PIC Badge & Admin Reassign Button + Live Output Quick Counter */}
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className={`flex items-center gap-3 px-3.5 py-2 rounded-lg border text-xs ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div>
                      <span className={`text-[10px] font-mono uppercase block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Designated Process PIC
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {pic.picName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {pic.badgeId}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleOpenEditPIC(pic)}
                        aria-label={`Edit PIC for ${pic.processName}`}
                        className={`p-1.5 rounded-md border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                          isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Change PIC</span>
                      </button>
                    )}
                  </div>

                  {/* Process Live Output Pill */}
                  {metric && (
                    <div
                      className={`flex items-center gap-3 px-3.5 py-2 rounded-lg border text-xs font-mono ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div>
                        <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Live Output / Plan
                        </span>
                        <span className="font-bold text-emerald-400">
                          {metric.liveOutput.toLocaleString()}
                        </span>{' '}
                        <span className="text-slate-500">/ {metric.dailyPlan.toLocaleString()} prs</span>
                      </div>
                      <button
                        onClick={() => {
                          if (canOperateStation) onIncrementLiveOutput(processKey, 50);
                        }}
                        disabled={!canOperateStation}
                        title={
                          canOperateStation
                            ? 'Log +50 pairs output for this process'
                            : `Locked: Only ${pic.picName} or Admin can log output here`
                        }
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                          canOperateStation
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        +50 prs
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Workstation Body: Active Projects Currently in This Manufacturing Process */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Styles Currently in {pic.processName} ({stationProjects.length})
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {processKey === 'cutting' ? (
                      <>
                        Next Step:{' '}
                        <strong className="text-purple-400">3. Subcont (2nd Process)</strong>
                        {' or '}
                        <strong className="text-emerald-400">Straight to 4. Preparation</strong>
                      </>
                    ) : (
                      <>
                        Next Step:{' '}
                        <strong className="text-emerald-400">
                          {PROCESS_LABELS[
                            canAdvanceProjectProcess(currentUser, processKey, processPICs).nextProcess
                          ]}
                        </strong>
                      </>
                    )}
                  </span>
                </div>

                {stationProjects.length === 0 ? (
                  <div
                    className={`p-6 rounded-lg border border-dashed text-center text-xs ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-500'
                        : 'bg-slate-950/50 border-slate-800 text-slate-500'
                    }`}
                  >
                    No footwear styles are currently waiting in <strong>{pic.processName}</strong>.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                    {stationProjects.map((project) => {
                      const currentProc = getProjectCurrentProcess(project);
                      const perm = canAdvanceProjectProcess(currentUser, currentProc, processPICs);
                      const stepIdx =
                        currentProc === 'completed' ? 6 : PROCESS_SEQUENCE.indexOf(currentProc);

                      return (
                        <div
                          key={project.id}
                          className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                            isLight
                              ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Top Row: Style Details */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={project.heroImage}
                                alt={project.name}
                                className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                                    {project.season}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {project.productCode || project.sku}
                                  </span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                    {project.orderVolumePairs.toLocaleString()} prs
                                  </span>
                                </div>
                                <h5
                                  onClick={() => onSelectProject(project.id)}
                                  className={`text-sm font-bold truncate mt-1 cursor-pointer hover:underline ${
                                    isLight ? 'text-slate-900' : 'text-white'
                                  }`}
                                >
                                  {project.name}
                                </h5>
                                <p className="text-[11px] text-slate-400 font-mono truncate">
                                  Team: {project.team} · Dev: {project.developer} · XF:{' '}
                                  {formatDateMMDDYYYY(project.targetXFDate)}
                                </p>
                              </div>
                            </div>

                            {/* Admin Direct Override Dropdown */}
                            {isAdmin && (
                              <div className="shrink-0">
                                <label className="block text-[9px] font-mono uppercase text-amber-400 mb-0.5">
                                  Admin Jump:
                                </label>
                                <select
                                  aria-label={`Admin override process for ${project.name}`}
                                  value={currentProc}
                                  onChange={(e) =>
                                    onAdminSetProjectProcess(
                                      project.id,
                                      e.target.value as FactoryProcessKey | 'completed',
                                      'Admin manual process override'
                                    )
                                  }
                                  className={`text-[11px] font-mono rounded px-2 py-1 border cursor-pointer ${
                                    isLight
                                      ? 'bg-white border-amber-300 text-slate-900'
                                      : 'bg-slate-900 border-amber-500/40 text-amber-200'
                                  }`}
                                >
                                  {PROCESS_SEQUENCE.map((k, idx) => (
                                    <option key={k} value={k}>
                                      {idx + 1}. { pic.processKey === k ? pic.processName : PROCESS_LABELS[k].slice(3) }
                                    </option>
                                  ))}
                                  <option value="completed">7. Completed</option>
                                </select>
                              </div>
                            )}
                          </div>

                          {/* 6-Step Visual Process Pipeline Bar */}
                          <div className="space-y-1">
                            <div className="grid grid-cols-6 gap-1">
                              {PROCESS_SEQUENCE.map((pKey, idx) => {
                                const isDone = idx < stepIdx;
                                const isCurrent = idx === stepIdx;
                                return (
                                  <div key={pKey} className="space-y-1">
                                    <div
                                      className={`h-1.5 rounded-full ${
                                        isDone
                                          ? 'bg-emerald-500'
                                          : isCurrent
                                          ? 'bg-amber-400 animate-pulse'
                                          : isLight
                                          ? 'bg-slate-200'
                                          : 'bg-slate-800'
                                      }`}
                                    />
                                    <span
                                      className={`block text-[9px] font-mono truncate ${
                                        isCurrent
                                          ? 'text-amber-400 font-bold'
                                          : isDone
                                          ? 'text-emerald-400'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {idx + 1}. {PROCESS_LABELS[pKey].replace(/^\d+\.\s*/, '')}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Cutting 2nd-Process Routing Indicator */}
                          {currentProc === 'cutting' && (
                            <div
                              className={`px-3 py-2 rounded-lg border text-[11px] font-mono flex items-center justify-between gap-2 ${
                                doesProjectRequireSubcont(project)
                                  ? 'bg-purple-950/30 border-purple-800/60 text-purple-200'
                                  : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <GitBranch className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{getProjectSubcontSummary(project)}</span>
                              </div>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 shrink-0">
                                {doesProjectRequireSubcont(project)
                                  ? 'Rec: 3. Subcont'
                                  : 'Rec: Direct to 4. Prep'}
                              </span>
                            </div>
                          )}

                          {/* Hand-Off Notes & Gated Action Button(s) */}
                          <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-2">
                            <input
                              type="text"
                              placeholder={
                                perm.allowed
                                  ? 'Optional QC / Hand-off note (e.g., 100% upper pieces inspected)...'
                                  : `Locked: Assigned to ${pic.picName} (${pic.badgeId})`
                              }
                              disabled={!perm.allowed}
                              value={handoffNotesMap[project.id] || ''}
                              onChange={(e) =>
                                setHandoffNotesMap((prev) => ({
                                  ...prev,
                                  [project.id]: e.target.value,
                                }))
                              }
                              className={`w-full text-xs rounded-lg px-2.5 py-1.5 border font-sans ${
                                perm.allowed
                                  ? isLight
                                    ? 'bg-white border-slate-300 text-slate-900'
                                    : 'bg-slate-900 border-slate-700 text-white'
                                  : isLight
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            />

                            {currentProc === 'cutting' ? (
                              perm.allowed ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <button
                                    onClick={() => {
                                      onAdvanceProjectProcess(project.id, handoffNotesMap[project.id], {
                                        skipSubcont: false,
                                      });
                                      setHandoffNotesMap((prev) => ({ ...prev, [project.id]: '' }));
                                    }}
                                    title="Send cut components needing 2nd process (HF welding, screen print, embroidery) to 3. Subcont Process"
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm cursor-pointer transition-all"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>To 3. Subcont (2nd Process) &rarr;</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      onAdvanceProjectProcess(project.id, handoffNotesMap[project.id], {
                                        skipSubcont: true,
                                      });
                                      setHandoffNotesMap((prev) => ({ ...prev, [project.id]: '' }));
                                    }}
                                    title="Skip Subcont when no 2nd process is needed — hand off straight to 4. Preparation"
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer transition-all"
                                  >
                                    <Zap className="w-3.5 h-3.5 shrink-0" />
                                    <span>Straight to 4. Preparation &rarr;</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  disabled
                                  title={perm.reason}
                                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold ${
                                    isLight
                                      ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
                                      : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                                  }`}
                                >
                                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Locked ({pic.picName} Only)</span>
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => {
                                  if (!perm.allowed) return;
                                  onAdvanceProjectProcess(project.id, handoffNotesMap[project.id]);
                                  setHandoffNotesMap((prev) => ({ ...prev, [project.id]: '' }));
                                }}
                                disabled={!perm.allowed}
                                title={perm.reason}
                                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                  perm.allowed
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer'
                                    : isLight
                                    ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
                                    : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                                }`}
                              >
                                {perm.allowed ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>
                                      Move to {PROCESS_LABELS[perm.nextProcess].replace(/^\d+\.\s*/, '')} &rarr;
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Locked ({pic.picName} Only)</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          4. COMPLETED MANUFACTURING RUNS & REAL-TIME HAND-OFF AUDIT LOG
         ===================================================================== */}
      <div
        className={`rounded-xl border p-5 shadow-sm space-y-3 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Process Hand-Off Audit Log (Waktu Indonesia Barat)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {handoffLogs.length} verified PIC &amp; Admin sign-offs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b font-mono text-[11px] uppercase ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <th className="py-2.5 px-3">Timestamp (MM/DD/YYYY WIB)</th>
                <th className="py-2.5 px-3">Style &amp; Code</th>
                <th className="py-2.5 px-3">Process Hand-Off</th>
                <th className="py-2.5 px-3">Authorized PIC / Admin</th>
                <th className="py-2.5 px-3">Hand-Off Notes</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
              {handoffLogs.map((log) => (
                <tr key={log.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}>
                  <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap text-emerald-400 font-semibold">
                    {log.timestampWib}
                  </td>
                  <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                    {log.projectName}{' '}
                    <span className="font-mono text-[11px] text-slate-400">({log.productCode})</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {PROCESS_LABELS[log.fromProcess]}
                    </span>
                    <span className="mx-1.5 text-emerald-400 font-bold">&rarr;</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      {PROCESS_LABELS[log.toProcess]}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-semibold">{log.authorizedByName}</span>{' '}
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                        log.authorizedRole === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {log.authorizedByBadge}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{log.notes || 'Standard PIC gate sign-off'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================================
          5. ADMIN MODAL: REASSIGN / EDIT PROCESS PIC
         ===================================================================== */}
      {editingPIC && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  Admin PIC Assignment
                </span>
                <h3 className="text-base font-bold mt-1">
                  Assign PIC for {editingPIC.stepNumber}. {editingPIC.processName}
                </h3>
              </div>
            </div>

            <form onSubmit={handleSavePIC} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Person-In-Charge (PIC) Full Name</label>
                <input
                  type="text"
                  required
                  value={editPicName}
                  onChange={(e) => setEditPicName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Employee Badge ID</label>
                  <input
                    type="text"
                    required
                    value={editBadgeId}
                    onChange={(e) => setEditBadgeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shift Hours (WIB)</label>
                  <input
                    type="text"
                    required
                    value={editShift}
                    onChange={(e) => setEditShift(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPIC(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                >
                  Save PIC Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
