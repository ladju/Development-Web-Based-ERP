import * as XLSX from 'xlsx';
import { 
  FootwearProject, 
  BOMItem, 
  DevelopmentStage, 
  ProjectTrack, 
  MaterialCategory, 
  LabDipStatus, 
  SourcingStatus,
  MaterialArrivalRecord 
} from '../types/footwear';

// Normalizer helper
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parseStylesFromWorkbook(data: ArrayBuffer): Partial<FootwearProject>[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawRows.map((row, idx) => {
    // Map columns dynamically
    const normalizedRow: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      normalizedRow[normalizeKey(k)] = v;
    }

    const name = normalizedRow['stylename'] || normalizedRow['style'] || normalizedRow['modelname'] || normalizedRow['name'] || `Imported Style #${idx + 1}`;
    const productNumber = String(normalizedRow['productnumber'] || normalizedRow['productno'] || normalizedRow['articleno'] || normalizedRow['prodno'] || `PWI-${90000 + idx}`);
    const productCode = String(normalizedRow['productcode'] || normalizedRow['prodcode'] || normalizedRow['stylecode'] || `PC-2027-${100 + idx}`);
    const sku = String(normalizedRow['sku'] || normalizedRow['skucode'] || `${productCode}-001`);
    const colorwayName = String(normalizedRow['colorway'] || normalizedRow['colorwayname'] || normalizedRow['color'] || 'Core Black / Solar White');
    const season = String(normalizedRow['season'] || normalizedRow['seasoncode'] || 'S1-27');
    const developer = String(normalizedRow['developer'] || normalizedRow['productdeveloper'] || normalizedRow['devengineer'] || 'PWI2 Tech Developer');
    const team = String(normalizedRow['team'] || normalizedRow['devteam'] || normalizedRow['department'] || 'Running Dev Team');
    const project = String(normalizedRow['project'] || normalizedRow['projectname'] || name);
    
    // Parse stage
    const rawStage = String(normalizedRow['stage'] || normalizedRow['developmentstage'] || normalizedRow['currentstage'] || 'gtm_1').toLowerCase();
    let currentStage: DevelopmentStage = 'gtm_1';
    if (rawStage.includes('gtm 2') || rawStage.includes('gtm2') || rawStage.includes('gtm_2')) {
      currentStage = 'gtm_2';
    } else if (rawStage.includes('line confirm') || rawStage.includes('line_confirm')) {
      currentStage = 'line_confirm';
    } else if (rawStage.includes('reline') || rawStage.includes('reline_confirm')) {
      currentStage = 'reline_confirm';
    } else if (rawStage.includes('salesman') || rawStage.includes('ss') || rawStage.includes('salesman_sample')) {
      currentStage = 'salesman_sample';
    } else if (rawStage.includes('fsc') || rawStage.includes('final sample')) {
      currentStage = 'fsc';
    } else if (rawStage.includes('xtr') || rawStage.includes('workshop')) {
      currentStage = 'xtr';
    } else if (rawStage.includes('prod') || rawStage.includes('production') || rawStage.includes('production_confirm')) {
      currentStage = 'production_confirm';
    }

    // Track type
    const rawTrack = String(normalizedRow['track'] || normalizedRow['tracktype'] || normalizedRow['projecttrack'] || 'inline').toLowerCase();
    let trackType: ProjectTrack = 'inline';
    if (rawTrack.includes('smu')) trackType = 'smu';
    else if (rawTrack.includes('speed')) trackType = 'speed';
    else if (rawTrack.includes('pullover') || rawTrack.includes('trial')) trackType = 'pullover';
    else if (rawTrack.includes('xtr') || rawTrack.includes('workshop')) trackType = 'xtr';

    const category = String(normalizedRow['category'] || normalizedRow['silhouette'] || 'Road Running');
    const gender = String(normalizedRow['gender'] || "Men's") as any;
    const tier1Factory = String(normalizedRow['factory'] || normalizedRow['tier1factory'] || normalizedRow['plant'] || 'PWI2 Dev Plant 4 (Serang, Banten)');
    const targetFOBUSD = Number(normalizedRow['targetfob'] || normalizedRow['targetfobusd'] || normalizedRow['fob'] || 42.0);
    const targetRRPUSD = Number(normalizedRow['targetrrp'] || normalizedRow['targetrrpusd'] || normalizedRow['rrp'] || 190.0);
    const orderVolumePairs = Number(normalizedRow['ordervolume'] || normalizedRow['volume'] || normalizedRow['pairs'] || 25000);
    const lastCode = String(normalizedRow['last'] || normalizedRow['lastcode'] || 'FAST-R-LAST-04');
    const outsoleMoldId = String(normalizedRow['outsolemold'] || normalizedRow['mold'] || 'MOLD-OS-4402');
    const midsoleMoldId = String(normalizedRow['midsolemold'] || 'MOLD-MS-4402');
    const targetXFDate = String(normalizedRow['targetxfdate'] || normalizedRow['xfdate'] || '2027-04-15');

    return {
      id: `proj-import-${Date.now()}-${idx}`,
      name,
      productNumber,
      productCode,
      sku,
      colorwayName,
      colorwayCode: 'CW-01',
      season,
      developer,
      team,
      project,
      silhouette: `${category} Performance Footwear`,
      category,
      gender,
      trackType,
      currentStage,
      isRelineRequired: currentStage === 'reline_confirm',
      isSalesmanSampleRequired: true,
      tier1Factory,
      sampleRoomLead: 'Bambang Triyono (Dev Tech)',
      targetFOBUSD,
      currentFOBUSD: targetFOBUSD,
      targetRRPUSD,
      orderVolumePairs,
      status: 'development',
      techPackFreezeDate: '2026-10-15',
      bulkMaterialCutWeek: '2027-02-01',
      targetXFDate,
      targetETD: '2027-04-22',
      targetETA: '2027-05-28',
      lastCode,
      outsoleMoldId,
      midsoleMoldId,
      heroImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      bom: [],
      samples: [],
      milestones: [],
    };
  });
}

