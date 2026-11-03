import { 
  BOMItem, 
  FootwearProject, 
  Milestone, 
  SampleRound, 
  ErpAlert,
  DevelopmentStage,
  ProjectTrack 
} from '../types/footwear';
import { FactoryProcessKey, ProcessPIC, UserRoleSession, ProcessHandoffLog } from '../types/factoryOutput';

export interface BOMCostBreakdown {
  totalMaterialCost: number;
  upperCost: number;
  soleCost: number;
  liningCost: number;
  hardwareCost: number;
  packagingCost: number;
  overheadAndLaborEstimate: number;
  projectedFOB: number;
  varianceFromTarget: number; // positive = over target, negative = savings
  variancePercent: number;
}

export function calculateBOMCost(bom: BOMItem[], targetFOB: number): BOMCostBreakdown {
  let upper = 0;
  let sole = 0;
  let lining = 0;
  let hardware = 0;
  let packaging = 0;

  for (const item of bom) {
    const itemTotal = Number((item.yieldPerPair * item.unitCostUSD).toFixed(2));
    switch (item.category) {
      case 'upper':
        upper += itemTotal;
        break;
      case 'sole':
        sole += itemTotal;
        break;
      case 'lining':
        lining += itemTotal;
        break;
      case 'hardware':
        hardware += itemTotal;
        break;
      case 'packaging':
        packaging += itemTotal;
        break;
    }
  }

  const totalMaterialCost = Number((upper + sole + lining + hardware + packaging).toFixed(2));
  // In footwear commercialization, factory cut-stitch-assembly labor & overhead is typically 30-45% of material
  const overheadAndLaborEstimate = Number((totalMaterialCost * 0.38).toFixed(2));
  const projectedFOB = Number((totalMaterialCost + overheadAndLaborEstimate).toFixed(2));
  const varianceFromTarget = Number((projectedFOB - targetFOB).toFixed(2));
  const variancePercent = targetFOB > 0 
    ? Number(((varianceFromTarget / targetFOB) * 100).toFixed(1)) 
    : 0;

  return {
    totalMaterialCost,
    upperCost: Number(upper.toFixed(2)),
    soleCost: Number(sole.toFixed(2)),
    liningCost: Number(lining.toFixed(2)),
    hardwareCost: Number(hardware.toFixed(2)),
    packagingCost: Number(packaging.toFixed(2)),
    overheadAndLaborEstimate,
    projectedFOB,
    varianceFromTarget,
    variancePercent,
  };
}

export interface SourcingReadinessReport {
  totalComponents: number;
  approvedCount: number;
  inProgressCount: number;
  atRiskCount: number;
  readinessPercentage: number;
  labDipsApprovedCount: number;
  labDipsPendingCount: number;
  testsPassedCount: number;
  testsFailedCount: number;
}

export function calculateSourcingReadiness(bom: BOMItem[]): SourcingReadinessReport {
  if (bom.length === 0) {
    return {
      totalComponents: 0,
      approvedCount: 0,
      inProgressCount: 0,
      atRiskCount: 0,
      readinessPercentage: 0,
      labDipsApprovedCount: 0,
      labDipsPendingCount: 0,
      testsPassedCount: 0,
      testsFailedCount: 0,
    };
  }

  let approved = 0;
  let inProgress = 0;
  let atRisk = 0;
  let labDipApproved = 0;
  let labDipPending = 0;
  let testPassed = 0;
  let testFailed = 0;

  for (const item of bom) {
    if (item.sourcingStatus === 'bulk_delivered' || item.sourcingStatus === 'swatch_approved') {
      approved++;
    } else if (item.sourcingStatus === 'delayed' || item.criticalPathRisk) {
      atRisk++;
    } else {
      inProgress++;
    }

    if (item.labDipStatus === 'approved' || item.labDipStatus === 'approved_with_condition') {
      labDipApproved++;
    } else if (item.labDipStatus === 'pending' || item.labDipStatus === 'submitted') {
      labDipPending++;
    }

    if (item.testStatus === 'passed') {
      testPassed++;
    } else if (item.testStatus === 'failed') {
      testFailed++;
    }
  }

  const readinessPercentage = Math.round((approved / bom.length) * 100);

  return {
    totalComponents: bom.length,
    approvedCount: approved,
    inProgressCount: inProgress,
    atRiskCount: atRisk,
    readinessPercentage,
    labDipsApprovedCount: labDipApproved,
    labDipsPendingCount: labDipPending,
    testsPassedCount: testPassed,
    testsFailedCount: testFailed,
  };
}

