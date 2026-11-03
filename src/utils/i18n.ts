export type Language = 'en' | 'id';
export type ThemeMode = 'dark' | 'light';

export interface Translations {
  // Brand & Header
  brandName: string;
  projectTrack: string;
  subBrand: string;
  styleLabel: string;
  searchPlaceholder: string;
  todayLabel: string;
  overtimeSchedule: string;
  manageOT: string;
  staffOTCount: string;
  importLineSheet: string;
  exportOutput: string;
  exportBOM: string;
  addMaterial: string;
  delaySimulator: string;
  targetXF: string;
  daysPastXF: string;
  daysUntilXF: string;
  dayMode: string;
  nightMode: string;

  // Tabs
  tabProcessControl: string;
  tabStagesBoard: string;
  tabStyleOverview: string;
  tabMaterialSourcing: string;
  tabSampleRoom: string;
  tabShipmentTimeline: string;
  tabCosting: string;

  // Factory Process Output
  plantOutputTitle: string;
  liveFactoryTelemetry: string;
  plantOutputSubtitle: string;
  maxPlantCapacity: string;
  plannedDailyTarget: string;
  liveOutputProduced: string;
  plantEfficiency: string;
  bottlenecksLabel: string;
  bottleneckSlip: string;
  clearPipeline: string;
  capacityBarsView: string;
  flowPipelineView: string;
  d3WipBufferView: string;
  bulkUpdateLiveOutput: string;
  exportProductionData: string;
  prsDay: string;
  prs: string;
  achievement: string;
  hourlyRate: string;
  wipInQueue: string;
  optimalRun: string;
  onTrack: string;
  standby: string;

  // 6 Manufacturing Processes
  procMaterialSetting: string;
  procCutting: string;
  procSubcont: string;
  procPreparation: string;
  procSewing: string;
  procAssembling: string;

  // Stage Control & Track Lifecycles
  controlCenterTitle: string;
  controlCenterSubtitle: string;
  allStages: string;
  matchingStyles: string;
  filterByTrack: string;
  trackAll: string;
  trackInline: string;
  trackSmu: string;
  trackSpeed: string;
  trackPullover: string;
  trackXtr: string;
  allSeasons: string;
  allTeams: string;
  allProjects: string;
  materialReadiness: string;
  fullStyleERP: string;
  relineRequired: string;
  yes: string;
  no: string;

  // Bulk Action Modal
  bulkModalTitle: string;
  bulkModalSubtitle: string;
  selectedProcesses: string;
  updateMode: string;
  modeIncrement: string;
  modeSetExact: string;
  enterAmount: string;
  applyToAllSelected: string;
  cancel: string;
  confirmUpdate: string;
  currentLiveOutput: string;
  newLiveOutput: string;

  // Export Modal
  exportModalTitle: string;
  exportModalSubtitle: string;
  timeRange: string;
  rangeDaily: string;
  rangeWeekly: string;
  rangeMonthly: string;
  rangeSeason: string;
  processScope: string;
  allProcessesScope: string;
  downloadExcel: string;
  exportCSV: string;
  recordsCount: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    brandName: 'PWI2 DEV ERP',
    projectTrack: 'PROJECT TRACK',
    subBrand: 'Footwear Development & Material Tracking',
    styleLabel: 'Active Style:',
    searchPlaceholder: 'Quick search style, season (e.g. S1-27), or code...',
    todayLabel: 'Today:',
    overtimeSchedule: 'Overtime Schedule:',
    manageOT: 'Manage OT →',
    staffOTCount: 'Dev Staff OT',
    importLineSheet: 'Import Line Sheet',
    exportOutput: 'Export Output',
    exportBOM: 'Export BOM',
    addMaterial: 'Add Material',
    delaySimulator: 'Delay Simulator',
    targetXF: 'Target XF:',
    daysPastXF: 'd Past XF',
    daysUntilXF: 'Days',
    dayMode: 'Day Mode',
    nightMode: 'Night Mode',

    tabProcessControl: 'Process Control & Output Monitor',
    tabStagesBoard: 'Stages Board (By Track)',
    tabStyleOverview: 'Selected Style PSR',
    tabMaterialSourcing: 'Material Sourcing & BOM',
    tabSampleRoom: 'Factory Sample Room & Gates',
    tabShipmentTimeline: 'Shipment & Critical Path',
    tabCosting: 'FOB Costing & Landed',