export function parseBOMFromWorkbook(data: ArrayBuffer): BOMItem[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawRows.map((row, idx) => {
    const normalizedRow: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      normalizedRow[normalizeKey(k)] = v;
    }

    const componentName = String(
      normalizedRow['componentname'] || 
      normalizedRow['component'] || 
      normalizedRow['partname'] || 
      normalizedRow['item'] || 
      normalizedRow['position'] || 
      `Component #${idx + 1}`
    );

    const materialName = String(
      normalizedRow['materialname'] || 
      normalizedRow['material'] || 
      normalizedRow['materialdescription'] || 
      normalizedRow['description'] || 
      'High Performance Footwear Compound'
    );

    const materialCode = String(
      normalizedRow['materialcode'] || 
      normalizedRow['code'] || 
      normalizedRow['itemcode'] || 
      `MAT-${100 + idx}`
    );

    const rawCategory = String(normalizedRow['category'] || 'upper').toLowerCase();
    let category: MaterialCategory = 'upper';
    if (rawCategory.includes('sole') || rawCategory.includes('bottom') || rawCategory.includes('rubber') || rawCategory.includes('midsole')) {
      category = 'sole';
    } else if (rawCategory.includes('lining') || rawCategory.includes('sockliner') || rawCategory.includes('foam')) {
      category = 'lining';
    } else if (rawCategory.includes('hardware') || rawCategory.includes('eyelet') || rawCategory.includes('boa') || rawCategory.includes('lace')) {
      category = 'hardware';
    } else if (rawCategory.includes('packaging') || rawCategory.includes('box')) {
      category = 'packaging';
    }

    const supplierName = String(normalizedRow['suppliername'] || normalizedRow['supplier'] || normalizedRow['vendor'] || 'PWI Approved Tier-2 Mill');
    const supplierCountry = String(normalizedRow['country'] || normalizedRow['origin'] || normalizedRow['suppliercountry'] || 'Indonesia');
    const leadTimeWeeks = Number(normalizedRow['leadtime'] || normalizedRow['leadtimeweeks'] || normalizedRow['weeks'] || 6);
    const moq = Number(normalizedRow['moq'] || normalizedRow['minimumorder'] || 1000);
    const unit = (String(normalizedRow['unit'] || 'm²').toLowerCase() === 'pair' ? 'pair' : 'm²') as any;
    const yieldPerPair = Number(normalizedRow['yield'] || normalizedRow['yieldperpair'] || normalizedRow['consumption'] || 0.25);
    const unitCostUSD = Number(normalizedRow['unitcost'] || normalizedRow['unitcostusd'] || normalizedRow['cost'] || normalizedRow['price'] || 8.5);
    const totalCostUSD = Number((yieldPerPair * unitCostUSD).toFixed(2));

    // Color Confirmation
    const rawColorStatus = String(normalizedRow['colorconfirmstatus'] || normalizedRow['colorstatus'] || normalizedRow['labdipstatus'] || 'approved').toLowerCase();
    let colorConfirmStatus: LabDipStatus = 'approved';
    if (rawColorStatus.includes('reject')) colorConfirmStatus = 'rejected';
    else if (rawColorStatus.includes('pend') || rawColorStatus.includes('submit')) colorConfirmStatus = 'pending';
    else if (rawColorStatus.includes('condition')) colorConfirmStatus = 'approved_with_condition';

    const colorConfirmDeltaE = Number(normalizedRow['deltae'] || normalizedRow['colorconfirmdeltae'] || (colorConfirmStatus === 'rejected' ? 1.82 : 0.45));
    const colorStandardName = String(normalizedRow['colorstandard'] || normalizedRow['colorstandardname'] || normalizedRow['pantone'] || 'Standard Spec');

    // Sourcing Status
    const rawSourcing = String(normalizedRow['sourcingstatus'] || normalizedRow['status'] || 'bulk_ordered').toLowerCase();
    let sourcingStatus: SourcingStatus = 'bulk_ordered';
    if (rawSourcing.includes('delay')) sourcingStatus = 'delayed';
    else if (rawSourcing.includes('delivered')) sourcingStatus = 'bulk_delivered';
    else if (rawSourcing.includes('transit')) sourcingStatus = 'in_transit';
    else if (rawSourcing.includes('swatch')) sourcingStatus = 'swatch_approved';

    // AWB Logistics
    const airwayBill = String(
      normalizedRow['airwaybill'] || 
      normalizedRow['awb'] || 
      normalizedRow['trackingnumber'] || 
      `AWB-DHL-${Math.floor(10000000 + Math.random() * 90000000)}`
    );
    const airwayBillCarrier = String(normalizedRow['carrier'] || normalizedRow['courier'] || 'DHL Express Air Freight');
    const etaFactoryDate = String(normalizedRow['eta'] || normalizedRow['arrivaldate'] || normalizedRow['etafactorydate'] || '2027-01-15');

    // Arrival & Reject History
    const arrivalHistory: MaterialArrivalRecord[] = [];
    const rawArrivalCount = Number(normalizedRow['arrivalcount'] || normalizedRow['berapakalidatang'] || 1);
    const rawRejectCount = Number(normalizedRow['rejectcount'] || normalizedRow['berapakalireject'] || (sourcingStatus === 'delayed' ? 1 : 0));
    const rawRejectReason = String(normalizedRow['rejectionreason'] || normalizedRow['alasanreject'] || 'Color delta-E exceeds tolerance standard ΔE > 1.2');

    if (rawArrivalCount > 0) {
      for (let r = 1; r <= rawArrivalCount; r++) {
        const isRejectedBatch = r <= rawRejectCount;
        arrivalHistory.push({
          id: `arr-imp-${Date.now()}-${idx}-${r}`,
          batchNumber: r,
          arrivalDate: new Date(Date.now() - (rawArrivalCount - r + 1) * 7 * 86400000).toISOString().split('T')[0],
          airwayBill: `${airwayBill}-B${r}`,
          courierCarrier: airwayBillCarrier,
          quantityReceived: Math.round(moq / rawArrivalCount),
          unit,
          status: isRejectedBatch ? 'rejected' : 'accepted',
          rejectionReason: isRejectedBatch ? rawRejectReason : undefined,
          inspectorName: 'PWI2 Dev Incoming QA',
          warehouseLotNumber: `LOT-IMP-0${r}`,
        });
      }
    }

    return {
      id: `bom-imp-${Date.now()}-${idx}`,
      componentName,
      category,
      materialName,
      materialCode,
      supplierName,
      supplierCountry,
      leadTimeWeeks,
      moq,
      unit,
      yieldPerPair,
      unitCostUSD,
      totalCostUSD,
      colorConfirmStatus,
      colorConfirmDeltaE,
      colorConfirmRound: 1,
      colorStandardName,
      labDipStatus: colorConfirmStatus,
      labDipRound: 1,
      testStatus: 'passed',
      sourcingStatus,
      airwayBill,
      airwayBillCarrier,
      etaFactoryDate,
      criticalPathRisk: sourcingStatus === 'delayed' || colorConfirmStatus === 'rejected',
      arrivalHistory,
      notes: String(normalizedRow['notes'] || normalizedRow['keterangan'] || ''),
    };
  });
}