export interface CriticalPathReport {
  daysUntilXF: number;
  targetXFFormatted: string;
  isOverdue: boolean;
  totalDelayDays: number;
  criticalMilestonesCount: number;
  delayedCriticalMilestonesCount: number;
  overallStatus: 'on_track' | 'at_risk' | 'delayed' | 'completed';
}

export function calculateCriticalPathStatus(
  targetXFDate: string,
  milestones: Milestone[],
  currentDateStr = '2026-11-01'
): CriticalPathReport {
  const current = new Date(currentDateStr);
  const targetXF = new Date(targetXFDate);
  const diffTime = targetXF.getTime() - current.getTime();
  const daysUntilXF = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let totalDelay = 0;
  let criticalCount = 0;
  let delayedCriticalCount = 0;

  for (const m of milestones) {
    if (m.isCriticalPath) {
      criticalCount++;
      if (m.status === 'delayed' || m.delayDays > 0) {
        delayedCriticalCount++;
        totalDelay = Math.max(totalDelay, m.delayDays);
      }
    }
  }

  let overallStatus: 'on_track' | 'at_risk' | 'delayed' | 'completed' = 'on_track';
  if (delayedCriticalCount > 0) {
    overallStatus = totalDelay > 7 ? 'delayed' : 'at_risk';
  } else if (daysUntilXF < 0) {
    overallStatus = 'delayed';
  }

  return {
    daysUntilXF,
    targetXFFormatted: targetXFDate,
    isOverdue: daysUntilXF < 0,
    totalDelayDays: totalDelay,
    criticalMilestonesCount: criticalCount,
    delayedCriticalMilestonesCount: delayedCriticalCount,
    overallStatus,
  };
}

export function evaluateSampleGateApproval(sample: SampleRound): {
  canProceed: boolean;
  unresolvedCriticalComments: number;
  reason: string;
} {
  const criticalUnresolved = sample.fitComments.filter(
    (c) => c.severity === 'critical' && !c.resolved
  );

  if (sample.status === 'rejected_resample') {
    return {
      canProceed: false,
      unresolvedCriticalComments: criticalUnresolved.length,
      reason: 'Sample was formally rejected. A revision round must be built.',
    };
  }

  if (criticalUnresolved.length > 0) {
    return {
      canProceed: false,
      unresolvedCriticalComments: criticalUnresolved.length,
      reason: `${criticalUnresolved.length} critical fit/mold defect(s) pending resolution.`,
    };
  }

  if (sample.fitScore < 7) {
    return {
      canProceed: false,
      unresolvedCriticalComments: 0,
      reason: `Fit score (${sample.fitScore}/10) is below passing threshold (7.0/10).`,
    };
  }

  return {
    canProceed: true,
    unresolvedCriticalComments: 0,
    reason: 'Stage criteria satisfied. Approved to advance to subsequent round.',
  };
}

