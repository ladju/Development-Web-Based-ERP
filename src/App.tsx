import React, { useState, useMemo } from 'react';
import { initialProjects } from './data/mockProjects';
import { initialOvertimeSchedules } from './data/mockOvertime';
import { 
  FootwearProject, 
  BOMItem, 
  SampleRound, 
  Milestone, 
  ErpAlert,
  LabDipStatus,
  ComplianceTestStatus,
  SourcingStatus,
  FitComment,
  DevelopmentStage,
  ProjectTrack,
  MaterialArrivalRecord,
  OvertimeRecord
} from './types/footwear';
import { 
  calculateSourcingReadiness, 
  calculateCriticalPathStatus, 
  detectCriticalAlerts,
  getProjectCurrentProcess,
  canAdvanceProjectProcess,
  canPerformAdminAction,
  PROCESS_SLA_HOURS,
  getProjectSubcontSummary
} from './utils/footwearErpLogic';
import { formatWibDateTime } from './utils/dateUtils';

import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { ProcessControlTracker } from './components/ProcessControlTracker';
import { ProcessWorkstationDashboard } from './components/ProcessWorkstationDashboard';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { StageBoardView } from './components/StageBoardView';
import { ProjectOverview } from './components/ProjectOverview';
import { MaterialSourcingTable } from './components/MaterialSourcingTable';
import { SampleRoomTracker } from './components/SampleRoomTracker';
import { MilestoneTimeline } from './components/MilestoneTimeline';
import { AddMaterialModal } from './components/AddMaterialModal';
import { LabDipModal } from './components/LabDipModal';
import { TechPackExportModal } from './components/TechPackExportModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ImportExcelModal } from './components/ImportExcelModal';
import { OvertimeScheduleModal } from './components/OvertimeScheduleModal';
import { ExportProcessDataModal } from './components/ExportProcessDataModal';
import { BulkUpdateOutputModal } from './components/BulkUpdateOutputModal';
import { FactoryProcessKey, ProcessOutputMetric, ProcessPIC, UserRoleSession, ProcessHandoffLog } from './types/factoryOutput';
import { initialProcessMetrics, initialProcessPICs, initialProcessHandoffLogs } from './data/mockFactoryOutput';
import { Language, ThemeMode } from './utils/i18n';

