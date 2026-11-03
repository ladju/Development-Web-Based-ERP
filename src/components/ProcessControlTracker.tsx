import React, { useState, useMemo } from 'react';
import { 
  FootwearProject, 
  DevelopmentStage, 
  ProjectTrack, 
  BOMItem, 
  MaterialArrivalRecord,
  LabDipStatus,
  SourcingStatus
} from '../types/footwear';
import { 
  FOOTWEAR_STAGES, 
  getStagesForTrack,
  getMaterialArrivalStats, 
  calculateStageSummary,
  isFSTRequiredForStage,
  PROCESS_SEQUENCE,
  PROCESS_LABELS,
  getProjectCurrentProcess,
  canAdvanceProjectProcess,
  canPerformAdminAction,
  doesProjectRequireSubcont,
  getProjectSubcontSummary
} from '../utils/footwearErpLogic';
import { formatDateMMDDYYYY } from '../utils/dateUtils';
import { Language, ThemeMode, translations } from '../utils/i18n';
import { 
  Layers, 
  Search, 
  Filter, 
  Clock, 
  Plane, 
  Palette, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Package, 
  Building2, 
  FileText, 
  Calendar,
  Sparkles,
  Zap,
  TestTube2,
  X,
  History,
  RotateCcw,
  Edit3,
  FileSpreadsheet,
  Users,
  Lock,
  UserCheck,
  ShieldCheck,
  GitFork,
  FastForward,
  BarChart3
} from 'lucide-react';
import { ProcessOutputMetric, FactoryProcessKey, ProcessPIC, UserRoleSession } from '../types/factoryOutput';
import { initialProcessMetrics, initialProcessPICs } from '../data/mockFactoryOutput';
import { FactoryProcessOutputChart } from './FactoryProcessOutputChart';

interface ProcessControlTrackerProps {
  projects: FootwearProject[];
  onSelectProjectForERP?: (projectId: string) => void;
  onSelectProject?: (projectId: string) => void;
  onUpdateProjectStage: (projectId: string, newStage: DevelopmentStage) => void;
  onOpenCreateProject?: () => void;
  onOpenImportExcel?: () => void;
  onAddArrivalRecord?: (
    projectId: string,
    bomItemId: string,
    newRecord: MaterialArrivalRecord
  ) => void;
  onAddMaterialArrivalRecord?: (
    projectId: string,
    bomItemId: string,
    newRecord: MaterialArrivalRecord
  ) => void;
  onUpdateBOMItem?: (
    projectId: string,
    updatedItem: BOMItem
  ) => void;
  processMetrics?: ProcessOutputMetric[];
  onOpenExportModal?: (defaultProcess?: FactoryProcessKey) => void;
  onIncrementLiveOutput?: (processKey: FactoryProcessKey, incrementAmount: number) => void;
  onOpenBulkUpdateModal?: (selectedKeys: FactoryProcessKey[]) => void;
  lang?: Language;
  theme?: ThemeMode;
  selectedTeam?: string;
  onSelectTeam?: (team: string) => void;
  currentUser?: UserRoleSession;
  processPICs?: ProcessPIC[];
  onAdvanceProjectProcess?: (projectId: string, notes?: string, options?: { skipSubcont?: boolean }) => void;
  onNavigateWorkstations?: () => void;
  onNavigatePerformance?: () => void;
}