export function detectCriticalAlerts(
  project: FootwearProject,
  bom: BOMItem[],
  samples: SampleRound[],
  milestones: Milestone[]
): ErpAlert[] {
  const alerts: ErpAlert[] = [];

  // 1. Material delays & lab dip blocks
  for (const item of bom) {
    if (item.criticalPathRisk || item.sourcingStatus === 'delayed') {
      alerts.push({
        id: `alert-mat-${item.id}`,
        type: 'critical',
        category: 'material',
        title: `Delayed Material: ${item.componentName}`,
        message: `${item.materialName} from ${item.supplierName} is flagged at risk. ETA is past the cut window.`,
        relatedId: item.id,
        actionText: 'View BOM Component',
      });
    } else if (item.testStatus === 'failed') {
      alerts.push({
        id: `alert-test-${item.id}`,
        type: 'critical',
        category: 'material',
        title: `Physical Lab Test Failure: ${item.componentName}`,
        message: `${item.materialName} failed flexing/abrasion standard. Re-test or alternative compound required.`,
        relatedId: item.id,
        actionText: 'Review Test Spec',
      });
    } else if (item.labDipStatus === 'rejected') {
      alerts.push({
        id: `alert-labdip-${item.id}`,
        type: 'warning',
        category: 'material',
        title: `Lab Dip Rejected (R${item.labDipRound})`,
        message: `Color swatch for ${item.materialName} was rejected for delta-E color variance.`,
        relatedId: item.id,
        actionText: 'Re-submit Lab Dip',
      });
    }
  }

  // 2. Sample round defects
  for (const sample of samples) {
    const criticalUnresolved = sample.fitComments.filter(
      (c) => c.severity === 'critical' && !c.resolved
    );
    if (criticalUnresolved.length > 0) {
      alerts.push({
        id: `alert-sample-${sample.id}`,
        type: 'critical',
        category: 'sample',
        title: `Gate Blocker: ${sample.stageName}`,
        message: `${criticalUnresolved.length} unresolved critical fit defect(s) blocking tooling sign-off.`,
        relatedId: sample.id,
        actionText: 'Inspect Sample Comments',
      });
    }
    if (sample.status === 'in_transit' && sample.trackingNumber) {
      alerts.push({
        id: `alert-transit-${sample.id}`,
        type: 'info',
        category: 'sample',
        title: `Sample In Transit: ${sample.stageName}`,
        message: `Air courier dispatch from ${sample.factory} via ${sample.courier} (${sample.trackingNumber}).`,
        relatedId: sample.id,
        actionText: 'Track Courier',
      });
    }
  }

  // 3. Milestone delays
  for (const m of milestones) {
    if (m.isCriticalPath && (m.status === 'delayed' || m.delayDays > 0)) {
      alerts.push({
        id: `alert-milestone-${m.id}`,
        type: 'critical',
        category: 'shipment',
        title: `Critical Path Slip: ${m.title}`,
        message: `Milestone is delayed by ${m.delayDays} day(s), risking Ex-Factory Date (${project.targetXFDate}).`,
        relatedId: m.id,
        actionText: 'Adjust Production Schedule',
      });
    }
  }

  return alerts;
}

export interface StageDefinition {
  id: DevelopmentStage;
  number: number;
  label: string;
  shortLabel: string;
  description: string;
  isOptionalOrConditional: boolean;
  inlineCalendarScope: string;
}

export const INLINE_STAGES: StageDefinition[] = [
  {
    id: 'gtm_1',
    number: 1,
    label: 'GTM 1 (Go-To-Market 1)',
    shortLabel: 'GTM 1',
    description: 'Initial concept review, design lines, proto 1 look & target costing alignment.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'T-10 to T-8 Months',
  },
  {
    id: 'gtm_2',
    number: 2,
    label: 'GTM 2 (Go-To-Market 2)',
    shortLabel: 'GTM 2',
    description: 'Refined tooling & upper patterns, initial fit testing, material lab dip review & commercial validation.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'T-7 to T-6 Months',
  },
  {
    id: 'line_confirm',
    number: 3,
    label: 'Line Confirm',
    shortLabel: 'Line Confirm',
    description: 'Official seasonal range confirmation. Buyer forecast commitment & tech pack freeze signoff.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'T-5 to T-4 Months',
  },
  {
    id: 'reline_confirm',
    number: 4,
    label: 'Reline Confirm',
    shortLabel: 'Reline Confirm',
    description: 'Adjustment review for upper pattern & costing (Note: tidak semua sample Line confirm melalui Reline).',
    isOptionalOrConditional: true,
    inlineCalendarScope: 'T-4 to T-3.5 Months',
  },
  {
    id: 'salesman_sample',
    number: 5,
    label: 'Salesman Sample (SS)',
    shortLabel: 'Salesman Sample (SS)',
    description: 'Commercial sales samples built for global showroom reps & market ordering.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'T-3.5 to T-3 Months',
  },
  {
    id: 'production_confirm',
    number: 6,
    label: 'Production Confirm (Final)',
    shortLabel: 'Prod. Confirm',
    description: 'Golden sealed master confirmation pair (PPS), bulk mold lock, 100% BOM approval for factory cut.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'T-3 to T-2 Months (Pre-Cut)',
  },
];

export const SPEED_SMU_STAGES: StageDefinition[] = [
  {
    id: 'round_1',
    number: 1,
    label: '1st Round (Concept & Proto)',
    shortLabel: '1st Round',
    description: 'Fast-track initial prototype round with partner/account signoff.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'Fast-Turn Sprint',
  },
  {
    id: 'round_2',
    number: 2,
    label: '2nd Round (Fit & Revision)',
    shortLabel: '2nd Round',
    description: 'Refined upper fitting, colorway approval, and mold test review.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'Sprint Phase 2',
  },
  {
    id: 'round_3',
    number: 3,
    label: '3rd Round (Rare Revision)',
    shortLabel: '3rd Round (Rare)',
    description: 'Exceptional final adjustment round if 2nd round required major mold/pattern alteration.',
    isOptionalOrConditional: true,
    inlineCalendarScope: 'Conditional Extra',
  },
  {
    id: 'production_confirm',
    number: 4,
    label: 'Prod Confirm (Fast-Track Lock)',
    shortLabel: 'Prod Confirm',
    description: 'Final authorization to cut and assemble speed / SMU commercial run.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'Pre-Production Lock',
  },
];

