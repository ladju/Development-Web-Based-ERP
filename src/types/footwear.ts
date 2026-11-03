export type MaterialCategory = 'upper' | 'sole' | 'lining' | 'hardware' | 'packaging';

export type LabDipStatus = 
  | 'pending' 
  | 'submitted' 
  | 'rejected' 
  | 'approved' 
  | 'approved_with_condition';

export type ComplianceTestStatus = 
  | 'pending' 
  | 'in_testing' 
  | 'passed' 
  | 'failed' 
  | 'waived';

export type FstTestStatus = 
  | 'passed' 
  | 'pending' 
  | 'in_progress' 
  | 'failed' 
  | 'not_required';

export interface FstTestRecord {
  status: FstTestStatus;
  testDate?: string;
  bondStrengthKgPerCm?: number; // Factory target >= 3.0 kg/cm
  flexCyclesPassed?: number; // Target >= 100,000 cycles
  abrasionIndexMm3?: number; // Target < 120 mm3
  seamBurstKg?: number; // Target >= 18 kg
  fitterFeedback?: string;
  inspectorName?: string;
  certNumber?: string;
}

export type SourcingStatus = 
  | 'unassigned' 
  | 'inquiry' 
  | 'lab_dip_phase' 
  | 'swatch_approved' 
  | 'in_transit' 
  | 'bulk_ordered' 
  | 'bulk_delivered' 
  | 'delayed' 
  | 'rejected_on_arrival';

export interface MaterialArrivalRecord {
  id: string;
  batchNumber: number; // 1 = 1st arrival, 2 = 2nd arrival
  arrivalDate: string; // ISO format e.g. "2026-10-18"
  airwayBill: string; // Airwaybill e.g. "AWB-DHL-8941092"
  courierCarrier: string; // "DHL Express Air", "FedEx Priority", "Vietnam Air Cargo"
  quantityReceived: number;
  unit: string;
  status: 'accepted' | 'rejected' | 'quarantine_inspecting';
  rejectionReason?: string; // Reason if rejected: e.g. "Grammage 210gsm below 240gsm spec", "Color delta-E 1.8 too yellow under D65"
  inspectorName: string;
  warehouseLotNumber: string;
}

export interface BOMItem {
  id: string;
  componentName: string; // e.g. "Vamp & Quarter Mesh", "Midsole Foam"
  category: MaterialCategory;
  materialName: string; // e.g. "Matryx Jacquard Carbon Weave"
  materialCode: string; // e.g. "MAT-992-BLK"
  supplierName: string;
  supplierCountry: string;
  leadTimeWeeks: number;
  moq: number; // Minimum Order Quantity in units
  unit: 'm²' | 'pair' | 'pcs' | 'kg' | 'm';
  yieldPerPair: number;
  unitCostUSD: number;
  totalCostUSD: number; // (yieldPerPair * unitCostUSD)
  
  // Color Confirmation (Status Color Confirm)
  colorConfirmStatus: LabDipStatus;
  colorConfirmDeltaE?: number;
  colorConfirmRound: number;
  colorStandardName?: string; // e.g. "Pantone 19-4028 TCX Cyber Teal"

  // Legacy alias for compatibility
  labDipStatus: LabDipStatus;
  labDipRound: number;

  testStatus: ComplianceTestStatus;
  sourcingStatus: SourcingStatus;
  
  // Airwaybill & Logistics Tracking
  airwayBill?: string; // Airwaybill e.g. "AWB-DHL-778912401"
  airwayBillCarrier?: string; // "DHL Express", "FedEx", "Air Cargo"
  etaFactoryDate: string; // ISO date e.g. "2027-01-15"
  
  // Material Arrival Delivery History
  arrivalHistory: MaterialArrivalRecord[];

  criticalPathRisk: boolean;
  notes?: string;
}

export type SampleStage = 
  | 'proto_1' 
  | 'proto_2' 
  | 'fit_wear_test' 
  | 'sms' 
  | 'pps';

export type SampleStatus = 
  | 'in_tooling' 
  | 'cutting_stitching' 
  | 'in_transit' 
  | 'received_reviewing' 
  | 'approved' 
  | 'rejected_resample' 
  | 'approved_with_revisions';

export interface FitComment {
  id: string;
  timestamp: string;
  author: string;
  role: string;
  area: 'vamp' | 'collar' | 'heel' | 'midsole' | 'outsole' | 'tongue' | 'lacing';
  comment: string;
  severity: 'critical' | 'moderate' | 'minor';
  resolved: boolean;
}

export interface SampleRound {
  id: string;
  stage: SampleStage;
  stageName: string; // "Proto 1 (Pattern Verification)", "Salesman Sample (SS)"
  version: string; // "v1.2"
  factory: string;
  courier: string;
  trackingNumber: string;
  dispatchedDate: string;
  receivedDate: string;
  targetReviewDate: string;
  reviewer: string;
  shoeSize: string; // e.g. "US 9M / 270mm"
  weightGrams: number;
  fitScore: number; // 1-10
  status: SampleStatus;
  decision: 'approved' | 'rejected' | 'pending';
  fitComments: FitComment[];
  imageUrl: string;
  testFlexCycles?: number; // e.g. 100,000 cycles
}