export const ProcessControlTracker: React.FC<ProcessControlTrackerProps> = ({
  projects,
  onSelectProjectForERP,
  onSelectProject,
  onUpdateProjectStage,
  onOpenCreateProject,
  onOpenImportExcel,
  onAddArrivalRecord,
  onAddMaterialArrivalRecord,
  onUpdateBOMItem,
  processMetrics = initialProcessMetrics,
  onOpenExportModal,
  onIncrementLiveOutput,
  onOpenBulkUpdateModal,
  lang = 'en',
  theme = 'dark',
  selectedTeam: externalSelectedTeam,
  onSelectTeam,
  currentUser = {
    id: 'role-admin',
    role: 'admin',
    name: 'Rizky Pratama',
    badgeId: 'ADM-001',
    title: 'Super Admin',
  },
  processPICs = initialProcessPICs,
  onAdvanceProjectProcess,
  onNavigateWorkstations,
  onNavigatePerformance,
}) => {
  const t = translations[lang];
  const isLight = theme === 'light';
  const isAdmin = canPerformAdminAction(currentUser);
  const handleSelectERP = onSelectProject || onSelectProjectForERP || (() => {});
  const handleRecordArrival = onAddArrivalRecord || onAddMaterialArrivalRecord || (() => {});
  
  // Filters
  const [selectedStageFilter, setSelectedStageFilter] = useState<'all' | DevelopmentStage>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<'all' | ProjectTrack>('all');
  const [internalSelectedTeam, setInternalSelectedTeam] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedTeam = externalSelectedTeam !== undefined ? externalSelectedTeam : internalSelectedTeam;
  const handleTeamChange = (newTeam: string) => {
    setInternalSelectedTeam(newTeam);
    if (onSelectTeam) onSelectTeam(newTeam);
  };
  
  // Selected Style for deep-dive tracking
  const [activeTrackingProjectId, setActiveTrackingProjectId] = useState<string>(
    projects[0]?.id || ''
  );

  // Modal to log new material arrival
  const [loggingArrivalItem, setLoggingArrivalItem] = useState<{
    project: FootwearProject;
    item: BOMItem;
  } | null>(null);

  const [newAWB, setNewAWB] = useState('');
  const [newCarrier, setNewCarrier] = useState('DHL Express Air Freight');
  const [newQuantity, setNewQuantity] = useState(500);
  const [newStatus, setNewStatus] = useState<'accepted' | 'rejected' | 'quarantine_inspecting'>('accepted');
  const [newRejectionReason, setNewRejectionReason] = useState('');
  const [newInspector, setNewInspector] = useState('PWI2 Dev Incoming QA');

  // Modal to edit material / AWB details
  const [editingItem, setEditingItem] = useState<{
    project: FootwearProject;
    item: BOMItem;
  } | null>(null);

  const [editAWB, setEditAWB] = useState('');
  const [editCarrier, setEditCarrier] = useState('');
  const [editETA, setEditETA] = useState('');
  const [editColorStatus, setEditColorStatus] = useState<LabDipStatus>('approved');
  const [editDeltaE, setEditDeltaE] = useState<number>(0.45);
  const [editSourcingStatus, setEditSourcingStatus] = useState<SourcingStatus>('bulk_ordered');

  // Extract unique Teams & Projects
  const uniqueTeams = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.team) set.add(p.team);
    });
    return Array.from(set);
  }, [projects]);

  const uniqueProjects = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.project) set.add(p.project);
    });
    return Array.from(set);
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchStage = selectedStageFilter === 'all' || p.currentStage === selectedStageFilter;
      const matchSeason = selectedSeason === 'all' || p.season === selectedSeason;
      const matchTrack = selectedTrack === 'all' || p.trackType === selectedTrack;
      const matchTeam = selectedTeam === 'all' || p.team === selectedTeam;
      const matchProject = selectedProject === 'all' || p.project === selectedProject;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.productNumber && p.productNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.productCode && p.productCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.developer && p.developer.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.team && p.team.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.project && p.project.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.tier1Factory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.collabPartner && p.collabPartner.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchStage && matchSeason && matchTrack && matchTeam && matchProject && matchSearch;
    });
  }, [projects, selectedStageFilter, selectedSeason, selectedTrack, selectedTeam, selectedProject, searchQuery]);

  // Active Project for deep material detail
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeTrackingProjectId) || filteredProjects[0] || projects[0];
  }, [projects, activeTrackingProjectId, filteredProjects]);

  // Dynamically derive stages for the selected track (Inline GTM, SPEED/SMU rounds, Pullover rounds, XTR workshop)
  const activeStagesList = useMemo(() => {
    return getStagesForTrack(selectedTrack);
  }, [selectedTrack]);

  // Aggregate Stage Stats for the active track stages
  const stageStats = useMemo(() => {
    return activeStagesList.map((s) => ({
      ...s,
      summary: calculateStageSummary(projects, s.id),
    }));
  }, [activeStagesList, projects]);

  const handleOpenLogArrival = (project: FootwearProject, item: BOMItem) => {
    setLoggingArrivalItem({ project, item });
    setNewAWB(item.airwayBill || `AWB-DHL-${Math.floor(100000 + Math.random() * 900000)}`);
    setNewQuantity(item.moq || 500);
    setNewStatus('accepted');
    setNewRejectionReason('');
  };

  const handleOpenEditItem = (project: FootwearProject, item: BOMItem) => {
    setEditingItem({ project, item });
    setEditAWB(item.airwayBill || '');
    setEditCarrier(item.airwayBillCarrier || 'DHL Express Air Freight');
    setEditETA(item.etaFactoryDate || '2027-01-15');
    setEditColorStatus(item.colorConfirmStatus || 'approved');
    setEditDeltaE(item.colorConfirmDeltaE || 0.45);
    setEditSourcingStatus(item.sourcingStatus || 'bulk_ordered');
  };

  const handleSaveArrival = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingArrivalItem) return;

    const currentHistory = loggingArrivalItem.item.arrivalHistory || [];
    const newRecord: MaterialArrivalRecord = {
      id: `arr-${Date.now()}`,
      batchNumber: currentHistory.length + 1,
      arrivalDate: new Date().toISOString().split('T')[0],
      airwayBill: newAWB,
      courierCarrier: newCarrier,
      quantityReceived: Number(newQuantity),
      unit: loggingArrivalItem.item.unit,
      status: newStatus,
      rejectionReason: newStatus === 'rejected' ? (newRejectionReason || 'Failed technical inspection') : undefined,
      inspectorName: newInspector,
      warehouseLotNumber: `LOT-PWI2-${Math.floor(100 + Math.random() * 900)}`,
    };

    handleRecordArrival(loggingArrivalItem.project.id, loggingArrivalItem.item.id, newRecord);
    setLoggingArrivalItem(null);
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !onUpdateBOMItem) {
      setEditingItem(null);
      return;
    }

    const updatedItem: BOMItem = {
      ...editingItem.item,
      airwayBill: editAWB,
      airwayBillCarrier: editCarrier,
      etaFactoryDate: editETA,
      colorConfirmStatus: editColorStatus,
      colorConfirmDeltaE: Number(editDeltaE),
      sourcingStatus: editSourcingStatus,
      criticalPathRisk: editSourcingStatus === 'delayed' || editColorStatus === 'rejected',
    };

    onUpdateBOMItem(editingItem.project.id, updatedItem);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Factory Process Output & Capacity Live Chart (Material Setting, Cutting, Subcont, Prep, Sewing, Assembling) */}
      <FactoryProcessOutputChart
        metrics={processMetrics}
        onOpenExportModal={onOpenExportModal}
        onIncrementLiveOutput={onIncrementLiveOutput}
        onOpenBulkUpdateModal={onOpenBulkUpdateModal}
        lang={lang}
        theme={theme}
      />

      {/* Top Stage Control Header - Odoo / Acumatica Style Control Center */}
      <div className={`border rounded-xl p-5 shadow-xs space-y-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${
                isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                PWI2 CONTROL
              </span>
              <h2 className={`text-lg font-bold tracking-tight font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Process Tracking &amp; Stage Control Center
              </h2>
            </div>
            <p className={`text-xs mt-1 max-w-3xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Monitor process status across hundreds of styles across <strong>8 separated stages</strong> (GTM 1, GTM 2, Line Confirm, Reline Confirm, Salesman Sample, Prod. Confirm, FSC, XTR Workshop). Filter by Team, Project, and Season. Inspect Airwaybills (AWB), Color Confirm $\Delta E$, and Delivery/Rejection history.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigatePerformance && (
              <button
                onClick={onNavigatePerformance}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Performance &amp; Bottlenecks</span>
              </button>
            )}
            {onNavigateWorkstations && (
              <button
                onClick={onNavigateWorkstations}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Process PIC Workstations</span>
              </button>
            )}
            {onOpenImportExcel && (
              <button
                onClick={() => {
                  if (isAdmin) onOpenImportExcel();
                }}
                disabled={!isAdmin}
                title={isAdmin ? 'Import Excel Line Sheet or BOM' : 'Admin Only: Switch to Super Admin to import Line Sheets or BOM'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                  isAdmin
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {isAdmin ? <FileSpreadsheet className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
                <span>Import Excel / BOM</span>
                {!isAdmin && (
                  <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-400">
                    Admin Only
                  </span>
                )}
              </button>
            )}
            {onOpenCreateProject && (
              <button
                onClick={() => {
                  if (isAdmin) onOpenCreateProject();
                }}
                disabled={!isAdmin}
                title={isAdmin ? 'Create New Footwear Style' : 'Admin Only: Switch to Super Admin to create new styles'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-xs ${
                  isAdmin
                    ? isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer' 
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 cursor-pointer'
                    : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
                <span>New Style</span>
              </button>
            )}
          </div>
        </div>

        {/* 8 Stage Selector Pills with Aggregated Summary Metrics (9 buttons total: All + 8 Stages) */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 pt-2 border-t ${
          isLight ? 'border-slate-100' : 'border-slate-800'
        }`}>
          <button
            onClick={() => setSelectedStageFilter('all')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              selectedStageFilter === 'all'
                ? isLight
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs ring-1 ring-emerald-600/30'
                  : 'bg-slate-800 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
                : isLight
                ? 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span>All Stages</span>
              <span className={`font-mono text-[11px] px-1.5 py-0.2 rounded border ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}>
                {projects.length}
              </span>
            </div>
            <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Full Portfolio</p>
          </button>

          {stageStats.map((s) => {
            const isSelected = selectedStageFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStageFilter(s.id)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs ring-1 ring-emerald-600/30'
                      : 'bg-slate-800 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
                    : isLight
                    ? 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="truncate">{s.shortLabel}</span>
                  <span className={`font-mono text-[11px] px-1.5 py-0.2 rounded border ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}>
                    {s.summary.totalStyles}
                  </span>
                </div>
                <div className={`flex items-center justify-between text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>{s.summary.onTrackCount} ok</span>
                  {s.summary.atRiskCount > 0 && (
                    <span className="text-red-500 font-semibold">{s.summary.atRiskCount} risk</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Row: Search, Season, Team, Project, Track */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-2 border-t text-xs ${
          isLight ? 'border-slate-100' : 'border-slate-800'
        }`}>
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search style name, SKU, product #, code, developer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none transition-all shadow-xs ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600' 
                  : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500'
              }`}
            />
          </div>

          {/* Season Filter */}
          <div>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              aria-label="Filter by Season"
              className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono cursor-pointer focus:outline-none shadow-xs ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-600' 
                  : 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
              }`}
            >
              <option value="all">Season: All Seasons</option>
              <option value="S1-27">S1-27 (First Season 2027)</option>
              <option value="S2-26">S2-26 (Second Season 2026)</option>
              <option value="S1-26">S1-26 (First Season 2026)</option>
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <select
              value={selectedTeam}
              onChange={(e) => handleTeamChange(e.target.value)}
              aria-label="Filter by Team"
              className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer focus:outline-none shadow-xs ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-emerald-800 font-semibold focus:border-emerald-600' 
                  : 'bg-slate-950 border-slate-800 text-emerald-300 focus:border-emerald-500'
              }`}
            >
              <option value="all">Team: All Teams</option>
              {uniqueTeams.map((teamName) => (
                <option key={teamName} value={teamName}>
                  {teamName}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Filter by Project"
              className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer focus:outline-none shadow-xs ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-sky-800 font-semibold focus:border-emerald-600' 
                  : 'bg-slate-950 border-slate-800 text-sky-300 focus:border-emerald-500'
              }`}
            >
              <option value="all">Project: All Projects</option>
              {uniqueProjects.map((projName) => (
                <option key={projName} value={projName}>
                  {projName}
                </option>
              ))}
            </select>
          </div>

          {/* Track Filter */}
          <div>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value as any)}
              aria-label="Filter by Track"
              className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono cursor-pointer focus:outline-none shadow-xs ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-600' 
                  : 'bg-slate-950 border-slate-800 text-slate-300 focus:border-emerald-500'
              }`}
            >
              <option value="all">Track: All (Inline &amp; Special)</option>
              <option value="inline">Inline Calendar</option>
              <option value="smu">Special Make Up (SMU)</option>
              <option value="speed">Speed Track</option>
              <option value="pullover">Pullover Trials</option>
              <option value="xtr">Workshop Small-Run (XTR)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Left = Project List at Selected Stage; Right = Deep Material Sourcing & Arrival History Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Styles at this Stage */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Matching Styles ({filteredProjects.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Click style to inspect details &rarr;
            </span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredProjects.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
                No styles found matching the selected stage, team, project, or season filter.
              </div>
            ) : (
              filteredProjects.map((proj) => {
                const isSelected = proj.id === activeProject.id;
                const totalBOM = proj.bom.length;
                const approvedBOM = proj.bom.filter(
                  (b) => b.sourcingStatus === 'bulk_delivered' || b.sourcingStatus === 'swatch_approved'
                ).length;
                const readiness = totalBOM > 0 ? Math.round((approvedBOM / totalBOM) * 100) : 0;
                const hasDelayed = proj.bom.some((b) => b.criticalPathRisk || b.sourcingStatus === 'delayed');

                return (
                  <div
                    key={proj.id}
                    onClick={() => setActiveTrackingProjectId(proj.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={proj.heroImage}
                          alt={proj.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-800 bg-slate-950 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {proj.season}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400">
                              {proj.productNumber || proj.sku}
                            </span>
                            {proj.trackType === 'smu' && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                                SMU
                              </span>
                            )}
                            {proj.trackType === 'pullover' && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                Pullover
                              </span>
                            )}
                            {proj.trackType === 'xtr' && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                                XTR Workshop
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white mt-1">{proj.name}</h4>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Code: <strong className="text-slate-300">{proj.productCode || proj.sku}</strong> · {proj.team}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Dev: {proj.developer} · CW: {proj.colorwayName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border block ${
                          isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                        }`}>
                          {proj.currentStage.replace('_', ' ')}
                        </span>
                        {isFSTRequiredForStage(proj.currentStage) && (
                          <div className="flex items-center justify-end">
                            {proj.fstTest?.status === 'passed' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>FST: PASS</span>
                              </span>
                            ) : proj.fstTest?.status === 'in_progress' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                <Clock className="w-2.5 h-2.5" />
                                <span>FST: IN PROG</span>
                              </span>
                            ) : proj.fstTest?.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>FST: REJECT</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                <TestTube2 className="w-2.5 h-2.5" />
                                <span>FST: REQ</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & BOM Readiness Indicator */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono">Material Readiness:</span>
                        <span className={`font-mono font-bold ${readiness === 100 ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {readiness}% ({approvedBOM}/{totalBOM} items)
                        </span>
                      </div>
                      {hasDelayed && (
                        <span className="text-red-400 flex items-center gap-1 font-mono text-[10px]">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Material Risk</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep Material Tracking, Airwaybill & Rejection History */}
        <div className={`lg:col-span-7 border rounded-xl p-5 shadow-sm space-y-5 ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          {activeProject ? (
            <>
              {/* Selected Style Header Specs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {activeProject.season}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-white">
                      Prod #: {activeProject.productNumber || activeProject.sku}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Code: {activeProject.productCode}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      {activeProject.team}
                    </span>
                  </div>
                  <h3 className={`text-base font-bold mt-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {activeProject.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Project: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{activeProject.project}</strong> · Dev: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{activeProject.developer}</strong> · CW: <strong className="text-emerald-500">{activeProject.colorwayName}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenImportExcel && (
                    <button
                      onClick={() => {
                        if (isAdmin) onOpenImportExcel();
                      }}
                      disabled={!isAdmin}
                      title={isAdmin ? 'Upload BOM Spreadsheet' : 'Admin Only: Switch to Super Admin to upload BOM'}
                      className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5 border ${
                        isAdmin
                          ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700 cursor-pointer'
                          : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      {isAdmin ? <FileSpreadsheet className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
                      <span>Upload BOM</span>
                      {!isAdmin && (
                        <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-400">
                          Admin
                        </span>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleSelectERP(activeProject.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <span>Full Style ERP</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Active Manufacturing Process & PIC Hand-Off Gate Card */}
              {(() => {
                const currentProc = getProjectCurrentProcess(activeProject);
                const perm = canAdvanceProjectProcess(currentUser, currentProc, processPICs);
                const assignedPic = processPICs.find((p) => p.processKey === currentProc);
                const stepIdx = currentProc === 'completed' ? 6 : PROCESS_SEQUENCE.indexOf(currentProc);
                const needsSubcont = doesProjectRequireSubcont(activeProject);
                const subcontNote = getProjectSubcontSummary(activeProject);

                return (
                  <div
                    className={`p-4 rounded-xl border space-y-3 ${
                      perm.allowed
                        ? isLight
                          ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                          : 'bg-emerald-950/20 border-emerald-800/70 text-slate-100'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            ACTIVE PROCESS: {PROCESS_LABELS[currentProc]}
                          </span>
                          {assignedPic && (
                            <span className="text-[11px] font-mono text-slate-400">
                              PIC: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{assignedPic.picName}</strong> ({assignedPic.badgeId})
                            </span>
                          )}
                          {currentProc === 'cutting' && (
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                                needsSubcont
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              }`}
                            >
                              {needsSubcont ? '2nd Process Needed (Subcont)' : 'No 2nd Process (Direct to Prep)'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {perm.reason}
                        </p>
                        {currentProc === 'cutting' && (
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                            Component Routing Note: <span className={isLight ? 'text-slate-700 font-semibold' : 'text-slate-300'}>{subcontNote}</span>
                          </p>
                        )}
                      </div>

                      {onAdvanceProjectProcess && currentProc !== 'completed' && (
                        currentProc === 'cutting' && perm.allowed ? (
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              onClick={() => onAdvanceProjectProcess(activeProject.id, undefined, { skipSubcont: false })}
                              title="Send components needing HF welding, screen print, or embroidery to 3. Subcont Process"
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                needsSubcont
                                  ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-sm'
                                  : isLight
                                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300'
                                  : 'bg-purple-950/60 hover:bg-purple-900/70 text-purple-200 border-purple-700/70'
                              }`}
                            >
                              <GitFork className="w-3.5 h-3.5" />
                              <span>To 3. Subcont (2nd Process) &rarr;</span>
                            </button>
                            <button
                              onClick={() => onAdvanceProjectProcess(activeProject.id, undefined, { skipSubcont: true })}
                              title="Components need no 2nd process — hand off straight to 4. Preparation (bypassing Subcont)"
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                !needsSubcont
                                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-500 shadow-sm'
                                  : isLight
                                  ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-300'
                                  : 'bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-200 border-cyan-700/70'
                              }`}
                            >
                              <FastForward className="w-3.5 h-3.5" />
                              <span>Straight to 4. Preparation &rarr;</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (perm.allowed) onAdvanceProjectProcess(activeProject.id);
                            }}
                            disabled={!perm.allowed}
                            title={perm.reason}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                              perm.allowed
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer'
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
                                <span>Locked ({assignedPic?.picName || 'PIC'} Only)</span>
                              </>
                            )}
                          </button>
                        )
                      )}
                    </div>

                    {/* 6-Step Process Progress Bar */}
                    <div className="grid grid-cols-6 gap-1.5 pt-1">
                      {PROCESS_SEQUENCE.map((pKey, idx) => {
                        const isDone = idx < stepIdx;
                        const isCurrent = idx === stepIdx;
                        const stepPic = processPICs.find((p) => p.processKey === pKey);
                        return (
                          <div key={pKey} className="space-y-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                isDone
                                  ? 'bg-emerald-500'
                                  : isCurrent
                                  ? 'bg-amber-400 animate-pulse'
                                  : 'bg-slate-800'
                              }`}
                            />
                            <div className="text-[9px] font-mono truncate">
                              <span
                                className={
                                  isCurrent
                                    ? 'text-amber-400 font-bold'
                                    : isDone
                                    ? 'text-emerald-400'
                                    : 'text-slate-500'
                                }
                              >
                                {idx + 1}. {PROCESS_LABELS[pKey].replace(/^\d+\.\s*/, '')}
                              </span>
                              {stepPic && (
                                <span className="block text-[8px] text-slate-500 truncate">
                                  {stepPic.picName.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Quick Summary Pill Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className="text-slate-400 text-[10px] block">Current Stage:</span>
                  <span className={`font-bold capitalize ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeProject.currentStage.replace('_', ' ')}</span>
                </div>

                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className="text-slate-400 text-[10px] block">Target Ex-Factory (XF):</span>
                  <span className="font-bold text-amber-500">{formatDateMMDDYYYY(activeProject.targetXFDate)}</span>
                </div>

                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className="text-slate-400 text-[10px] block">Reline Required?</span>
                  <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {activeProject.isRelineRequired ? 'Yes (Undergoing Reline)' : 'No (Skips Reline)'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className="text-slate-400 text-[10px] block">Salesman Sample (SS):</span>
                  <span className="font-bold text-emerald-500">
                    {activeProject.isSalesmanSampleRequired ? 'Required (SS Round)' : 'Exempt'}
                  </span>
                </div>
              </div>

              {/* FST Laboratory Testing Gate (Mandatory for GTM 1, GTM 2, Line Confirm, Reline Confirm) */}
              {(isFSTRequiredForStage(activeProject.currentStage) || activeProject.fstTest) && (
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isLight
                    ? 'bg-sky-50/80 border-sky-200 text-slate-800 shadow-sm'
                    : 'bg-slate-950 border-sky-900/60 text-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-800/40 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40">
                        <TestTube2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold uppercase tracking-wider ${
                            isLight ? 'text-sky-900' : 'text-sky-300'
                          }`}>
                            FST Testing Gate (Factory Sample Testing)
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                            MANDATORY LAB GATE
                          </span>
                        </div>
                        <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          Physical performance validation required for GTM 1, GTM 2, Line Confirm &amp; Reline Confirm stages.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeProject.fstTest?.status === 'passed' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-600 border border-emerald-500/50">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>FST TEST: PASSED</span>
                        </span>
                      ) : activeProject.fstTest?.status === 'in_progress' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-600 border border-amber-500/50">
                          <Clock className="w-3.5 h-3.5" />
                          <span>FST TEST: IN PROGRESS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-600 border border-cyan-500/50">
                          <TestTube2 className="w-3.5 h-3.5" />
                          <span>FST TEST: PENDING LAB LOG</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* FST Lab Parameters: Bond Strength, Bally Flex, Wear Test */}
                  {activeProject.fstTest ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                      <div className={`p-2.5 rounded-lg border ${
                        (activeProject.fstTest.bondStrengthKgPerCm ?? 0) >= 3.0
                          ? (isLight ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-950/20 border-emerald-800/60')
                          : (isLight ? 'bg-rose-50 border-rose-300' : 'bg-rose-950/20 border-rose-800/60')
                      }`}>
                        <span className={`text-[10px] block uppercase ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Bond Peel Strength</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className={`text-base font-bold ${
                            (activeProject.fstTest.bondStrengthKgPerCm ?? 0) >= 3.0 
                              ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                              : (isLight ? 'text-rose-700' : 'text-rose-400')
                          }`}>
                            {activeProject.fstTest.bondStrengthKgPerCm ?? '—'}
                          </span>
                          <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>kg/cm</span>
                        </div>
                        <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Spec: ≥ 3.0 kg/cm</span>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${
                        (activeProject.fstTest.flexCyclesPassed ?? 0) >= 100000
                          ? (isLight ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-950/20 border-emerald-800/60')
                          : (isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-950/20 border-amber-800/60')
                      }`}>
                        <span className={`text-[10px] block uppercase ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Bally Flex Test</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className={`text-base font-bold ${
                            (activeProject.fstTest.flexCyclesPassed ?? 0) >= 100000 
                              ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                              : (isLight ? 'text-amber-700' : 'text-amber-400')
                          }`}>
                            {activeProject.fstTest.flexCyclesPassed?.toLocaleString() ?? '—'}
                          </span>
                          <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>cycles</span>
                        </div>
                        <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Spec: ≥ 100k cycles</span>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <span className={`text-[10px] block uppercase ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Abrasion Loss</span>
                        <div className="mt-0.5">
                          <span className={`text-xs font-bold uppercase ${
                            (activeProject.fstTest.abrasionIndexMm3 ?? 999) <= 120 
                              ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                              : (isLight ? 'text-amber-700' : 'text-amber-400')
                          }`}>
                            {activeProject.fstTest.abrasionIndexMm3 ? `${activeProject.fstTest.abrasionIndexMm3} mm³` : 'Standard'}
                          </span>
                        </div>
                        <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Cert: {activeProject.fstTest.certNumber || 'PWI-FST-2026'}</span>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <span className={`text-[10px] block uppercase ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>QA Sign-Off</span>
                        <div className={`mt-0.5 text-xs font-semibold truncate ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                          {activeProject.fstTest.inspectorName || 'Lead QA Tech'}
                        </div>
                        <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Tested: {formatDateMMDDYYYY(activeProject.fstTest.testDate || '2026-10-24')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-800/40 text-xs font-mono text-sky-200">
                      Standard FST protocol pending sample arrival. Bond peel &amp; Bally flex will be conducted at PWI2 Plant 4 Lab.
                    </div>
                  )}

                  {activeProject.fstTest?.fitterFeedback && (
                    <div className={`text-[11px] font-mono pt-1 border-t ${
                      isLight ? 'text-slate-600 border-sky-200' : 'text-slate-400 border-sky-900/40'
                    }`}>
                      <strong>Lab Notes:</strong> {activeProject.fstTest.fitterFeedback}
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Component Sourcing, Airwaybills & Arrival History */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-400" />
                    <span>Component Material Readiness &amp; Arrival History</span>
                  </h4>
                  <span className="text-xs font-mono text-slate-400">
                    {activeProject.bom.length} BOM components
                  </span>
                </div>

                {activeProject.bom.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950 rounded-lg border border-slate-800 text-slate-400 text-xs space-y-3">
                    <p>No BOM components registered for this style yet.</p>
                    {onOpenImportExcel && (
                      <button
                        onClick={onOpenImportExcel}
                        className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Upload BOM Spreadsheet (.xlsx)</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProject.bom.map((item) => {
                      const stats = getMaterialArrivalStats(item);

                      return (
                        <div
                          key={item.id}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3"
                        >
                          {/* Row 1: Component & Supplier */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs">{item.componentName}</span>
                                <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                                  {item.materialCode}
                                </span>
                                <span className="text-[10px] font-mono capitalize text-slate-400">
                                  {item.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5">{item.materialName}</p>
                              <p className="text-[11px] text-slate-500">
                                Supplier: <strong className="text-slate-300 font-normal">{item.supplierName} ({item.supplierCountry})</strong> · Lead Time: {item.leadTimeWeeks} wks
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <button
                                onClick={() => handleOpenEditItem(activeProject, item)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit AWB / Status</span>
                              </button>
                              <button
                                onClick={() => handleOpenLogArrival(activeProject, item)}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Log Arrival / Reject</span>
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Airwaybill Tracking & Color Confirm Status */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Airwaybill Tracking */}
                            <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80 space-y-1">
                              <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-[11px]">
                                <Plane className="w-3.5 h-3.5" />
                                <span>Airwaybill (AWB) Tracking:</span>
                              </div>
                              <div className="font-mono text-slate-200 font-semibold">{item.airwayBill || stats.latestAWB}</div>
                              <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
                                <span>Carrier: {item.airwayBillCarrier || stats.latestCarrier}</span>
                                <span>ETA: {formatDateMMDDYYYY(item.etaFactoryDate)}</span>
                              </div>
                            </div>

                            {/* Color Confirm Status */}
                            <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                                  <Palette className="w-3.5 h-3.5" />
                                  <span>Color Confirm Status:</span>
                                </div>
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold capitalize ${
                                    item.colorConfirmStatus === 'approved'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : item.colorConfirmStatus === 'rejected'
                                      ? 'bg-red-950 text-red-300 border border-red-800'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                                  }`}
                                >
                                  {item.colorConfirmStatus} (R{item.colorConfirmRound || 1})
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-200 font-mono truncate">
                                Standard: {item.colorStandardName || 'Pantone Lab Standard'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Measured Color Variance: <strong className={item.colorConfirmDeltaE && item.colorConfirmDeltaE > 1 ? 'text-red-400' : 'text-emerald-400'}>
                                  ΔE {item.colorConfirmDeltaE ? item.colorConfirmDeltaE : '0.45'}
                                </strong> ({item.colorConfirmDeltaE && item.colorConfirmDeltaE > 1 ? 'Exceeds 1.0 tolerance' : 'Passed tolerance'})
                              </div>
                            </div>
                          </div>

                          {/* Row 3: History Kedatangan Material (Berapa kali datang, berapa kali reject, alasan reject) */}
                          <div className="pt-2 border-t border-slate-900 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 font-mono">
                                <History className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-300 font-semibold">Delivery Arrival History:</span>
                                <span className="text-slate-400">
                                  <strong>{stats.arrivalCount}x</strong> Kedatangan ({stats.acceptedCount}x Lolos, <strong className={stats.rejectionCount > 0 ? 'text-red-400' : 'text-slate-400'}>{stats.rejectionCount}x Reject</strong>)
                                </span>
                              </div>
                            </div>

                            {/* Arrival Batches List */}
                            {(!item.arrivalHistory || item.arrivalHistory.length === 0) ? (
                              <div className="p-2.5 bg-slate-900/60 rounded text-[11px] text-slate-500 italic">
                                Belum ada record kedatangan material (sedang dalam proses PO / dispatch).
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {item.arrivalHistory.map((batch) => (
                                  <div
                                    key={batch.id}
                                    className={`p-2.5 rounded border text-xs ${
                                      batch.status === 'accepted'
                                        ? 'bg-emerald-950/20 border-emerald-900/40'
                                        : batch.status === 'rejected'
                                        ? 'bg-red-950/30 border-red-800/80'
                                        : 'bg-slate-900 border-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-mono text-[11px]">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-white">Batch #{batch.batchNumber}</span>
                                        <span className="text-slate-400">· {formatDateMMDDYYYY(batch.arrivalDate)}</span>
                                        <span className="text-slate-400">· {batch.quantityReceived} {batch.unit}</span>
                                      </div>
                                      <span
                                        className={`px-1.5 py-0.2 rounded font-bold uppercase text-[10px] ${
                                          batch.status === 'accepted'
                                            ? 'bg-emerald-900/60 text-emerald-300'
                                            : batch.status === 'rejected'
                                            ? 'bg-red-900 text-red-200'
                                            : 'bg-amber-900 text-amber-200'
                                        }`}
                                      >
                                        {batch.status}
                                      </span>
                                    </div>

                                    {/* Alasan Reject (Highlight jika status rejected) */}
                                    {batch.status === 'rejected' && batch.rejectionReason && (
                                      <div className="mt-1.5 p-2 rounded bg-red-950/80 border border-red-800 text-red-200 text-[11px] leading-relaxed">
                                        <strong className="block text-red-300 font-mono text-[10px] uppercase">
                                          Alasan Reject / QC Defect:
                                        </strong>
                                        {batch.rejectionReason}
                                      </div>
                                    )}

                                    <div className="mt-1 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                                      <span>AWB: {batch.airwayBill} ({batch.courierCarrier})</span>
                                      <span>Inspector: {batch.inspectorName} ({batch.warehouseLotNumber})</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              Select a project from the left panel to inspect material arrivals and airwaybills.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Log New Material Arrival Batch */}
      {loggingArrivalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Log Material Arrival Batch</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {loggingArrivalItem.item.componentName} · {loggingArrivalItem.project.sku}
                </p>
              </div>
              <button
                onClick={() => setLoggingArrivalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveArrival} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Airwaybill (AWB) Number</label>
                <input
                  type="text"
                  required
                  value={newAWB}
                  onChange={(e) => setNewAWB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Courier Carrier</label>
                  <select
                    value={newCarrier}
                    onChange={(e) => setNewCarrier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white"
                  >
                    <option value="DHL Express Air Freight">DHL Express Air Freight</option>
                    <option value="FedEx Priority Heavy Air">FedEx Priority Heavy Air</option>
                    <option value="Japan Airlines Cargo">Japan Airlines Cargo</option>
                    <option value="Emirates SkyCargo">Emirates SkyCargo</option>
                    <option value="Vietnam Air Cargo">Vietnam Air Cargo</option>
                    <option value="Domestic Ground Express">Domestic Ground Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quantity Received</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Inspection Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-semibold"
                >
                  <option value="accepted">Accepted / Passed Spec (Lolos Standar QC)</option>
                  <option value="rejected">Rejected (Ditolak / Defect Fisik / Color Gagal)</option>
                  <option value="quarantine_inspecting">Quarantine (Sedang Uji Lab/Karantina)</option>
                </select>
              </div>

              {/* Alasan Reject Textarea jika status rejected */}
              {newStatus === 'rejected' && (
                <div className="space-y-1 p-3 rounded-lg bg-red-950/40 border border-red-800">
                  <label className="block text-red-300 font-bold">
                    Alasan Reject Material (Spesifikasi QC Defect) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Contoh: Delta-E 1.82 terlalu kuning di bawah D65, hardness 68 Shore A melebihi spec 62 max, atau permukaan retak saat flexing test."
                    value={newRejectionReason}
                    onChange={(e) => setNewRejectionReason(e.target.value)}
                    className="w-full bg-slate-950 border border-red-800 rounded-md p-2 text-red-200 placeholder-red-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Inspector / Warehouse QA Lead</label>
                <input
                  type="text"
                  required
                  value={newInspector}
                  onChange={(e) => setNewInspector(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setLoggingArrivalItem(null)}
                  className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm"
                >
                  Save Arrival Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Material & AWB Details */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Update Material Tracking &amp; AWB</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {editingItem.item.componentName} · {editingItem.project.name}
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Airwaybill (AWB) Number</label>
                <input
                  type="text"
                  value={editAWB}
                  onChange={(e) => setEditAWB(e.target.value)}
                  placeholder="e.g. AWB-DHL-994182401"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Carrier</label>
                  <input
                    type="text"
                    value={editCarrier}
                    onChange={(e) => setEditCarrier(e.target.value)}
                    placeholder="e.g. DHL Express, FedEx Priority"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ETA Factory Date</label>
                  <input
                    type="date"
                    value={editETA}
                    onChange={(e) => setEditETA(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Color Confirm Status</label>
                  <select
                    value={editColorStatus}
                    onChange={(e) => setEditColorStatus(e.target.value as LabDipStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-semibold"
                  >
                    <option value="approved">Approved (Lolos)</option>
                    <option value="rejected">Rejected (Ditolak)</option>
                    <option value="pending">Pending</option>
                    <option value="approved_with_condition">Approved with Condition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Measured Color ΔE</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editDeltaE}
                    onChange={(e) => setEditDeltaE(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sourcing Status</label>
                <select
                  value={editSourcingStatus}
                  onChange={(e) => setEditSourcingStatus(e.target.value as SourcingStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white"
                >
                  <option value="bulk_ordered">Bulk Ordered</option>
                  <option value="bulk_delivered">Bulk Delivered</option>
                  <option value="in_transit">In Transit (Air Cargo)</option>
                  <option value="swatch_approved">Swatch Approved</option>
                  <option value="delayed">Delayed (Critical Path Risk)</option>
                  <option value="rejected_on_arrival">Rejected on Arrival</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm"
                >
                  Save Material Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