export const PULLOVER_STAGES: StageDefinition[] = [
  {
    id: 'pullover_round_1',
    number: 1,
    label: '1st Round Pullover',
    shortLabel: '1st Pullover',
    description: 'Trial 1: Raw pattern fit on last, initial draping & proportion check.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'Trial Sprint',
  },
  {
    id: 'pullover_round_2',
    number: 2,
    label: '2nd Round Pullover',
    shortLabel: '2nd Pullover',
    description: 'Trial 2: Pattern refinement, toe spring & collar curve adjustments.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'Trial Phase 2',
  },
  {
    id: 'pullover_round_3',
    number: 3,
    label: '3rd Round Pullover',
    shortLabel: '3rd Pullover',
    description: 'Trial 3: Advanced material tension & lamination test.',
    isOptionalOrConditional: true,
    inlineCalendarScope: 'Conditional Trial',
  },
  {
    id: 'pullover_confirm',
    number: 4,
    label: 'Pullover Trial Signoff',
    shortLabel: 'Trial Signoff',
    description: 'Technical pattern & last approved for commercial tech pack handoff.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'Signoff',
  },
];

export const XTR_STAGES: StageDefinition[] = [
  {
    id: 'xtr_prep',
    number: 1,
    label: 'Workshop Prep (<50 prs)',
    shortLabel: 'Workshop Prep',
    description: 'Material pull & archive pattern retrieval for very small order (<50 pairs in dev workshop).',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'Dev Workshop Cell',
  },
  {
    id: 'xtr_cutting_stitching',
    number: 2,
    label: 'Workshop Cut & Stitch',
    shortLabel: 'Cut & Stitch',
    description: 'Manual cutting & hand/machine stitching in sample room mini-line.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'Dev Workshop Cell',
  },
  {
    id: 'xtr_assembly',
    number: 3,
    label: 'Workshop Assembly',
    shortLabel: 'Assembly',
    description: 'Individual pair lasting, sole cementing, and edge pressing.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'Dev Workshop Cell',
  },
  {
    id: 'xtr_ready',
    number: 4,
    label: 'Workshop Ready / Handover',
    shortLabel: 'Handover Ready',
    description: 'Final QC inspection, special boxing, and dispatch handover.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'Complete',
  },
];

// Unified default stages for general matrix
export const FOOTWEAR_STAGES: StageDefinition[] = [
  ...INLINE_STAGES,
  {
    id: 'fsc',
    number: 7,
    label: 'FSC (Final Sample Confirmation)',
    shortLabel: 'FSC',
    description: 'Factory / Final Sample Confirmation right after Prod. Confirm for pilot line readiness.',
    isOptionalOrConditional: false,
    inlineCalendarScope: 'Pilot Run',
  },
  {
    id: 'xtr',
    number: 8,
    label: 'XTR (Workshop Small-Run <50 prs)',
    shortLabel: 'XTR (<50 prs)',
    description: 'Small batch order (<50 pairs) produced directly in sample room / dev workshop outside inline calendar.',
    isOptionalOrConditional: true,
    inlineCalendarScope: 'Dev Workshop',
  },
];

export function getStagesForTrack(track: ProjectTrack | 'all'): StageDefinition[] {
  if (track === 'inline') return INLINE_STAGES;
  if (track === 'speed' || track === 'smu') return SPEED_SMU_STAGES;
  if (track === 'pullover') return PULLOVER_STAGES;
  if (track === 'xtr') return XTR_STAGES;
  return FOOTWEAR_STAGES;
}

