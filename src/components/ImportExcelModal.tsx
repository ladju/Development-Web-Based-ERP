import React, { useState, useRef } from 'react';
import { FootwearProject, BOMItem } from '../types/footwear';
import { 
  parseStylesFromWorkbook, 
  parseBOMFromWorkbook, 
  generateStyleTemplateWorkbook, 
  generateBOMTemplateWorkbook 
} from '../utils/excelParser';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Layers, 
  Package, 
  ArrowRight,
  Filter,
  Sparkles
} from 'lucide-react';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: FootwearProject[];
  currentProjectId: string;
  onImportStyles: (newStyles: FootwearProject[]) => void;
  onImportBOM: (targetProjectId: string, newBOM: BOMItem[]) => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onImportStyles,
  onImportBOM,
}) => {
  const [activeTab, setActiveTab] = useState<'styles' | 'bom'>('styles');
  const [selectedTargetProjectId, setSelectedTargetProjectId] = useState<string>(currentProjectId || projects[0]?.id || '');
  
  // File state
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [parsedStyles, setParsedStyles] = useState<Partial<FootwearProject>[]>([]);
  const [parsedBOMItems, setParsedBOMItems] = useState<BOMItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadStyleTemplate = () => {
    const blob = generateStyleTemplateWorkbook();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PWI2_Footwear_LineSheet_Template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBOMTemplate = () => {
    const blob = generateBOMTemplateWorkbook();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PWI2_BOM_Import_Template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleProcessFile = async (file: File) => {
    setErrorMsg('');
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    try {
      const buffer = await file.arrayBuffer();
      if (activeTab === 'styles') {
        const styles = parseStylesFromWorkbook(buffer);
        if (styles.length === 0) {
          setErrorMsg('No valid style rows found in spreadsheet. Please check sheet headers.');
          setParsedStyles([]);
        } else {
          setParsedStyles(styles);
        }
      } else {
        const bom = parseBOMFromWorkbook(buffer);
        if (bom.length === 0) {
          setErrorMsg('No valid BOM component rows found in spreadsheet. Please check sheet headers.');
          setParsedBOMItems([]);
        } else {
          setParsedBOMItems(bom);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to parse file: ${err.message || 'Unknown error'}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (activeTab === 'styles') {
      if (parsedStyles.length === 0) return;
      onImportStyles(parsedStyles as FootwearProject[]);
      onClose();
    } else {
      if (parsedBOMItems.length === 0) return;
      onImportBOM(selectedTargetProjectId, parsedBOMItems);
      onClose();
    }
  };

  const resetUpload = () => {
    setFileName('');
    setFileSize('');
    setParsedStyles([]);
    setParsedBOMItems([]);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Excel Spreadsheet Data Importer
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  .xlsx / .csv
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Bulk upload Footwear Styles portfolio or Style Bill of Materials (BOM) with automatic tracking sync.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-6 pt-3 gap-4">
          <button
            onClick={() => {
              setActiveTab('styles');
              resetUpload();
            }}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'styles'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Import Project Line Sheet (Seasonal Styles)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('bom');
              resetUpload();
            }}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'bom'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>2. Import BOM for Style Material Tracking</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Target style selector if in BOM tab */}
          {activeTab === 'bom' && (
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Assign Uploaded BOM to Target Footwear Style:
                </label>
                <p className="text-xs text-slate-500">
                  Imported BOM items will replace or populate material tracking for this style.
                </p>
              </div>
              <select
                value={selectedTargetProjectId}
                onChange={(e) => setSelectedTargetProjectId(e.target.value)}
                aria-label="Select Target Project for BOM"
                className="bg-slate-900 border border-slate-700 text-sm font-medium text-emerald-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.season} - {p.sku}) [{p.team}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Download sample templates helper strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Need standard column formats? Download ready-to-use template with verified columns:
              </span>
            </div>
            {activeTab === 'styles' ? (
              <button
                onClick={handleDownloadStyleTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Line Sheet Template (.xlsx)</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadBOMTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download BOM Template (.xlsx)</span>
              </button>
            )}
          </div>

          {/* Upload Drag & Drop Box */}
          {fileName === '' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-950/40 hover:bg-slate-950/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-300">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                Drag & drop your Excel file here, or{' '}
                <span className="text-emerald-400 underline">browse files</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white font-mono">{fileName}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    {fileSize} • {activeTab === 'styles' ? `${parsedStyles.length} Styles Parsed` : `${parsedBOMItems.length} BOM Items Parsed`}
                  </p>
                </div>
              </div>
              <button
                onClick={resetUpload}
                className="text-xs px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Change File
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table for Styles */}
          {activeTab === 'styles' && parsedStyles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Parsed Styles Preview ({parsedStyles.length} Styles Detected)
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">Ready to import</span>
              </div>
              <div className="border border-slate-800 rounded-lg overflow-x-auto max-h-60 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">Style Name</th>
                      <th className="p-2.5">Product #</th>
                      <th className="p-2.5">Product Code</th>
                      <th className="p-2.5">Colorway</th>
                      <th className="p-2.5">Season</th>
                      <th className="p-2.5">Team</th>
                      <th className="p-2.5">Project</th>
                      <th className="p-2.5">Developer</th>
                      <th className="p-2.5">Stage</th>
                      <th className="p-2.5">Track</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {parsedStyles.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-2.5 font-sans font-semibold text-white whitespace-nowrap">{s.name}</td>
                        <td className="p-2.5 text-emerald-400 whitespace-nowrap">{s.productNumber}</td>
                        <td className="p-2.5 text-slate-300 whitespace-nowrap">{s.productCode}</td>
                        <td className="p-2.5 text-slate-300 whitespace-nowrap">{s.colorwayName}</td>
                        <td className="p-2.5 text-amber-300 whitespace-nowrap">{s.season}</td>
                        <td className="p-2.5 text-blue-300 whitespace-nowrap">{s.team}</td>
                        <td className="p-2.5 text-slate-300 whitespace-nowrap">{s.project}</td>
                        <td className="p-2.5 text-slate-400 whitespace-nowrap">{s.developer}</td>
                        <td className="p-2.5 text-purple-300 whitespace-nowrap">{s.currentStage}</td>
                        <td className="p-2.5 uppercase text-slate-400 whitespace-nowrap">{s.trackType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview Table for BOM */}
          {activeTab === 'bom' && parsedBOMItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Parsed BOM Components ({parsedBOMItems.length} Materials Detected)
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">AWB & Reject tracking ready</span>
              </div>
              <div className="border border-slate-800 rounded-lg overflow-x-auto max-h-60 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">Component</th>
                      <th className="p-2.5">Material Description</th>
                      <th className="p-2.5">Supplier</th>
                      <th className="p-2.5">Airwaybill (AWB)</th>
                      <th className="p-2.5">Color Status</th>
                      <th className="p-2.5">ΔE</th>
                      <th className="p-2.5">Arrivals</th>
                      <th className="p-2.5">Rejections</th>
                      <th className="p-2.5">Sourcing Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {parsedBOMItems.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-2.5 font-sans font-semibold text-white whitespace-nowrap">{b.componentName}</td>
                        <td className="p-2.5 text-slate-300 whitespace-nowrap">{b.materialName}</td>
                        <td className="p-2.5 text-slate-400 whitespace-nowrap">{b.supplierName}</td>
                        <td className="p-2.5 text-emerald-400 whitespace-nowrap">{b.airwayBill || 'Pending'}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            b.colorConfirmStatus === 'approved' 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {b.colorConfirmStatus}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300 whitespace-nowrap">ΔE {b.colorConfirmDeltaE || '-'}</td>
                        <td className="p-2.5 text-blue-300 whitespace-nowrap">{b.arrivalHistory?.length || 0}x Datang</td>
                        <td className="p-2.5 text-rose-400 whitespace-nowrap">
                          {b.arrivalHistory?.filter(a => a.status === 'rejected').length || 0}x Reject
                        </td>
                        <td className="p-2.5 text-slate-400 whitespace-nowrap">{b.sourcingStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={activeTab === 'styles' ? parsedStyles.length === 0 : parsedBOMItems.length === 0}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md ${
              (activeTab === 'styles' ? parsedStyles.length > 0 : parsedBOMItems.length > 0)
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {activeTab === 'styles'
                ? `Confirm & Import ${parsedStyles.length} Styles`
                : `Confirm & Populate BOM (${parsedBOMItems.length} Materials)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
