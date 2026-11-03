import React, { useState } from 'react';
import { FootwearProject } from '../types/footwear';
import { X, Download, Copy, Check, FileSpreadsheet, Layers } from 'lucide-react';

interface TechPackExportModalProps {
  project: FootwearProject;
  isOpen: boolean;
  onClose: () => void;
}

export const TechPackExportModal: React.FC<TechPackExportModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const generateCSV = () => {
    const headers = [
      'Component Name',
      'Category',
      'Material Spec',
      'Material Code',
      'Supplier',
      'Country',
      'Lead Time (Weeks)',
      'MOQ',
      'Unit',
      'Yield Per Pair',
      'Unit Cost (USD)',
      'Total Cost Per Pair (USD)',
      'Lab Dip Status',
      'Test Status',
      'Sourcing Status',
      'Factory ETA',
    ];

    const rows = project.bom.map((item) => [
      `"${item.componentName}"`,
      `"${item.category}"`,
      `"${item.materialName}"`,
      `"${item.materialCode}"`,
      `"${item.supplierName}"`,
      `"${item.supplierCountry}"`,
      item.leadTimeWeeks,
      item.moq,
      item.unit,
      item.yieldPerPair,
      item.unitCostUSD,
      item.totalCostUSD,
      `"${item.labDipStatus}"`,
      `"${item.testStatus}"`,
      `"${item.sourcingStatus}"`,
      `"${item.etaFactoryDate}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SoleCraft_BOM_${project.sku}_${project.season}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(project, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Export Footwear Tech Pack &amp; BOM</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tech Pack Metadata Preview */}
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
            <div>
              <span className="text-slate-500 block">Style / Model:</span>
              <span className="text-white font-semibold">{project.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Style SKU:</span>
              <span className="text-emerald-400 font-semibold">{project.sku}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Season / Gender:</span>
              <span className="text-slate-200">{project.season} · {project.gender}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Ex-Factory (XF):</span>
              <span className="text-amber-400 font-semibold">{project.targetXFDate}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400 font-mono">
            <span>BOM Components: <strong className="text-slate-200">{project.bom.length} items</strong></span>
            <span>Assembly Plant: <strong className="text-slate-200">{project.tier1Factory}</strong></span>
          </div>
        </div>

        {/* Components Quick List */}
        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs">
          {project.bom.map((item, idx) => (
            <div
              key={item.id}
              className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-slate-300"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono text-slate-500 text-[10px]">#{idx + 1}</span>
                <span className="font-medium text-white">{item.componentName}</span>
                <span className="text-slate-500 text-[11px] truncate">({item.materialName})</span>
              </div>
              <div className="font-mono text-emerald-400 shrink-0 font-semibold">
                ${item.totalCostUSD.toFixed(2)}/pr
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCopyJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Full JSON' : 'Copy ERP JSON'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-md text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
            <button
              type="button"
              onClick={generateCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV Tech Pack</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