    plantOutputTitle: 'Plant 4 Process Output & Capacity Live Monitor',
    liveFactoryTelemetry: 'Live Factory Telemetry',
    plantOutputSubtitle: 'Real-time tracking of Output Capacity, Daily Plan Target, and Live Production Output across all 6 manufacturing processes.',
    maxPlantCapacity: 'Max Plant Capacity',
    plannedDailyTarget: 'Planned Daily Target',
    liveOutputProduced: 'Live Output Produced',
    plantEfficiency: 'Plant Efficiency',
    bottlenecksLabel: 'Bottlenecks',
    bottleneckSlip: 'Bottleneck Slip',
    clearPipeline: 'Clear Pipeline',
    capacityBarsView: 'Capacity Bars',
    flowPipelineView: 'Flow Pipeline',
    d3WipBufferView: 'D3 WIP Buffer (Bottlenecks)',
    bulkUpdateLiveOutput: 'Bulk Update Live Output',
    exportProductionData: 'Export Production Data',
    prsDay: 'prs/day',
    prs: 'prs',
    achievement: 'Achievement',
    hourlyRate: 'Hourly Rate',
    wipInQueue: 'WIP In-Queue',
    optimalRun: 'Optimal Run',
    onTrack: 'On Track',
    standby: 'Standby',

    procMaterialSetting: 'Material Setting',
    procCutting: 'Cutting',
    procSubcont: 'Subcont Process',
    procPreparation: 'Preparation',
    procSewing: 'Sewing',
    procAssembling: 'Assembling',

    controlCenterTitle: 'Process Tracking & Stage Control Center',
    controlCenterSubtitle: 'Monitor styles across track lifecycles (Inline GTM stages, SPEED/SMU rounds, Pullover trials, XTR workshop <50 prs).',
    allStages: 'All Stages',
    matchingStyles: 'Matching Styles',
    filterByTrack: 'Track Filter:',
    trackAll: 'All Tracks',
    trackInline: 'Inline Calendar (GTM 1 → Prod)',
    trackSmu: 'SMU Collab (Rounds 1-3)',
    trackSpeed: 'Speed Track (Rounds 1-3)',
    trackPullover: 'Pullover (Trial Rounds)',
    trackXtr: 'XTR Workshop (<50 prs)',
    allSeasons: 'All Seasons',
    allTeams: 'All Teams',
    allProjects: 'All Projects',
    materialReadiness: 'Material Readiness',
    fullStyleERP: 'Full Style ERP',
    relineRequired: 'Reline Required?',
    yes: 'Yes',
    no: 'No',

    bulkModalTitle: 'Bulk Update Live Output',
    bulkModalSubtitle: 'Simultaneously update the Live Output count for multiple manufacturing processes.',
    selectedProcesses: 'Selected Processes',
    updateMode: 'Update Mode:',
    modeIncrement: 'Add to current output (+ pairs)',
    modeSetExact: 'Set new exact live output count',
    enterAmount: 'Enter Pairs Amount:',
    applyToAllSelected: 'Apply to all selected processes',
    cancel: 'Cancel',
    confirmUpdate: 'Save & Update Output',
    currentLiveOutput: 'Current Live Output:',
    newLiveOutput: 'New Live Output:',

