import React, { useState, useMemo } from 'react';
import { FootwearProject, DevelopmentStage, ProjectTrack } from '../types/footwear';
import { FOOTWEAR_STAGES, getStagesForTrack, groupProjectsByStage, filterProjectsByTrack, isFSTRequiredForStage } from '../utils/footwearErpLogic';
import { Language, ThemeMode, translations } from '../utils/i18n';
import { 
  Layers, 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Sparkles, 
  TestTube2, 
  Calendar, 
  SlidersHorizontal,
  ChevronRight,
  Factory,
  Tag,
  Kanban,
  ListFilter,
  Plus,
  Users
} from 'lucide-react';

interface StageBoardViewProps {
  projects: FootwearProject[];
  onSelectProject: (projectId: string) => void;
  onUpdateProjectStage: (projectId: string, newStage: DevelopmentStage) => void;
  onOpenCreateProject: () => void;
  lang?: Language;
  theme?: ThemeMode;
}

export const StageBoardView: React.FC<StageBoardViewProps> = ({
  projects,
  onSelectProject,
  onUpdateProjectStage,
  onOpenCreateProject,
  lang = 'en',
  theme = 'dark',
}) => {
  const t = translations[lang];
  const [selectedTrack, setSelectedTrack] = useState<'all' | ProjectTrack>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  const activeStagesList = useMemo(() => {
    return getStagesForTrack(selectedTrack);
  }, [selectedTrack]);

  // Extract unique Teams & Projects for filter dropdowns
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

  // Filtered project list
  const filteredProjects = useMemo(() => {
    let list = filterProjectsByTrack(projects, selectedTrack);

    if (selectedSeason !== 'all') {
      list = list.filter((p) => p.season === selectedSeason);
    }

    if (selectedTeam !== 'all') {
      list = list.filter((p) => p.team === selectedTeam);
    }

    if (selectedProject !== 'all') {
      list = list.filter((p) => p.project === selectedProject);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.productNumber && p.productNumber.toLowerCase().includes(q)) ||
          (p.productCode && p.productCode.toLowerCase().includes(q)) ||
          (p.developer && p.developer.toLowerCase().includes(q)) ||
          (p.team && p.team.toLowerCase().includes(q)) ||
          (p.project && p.project.toLowerCase().includes(q)) ||
          p.tier1Factory.toLowerCase().includes(q) ||
          (p.collabPartner && p.collabPartner.toLowerCase().includes(q))
      );
    }

    return list;
  }, [projects, selectedTrack, selectedSeason, selectedTeam, selectedProject, searchQuery]);

  // Grouped by the 7 official stages
  const groupedStages = useMemo(() => {
    return groupProjectsByStage(filteredProjects);
  }, [filteredProjects]);

  // Track breakdown counts
  const trackCounts = useMemo(() => {
    return {
      all: projects.length,
      inline: projects.filter((p) => p.trackType === 'inline').length,
      smu: projects.filter((p) => p.trackType === 'smu').length,
      speed: projects.filter((p) => p.trackType === 'speed').length,
      pullover: projects.filter((p) => p.trackType === 'pullover').length,
      xtr: projects.filter((p) => p.trackType === 'xtr').length,
    };
  }, [projects]);

  // Helper for Track Badge styling
  const renderTrackBadge = (project: FootwearProject) => {
    switch (project.trackType) {
      case 'inline':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
            <Calendar className="w-2.5 h-2.5" />
            <span>Inline ({project.season})</span>
          </span>
        );
      case 'smu':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800">
            <Sparkles className="w-2.5 h-2.5" />
            <span>SMU Collab</span>
          </span>
        );
      case 'speed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800">
            <Zap className="w-2.5 h-2.5" />
            <span>Speed {project.speedTargetDays ? `${project.speedTargetDays}d` : 'Track'}</span>
          </span>
        );
      case 'pullover':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800">
            <TestTube2 className="w-2.5 h-2.5" />
            <span>Pullover Trial</span>
          </span>
        );
      case 'xtr':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800">
            <Factory className="w-2.5 h-2.5" />
            <span>XTR Workshop</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Explaining the 7 Stages and Special Tracks */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Footwear Development Master Stage Board
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              PWI2 Dev Project Track across <strong>7 Sequential Development Stages</strong> (GTM 1 &rarr; GTM 2 &rarr; Line Confirm &rarr; Reline Confirm &rarr; Salesman Sample [SS] &rarr; Production Confirm &rarr; FSC) and non-calendar tracks (<strong>SMU Collab</strong>, <strong>Speed Track</strong>, and <strong>Pullover Trials</strong>).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setViewMode('board')}
                aria-label="Kanban Stage Matrix View"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === 'board'
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>7-Stage Board</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="Table List View"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>List Matrix</span>
              </button>
            </div>

            <button
              onClick={onOpenCreateProject}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Track Filter Pills & Dropdown Controls */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          {/* Track Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-mono mr-1">Track Filter:</span>
            {[
              { id: 'all', label: 'All Tracks', count: trackCounts.all, desc: 'All projects' },
              { id: 'inline', label: 'Inline Calendar', count: trackCounts.inline, desc: 'Seasonal calendar' },
              { id: 'smu', label: 'SMU Collab', count: trackCounts.smu, desc: 'Special make-up' },
              { id: 'speed', label: 'Speed Track', count: trackCounts.speed, desc: '60-90 day fast turn' },
              { id: 'pullover', label: 'Pullover Trials', count: trackCounts.pullover, desc: 'New pattern/material trial' },
              { id: 'xtr', label: 'XTR Workshop', count: trackCounts.xtr, desc: 'Workshop small-run / legacy' },
            ].map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTrack === track.id
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                <span>{track.label}</span>
                <span className="ml-1.5 font-mono text-[11px] opacity-75 px-1 py-0.2 rounded bg-slate-900 border border-slate-800">
                  {track.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Season, Team, and Project Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search style, SKU, prod #, developer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Season Filter */}
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              aria-label="Filter by Season"
              className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer font-mono"
            >
              <option value="all">Season: All Seasons</option>
              <option value="S1-27">S1-27 (2027 First)</option>
              <option value="S2-26">S2-26 (2026 Second)</option>
              <option value="S1-26">S1-26 (2026 First)</option>
            </select>

            {/* Team Filter */}
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              aria-label="Filter by Team"
              className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-emerald-300 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Team: All Teams</option>
              {uniqueTeams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Filter by Project"
              className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-sky-300 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Project: All Projects</option>
              {uniqueProjects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Kanban Stage Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 items-start">
          {activeStagesList.map((stage) => {
            const stageProjects = groupedStages[stage.id] || [];
            const isReline = stage.id === 'reline_confirm';
            const isSS = stage.id === 'salesman_sample';
            const isFSC = stage.id === 'fsc';
            const isXTR = stage.id === 'xtr';

            return (
              <div
                key={stage.id}
                className={`flex flex-col rounded-xl border bg-slate-900/90 shadow-sm transition-all min-h-[480px] ${
                  isXTR
                    ? 'border-rose-900/80 bg-gradient-to-b from-slate-900 via-rose-950/15 to-slate-900'
                    : isFSC
                    ? 'border-emerald-800/80 bg-gradient-to-b from-slate-900 via-emerald-950/10 to-slate-900'
                    : isSS
                    ? 'border-indigo-900/80 bg-gradient-to-b from-slate-900 via-indigo-950/10 to-slate-900'
                    : isReline
                    ? 'border-amber-900/80 bg-gradient-to-b from-slate-900 via-amber-950/10 to-slate-900'
                    : 'border-slate-800'
                }`}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[11px] font-bold text-slate-300 shrink-0">
                        {stage.number}
                      </span>
                      <h3 className="font-bold text-xs text-white uppercase tracking-wider truncate">
                        {stage.shortLabel}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                      {stageProjects.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {stage.description}
                  </p>
                </div>

                {/* Column Body: Project Cards */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[640px]">
                  {stageProjects.length === 0 ? (
                    <div className="p-6 text-center text-[11px] text-slate-600 border border-dashed border-slate-800 rounded-lg">
                      No styles in this stage
                    </div>
                  ) : (
                    stageProjects.map((project) => {
                      const delayedItems = project.bom.filter(
                        (b) => b.sourcingStatus === 'delayed' || b.criticalPathRisk
                      ).length;

                      return (
                        <div
                          key={project.id}
                          className="bg-slate-950/80 border border-slate-800/90 hover:border-emerald-500/80 rounded-lg p-2.5 transition-all shadow-sm group cursor-pointer space-y-2"
                          onClick={() => onSelectProject(project.id)}
                        >
                          {/* Image & Main Info */}
                          <div className="flex items-start gap-2">
                            <img
                              src={project.heroImage}
                              alt={project.name}
                              className="w-10 h-10 rounded-md object-cover border border-slate-800 bg-slate-900 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                                {project.name}
                              </h4>
                              <p className="text-[10px] font-mono text-slate-400 truncate">
                                {project.productNumber || project.sku} · {project.productCode}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {project.team}
                              </p>
                            </div>
                          </div>

                          {/* Track Badge & Details */}
                          <div className="flex flex-wrap items-center gap-1 text-[10px]">
                            {renderTrackBadge(project)}
                            {project.isRelineRequired && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800">
                                Reline Req.
                              </span>
                            )}
                            {isFSTRequiredForStage(project.currentStage) && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800 flex items-center gap-1 font-semibold">
                                <TestTube2 className="w-2.5 h-2.5" />
                                <span>FST Req.</span>
                              </span>
                            )}
                          </div>

                          {/* Developer & Dates */}
                          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
                            <span className="truncate">Dev: {project.developer?.split(' ')[0] || 'Dev'}</span>
                            <span className="text-amber-400">XF: {project.targetXFDate?.slice(5)}</span>
                          </div>

                          {/* Risk Warning if material delayed */}
                          {delayedItems > 0 && (
                            <div className="text-[10px] font-mono text-rose-400 flex items-center gap-1 bg-rose-950/40 border border-rose-900/60 px-1.5 py-0.5 rounded">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              <span>{delayedItems} mat. delayed</span>
                            </div>
                          )}

                          {/* Quick Stage Advance */}
                          <div className="pt-1.5 border-t border-slate-900/80 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-mono">Stage:</span>
                            <select
                              value={project.currentStage}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                onUpdateProjectStage(project.id, e.target.value as DevelopmentStage);
                              }}
                              aria-label={`Change stage for ${project.name}`}
                              className="bg-slate-900 border border-slate-700/80 text-[10px] font-mono rounded px-1.5 py-0.5 text-slate-300 hover:text-white outline-none cursor-pointer"
                            >
                              <option value="gtm_1">1. GTM 1</option>
                              <option value="gtm_2">2. GTM 2</option>
                              <option value="line_confirm">3. Line Confirm</option>
                              <option value="reline_confirm">4. Reline Confirm</option>
                              <option value="salesman_sample">5. SS Sample</option>
                              <option value="production_confirm">6. Prod. Confirm</option>
                              <option value="fsc">7. FSC</option>
                              <option value="xtr">8. XTR (Workshop)</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List Matrix View */}
      {viewMode === 'list' && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Style Name</th>
                  <th className="p-3">Product #</th>
                  <th className="p-3">Product Code</th>
                  <th className="p-3">Team</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Developer</th>
                  <th className="p-3">Season</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Track</th>
                  <th className="p-3">Target XF</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProject(p.id)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-semibold text-white whitespace-nowrap">{p.name}</td>
                    <td className="p-3 font-mono text-emerald-400 whitespace-nowrap">{p.productNumber || p.sku}</td>
                    <td className="p-3 font-mono text-slate-300 whitespace-nowrap">{p.productCode}</td>
                    <td className="p-3 text-blue-300 whitespace-nowrap">{p.team}</td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">{p.project}</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">{p.developer}</td>
                    <td className="p-3 font-mono text-amber-300 whitespace-nowrap">{p.season}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                        {p.currentStage.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">{renderTrackBadge(p)}</td>
                    <td className="p-3 font-mono text-slate-300 whitespace-nowrap">{p.targetXFDate}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(p.id);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