export function groupProjectsByStage(projects: FootwearProject[]): Record<DevelopmentStage, FootwearProject[]> {
  const grouped: Record<DevelopmentStage, FootwearProject[]> = {
    gtm_1: [],
    gtm_2: [],
    line_confirm: [],
    reline_confirm: [],
    salesman_sample: [],
    production_confirm: [],
    fsc: [],
    round_1: [],
    round_2: [],
    round_3: [],
    pullover_round_1: [],
    pullover_round_2: [],
    pullover_round_3: [],
    pullover_confirm: [],
    xtr_prep: [],
    xtr_cutting_stitching: [],
    xtr_assembly: [],
    xtr_ready: [],
    xtr: [],
  };

  for (const project of projects) {
    if (grouped[project.currentStage]) {
      grouped[project.currentStage].push(project);
    } else {
      grouped.gtm_1.push(project);
    }
  }

  return grouped;
}

export function filterProjectsByTrack(
  projects: FootwearProject[],
  selectedTrack: 'all' | ProjectTrack
): FootwearProject[] {
  if (selectedTrack === 'all') return projects;
  return projects.filter((p) => p.trackType === selectedTrack);
}

export interface MaterialArrivalStats {
  arrivalCount: number;
  rejectionCount: number;
  acceptedCount: number;
  pendingInspectionCount: number;
  rejectionReasons: Array<{ batchNumber: number; date: string; reason: string }>;
  latestAWB: string;
  latestCarrier: string;
  latestStatus: 'accepted' | 'rejected' | 'quarantine_inspecting' | 'awaiting_arrival';
}

export function getMaterialArrivalStats(item: BOMItem): MaterialArrivalStats {
  const history = item.arrivalHistory || [];
  const arrivalCount = history.length;
  let rejectionCount = 0;
  let acceptedCount = 0;
  let pendingCount = 0;
  const rejectionReasons: Array<{ batchNumber: number; date: string; reason: string }> = [];

  for (const record of history) {
    if (record.status === 'rejected') {
      rejectionCount++;
      if (record.rejectionReason) {
        rejectionReasons.push({
          batchNumber: record.batchNumber,
          date: record.arrivalDate,
          reason: record.rejectionReason,
        });
      }
    } else if (record.status === 'accepted') {
      acceptedCount++;
    } else {
      pendingCount++;
    }
  }

  const latest = history[history.length - 1];

  return {
    arrivalCount,
    rejectionCount,
    acceptedCount,
    pendingInspectionCount: pendingCount,
    rejectionReasons,
    latestAWB: latest ? latest.airwayBill : (item.airwayBill || 'AWB-PENDING'),
    latestCarrier: latest ? latest.courierCarrier : (item.airwayBillCarrier || 'DHL Express'),
    latestStatus: latest ? latest.status : 'awaiting_arrival',
  };
}

export interface StageSummary {
  stageId: DevelopmentStage;
  totalStyles: number;
  onTrackCount: number;
  atRiskCount: number;
  averageMaterialReadiness: number;
  trackCounts: {
    inline: number;
    smu: number;
    speed: number;
    pullover: number;
    xtr: number;
  };
}

export function calculateStageSummary(projects: FootwearProject[], stageId: DevelopmentStage): StageSummary {
  const stageProjects = projects.filter((p) => p.currentStage === stageId);
  const totalStyles = stageProjects.length;

  if (totalStyles === 0) {
    return {
      stageId,
      totalStyles: 0,
      onTrackCount: 0,
      atRiskCount: 0,
      averageMaterialReadiness: 0,
      trackCounts: { inline: 0, smu: 0, speed: 0, pullover: 0, xtr: 0 },
    };
  }

  let atRisk = 0;
  let totalReadinessSum = 0;
  const trackCounts: Record<ProjectTrack, number> = { inline: 0, smu: 0, speed: 0, pullover: 0, xtr: 0 };

  for (const p of stageProjects) {
    trackCounts[p.trackType]++;
    const hasDelayedMat = p.bom.some((b) => b.criticalPathRisk || b.sourcingStatus === 'delayed');
    if (hasDelayedMat || p.status === 'ready_to_ship') {
      if (hasDelayedMat) atRisk++;
    }

    const approvedCount = p.bom.filter(
      (b) => b.sourcingStatus === 'bulk_delivered' || b.sourcingStatus === 'swatch_approved'
    ).length;
    const readiness = p.bom.length > 0 ? Math.round((approvedCount / p.bom.length) * 100) : 0;
    totalReadinessSum += readiness;
  }

  return {
    stageId,
    totalStyles,
    onTrackCount: totalStyles - atRisk,
    atRiskCount: atRisk,
    averageMaterialReadiness: Math.round(totalReadinessSum / totalStyles),
    trackCounts,
  };
}

