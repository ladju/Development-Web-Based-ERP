import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  getStagesForTrack, 
  INLINE_STAGES, 
  SPEED_SMU_STAGES, 
  PULLOVER_STAGES, 
  XTR_STAGES,
  FOOTWEAR_STAGES,
  calculateBOMCost,
  isFSTRequiredForStage,
  getNextProcess,
  canAdvanceProjectProcess,
  canPerformAdminAction,
  calculateProcessPerformanceAnalytics,
} from './footwearErpLogic';
import { formatDateMMDDYYYY, formatWibDateTime } from './dateUtils';
import { BOMItem } from '../types/footwear';
import { UserRoleSession, ProcessHandoffLog } from '../types/factoryOutput';

test('getStagesForTrack correctly returns inline calendar stages', () => {
  const inlineStages = getStagesForTrack('inline');
  assert.equal(inlineStages.length, 6);
  assert.equal(inlineStages[0].id, 'gtm_1');
  assert.equal(inlineStages[1].id, 'gtm_2');
  assert.equal(inlineStages[2].id, 'line_confirm');
  assert.equal(inlineStages[3].id, 'reline_confirm');
  assert.equal(inlineStages[4].id, 'salesman_sample');
  assert.equal(inlineStages[5].id, 'production_confirm');
});

test('getStagesForTrack correctly returns SPEED and SMU rounds', () => {
  const speedStages = getStagesForTrack('speed');
  assert.equal(speedStages.length, 4);
  assert.equal(speedStages[0].id, 'round_1');
  assert.equal(speedStages[1].id, 'round_2');
  assert.equal(speedStages[2].id, 'round_3');
  assert.equal(speedStages[3].id, 'production_confirm');

  const smuStages = getStagesForTrack('smu');
  assert.deepEqual(smuStages, speedStages);
});

test('getStagesForTrack correctly returns Pullover trial rounds', () => {
  const pulloverStages = getStagesForTrack('pullover');
  assert.equal(pulloverStages.length, 4);
  assert.equal(pulloverStages[0].id, 'pullover_round_1');
  assert.equal(pulloverStages[1].id, 'pullover_round_2');
  assert.equal(pulloverStages[2].id, 'pullover_round_3');
  assert.equal(pulloverStages[3].id, 'pullover_confirm');
});

test('getStagesForTrack correctly returns XTR workshop stages', () => {
  const xtrStages = getStagesForTrack('xtr');
  assert.equal(xtrStages.length, 4);
  assert.equal(xtrStages[0].id, 'xtr_prep');
  assert.equal(xtrStages[1].id, 'xtr_cutting_stitching');
  assert.equal(xtrStages[2].id, 'xtr_assembly');
  assert.equal(xtrStages[3].id, 'xtr_ready');
});

test('calculateBOMCost calculates projected FOB with overhead accurately', () => {
  const mockBOM = [
    {
      id: 'item-1',
      componentName: 'Upper Mesh',
      materialCode: 'MSH-01',
      materialName: 'Engineered Jacquard Mesh',
      category: 'upper',
      yieldPerPair: 0.35,
      unit: 'm²',
      unitCostUSD: 10,
      leadTimeWeeks: 4,
      sourcingStatus: 'bulk_ordered',
      supplierName: 'Best Textile',
      supplierCountry: 'Taiwan',
    },
    {
      id: 'item-2',
      componentName: 'Rubber Outsole',
      materialCode: 'RBR-01',
      materialName: 'High Abrasion Rubber',
      category: 'sole',
      yieldPerPair: 1,
      unit: 'pair',
      unitCostUSD: 5,
      leadTimeWeeks: 3,
      sourcingStatus: 'bulk_delivered',
      supplierName: 'Sole Tech',
      supplierCountry: 'Indonesia',
    }
  ] as unknown as BOMItem[];

  // material = (0.35 * 10) + (1 * 5) = 3.50 + 5.00 = 8.50
  // overhead = 8.50 * 0.38 = 3.23
  // projected = 8.50 + 3.23 = 11.73
  const cost = calculateBOMCost(mockBOM, 12.00);
  assert.equal(cost.totalMaterialCost, 8.50);
  assert.equal(cost.projectedFOB, 11.73);
  assert.equal(cost.varianceFromTarget, -0.27);
});

test('isFSTRequiredForStage enforces mandatory FST testing on GTM and Line/Reline confirm stages only', () => {
  assert.equal(isFSTRequiredForStage('gtm_1'), true);
  assert.equal(isFSTRequiredForStage('gtm_2'), true);
  assert.equal(isFSTRequiredForStage('line_confirm'), true);
  assert.equal(isFSTRequiredForStage('reline_confirm'), true);

  // Other stages should NOT mandate FST lab testing
  assert.equal(isFSTRequiredForStage('salesman_sample'), false);
  assert.equal(isFSTRequiredForStage('production_confirm'), false);
  assert.equal(isFSTRequiredForStage('fsc'), false);
  assert.equal(isFSTRequiredForStage('round_1'), false);
  assert.equal(isFSTRequiredForStage('pullover_round_1'), false);
  assert.equal(isFSTRequiredForStage('xtr'), false);
});

test('formatDateMMDDYYYY strictly formats dates into MM/DD/YYYY', () => {
  assert.equal(formatDateMMDDYYYY('2026-10-24'), '10/24/2026');
  assert.equal(formatDateMMDDYYYY('2027-01-05'), '01/05/2027');
  assert.equal(formatDateMMDDYYYY('2026-12-31'), '12/31/2026');
  assert.equal(formatDateMMDDYYYY(new Date(2026, 7, 19)), '08/19/2026');
  assert.equal(formatDateMMDDYYYY(undefined), '—');
});