// Downloadable Style Excel Template Generator
export function generateStyleTemplateWorkbook(): Blob {
  const headers = [
    'Style Name',
    'Product Number',
    'Product Code',
    'Colorway',
    'Season',
    'Product Developer',
    'Team',
    'Project',
    'Stage',
    'Track',
    'Category',
    'Order Volume Pairs',
    'Target XF Date',
    'Factory'
  ];

  const sampleRows = [
    [
      'AeroStride Carbon Pro 2',
      'PWI-94021',
      'PC-2027-AR01',
      'Cyber Teal / Solar Volt',
      'S1-27',
      'Budi Santoso',
      'Running Dev Team',
      'AeroStride Speed',
      'GTM 2',
      'Inline',
      'Road Running',
      32000,
      '2027-03-28',
      'PWI2 Dev Plant 4 (Serang, Banten)'
    ],
    [
      'TerraGrip Apex BOA',
      'PWI-88124',
      'PC-2026-TG03',
      'Alpine Granite / Signal Orange',
      'S2-26',
      'Rina Suryani',
      'Trail & Outdoor Team',
      'TerraGrip BOA',
      'Line Confirm',
      'Inline',
      'Ultra Trail',
      20000,
      '2027-04-28',
      'PWI2 Dev Plant 2 (Serang, Banten)'
    ],
    [
      'CloudCourt Vintage Retro Low',
      'PWI-77401',
      'PC-2027-CC09',
      'Chalk White / Vintage Pine',
      'S1-27',
      'Dian Permana',
      'Sportstyle Court Team',
      'CloudCourt Classic',
      'Reline Confirm',
      'Inline',
      'Sportstyle Court',
      45000,
      '2027-03-12',
      'PWI2 Dev Plant 1 (Serang, Banten)'
    ],
    [
      'Velocity Surge Marathoner',
      'PWI-95100',
      'PC-2027-VS01',
      'Hyper Orange / Pure Platinum',
      'S1-27',
      'Budi Santoso',
      'Running Dev Team',
      'AeroStride Speed',
      'Salesman Sample (SS)',
      'Inline',
      'Road Running',
      28000,
      '2027-04-10',
      'PWI2 Dev Plant 4 (Serang, Banten)'
    ],
    [
      'Apex Ridge GTX Fast-Hike',
      'PWI-44320',
      'PC-2026-APX01',
      'Storm Grey / Acid Lime',
      'S2-26',
      'Rina Suryani',
      'Trail & Outdoor Team',
      'Apex Fast-Hike',
      'Production Confirm',
      'Inline',
      'Fast Hiking',
      28000,
      '2027-01-20',
      'PWI2 Dev Plant 2 (Serang, Banten)'
    ],
    [
      'Atmos Tokyo Retro Low FSC',
      'PWI-33201',
      'PC-2026-ATM01',
      'Jade Glow / Safari Print',
      'S1-26',
      'Dian Permana',
      'Special Projects / SMU Team',
      'Atmos Tokyo',
      'FSC',
      'SMU',
      'Lifestyle Collab',
      3000,
      '2026-12-15',
      'PWI2 Dev Plant 1 (Serang, Banten)'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Styles_Portfolio');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Downloadable BOM Excel Template Generator
export function generateBOMTemplateWorkbook(): Blob {
  const headers = [
    'Component Name',
    'Material Name',
    'Material Code',
    'Category',
    'Supplier Name',
    'Country',
    'Lead Time (Weeks)',
    'MOQ',
    'Unit',
    'Yield Per Pair',
    'Unit Cost USD',
    'Color Confirm Status',
    'Delta E',
    'Color Standard Pantone',
    'Airwaybill (AWB)',
    'Carrier',
    'Sourcing Status',
    'Arrival Count',
    'Reject Count',
    'Rejection Reason'
  ];

  const sampleBOMRows = [
    [
      'Vamp & Quarter Engineered Mesh',
      'Matryx Tech Woven Jacquard 240g',
      'MTX-240-CYB',
      'upper',
      'Chamatex Advanced Textiles',
      'France',
      6,
      800,
      'm²',
      0.26,
      18.2,
      'approved',
      0.52,
      'Pantone 18-4733 TCX Cyber Teal',
      'AWB-DHL-994182401',
      'DHL Express Air Freight',
      'bulk_ordered',
      1,
      0,
      ''
    ],
    [
      'Forefoot & Heel High-Abrasion Outsole',
      'Vibram Megagrip Litebase Rubber 1.5mm',
      'VIB-LB-15',
      'sole',
      'Vibram Asia Pacific',
      'Vietnam',
      9,
      2000,
      'pair',
      1.0,
      5.4,
      'rejected',
      1.85,
      'Pantone 14-0452 TCX Solar Volt (Translucent)',
      'AWB-DHL-667104921',
      'DHL Express Heavy Air',
      'delayed',
      2,
      2,
      'Hardness tested 68 Shore A (exceeds 62 Shore A maximum limit) & oxidation yellow haze'
    ],
    [
      'Full-Length 3D Carbon Propulsion Plate',
      'Toray T700 1.2mm Curved Carbon Composite',
      'TC-700-PLT',
      'sole',
      'Toray Composite Materials',
      'Japan',
      9,
      2500,
      'pair',
      1.0,
      6.9,
      'approved',
      0.1,
      'Carbon Fiber Weave 3K',
      'AWB-JAL-55410928',
      'Japan Airlines Cargo',
      'bulk_delivered',
      1,
      0,
      ''
    ],
    [
      'Anatomical Molded Sockliner',
      'Ortholite X40 High Rebound Foam + Recycled Topcloth',
      'ORT-X40-REC',
      'lining',
      'Ortholite Indonesia Mill',
      'Indonesia',
      4,
      5000,
      'pair',
      1.0,
      1.35,
      'approved',
      0.3,
      'Core Black Pantone 19-4008 TCX',
      'AWB-GRAB-IND-201',
      'Domestic Ground Express',
      'bulk_delivered',
      1,
      0,
      ''
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleBOMRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BOM_Material_Tracking');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