export function isFSTRequiredForStage(stage: DevelopmentStage): boolean {
  return stage === 'gtm_1' || stage === 'gtm_2' || stage === 'line_confirm' || stage === 'reline_confirm';
}

export const PROCESS_SEQUENCE: FactoryProcessKey[] = [
  'material_setting',
  'cutting',
  'subcont',
  'preparation',
  'sewing',
  'assembling',
];

export const PROCESS_LABELS: Record<FactoryProcessKey | 'completed', string> = {
  material_setting: '1. Material Setting',
  cutting: '2. Cutting',
  subcont: '3. Subcont Process',
  preparation: '4. Preparation',
  sewing: '5. Sewing',
  assembling: '6. Assembling',
  completed: 'Completed (Finished Goods)',
};

export const PROCESS_SLA_HOURS: Record<FactoryProcessKey, number> = {
  material_setting: 12,
  cutting: 16,
  subcont: 24,
  preparation: 14,
  sewing: 20,
  assembling: 18,
};

export function doesProjectRequireSubcont(project: FootwearProject): boolean {
  if (typeof project.requiresSubcont === 'boolean') {
    return project.requiresSubcont;
  }
  // Determine realistically from style characteristics: styles with TPU weld, SMU collab, or complex upper go to Subcont; clean court/speed/workshop styles can go straight to Preparation
  if (
    project.id === 'proj-courtmatch' ||
    project.id === 'proj-speed-carbon' ||
    project.id === 'proj-heritage-xtr' ||
    project.trackType === 'xtr' ||
    project.trackType === 'speed'
  ) {
    return false;
  }
  return true;
}

export function getProjectSubcontSummary(project: FootwearProject): string {
  if (project.subcontProcessNote) {
    return project.subcontProcessNote;
  }
  if (doesProjectRequireSubcont(project)) {
    return 'Requires 2nd Process (Subcont TPU HF Welding / Screen Print / Embroidery)';
  }
  return 'No 2nd Process Needed — Can Hand Off Straight to 4. Preparation';
}

export function getNextProcess(
  current: FactoryProcessKey | 'completed',
  options?: { skipSubcont?: boolean }
): FactoryProcessKey | 'completed' {
  if (current === 'completed') return 'completed';
  // Branching rule: Cutting can hand off to Subcont (3) for components needing 2nd process, OR straight to Preparation (4)
  if (current === 'cutting' && options?.skipSubcont) {
    return 'preparation';
  }
  const idx = PROCESS_SEQUENCE.indexOf(current);
  if (idx === -1 || idx === PROCESS_SEQUENCE.length - 1) {
    return 'completed';
  }
  return PROCESS_SEQUENCE[idx + 1];
}

export interface CuttingHandoffOption {
  targetProcess: 'subcont' | 'preparation';
  skipSubcont: boolean;
  label: string;
  shortLabel: string;
  routingType: 'subcont_2nd_process' | 'direct_skip_subcont';
  recommended: boolean;
  description: string;
}

export function getCuttingHandoffOptions(project: FootwearProject): CuttingHandoffOption[] {
  const needsSubcont = doesProjectRequireSubcont(project);
  return [
    {
      targetProcess: 'subcont',
      skipSubcont: false,
      label: 'Move to 3. Subcont (2nd Process) →',
      shortLabel: 'To 3. Subcont (2nd Process)',
      routingType: 'subcont_2nd_process',
      recommended: needsSubcont,
      description: 'For cut components requiring HF welding, embroidery, debossing, or screen print.',
    },
    {
      targetProcess: 'preparation',
      skipSubcont: true,
      label: 'Skip Subcont → Straight to 4. Preparation →',
      shortLabel: 'Straight to 4. Preparation',
      routingType: 'direct_skip_subcont',
      recommended: !needsSubcont,
      description: 'Bypass Subcont when cut components need no 2nd process — send directly to skiving & prep.',
    },
  ];
}