test('formatWibDateTime provides date in MM/DD/YYYY and time with WIB suffix', () => {
  const result = formatWibDateTime(new Date('2026-06-15T08:30:00Z'));
  assert.match(result.dateStr, /^\d{2}\/\d{2}\/\d{4}$/);
  assert.ok(result.timeStr.includes('WIB'));
  assert.ok(result.fullStr.includes('WIB'));
});

test('getNextProcess advances sequentially and supports Cutting branching to Subcont or straight to Preparation', () => {
  assert.equal(getNextProcess('material_setting'), 'cutting');
  // Standard Cutting -> Subcont (when 2nd process is needed)
  assert.equal(getNextProcess('cutting'), 'subcont');
  assert.equal(getNextProcess('cutting', { skipSubcont: false }), 'subcont');
  // Direct Cutting -> Preparation (when no 2nd process / subcont is needed)
  assert.equal(getNextProcess('cutting', { skipSubcont: true }), 'preparation');
  assert.equal(getNextProcess('subcont'), 'preparation');
  assert.equal(getNextProcess('preparation'), 'sewing');
  assert.equal(getNextProcess('sewing'), 'assembling');
  assert.equal(getNextProcess('assembling'), 'completed');
  assert.equal(getNextProcess('completed'), 'completed');
});

test('canAdvanceProjectProcess allows Cutting PIC to hand off either to Subcont or straight to Preparation', () => {
  const cuttingPic: UserRoleSession = {
    id: 'role-cutting',
    role: 'process_pic',
    processKey: 'cutting',
    name: 'Joko Susilo',
    badgeId: 'PIC-CT-02',
    title: 'Cutting PIC',
  };

  const toSubcont = canAdvanceProjectProcess(cuttingPic, 'cutting', undefined, { skipSubcont: false });
  assert.equal(toSubcont.allowed, true);
  assert.equal(toSubcont.nextProcess, 'subcont');

  const straightToPrep = canAdvanceProjectProcess(cuttingPic, 'cutting', undefined, { skipSubcont: true });
  assert.equal(straightToPrep.allowed, true);
  assert.equal(straightToPrep.nextProcess, 'preparation');
});

test('calculateProcessPerformanceAnalytics computes average hours per process, identifies bottlenecks, and tracks Cutting branching', () => {
  const sampleLogs: ProcessHandoffLog[] = [
    {
      id: 'h-1',
      projectId: 'p1',
      projectName: 'Style A',
      productCode: 'C1',
      fromProcess: 'cutting',
      toProcess: 'subcont',
      timestampWib: '11/01/2026 10:00:00 WIB',
      durationHours: 14,
      slaTargetHours: 16,
      authorizedByName: 'Joko Susilo',
      authorizedByBadge: 'PIC-CT-02',
      authorizedRole: 'process_pic',
    },
    {
      id: 'h-2',
      projectId: 'p2',
      projectName: 'Style B',
      productCode: 'C2',
      fromProcess: 'cutting',
      toProcess: 'preparation',
      timestampWib: '11/01/2026 12:00:00 WIB',
      durationHours: 16,
      slaTargetHours: 16,
      authorizedByName: 'Joko Susilo',
      authorizedByBadge: 'PIC-CT-02',
      authorizedRole: 'process_pic',
    },
    {
      id: 'h-3',
      projectId: 'p1',
      projectName: 'Style A',
      productCode: 'C1',
      fromProcess: 'subcont',
      toProcess: 'preparation',
      timestampWib: '11/02/2026 10:00:00 WIB',
      durationHours: 32,
      slaTargetHours: 24,
      authorizedByName: 'Agus Setiawan',
      authorizedByBadge: 'PIC-SB-03',
      authorizedRole: 'process_pic',
    },
  ];

  const report = calculateProcessPerformanceAnalytics(sampleLogs);
  const cuttingStat = report.processMetrics.find((m) => m.processKey === 'cutting')!;
  const subcontStat = report.processMetrics.find((m) => m.processKey === 'subcont')!;

  assert.equal(cuttingStat.avgHours, 15);
  assert.equal(cuttingStat.isBottleneck, false);

  assert.equal(subcontStat.avgHours, 32);
  assert.equal(subcontStat.isBottleneck, true);
  assert.equal(report.primaryBottleneck?.processKey, 'subcont');

  // Cutting branching: 1 to subcont, 1 direct to preparation (50%)
  assert.equal(report.cuttingBranching.totalCuttingHandoffs, 2);
  assert.equal(report.cuttingBranching.toSubcontCount, 1);
  assert.equal(report.cuttingBranching.directToPrepCount, 1);
  assert.equal(report.cuttingBranching.directToPrepPercent, 50);
});

test('canPerformAdminAction restricts Line Sheet import, BOM changes, and PIC edits to Super Admin only', () => {
  const adminUser: UserRoleSession = {
    id: 'role-admin',
    role: 'admin',
    name: 'Rizky Pratama',
    badgeId: 'ADM-001',
    title: 'Super Admin',
  };
  const cuttingPic: UserRoleSession = {
    id: 'role-cutting',
    role: 'process_pic',
    processKey: 'cutting',
    name: 'Joko Susilo',
    badgeId: 'PIC-CT-02',
    title: 'Cutting PIC',
  };

  assert.equal(canPerformAdminAction(adminUser), true);
  assert.equal(canPerformAdminAction(cuttingPic), false);
});