    exportModalTitle: 'Export Factory Production & Output Data',
    exportModalSubtitle: 'Export capacity, daily planned targets, actual output, and scrap metrics by time range and process.',
    timeRange: 'Time Range:',
    rangeDaily: 'Daily (Today)',
    rangeWeekly: 'Weekly (7 Days)',
    rangeMonthly: 'Monthly',
    rangeSeason: 'Season Full',
    processScope: 'Process Scope:',
    allProcessesScope: '★ All Processes (Consolidated 6 Steps)',
    downloadExcel: 'Download Excel (.xlsx)',
    exportCSV: 'Export CSV',
    recordsCount: 'records',
  },
  id: {
    brandName: 'PWI2 DEV ERP',
    projectTrack: 'PELACAK PROYEK',
    subBrand: 'Pengembangan Sepatu & Pelacakan Material',
    styleLabel: 'Model Aktif:',
    searchPlaceholder: 'Cari nama model, season (cth: S1-27), atau kode produk...',
    todayLabel: 'Hari Ini:',
    overtimeSchedule: 'Jadwal Lembur:',
    manageOT: 'Kelola Lembur →',
    staffOTCount: 'Staf Lembur Dev',
    importLineSheet: 'Impor Line Sheet',
    exportOutput: 'Ekspor Output',
    exportBOM: 'Ekspor BOM',
    addMaterial: 'Tambah Material',
    delaySimulator: 'Simulasi Keterlambatan',
    targetXF: 'Target XF:',
    daysPastXF: 'h Lewat XF',
    daysUntilXF: 'Hari',
    dayMode: 'Mode Siang',
    nightMode: 'Mode Malam',

    tabProcessControl: 'Kontrol Proses & Monitor Output',
    tabStagesBoard: 'Papan Tahapan (Per Jalur)',
    tabStyleOverview: 'Ringkasan Model Terpilih (PSR)',
    tabMaterialSourcing: 'Pengadaan Material & BOM',
    tabSampleRoom: 'Ruang Sampel Pabrik & Gerbang Uji',
    tabShipmentTimeline: 'Jadwal Pengiriman & Critical Path',
    tabCosting: 'Kalkulasi Biaya FOB & Landed',

    plantOutputTitle: 'Monitor Langsung Output & Kapasitas Proses Plant 4',
    liveFactoryTelemetry: 'Telemetri Langsung Pabrik',
    plantOutputSubtitle: 'Pemantauan real-time Kapasitas Output, Target Rencana Harian, dan Output Produksi Langsung di 6 proses manufaktur.',
    maxPlantCapacity: 'Kapasitas Maks Pabrik',
    plannedDailyTarget: 'Target Rencana Harian',
    liveOutputProduced: 'Output Langsung Tercapai',
    plantEfficiency: 'Efisiensi Pabrik',
    bottlenecksLabel: 'Kemacetan (Bottleneck)',
    bottleneckSlip: 'Slip Bottleneck',
    clearPipeline: 'Jalur Lancar Optimal',
    capacityBarsView: 'Diagram Kapasitas',
    flowPipelineView: 'Aliran Proses (Pipeline)',
    d3WipBufferView: 'Buffer WIP D3 (Kemacetan)',
    bulkUpdateLiveOutput: 'Perbarui Massal Output Langsung',
    exportProductionData: 'Ekspor Data Produksi',
    prsDay: 'pasang/hari',
    prs: 'pasang',
    achievement: 'Pencapaian',
    hourlyRate: 'Laju per Jam',
    wipInQueue: 'Antrean WIP',
    optimalRun: 'Berjalan Optimal',
    onTrack: 'Sesuai Target',
    standby: 'Menunggu',

    procMaterialSetting: 'Penetapan Material',
    procCutting: 'Pemotongan (Cutting)',
    procSubcont: 'Proses Subkontrak',
    procPreparation: 'Persiapan (Preparation)',
    procSewing: 'Penjahitan (Sewing)',
    procAssembling: 'Perakitan (Assembling)',

    controlCenterTitle: 'Pusat Kontrol Tahapan & Pelacakan Proses',
    controlCenterSubtitle: 'Pantau model berdasarkan siklus jalur (Tahapan Inline GTM, Putaran SPEED/SMU, Uji coba Pullover, XTR workshop <50 pasang).',
    allStages: 'Semua Tahapan',
    matchingStyles: 'Model Cocok',
    filterByTrack: 'Filter Jalur:',
    trackAll: 'Semua Jalur',
    trackInline: 'Kalender Inline (GTM 1 → Prod Confirm)',
    trackSmu: 'SMU Kolaborasi (Putaran 1-3)',
    trackSpeed: 'Jalur Cepat / Speed (Putaran 1-3)',
    trackPullover: 'Pullover (Putaran Uji Coba)',
    trackXtr: 'Workshop XTR (<50 pasang)',
    allSeasons: 'Semua Season',
    allTeams: 'Semua Tim Dev',
    allProjects: 'Semua Inisiatif Proyek',
    materialReadiness: 'Kesiapan Material',
    fullStyleERP: 'ERP Detail Model',
    relineRequired: 'Perlu Reline?',
    yes: 'Ya',
    no: 'Tidak',

    bulkModalTitle: 'Perbarui Massal Output Langsung',
    bulkModalSubtitle: 'Perbarui jumlah Output Langsung secara serentak untuk beberapa proses pabrik yang dipilih.',
    selectedProcesses: 'Proses yang Dipilih',
    updateMode: 'Metode Pembaruan:',
    modeIncrement: 'Tambahkan ke output berjalan saat ini (+ pasang)',
    modeSetExact: 'Tetapkan nilai output langsung baru secara pasti',
    enterAmount: 'Masukkan Jumlah Pasang:',
    applyToAllSelected: 'Terapkan ke seluruh proses terpilih',
    cancel: 'Batal',
    confirmUpdate: 'Simpan & Perbarui Output',
    currentLiveOutput: 'Output Langsung Saat Ini:',
    newLiveOutput: 'Output Langsung Baru:',

    exportModalTitle: 'Ekspor Data Produksi & Output Pabrik',
    exportModalSubtitle: 'Ekspor kapasitas, target rencana harian, output aktual, dan data cacat/scrap berdasarkan rentang waktu dan proses.',
    timeRange: 'Rentang Waktu:',
    rangeDaily: 'Harian (Hari Ini)',
    rangeWeekly: 'Mingguan (7 Hari)',
    rangeMonthly: 'Bulanan',
    rangeSeason: 'Musim Penuh (Season)',
    processScope: 'Cakupan Proses:',
    allProcessesScope: '★ Semua 6 Proses Manufaktur',
    downloadExcel: 'Unduh Excel (.xlsx)',
    exportCSV: 'Ekspor CSV',
    recordsCount: 'catatan',
  },
};