export function getProjectCurrentProcess(project: FootwearProject): FactoryProcessKey | 'completed' {
  if (project.currentProcess) {
    return project.currentProcess;
  }
  // Deterministic mapping based on project ID or stage so every project starts in a realistic active process
  switch (project.id) {
    case 'proj-skyblade-gtm1':
      return 'material_setting';
    case 'proj-aerostride':
      return 'cutting';
    case 'proj-terragrip':
      return 'subcont';
    case 'proj-courtmatch':
      return 'preparation';
    case 'proj-speed-carbon':
      return 'sewing';
    case 'proj-velocity-ss':
      return 'assembling';
    default: {
      if (project.currentStage === 'gtm_1' || project.currentStage === 'xtr_prep') return 'material_setting';
      if (project.currentStage === 'gtm_2' || project.currentStage === 'round_1' || project.currentStage === 'pullover_round_1') return 'cutting';
      if (project.currentStage === 'line_confirm' || project.currentStage === 'round_2' || project.currentStage === 'pullover_round_2') return 'subcont';
      if (project.currentStage === 'reline_confirm' || project.currentStage === 'round_3' || project.currentStage === 'pullover_round_3') return 'preparation';
      if (project.currentStage === 'salesman_sample' || project.currentStage === 'xtr_cutting_stitching') return 'sewing';
      return 'assembling';
    }
  }
}

export function canPerformAdminAction(user: UserRoleSession): boolean {
  return user.role === 'admin';
}

export function canAdvanceProjectProcess(
  user: UserRoleSession,
  projectCurrentProcess: FactoryProcessKey | 'completed',
  pics?: ProcessPIC[],
  options?: { skipSubcont?: boolean }
): {
  allowed: boolean;
  nextProcess: FactoryProcessKey | 'completed';
  requiredPicName: string;
  reason: string;
} {
  if (projectCurrentProcess === 'completed') {
    return {
      allowed: false,
      nextProcess: 'completed',
      requiredPicName: 'Completed',
      reason: 'All 6 manufacturing processes are already completed for this project.',
    };
  }

  const nextProcess = getNextProcess(projectCurrentProcess, options);
  const assignedPic = pics?.find((p) => p.processKey === projectCurrentProcess);
  const requiredPicName = assignedPic
    ? `${assignedPic.picName} (${assignedPic.processName} PIC)`
    : `${PROCESS_LABELS[projectCurrentProcess]} PIC`;

  const routingSuffix =
    projectCurrentProcess === 'cutting'
      ? options?.skipSubcont
        ? ' (Direct to Preparation — Skipping Subcont)'
        : ' (via Subcont 2nd Process or Direct to Preparation)'
      : '';

  if (user.role === 'admin') {
    return {
      allowed: true,
      nextProcess,
      requiredPicName,
      reason: `Authorized as Super Admin (${user.name}) — full override to advance from ${PROCESS_LABELS[projectCurrentProcess]} to ${PROCESS_LABELS[nextProcess]}${routingSuffix}.`,
    };
  }

  if (user.role === 'process_pic' && user.processKey === projectCurrentProcess) {
    return {
      allowed: true,
      nextProcess,
      requiredPicName,
      reason: `Authorized as ${requiredPicName} — can complete ${PROCESS_LABELS[projectCurrentProcess]} and hand off to ${PROCESS_LABELS[nextProcess]}${routingSuffix}.`,
    };
  }

  return {
    allowed: false,
    nextProcess,
    requiredPicName,
    reason: `Locked: Only ${requiredPicName} or Super Admin can move this project from ${PROCESS_LABELS[projectCurrentProcess]} to ${PROCESS_LABELS[nextProcess]}.`,
  };
}

export interface ProcessStagePerformanceMetric {
  processKey: FactoryProcessKey;
  stepNumber: number;
  processName: string;
  picName: string;
  badgeId: string;
  handoffCount: number;
  avgHours: number;
  minHours: number;
  maxHours: number;
  slaTargetHours: number;
  varianceHours: number; // positive = overrun over SLA
  variancePercent: number;
  isBottleneck: boolean;
  status: 'critical_bottleneck' | 'minor_delay' | 'within_sla';
}

export interface CuttingBranchingAnalytics {
  totalCuttingHandoffs: number;
  toSubcontCount: number;
  directToPrepCount: number;
  directToPrepPercent: number;
  avgHoursSavedWhenSkippingSubcont: number;
}

export interface ProcessPerformanceReport {
  processMetrics: ProcessStagePerformanceMetric[];
  bottleneckProcesses: ProcessStagePerformanceMetric[];
  primaryBottleneck: ProcessStagePerformanceMetric | null;
  totalHandoffsAnalyzed: number;
  totalPipelineAvgHoursWithSubcont: number;
  totalPipelineAvgHoursDirectPrep: number;
  cuttingBranching: CuttingBranchingAnalytics;
}