export default function App() {
  const [projects, setProjects] = useState<FootwearProject[]>(initialProjects);
  const [currentProjectId, setCurrentProjectId] = useState<string>('proj-aerostride');
  // Default to control_tracker for dedicated stage process control and material arrival tracking
  const [activeTab, setActiveTab] = useState<'control_tracker' | 'workstations' | 'performance' | 'stage_board' | 'overview' | 'materials' | 'samples' | 'milestones'>('control_tracker');
  
  // Language & Day/Night Mode State
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  // Process PICs & Active Role / RBAC Session State
  const [processPICs, setProcessPICs] = useState<ProcessPIC[]>(initialProcessPICs);
  const [handoffLogs, setHandoffLogs] = useState<ProcessHandoffLog[]>(initialProcessHandoffLogs);
  const [currentUserRoleId, setCurrentUserRoleId] = useState<string>('role-admin');

  const availableRoles: UserRoleSession[] = useMemo(() => {
    const adminSession: UserRoleSession = {
      id: 'role-admin',
      role: 'admin',
      name: 'Rizky Pratama',
      badgeId: 'ADM-001',
      title: 'Super Admin',
    };
    const picSessions: UserRoleSession[] = processPICs.map((pic) => ({
      id: `role-pic-${pic.processKey}`,
      role: 'process_pic',
      processKey: pic.processKey,
      name: pic.picName,
      badgeId: pic.badgeId,
      title: `PIC ${pic.stepNumber}: ${pic.processName}`,
    }));
    return [adminSession, ...picSessions];
  }, [processPICs]);

  const currentUser = useMemo(() => {
    return availableRoles.find((r) => r.id === currentUserRoleId) || availableRoles[0];
  }, [availableRoles, currentUserRoleId]);

  // Modals & Sub-states
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [activeLabDipItem, setActiveLabDipItem] = useState<BOMItem | null>(null);
  const [exportTechPackOpen, setExportTechPackOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simulatedDelayDays, setSimulatedDelayDays] = useState(0);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [overtimeSchedules, setOvertimeSchedules] = useState<OvertimeRecord[]>(initialOvertimeSchedules);
  const [importExcelOpen, setImportExcelOpen] = useState(false);
  const [overtimeScheduleOpen, setOvertimeScheduleOpen] = useState(false);

  // Factory Process Output & Capacity Metrics state
  const [processMetrics, setProcessMetrics] = useState<ProcessOutputMetric[]>(initialProcessMetrics);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDefaultProcess, setExportDefaultProcess] = useState<FactoryProcessKey | 'all'>('all');

  // Bulk Output Update Modal State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkSelectedProcesses, setBulkSelectedProcesses] = useState<FactoryProcessKey[]>([]);

  const handleOpenBulkModal = (keys: FactoryProcessKey[]) => {
    setBulkSelectedProcesses(keys);
    setBulkModalOpen(true);
  };

  const handleApplyBulkOutputUpdate = (updatedMap: Record<FactoryProcessKey, number>) => {
    setProcessMetrics((prev) =>
      prev.map((m) => {
        if (updatedMap[m.key] !== undefined) {
          const newLive = updatedMap[m.key];
          const diff = newLive - m.liveOutput;
          return {
            ...m,
            liveOutput: newLive,
            wipBufferPairs: Math.max(0, m.wipBufferPairs - Math.floor(diff * 0.3)),
          };
        }
        return m;
      })
    );
  };

  const handleOpenExportModal = (processKey?: FactoryProcessKey) => {
    setExportDefaultProcess(processKey || 'all');
    setExportModalOpen(true);
  };

  const handleIncrementLiveOutput = (processKey: FactoryProcessKey, incrementAmount: number) => {
    setProcessMetrics((prev) =>
      prev.map((m) =>
        m.key === processKey
          ? {
              ...m,
              liveOutput: m.liveOutput + incrementAmount,
              wipBufferPairs: Math.max(0, m.wipBufferPairs - Math.floor(incrementAmount * 0.4)),
            }
          : m
      )
    );
  };

  // Overtime summary metrics for header
  const totalOTHeadcount = useMemo(() => {
    return overtimeSchedules
      .filter((s) => s.status === 'active' || s.status === 'scheduled')
      .reduce((sum, item) => sum + item.headcount, 0);
  }, [overtimeSchedules]);

  const activeShiftHours = useMemo(() => {
    const active = overtimeSchedules.find((s) => s.status === 'active');
    return active ? `${active.cellOrLine} (${active.shiftHours})` : 'Dev Cells Operational';
  }, [overtimeSchedules]);
  
  // Active Project
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === currentProjectId) || projects[0];
  }, [projects, currentProjectId]);

  const [activeSampleId, setActiveSampleId] = useState<string>(
    currentProject.samples[currentProject.samples.length - 1]?.id || currentProject.samples[0]?.id || ''
  );

  // Core calculations for currently selected project
  const sourcingReport = useMemo(() => {
    return calculateSourcingReadiness(currentProject.bom);
  }, [currentProject.bom]);

  const criticalPath = useMemo(() => {
    return calculateCriticalPathStatus(currentProject.targetXFDate, currentProject.milestones, '2026-11-01');
  }, [currentProject.targetXFDate, currentProject.milestones]);

  const alerts = useMemo(() => {
    const rawAlerts = detectCriticalAlerts(
      currentProject,
      currentProject.bom,
      currentProject.samples,
      currentProject.milestones
    );
    return rawAlerts.filter((a) => !dismissedAlertIds.includes(a.id));
  }, [currentProject, dismissedAlertIds]);

  // Project Switcher
  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    const target = projects.find((p) => p.id === projectId);
    if (target && target.samples.length > 0) {
      setActiveSampleId(target.samples[target.samples.length - 1].id);
    }
  };

  // Stage Advancement / Modification
  const handleUpdateProjectStage = (projectId: string, newStage: DevelopmentStage) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, currentStage: newStage } : p))
    );
  };

  // Process Hand-Off Advancement (Strictly enforced by Process PIC or Super Admin, supports Cutting -> Subcont OR Cutting -> Preparation)
  const handleAdvanceProjectProcess = (
    projectId: string,
    notes?: string,
    options?: { skipSubcont?: boolean }
  ) => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    const currentProc = getProjectCurrentProcess(targetProject);
    const perm = canAdvanceProjectProcess(currentUser, currentProc, processPICs, options);
    if (!perm.allowed || currentProc === 'completed') return;

    const nextProc = perm.nextProcess;
    const wib = formatWibDateTime(new Date());

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, currentProcess: nextProc } : p))
    );

    const slaTarget = PROCESS_SLA_HOURS[currentProc] || 16;
    const simulatedActualHours =
      currentProc === 'cutting' && options?.skipSubcont
        ? Number((slaTarget * 0.85).toFixed(1))
        : currentProc === 'subcont'
        ? 31.5
        : Number((slaTarget * 0.95).toFixed(1));

    const routingType: ProcessHandoffLog['routingType'] =
      currentProc === 'cutting'
        ? options?.skipSubcont
          ? 'direct_skip_subcont'
          : 'subcont_2nd_process'
        : 'standard';

    const defaultNote =
      currentProc === 'cutting'
        ? options?.skipSubcont
          ? `Components need no 2nd process — handed off straight to 4. Preparation (bypassed Subcont) by ${currentUser.name}`
          : `Components requiring 2nd process handed off to 3. Subcont Process by ${currentUser.name}`
        : `Process completed & handed off by ${currentUser.name} (${currentUser.title})`;

    const newLog: ProcessHandoffLog = {
      id: `handoff-${Date.now()}`,
      projectId: targetProject.id,
      projectName: targetProject.name,
      productCode: targetProject.productCode || targetProject.sku,
      fromProcess: currentProc,
      toProcess: nextProc,
      timestampWib: wib.fullStr,
      durationHours: simulatedActualHours,
      slaTargetHours: slaTarget,
      routingType,
      componentScope:
        currentProc === 'cutting' ? getProjectSubcontSummary(targetProject) : undefined,
      authorizedByName: currentUser.name,
      authorizedByBadge: currentUser.badgeId,
      authorizedRole: currentUser.role,
      notes: notes?.trim() || defaultNote,
    };
    setHandoffLogs((prev) => [newLog, ...prev]);
  };

  // Admin Direct Process Override
  const handleAdminSetProjectProcess = (
    projectId: string,
    targetProcess: FactoryProcessKey | 'completed',
    notes?: string
  ) => {
    if (!canPerformAdminAction(currentUser)) return;
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    const currentProc = getProjectCurrentProcess(targetProject);
    if (currentProc === targetProcess) return;

    const wib = formatWibDateTime(new Date());
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, currentProcess: targetProcess } : p))
    );

    if (currentProc !== 'completed') {
      const slaTarget = PROCESS_SLA_HOURS[currentProc] || 16;
      const newLog: ProcessHandoffLog = {
        id: `handoff-${Date.now()}`,
        projectId: targetProject.id,
        projectName: targetProject.name,
        productCode: targetProject.productCode || targetProject.sku,
        fromProcess: currentProc,
        toProcess: targetProcess,
        timestampWib: wib.fullStr,
        durationHours: slaTarget,
        slaTargetHours: slaTarget,
        routingType:
          currentProc === 'cutting' && targetProcess === 'preparation'
            ? 'direct_skip_subcont'
            : currentProc === 'cutting' && targetProcess === 'subcont'
            ? 'subcont_2nd_process'
            : 'standard',
        authorizedByName: `${currentUser.name} (Super Admin)`,
        authorizedByBadge: currentUser.badgeId,
        authorizedRole: 'admin',
        notes: notes || 'Super Admin direct process reassignment',
      };
      setHandoffLogs((prev) => [newLog, ...prev]);
    }
  };

  // Admin Reassign Process PIC
  const handleUpdateProcessPIC = (
    processKey: FactoryProcessKey,
    updatedPicName: string,
    updatedBadgeId: string,
    updatedShift: string
  ) => {
    if (!canPerformAdminAction(currentUser)) return;
    setProcessPICs((prev) =>
      prev.map((p) =>
        p.processKey === processKey
          ? { ...p, picName: updatedPicName, badgeId: updatedBadgeId, shiftHours: updatedShift }
          : p
      )
    );
    setProcessMetrics((prev) =>
      prev.map((m) =>
        m.key === processKey
          ? { ...m, supervisor: updatedPicName, shiftHours: updatedShift }
          : m
      )
    );
  };

  // Add new project to the portfolio
  const handleCreateProject = (newProject: FootwearProject) => {
    setProjects((prev) => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
  };

  // Material Actions
  const handleAddMaterial = (newItem: BOMItem) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProjectId) return proj;
        return {
          ...proj,
          bom: [newItem, ...proj.bom],
        };
      })
    );
  };

  const handleUpdateSourcingStatus = (itemId: string, newStatus: SourcingStatus) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProjectId) return proj;
        return {
          ...proj,
          bom: proj.bom.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  sourcingStatus: newStatus,
                  criticalPathRisk: newStatus === 'delayed',
                }
              : item
          ),
        };
      })
    );
  };

  const handleUpdateTestStatus = (itemId: string, newStatus: ComplianceTestStatus) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProjectId) return proj;
        return {
          ...proj,
          bom: proj.bom.map((item) =>
            item.id === itemId ? { ...item, testStatus: newStatus } : item
          ),
        };
      })
    );
  };

  const handleToggleCriticalRisk = (itemId: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProjectId) return proj;
        return {
          ...proj,
          bom: proj.bom.map((item) =>
            item.id === itemId ? { ...item, criticalPathRisk: !item.criticalPathRisk } : item
          ),
        };
      })
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProjectId) return proj;
        return {
          ...proj,
          bom: proj.bom.filter((item) => item.id !== itemId),
        };
      })
    );
  };

  const handleUpdateLabDip = (
    itemId: string,
    newStatus: LabDipStatus,
    round: number,
    notes?: string
  ) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProjectId) return proj;
        return {
          ...proj,
          bom: proj.bom.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              labDipStatus: newStatus,
              labDipRound: round,
              sourcingStatus: newStatus === 'approved' ? 'swatch_approved' : item.sourcingStatus,
              criticalPathRisk: newStatus === 'rejected',
              notes: notes || item.notes,
            };
          }),
        };
      })
    );
  };

  // Add Material Arrival Record (with AWB, arrival count, rejection count & reasons)
  const handleAddMaterialArrivalRecord = (
    projectId: string,
    bomItemId: string,
    newRecord: MaterialArrivalRecord
  ) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          bom: proj.bom.map((item) => {
            if (item.id !== bomItemId) return item;
            const updatedHistory = [newRecord, ...(item.arrivalHistory || [])];
            return {
              ...item,
              airwayBill: newRecord.airwayBill || item.airwayBill,
              arrivalHistory: updatedHistory,
              sourcingStatus:
                newRecord.status === 'accepted'
                  ? 'bulk_delivered'
                  : newRecord.status === 'rejected'
                  ? 'delayed'
                  : 'in_transit',
              criticalPathRisk: newRecord.status === 'rejected',
            };
          }),
        };
      })
    );
  };

  // Excel Portfolio & BOM Import Handlers
  const handleImportStyles = (newStyles: FootwearProject[]) => {
    setProjects((prev) => [...newStyles, ...prev]);
    if (newStyles.length > 0) {
      setCurrentProjectId(newStyles[0].id);
    }
  };

  const handleImportBOM = (targetProjectId: string, newBOM: BOMItem[]) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== targetProjectId) return proj;
        return {
          ...proj,
          bom: [...newBOM, ...proj.bom],
        };
      })
    );
  };

  const handleUpdateBOMItem = (projectId: string, updatedItem: BOMItem) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          bom: proj.bom.map((b) => (b.id === updatedItem.id ? updatedItem : b)),
        };
      })
    );
  };

  // Overtime Schedule Handlers
  const handleAddOvertimeSchedule = (newRecord: OvertimeRecord) => {
    setOvertimeSchedules((prev) => [newRecord, ...prev]);
  };

  const handleUpdateOvertimeStatus = (
    id: string,
    status: 'active' | 'scheduled' | 'completed'
  ) => {
    setOvertimeSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  // Sample Room Actions
  const handleToggleResolveComment = (sampleId: string, commentId: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProjectId) return proj;
        return {
          ...proj,
          samples: proj.samples.map((s) => {
            if (s.id !== sampleId) return s;
            return {
              ...s,
              fitComments: s.fitComments.map((c) =>
                c.id === commentId ? { ...c, resolved: !c.resolved } : c
              ),
            };
          }),
        };
      })
    );
  };

  const handleAddComment = (
    sampleId: string,
    area: FitComment['area'],
    severity: FitComment['severity'],
    comment: string,
    author: string
  ) => {
    const newCommentObj: FitComment = {
      id: `comment-${Date.now()}`,
      timestamp: new Date().toISOString().split('T')[0],
      author,
      role: 'Quality & Fit Inspector',
      area,
      severity,
      comment,
      resolved: false,
    };

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProjectId) return proj;
        return {
          ...proj,
          samples: proj.samples.map((s) => {
            if (s.id !== sampleId) return s;
            return {
              ...s,
              fitComments: [newCommentObj, ...s.fitComments],
            };
          }),
        };
      })
    );
  };

  const handleUpdateSampleDecision = (sampleId: string, decision: 'approved' | 'rejected') => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProjectId) return proj;
        return {
          ...proj,
          samples: proj.samples.map((s) => {
            if (s.id !== sampleId) return s;
            return {
              ...s,
              decision,
              status: decision === 'approved' ? 'approved' : 'rejected_resample',
            };
          }),
        };
      })
    );
  };

  // Milestone Actions
  const handleToggleCompleteMilestone = (milestoneId: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== currentProjectId) return proj;
        return {
          ...proj,
          milestones: proj.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            const willBeCompleted = m.status !== 'completed';
            return {
              ...m,
              status: willBeCompleted ? 'completed' : 'on_track',
              actualDate: willBeCompleted ? new Date().toISOString().split('T')[0] : undefined,
              delayDays: 0,
            };
          }),
        };
      })
    );
  };

  // Alert Click Navigation
  const handleSelectAlert = (alert: ErpAlert) => {
    if (alert.category === 'material') {
      setActiveTab('materials');
    } else if (alert.category === 'sample') {
      setActiveTab('samples');
      if (alert.relatedId) setActiveSampleId(alert.relatedId);
    } else if (alert.category === 'shipment') {
      setActiveTab('milestones');
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlertIds((prev) => [...prev, alertId]);
  };

  const allTeams = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.team) set.add(p.team);
    });
    return Array.from(set);
  }, [projects]);

  return (
    <div className={`min-h-screen flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 transition-colors ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Top Application Navbar */}
      <Navbar
        projects={projects}
        currentProject={currentProject}
        onSelectProject={handleSelectProject}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenAddMaterial={() => setAddMaterialOpen(true)}
        onOpenExportTechPack={() => setExportTechPackOpen(true)}
        onToggleSimulator={() => {
          setSimulatorOpen(!simulatorOpen);
          if (activeTab !== 'milestones') {
            setActiveTab('milestones');
          }
        }}
        simulatorOpen={simulatorOpen}
        daysUntilXF={criticalPath.daysUntilXF - simulatedDelayDays}
        onOpenImportExcel={() => setImportExcelOpen(true)}
        onOpenOvertimeSchedule={() => setOvertimeScheduleOpen(true)}
        onOpenExportProductionData={() => handleOpenExportModal()}
        overtimeHeadcount={totalOTHeadcount}
        activeOTShiftHours={activeShiftHours}
        lang={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'id' : 'en'))}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        selectedTeam={selectedTeam}
        onSelectTeam={setSelectedTeam}
        teams={allTeams}
        currentUser={currentUser}
        availableRoles={availableRoles}
        onSelectUserRole={(roleId) => {
          setCurrentUserRoleId(roleId);
        }}
        processPICs={processPICs}
      />

      {/* Critical Path Alerts Strip (shown on specific views or if alerts exist) */}
      <AlertBanner
        alerts={alerts}
        onSelectAlert={handleSelectAlert}
        onDismissAlert={handleDismissAlert}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dedicated Process Control & Material Tracking Center */}
        {activeTab === 'control_tracker' && (
          <ProcessControlTracker
            projects={projects}
            onSelectProject={(id: string) => {
              handleSelectProject(id);
              setActiveTab('overview');
            }}
            onUpdateProjectStage={handleUpdateProjectStage}
            onOpenCreateProject={() => {
              if (canPerformAdminAction(currentUser)) setCreateProjectOpen(true);
            }}
            onOpenImportExcel={() => {
              if (canPerformAdminAction(currentUser)) setImportExcelOpen(true);
            }}
            onAddArrivalRecord={handleAddMaterialArrivalRecord}
            onUpdateBOMItem={handleUpdateBOMItem}
            processMetrics={processMetrics}
            onOpenExportModal={handleOpenExportModal}
            onIncrementLiveOutput={handleIncrementLiveOutput}
            onOpenBulkUpdateModal={handleOpenBulkModal}
            lang={language}
            theme={theme}
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
            currentUser={currentUser}
            processPICs={processPICs}
            onAdvanceProjectProcess={handleAdvanceProjectProcess}
            onNavigateWorkstations={() => setActiveTab('workstations')}
            onNavigatePerformance={() => setActiveTab('performance')}
          />
        )}

        {/* Dedicated Process PIC Workstations Dashboard */}
        {activeTab === 'workstations' && (
          <ProcessWorkstationDashboard
            projects={projects}
            processMetrics={processMetrics}
            processPICs={processPICs}
            currentUser={currentUser}
            handoffLogs={handoffLogs}
            onAdvanceProjectProcess={handleAdvanceProjectProcess}
            onAdminSetProjectProcess={handleAdminSetProjectProcess}
            onUpdateProcessPIC={handleUpdateProcessPIC}
            onIncrementLiveOutput={handleIncrementLiveOutput}
            onOpenImportExcel={() => {
              if (canPerformAdminAction(currentUser)) setImportExcelOpen(true);
            }}
            onOpenAddMaterial={() => {
              if (canPerformAdminAction(currentUser)) setAddMaterialOpen(true);
            }}
            onOpenCreateProject={() => {
              if (canPerformAdminAction(currentUser)) setCreateProjectOpen(true);
            }}
            onSelectProject={(id) => {
              handleSelectProject(id);
              setActiveTab('overview');
            }}
            lang={language}
            theme={theme}
          />
        )}

        {/* Process Performance & Bottleneck Analytics Dashboard */}
        {activeTab === 'performance' && (
          <PerformanceDashboard
            handoffLogs={handoffLogs}
            processPICs={processPICs}
            onNavigateWorkstations={() => setActiveTab('workstations')}
            lang={language}
            theme={theme}
          />
        )}

        {/* Main Stages Board Tab (Monitors all projects across stages) */}
        {activeTab === 'stage_board' && (
          <StageBoardView
            projects={projects}
            onSelectProject={(id) => {
              handleSelectProject(id);
              setActiveTab('overview');
            }}
            onUpdateProjectStage={handleUpdateProjectStage}
            onOpenCreateProject={() => {
              if (canPerformAdminAction(currentUser)) setCreateProjectOpen(true);
            }}
            lang={language}
            theme={theme}
          />
        )}

        {/* Selected Style Detail Overview */}
        {activeTab === 'overview' && (
          <ProjectOverview
            project={currentProject}
            sourcingReport={sourcingReport}
            criticalPath={criticalPath}
            alerts={alerts}
            onNavigateTab={setActiveTab}
            onSelectAlert={handleSelectAlert}
          />
        )}

        {/* Material Sourcing & BOM Hub */}
        {activeTab === 'materials' && (
          <MaterialSourcingTable
            bom={currentProject.bom}
            onOpenAddModal={() => {
              if (canPerformAdminAction(currentUser)) setAddMaterialOpen(true);
            }}
            onOpenLabDipModal={(item) => setActiveLabDipItem(item)}
            onUpdateSourcingStatus={handleUpdateSourcingStatus}
            onUpdateTestStatus={handleUpdateTestStatus}
            onToggleCriticalRisk={handleToggleCriticalRisk}
            onDeleteItem={handleDeleteItem}
            isAdmin={canPerformAdminAction(currentUser)}
          />
        )}

        {/* Factory Sample Room & Fit Gates */}
        {activeTab === 'samples' && (
          <SampleRoomTracker
            samples={currentProject.samples}
            activeSampleId={activeSampleId}
            onSelectSample={setActiveSampleId}
            onToggleResolveComment={handleToggleResolveComment}
            onAddComment={handleAddComment}
            onUpdateSampleDecision={handleUpdateSampleDecision}
          />
        )}

        {/* Shipment & Critical Path Gantt */}
        {activeTab === 'milestones' && (
          <MilestoneTimeline
            project={currentProject}
            milestones={currentProject.milestones}
            onToggleCompleteMilestone={handleToggleCompleteMilestone}
            onSimulateDelay={setSimulatedDelayDays}
            simulatedDelayDays={simulatedDelayDays}
          />
        )}
      </main>

      {/* Modals */}
      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onCreateProject={handleCreateProject}
      />

      <AddMaterialModal
        isOpen={addMaterialOpen}
        onClose={() => setAddMaterialOpen(false)}
        onAddMaterial={handleAddMaterial}
      />

      {activeLabDipItem && (
        <LabDipModal
          item={activeLabDipItem}
          isOpen={!!activeLabDipItem}
          onClose={() => setActiveLabDipItem(null)}
          onUpdateStatus={handleUpdateLabDip}
        />
      )}

      <TechPackExportModal
        project={currentProject}
        isOpen={exportTechPackOpen}
        onClose={() => setExportTechPackOpen(false)}
      />

      {/* Excel Portfolio & BOM Import Modal */}
      <ImportExcelModal
        isOpen={importExcelOpen}
        onClose={() => setImportExcelOpen(false)}
        projects={projects}
        currentProjectId={currentProjectId}
        onImportStyles={handleImportStyles}
        onImportBOM={handleImportBOM}
      />

      {/* Sample Room Overtime Schedule Modal */}
      <OvertimeScheduleModal
        isOpen={overtimeScheduleOpen}
        onClose={() => setOvertimeScheduleOpen(false)}
        schedules={overtimeSchedules}
        onAddSchedule={handleAddOvertimeSchedule}
        onUpdateStatus={handleUpdateOvertimeStatus}
      />

      {/* Factory Process Output & Production Data Export Modal (Daily, Weekly, Monthly, Season & By Process) */}
      <ExportProcessDataModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        defaultProcessKey={exportDefaultProcess}
      />

      {/* Bulk Action Update Live Output Modal */}
      <BulkUpdateOutputModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        selectedProcessKeys={bulkSelectedProcesses}
        allMetrics={processMetrics}
        onApplyBulkUpdate={handleApplyBulkOutputUpdate}
        lang={language}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        PWI2 Dev Project Track ERP · Enterprise Footwear Product Lifecycle &amp; Sourcing System
      </footer>
    </div>
  );
}