export interface Milestone {
  id: string;
  phase: 'concept' | 'tooling' | 'sourcing' | 'sampling' | 'commercialization' | 'production' | 'logistics';
  title: string;
  description: string;
  plannedDate: string; // ISO date
  revisedDate?: string;
  actualDate?: string;
  status: 'completed' | 'on_track' | 'at_risk' | 'delayed';
  isCriticalPath: boolean;
  delayDays: number;
  owner: string;
  deliverable: string;
}

// Track-Specific Stages:
// Inline: GTM 1 -> GTM 2 -> Line Confirm -> Reline Confirm -> Salesman Sample (SS) -> Production Confirm
// SPEED / SMU / Collabs: 1st Round -> 2nd Round -> 3rd Round (rare) -> Production Confirm
// Pullover: 1st Round -> 2nd Round -> 3rd Round -> Trial Signoff
// XTR (<50 prs workshop order): Workshop Prep -> Workshop Cutting & Stitching -> Workshop Assembly -> Workshop Ready
export type DevelopmentStage = 
  // Inline Calendar Stages
  | 'gtm_1' 
  | 'gtm_2' 
  | 'line_confirm' 
  | 'reline_confirm' 
  | 'salesman_sample' 
  | 'production_confirm'
  | 'fsc'
  // SPEED / SMU / Collab Rounds
  | 'round_1'
  | 'round_2'
  | 'round_3'
  // Pullover Rounds
  | 'pullover_round_1'
  | 'pullover_round_2'
  | 'pullover_round_3'
  | 'pullover_confirm'
  // XTR Workshop Stages (<50 prs)
  | 'xtr_prep'
  | 'xtr_cutting_stitching'
  | 'xtr_assembly'
  | 'xtr_ready'
  | 'xtr';

export type ProjectTrack = 
  | 'inline' 
  | 'smu' 
  | 'speed' 
  | 'pullover'
  | 'xtr';

export interface OvertimeRecord {
  id: string;
  date: string;
  department: string;
  cellOrLine: string;
  shiftHours: string;
  headcount: number;
  targetTask: string;
  supervisor: string;
  status: 'active' | 'scheduled' | 'completed';
}

export interface FootwearProject {
  id: string;
  sku: string;
  name: string; // Style Name
  productNumber: string; // Product Number (e.g., PWI-9402)
  productCode: string; // Product Code (e.g., PC-2026-AR01)
  developer: string; // Product Developer / Dev Engineer
  team: string; // Dev Team (e.g., Running Dev Team, Trail Outdoor Team)
  project: string; // Project Name (e.g., AeroStride Speed, TerraGrip)
  silhouette: string; // e.g. "Low-top Performance Marathoner"
  category: 'Road Running' | 'Ultra Trail' | 'Sportstyle Court' | 'Fast Hiking' | 'Lifestyle Collab' | 'R&D Concept' | string;
  season: 'S1-26' | 'S2-26' | 'S1-27' | 'S2-27' | 'Off-Calendar Fast Track' | 'Advance R&D' | string;
  trackType: ProjectTrack; // inline, smu, speed, pullover
  currentStage: DevelopmentStage; // gtm_1, gtm_2, line_confirm, reline_confirm, salesman_sample, production_confirm, fsc
  isRelineRequired?: boolean; // false for styles that skip Reline
  isSalesmanSampleRequired?: boolean; // true for commercial sales lines
  fstTest?: FstTestRecord; // Mandatory FST testing for GTM 1, GTM 2, Line Confirm, Reline Confirm
  pulloverTrialType?: 'new_pattern' | 'new_model_last' | 'new_material' | 'all';
  collabPartner?: string; // for SMU / Speed
  speedTargetDays?: number; // e.g. 60 or 90 days for Speed track
  gender: "Men's" | "Women's" | 'Unisex';
  lastCode: string; // e.g. "FAST-R-LAST-04"
  outsoleMoldId: string; // "MOLD-OS-4402"
  midsoleMoldId: string; // "MOLD-MS-4402"
  tier1Factory: string; // "PWI2 Plant 4 (Serang, Banten)"
  sampleRoomLead: string;
  targetFOBUSD: number;
  currentFOBUSD: number;
  targetRRPUSD: number;
  orderVolumePairs: number;
  status: 'development' | 'sampling' | 'commercialization' | 'production' | 'ready_to_ship';
  // Critical Dates
  techPackFreezeDate: string;
  bulkMaterialCutWeek: string;
  targetXFDate: string; // Ex-Factory Date
  targetETD: string; // Port departure
  targetETA: string; // Distribution Center Port arrival
  colorwayName: string;
  colorwayCode: string;
  heroImage: string;
  currentProcess?: 'material_setting' | 'cutting' | 'subcont' | 'preparation' | 'sewing' | 'assembling' | 'completed';
  requiresSubcont?: boolean; // Whether components require 2nd process (Subcont) after Cutting or go straight to Preparation
  subcontProcessNote?: string; // e.g., "TPU HF Weld + Heel Embroidery" or "No 2nd Process — Direct to Preparation"
  bom: BOMItem[];
  samples: SampleRound[];
  milestones: Milestone[];
}

export interface ErpAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  category: 'material' | 'sample' | 'shipment' | 'cost';
  relatedId?: string;
  actionText?: string;
}