export function calculateProcessPerformanceAnalytics(
  handoffLogs: ProcessHandoffLog[],
  pics?: ProcessPIC[]
): ProcessPerformanceReport {
  const processMetrics: ProcessStagePerformanceMetric[] = PROCESS_SEQUENCE.map((key, idx) => {
    const logsForProcess = handoffLogs.filter((l) => l.fromProcess === key);
    const slaTargetHours = PROCESS_SLA_HOURS[key];
    const assignedPic = pics?.find((p) => p.processKey === key);
    const processName = assignedPic
      ? assignedPic.processName
      : PROCESS_LABELS[key].replace(/^\d+\.\s*/, '');

    const durations = logsForProcess.map((l) =>
      typeof l.durationHours === 'number' && l.durationHours > 0 ? l.durationHours : slaTargetHours
    );

    const handoffCount = durations.length;
    const avgHours =
      handoffCount > 0
        ? Number((durations.reduce((acc, v) => acc + v, 0) / handoffCount).toFixed(1))
        : 0;
    const minHours = handoffCount > 0 ? Number(Math.min(...durations).toFixed(1)) : 0;
    const maxHours = handoffCount > 0 ? Number(Math.max(...durations).toFixed(1)) : 0;

    const varianceHours = handoffCount > 0 ? Number((avgHours - slaTargetHours).toFixed(1)) : 0;
    const variancePercent =
      handoffCount > 0 && slaTargetHours > 0
        ? Number(((varianceHours / slaTargetHours) * 100).toFixed(1))
        : 0;

    const isBottleneck = handoffCount > 0 && avgHours > slaTargetHours;
    let status: 'critical_bottleneck' | 'minor_delay' | 'within_sla' = 'within_sla';
    if (isBottleneck) {
      status = variancePercent >= 15 ? 'critical_bottleneck' : 'minor_delay';
    }

    return {
      processKey: key,
      stepNumber: idx + 1,
      processName,
      picName: assignedPic?.picName || 'Assigned PIC',
      badgeId: assignedPic?.badgeId || `PIC-0${idx + 1}`,
      handoffCount,
      avgHours,
      minHours,
      maxHours,
      slaTargetHours,
      varianceHours,
      variancePercent,
      isBottleneck,
      status,
    };
  });

  // Sort bottlenecks by highest varianceHours, then highest avgHours
  const bottleneckProcesses = [...processMetrics]
    .filter((m) => m.isBottleneck)
    .sort((a, b) => b.varianceHours - a.varianceHours || b.avgHours - a.avgHours);

  // If no process exceeded SLA, pick the slowest process with >0 handoffs as primary bottleneck watch
  const sortedByAvg = [...processMetrics]
    .filter((m) => m.handoffCount > 0)
    .sort((a, b) => b.avgHours - a.avgHours);

  const primaryBottleneck =
    bottleneckProcesses[0] || (sortedByAvg.length > 0 ? sortedByAvg[0] : null);

  const totalPipelineAvgHoursWithSubcont = Number(
    processMetrics.reduce((sum, m) => sum + m.avgHours, 0).toFixed(1)
  );

  const subcontMetric = processMetrics.find((m) => m.processKey === 'subcont');
  const subcontAvgHours = subcontMetric ? subcontMetric.avgHours : PROCESS_SLA_HOURS.subcont;

  const totalPipelineAvgHoursDirectPrep = Number(
    Math.max(0, totalPipelineAvgHoursWithSubcont - subcontAvgHours).toFixed(1)
  );

  // Cutting branching statistics (Cutting -> Subcont vs Cutting -> Preparation)
  const cuttingLogs = handoffLogs.filter((l) => l.fromProcess === 'cutting');
  const toSubcontCount = cuttingLogs.filter((l) => l.toProcess === 'subcont').length;
  const directToPrepCount = cuttingLogs.filter((l) => l.toProcess === 'preparation').length;
  const totalCuttingHandoffs = cuttingLogs.length;
  const directToPrepPercent =
    totalCuttingHandoffs > 0 ? Math.round((directToPrepCount / totalCuttingHandoffs) * 100) : 0;

  return {
    processMetrics,
    bottleneckProcesses,
    primaryBottleneck,
    totalHandoffsAnalyzed: handoffLogs.length,
    totalPipelineAvgHoursWithSubcont,
    totalPipelineAvgHoursDirectPrep,
    cuttingBranching: {
      totalCuttingHandoffs,
      toSubcontCount,
      directToPrepCount,
      directToPrepPercent,
      avgHoursSavedWhenSkippingSubcont: subcontAvgHours,
    },
  };
}



