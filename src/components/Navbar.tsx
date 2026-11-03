import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FootwearProject } from '../types/footwear';
import { ProcessPIC, UserRoleSession } from '../types/factoryOutput';
import { canPerformAdminAction } from '../utils/footwearErpLogic';
import { Language, ThemeMode, translations } from '../utils/i18n';
import { useLiveWibClock, formatDateMMDDYYYY } from '../utils/dateUtils';
import { 
  Layers, 
  Plus, 
  Download, 
  Calendar, 
  Clock, 
  Building2, 
  Box, 
  SlidersHorizontal,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  BarChart3,
  Sun,
  Moon,
  Globe,
  Users,
  Kanban,
  FileSpreadsheet,
  Package,
  TestTube2,
  Ship,
  DollarSign,
  Activity,
  CheckCircle2,
  FileText,
  ShieldCheck,
  UserCheck,
  Lock
} from 'lucide-react';

interface NavbarProps {
  projects: FootwearProject[];
  currentProject: FootwearProject;
  onSelectProject: (projectId: string) => void;
  activeTab: 'control_tracker' | 'workstations' | 'performance' | 'stage_board' | 'overview' | 'materials' | 'samples' | 'milestones';
  onChangeTab: (tab: 'control_tracker' | 'workstations' | 'performance' | 'stage_board' | 'overview' | 'materials' | 'samples' | 'milestones') => void;
  onOpenAddMaterial: () => void;
  onOpenExportTechPack: () => void;
  onToggleSimulator: () => void;
  onOpenImportExcel: () => void;
  onOpenOvertimeSchedule: () => void;
  onOpenExportProductionData?: () => void;
  overtimeHeadcount: number;
  activeOTShiftHours: string;
  simulatorOpen: boolean;
  daysUntilXF: number;
  lang?: Language;
  onToggleLanguage?: () => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  selectedTeam?: string;
  onSelectTeam?: (team: string) => void;
  teams?: string[];
  currentUser: UserRoleSession;
  availableRoles: UserRoleSession[];
  onSelectUserRole: (roleId: string) => void;
  processPICs: ProcessPIC[];
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  currentProject,
  onSelectProject,
  activeTab,
  onChangeTab,
  onOpenAddMaterial,
  onOpenExportTechPack,
  onToggleSimulator,
  onOpenImportExcel,
  onOpenOvertimeSchedule,
  onOpenExportProductionData,
  overtimeHeadcount,
  activeOTShiftHours,
  simulatorOpen,
  daysUntilXF,
  lang = 'en',
  onToggleLanguage,
  theme = 'dark',
  onToggleTheme,
  selectedTeam = 'all',
  onSelectTeam,
  teams,
  currentUser,
  availableRoles,
  onSelectUserRole,
}) => {
  const t = translations[lang];
  const isLight = theme === 'light';
  const isAdmin = canPerformAdminAction(currentUser);

  // Live ticking Waktu Indonesia Barat (WIB) clock in MM/DD/YYYY format
  const wibClock = useLiveWibClock();

  // Available unique teams
  const availableTeams = useMemo(() => {
    if (teams && teams.length > 0) return teams;
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.team) set.add(p.team);
    });
    return Array.from(set);
  }, [teams, projects]);

  // Search Bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic filter by name, season, or style code (productCode / productNumber / sku)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return projects.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchSeason = p.season.toLowerCase().includes(q);
      const matchCode = (p.productCode && p.productCode.toLowerCase().includes(q)) ||
                        (p.productNumber && p.productNumber.toLowerCase().includes(q)) ||
                        p.sku.toLowerCase().includes(q);
      const matchCategory = p.category && p.category.toLowerCase().includes(q);
      const matchDeveloper = p.developer && p.developer.toLowerCase().includes(q);
      return matchName || matchSeason || matchCode || matchCategory || matchDeveloper;
    });
  }, [projects, searchQuery]);

  const handleSelectSearchResult = (projectId: string) => {
    onSelectProject(projectId);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSelectSearchResult(searchResults[0].id);
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  // Close search popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`border-b sticky top-0 z-40 transition-colors shadow-sm ${
      isLight 
        ? 'bg-white border-slate-200 text-slate-900' 
        : 'bg-slate-950 border-slate-800 text-slate-100'
    }`}>
      {/* =========================================================================
          ROW 1: Odoo/Acumatica-Style Enterprise Top Application Bar
          - Brand & Module Breadcrumbs
          - Global Search Box
          - Live WIB Clock (MM/DD/YYYY & HH:mm:ss WIB)
          - Team Switcher
          - Top Right: Language Select & Day/Night Mode (User/System Settings)
         ========================================================================= */}
      <div className={`px-4 sm:px-6 lg:px-8 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950 border-slate-800/80'
      }`}>
        {/* Left: Brand Identity & Team Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border shadow-xs ${
              isLight 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-extrabold tracking-tight text-base font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  PWI2 DEV ERP
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                  isLight 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                }`}>
                  PROJECT TRACK
                </span>
              </div>
              <p className={`text-[11px] font-medium leading-none mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Footwear Commercialization • Plant 4 Serang
              </p>
            </div>
          </div>

          <div className={`h-6 w-px hidden md:block ${isLight ? 'bg-slate-300' : 'bg-slate-800'}`} />

          {/* Odoo-style Team Filter Dropdown */}
          <div className={`hidden md:flex items-center gap-2 border rounded-lg px-2.5 py-1.5 shadow-xs text-xs ${
            isLight ? 'bg-white border-slate-200 text-slate-800 hover:border-slate-300' : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
          }`}>
            <Users className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'} shrink-0`} />
            <span className={`uppercase tracking-wider font-mono text-[10px] font-semibold ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {lang === 'id' ? 'Tim:' : 'Team:'}
            </span>
            <select
              aria-label="Filter styles by development team or view all teams"
              className={`bg-transparent text-xs font-semibold outline-none cursor-pointer pr-1 max-w-[190px] truncate ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
              value={selectedTeam}
              onChange={(e) => onSelectTeam && onSelectTeam(e.target.value)}
            >
              <option value="all" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>
                ★ {lang === 'id' ? 'Semua Tim Sekaligus' : 'All Teams at Once'}
              </option>
              {availableTeams.map((t) => (
                <option key={t} value={t} className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Global ERP Search Box */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-xs md:max-w-sm lg:max-w-md min-w-[200px]">
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 pointer-events-none ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <input
              type="text"
              placeholder={lang === 'id' ? 'Cari model, season (cth: S1-27), kode...' : 'Search style, season (e.g. S1-27), code...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setIsSearchOpen(true);
              }}
              onKeyDown={handleKeyDown}
              className={`w-full border rounded-lg pl-9 pr-8 py-1.5 text-xs transition-all font-sans shadow-xs ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30' 
                  : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className={`absolute right-2.5 top-2 ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-white'}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Results */}
          {isSearchOpen && searchQuery.trim() && (
            <div className={`absolute top-full left-0 right-0 mt-1.5 border rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto divide-y ${
              isLight 
                ? 'bg-white border-slate-200 divide-slate-100 text-slate-800' 
                : 'bg-slate-900 border-slate-700 divide-slate-800 text-white'
            }`}>
              <div className={`p-2 text-[10px] font-mono flex items-center justify-between ${
                isLight ? 'bg-slate-50 text-slate-600' : 'bg-slate-950/80 text-slate-400'
              }`}>
                <span>Matching Styles ({searchResults.length})</span>
                <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>
                  Press Enter or click to inspect
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div className={`p-4 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  No styles found matching &quot;<span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{searchQuery}</span>&quot;
                </div>
              ) : (
                searchResults.map((p) => {
                  const isCurrent = p.id === currentProject.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectSearchResult(p.id)}
                      className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isCurrent
                          ? (isLight ? 'bg-emerald-50 hover:bg-emerald-100/70' : 'bg-emerald-950/40 hover:bg-emerald-950/60')
                          : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/80')
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={p.heroImage}
                          alt={p.name}
                          className={`w-8 h-8 rounded-md object-cover shrink-0 border ${
                            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {p.name}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                              isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-800 text-emerald-400'
                            }`}>
                              {p.season}
                            </span>
                            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {p.productCode || p.productNumber}
                            </span>
                          </div>
                          <p className={`text-[10px] font-mono truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {p.team} · Dev: {p.developer} · Stage: <strong className={isLight ? 'text-slate-800 capitalize' : 'text-slate-200 capitalize'}>{p.currentStage.replace('_', ' ')}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-[11px] font-mono">
                        {isCurrent ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-900/60 text-emerald-300'
                          }`}>
                            Active
                          </span>
                        ) : (
                          <span className={`${isLight ? 'text-slate-400 group-hover:text-emerald-700' : 'text-slate-400 group-hover:text-emerald-300'} flex items-center`}>
                            Select &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right: Active Role / PIC Switcher + Live WIB Clock + TOP-RIGHT Language & Day/Night Mode */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
          {/* Active Role / Process PIC Switcher */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs shadow-xs ${
              isAdmin
                ? isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-amber-950/40 border-amber-700/70 text-amber-200'
                : isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-emerald-950/40 border-emerald-700/70 text-emerald-200'
            }`}
          >
            {isAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <span className="font-mono text-[10px] uppercase font-bold hidden xl:inline">
              {lang === 'id' ? 'Peran / PIC:' : 'Active Role:'}
            </span>
            <select
              aria-label="Select Active User Role or Process PIC"
              value={currentUser.id}
              onChange={(e) => onSelectUserRole(e.target.value)}
              className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 max-w-[205px] truncate ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {availableRoles.map((r) => (
                <option
                  key={r.id}
                  value={r.id}
                  className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}
                >
                  {r.role === 'admin'
                    ? `★ Super Admin — ${r.name} (All Access)`
                    : `${r.title} — ${r.name} (${r.badgeId})`}
                </option>
              ))}
            </select>
          </div>

          {/* Live Waktu Indonesia Barat (WIB) Clock Widget in MM/DD/YYYY format */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs shadow-xs ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 leading-tight">
              <span className="font-semibold text-xs tracking-tight">{wibClock.dateStr}</span>
              <span className={`hidden sm:inline ${isLight ? 'text-slate-300' : 'text-slate-600'}`}>•</span>
              <span className={`text-[11px] font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                {wibClock.timeStr}
              </span>
            </div>
          </div>

          <div className={`h-6 w-px hidden sm:block ${isLight ? 'bg-slate-300' : 'bg-slate-800'}`} />

          {/* ==============================================================
              TOP RIGHT CORNER: Language Switcher & Day/Night Theme Mode
              Positioned clearly at the top right as requested by user.
             ============================================================== */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Language Switcher */}
            {onToggleLanguage && (
              <button
                onClick={onToggleLanguage}
                title={lang === 'en' ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
                aria-label="Toggle language between English and Indonesian"
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  isLight 
                    ? 'bg-white text-slate-800 shadow-xs hover:text-emerald-700' 
                    : 'bg-slate-800 text-slate-200 shadow-xs hover:text-white'
                }`}
              >
                <Globe className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                <span>{lang.toUpperCase()}</span>
              </button>
            )}

            {/* Day / Night Mode Toggle */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? t.dayMode : t.nightMode}
                aria-label={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  isLight 
                    ? 'bg-white text-slate-800 shadow-xs hover:text-slate-900' 
                    : 'bg-slate-800 text-slate-200 shadow-xs hover:text-white'
                }`}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden xl:inline text-[11px] font-sans">{t.dayMode}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden xl:inline text-[11px] font-sans">{t.nightMode}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: Odoo/Acumatica Action Ribbon & Quick Operational Controls
          - Primary CTA: Import Line Sheet (.xlsx)
          - Action buttons: Export Production, Export BOM, Add Material, Overtime, Delay Sim
          - Target Ex-Factory (XF) countdown pill in MM/DD/YYYY format
         ========================================================================= */}
      <div className={`px-4 sm:px-6 lg:px-8 py-2 text-xs border-b transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-950/90 border-slate-800/80'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Action Button: Import Line Sheet (Admin Only) */}
            <button
              onClick={() => {
                if (isAdmin) onOpenImportExcel();
              }}
              disabled={!isAdmin}
              title={
                isAdmin
                  ? 'Import Line Sheet or BOM (.xlsx)'
                  : 'Admin Only: Switch to Super Admin role to import Line Sheet or BOM'
              }
              aria-label="Import Excel Styles and BOM"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                isAdmin
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  : isLight
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              {isAdmin ? (
                <Download className="w-3.5 h-3.5 rotate-180" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>{t.importLineSheet}</span>
              {!isAdmin && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Admin Only
                </span>
              )}
            </button>

            {/* Export Production Data */}
            {onOpenExportProductionData && (
              <button
                onClick={onOpenExportProductionData}
                aria-label="Export Production and Output Data"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900' 
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BarChart3 className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
                <span>{t.exportOutput}</span>
              </button>
            )}

            {/* Export BOM Tech Pack */}
            <button
              onClick={onOpenExportTechPack}
              aria-label="Export BOM Tech Pack"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.exportBOM}</span>
            </button>

            {/* Add Material to BOM (Admin Only) */}
            <button
              onClick={() => {
                if (isAdmin) onOpenAddMaterial();
              }}
              disabled={!isAdmin}
              title={
                isAdmin
                  ? 'Add new material component to BOM'
                  : 'Admin Only: Switch to Super Admin role to add BOM materials'
              }
              aria-label="Add new material component to BOM"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-xs ${
                isAdmin
                  ? isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer' 
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
                  : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
              <span className="hidden sm:inline">{t.addMaterial}</span>
              {!isAdmin && (
                <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-400">
                  Admin
                </span>
              )}
            </button>

            {/* Delay Simulator */}
            <button
              onClick={onToggleSimulator}
              aria-label="Toggle critical path delay simulation"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                simulatorOpen 
                  ? (isLight ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-amber-500/20 text-amber-300 border-amber-500/50') 
                  : (isLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white')
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.delaySimulator}</span>
            </button>

            {/* Overtime Schedule Live Pill */}
            <button
              onClick={onOpenOvertimeSchedule}
              aria-label="View and edit overtime schedule"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-xs group ${
                isLight 
                  ? 'bg-amber-50 hover:bg-amber-100/70 border-amber-200 text-amber-900' 
                  : 'bg-amber-950/30 hover:bg-amber-950/50 border-amber-800/60 text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold">{t.overtimeSchedule}</span>
              <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                isLight ? 'bg-amber-200/80 text-amber-900' : 'bg-amber-900 text-amber-200'
              }`}>
                {overtimeHeadcount} {t.staffOTCount}
              </span>
            </button>
          </div>

          {/* Right: Ex-Factory Countdown Pill (MM/DD/YYYY format) */}
          <div className={`flex items-center gap-2.5 px-3 py-1 rounded-lg border text-xs font-mono shadow-xs ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}>
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{t.targetXF}</span>
            <strong className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {formatDateMMDDYYYY(currentProject.targetXFDate)}
            </strong>
            <span className={isLight ? 'text-slate-300' : 'text-slate-700'}>|</span>
            <span className={`font-bold px-1.5 py-0.2 rounded ${
              daysUntilXF < 60 
                ? (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-950 text-amber-300') 
                : (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950 text-emerald-300')
            }`}>
              {daysUntilXF >= 0 ? `T-${daysUntilXF} ${t.daysUntilXF}` : `+${Math.abs(daysUntilXF)}${t.daysPastXF}`}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: Modern Odoo/Acumatica ERP Module Navigation Tabs
          Clean iconography, clear labels, distinct active tab state
         ========================================================================= */}
      <div className={`px-4 sm:px-6 lg:px-8 ${isLight ? 'bg-white' : 'bg-slate-950'}`}>
        <div className="max-w-7xl mx-auto">
          <nav className="flex space-x-1 sm:space-x-2 py-1 overflow-x-auto scrollbar-none" aria-label="Footwear ERP Sections">
            {[
              { id: 'control_tracker', label: t.tabProcessControl, icon: Activity },
              {
                id: 'workstations',
                label: lang === 'id' ? 'Stasiun Kerja PIC Proses' : 'Process PIC Workstations',
                icon: UserCheck,
              },
              {
                id: 'performance',
                label: lang === 'id' ? 'Dashboard Performa' : 'Performance Dashboard',
                icon: BarChart3,
              },
              { id: 'stage_board', label: t.tabStagesBoard, icon: Kanban },
              { id: 'overview', label: t.tabStyleOverview, icon: FileText },
              { id: 'materials', label: t.tabMaterialSourcing, icon: Package },
              { id: 'samples', label: t.tabSampleRoom, icon: TestTube2 },
              { id: 'milestones', label: t.tabShipmentTimeline, icon: Clock },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const IconComponent = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? isLight
                        ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 font-bold shadow-xs'
                        : 'border-emerald-400 text-emerald-300 bg-emerald-950/30 font-bold shadow-xs'
                      : isLight
                      ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${
                    isActive 
                      ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                      : (isLight ? 'text-slate-400' : 'text-slate-500')
                  }`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
