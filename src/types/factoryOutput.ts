export type FactoryProcessKey = 
  | 'material_setting'
  | 'cutting'
  | 'subcont'
  | 'preparation'
  | 'sewing'
  | 'assembling';

export interface ProcessOutputMetric {
  key: FactoryProcessKey;
  name: string;
  department: string;
  supervisor: string;
  shiftHours: string;
  headcount: number;
  targetCapacity: number; // Max capacity per day/shift in pairs
  dailyPlan: number; // Planned daily output target
  liveOutput: number; // Live real-time output count so far
  hourlyRunRate: number; // Current run rate pairs/hr
  defectCount: number;
  scrapRatePercent: number;
  status: 'optimal' | 'on_track' | 'bottleneck_slip' | 'idle_awaiting_wip';
  activeStyleIds: string[]; // styles currently in this station
  wipBufferPairs: number; // inventory waiting in front of this station
}

export type ExportDateRange = 'daily' | 'weekly' | 'monthly' | 'season';

export interface ProcessProductionRecord {
  id: string;
  date: string;
  shift: string;
  processKey: FactoryProcessKey;
  processName: string;
  styleName: string;
  productCode: string;
  season: string;
  targetCapacity: number;
  dailyPlan: number;
  actualOutput: number;
  efficiencyPercent: number;
  rejectCount: number;
  supervisor: string;
  notes?: string;
}

export interface ProcessPIC {
  processKey: FactoryProcessKey;
  stepNumber: number;
  processName: string;
  picName: string;
  badgeId: string;
  department: string;
  shiftHours: string;
  phoneExt: string;
}

export interface UserRoleSession {
  id: string;
  role: 'admin' | 'process_pic';
  name: string;
  badgeId: string;
  processKey?: FactoryProcessKey;
  title: string;
}

export interface ProcessHandoffLog {
  id: string;
  projectId: string;
  projectName: string;
  productCode: string;
  fromProcess: FactoryProcessKey;
  toProcess: FactoryProcessKey | 'completed';
  timestampWib: string;
  durationHours: number; // Cycle time spent in fromProcess before hand-off
  slaTargetHours?: number; // Standard target hours for fromProcess
  routingType?: 'standard' | 'subcont_2nd_process' | 'direct_skip_subcont';
  componentScope?: string; // e.g. "Upper Quarters (HF Welding)" or "All Cut Components (No 2nd Process)"
  authorizedByName: string;
  authorizedByBadge: string;
  authorizedRole: 'admin' | 'process_pic';
  notes?: string;
}


