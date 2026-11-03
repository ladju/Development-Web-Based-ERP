import React, { useState } from 'react';
import { BOMItem, MaterialCategory, SourcingStatus, ComplianceTestStatus } from '../types/footwear';
import { formatDateMMDDYYYY } from '../utils/dateUtils';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Palette, 
  Check, 
  X, 
  Trash2, 
  Eye, 
  Plus, 
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  Lock
} from 'lucide-react';

interface MaterialSourcingTableProps {
  bom: BOMItem[];
  onOpenAddModal: () => void;
  onOpenLabDipModal: (item: BOMItem) => void;
  onUpdateSourcingStatus: (itemId: string, newStatus: SourcingStatus) => void;
  onUpdateTestStatus: (itemId: string, newStatus: ComplianceTestStatus) => void;
  onToggleCriticalRisk: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  isAdmin?: boolean;
}

export const MaterialSourcingTable: React.FC<MaterialSourcingTableProps> = ({
  bom,
  onOpenAddModal,
  onOpenLabDipModal,
  onUpdateSourcingStatus,
  onUpdateTestStatus,
  onToggleCriticalRisk,
  onDeleteItem,
  isAdmin = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter materials
  const filteredBOM = bom.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.componentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.materialCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'at_risk' && (item.criticalPathRisk || item.sourcingStatus === 'delayed')) ||
      (statusFilter === 'approved' && (item.sourcingStatus === 'bulk_delivered' || item.sourcingStatus === 'swatch_approved')) ||
      (statusFilter === 'lab_dip_pending' && item.labDipStatus !== 'approved');

    return matchesCategory && matchesSearch && matchesStatus;
  });

  const categoryCounts = {
    all: bom.length,
    upper: bom.filter((i) => i.category === 'upper').length,
    sole: bom.filter((i) => i.category === 'sole').length,
    lining: bom.filter((i) => i.category === 'lining').length,
    hardware: bom.filter((i) => i.category === 'hardware').length,
    packaging: bom.filter((i) => i.category === 'packaging').length,
  };

  const totalFilteredCost = filteredBOM.reduce((acc, curr) => acc + curr.totalCostUSD, 0);

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0" role="tablist">
            {[
              { id: 'all', label: 'All BOM' },
              { id: 'upper', label: 'Upper' },
              { id: 'sole', label: 'Bottom / Sole' },
              { id: 'lining', label: 'Lining & Foam' },
              { id: 'hardware', label: 'Hardware' },
              { id: 'packaging', label: 'Packaging' },
            ].map((cat) => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.label} ({categoryCounts[cat.id as keyof typeof categoryCounts] || 0})
              </button>
            ))}
          </div>

          {/* Add Component Button (Admin Only) */}
          <button
            onClick={() => {
              if (isAdmin) onOpenAddModal();
            }}
            disabled={!isAdmin}
            title={isAdmin ? 'Add BOM Component' : 'Admin Only: Switch to Super Admin role to add BOM items'}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-sm ${
              isAdmin
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            {isAdmin ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
            <span>Add BOM Component</span>
            {!isAdmin && (
              <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-400">
                Admin Only
              </span>
            )}
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search components, materials, codes, suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs">
            <span className="text-slate-400 hidden sm:inline">Status Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Sourcing Statuses</option>
              <option value="at_risk">At Risk / Delayed Only</option>
              <option value="approved">Approved &amp; Delivered Only</option>
              <option value="lab_dip_pending">Lab Dip Incomplete</option>
            </select>

            <span className="text-slate-400 font-mono text-xs pl-2 border-l border-slate-800">
              Total Material Cost: <strong className="text-emerald-400 font-bold">${totalFilteredCost.toFixed(2)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Sourcing Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[11px]">
                <th className="py-3 px-4">Component &amp; Code</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-4">Material Spec &amp; Supplier</th>
                <th className="py-3 px-3 text-right">Lead Time / MOQ</th>
                <th className="py-3 px-3 text-right">Yield &times; Unit Cost</th>
                <th className="py-3 px-3 text-center">Lab Dip Approval</th>
                <th className="py-3 px-3 text-center">Physical Test</th>
                <th className="py-3 px-4">Sourcing Pipeline</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredBOM.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No footwear BOM components found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredBOM.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      item.criticalPathRisk ? 'bg-red-950/20' : ''
                    }`}
                  >
                    {/* Component Name & Code */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.componentName}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{item.materialCode}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-slate-300 capitalize">
                        {item.category}
                      </span>
                    </td>

                    {/* Material Spec & Supplier */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-200 truncate">{item.materialName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{item.supplierName}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400 font-mono">{item.supplierCountry}</span>
                      </div>
                      {item.notes && (
                        <p className="text-[10px] text-slate-500 italic mt-1 line-clamp-1">{item.notes}</p>
                      )}
                    </td>

                    {/* Lead Time & MOQ */}
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="text-slate-200">{item.leadTimeWeeks} wks</div>
                      <div className="text-[11px] text-slate-500">MOQ: {item.moq.toLocaleString()} {item.unit}</div>
                    </td>

                    {/* Yield x Unit Cost = Pair Cost */}
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="font-bold text-emerald-400">${item.totalCostUSD.toFixed(2)}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.yieldPerPair} {item.unit} &times; ${item.unitCostUSD.toFixed(2)}
                      </div>
                    </td>

                    {/* Lab Dip Status (Clickable to open Light Booth Modal) */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onOpenLabDipModal(item)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                          item.labDipStatus === 'approved' || item.labDipStatus === 'approved_with_condition'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                            : item.labDipStatus === 'rejected'
                            ? 'bg-red-950/40 text-red-300 border-red-800 hover:bg-red-900/60'
                            : 'bg-amber-950/40 text-amber-300 border-amber-800 hover:bg-amber-900/60'
                        }`}
                      >
                        <Palette className="w-3 h-3" />
                        <span className="capitalize">
                          {item.labDipStatus === 'approved' ? 'Approved' : item.labDipStatus === 'rejected' ? 'Rejected' : 'In Review'}
                        </span>
                        <span className="font-mono text-[10px] opacity-75">R{item.labDipRound}</span>
                      </button>
                    </td>

                    {/* Physical Test Compliance */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          const nextStatus: ComplianceTestStatus = 
                            item.testStatus === 'passed' ? 'in_testing' : item.testStatus === 'in_testing' ? 'failed' : 'passed';
                          onUpdateTestStatus(item.id, nextStatus);
                        }}
                        title="Click to toggle test status: passed -> in_testing -> failed"
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                          item.testStatus === 'passed'
                            ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/60'
                            : item.testStatus === 'failed'
                            ? 'bg-red-950/40 text-red-300 border-red-800'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span className="capitalize">{item.testStatus.replace('_', ' ')}</span>
                      </button>
                    </td>

                    {/* Sourcing Pipeline Status */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={item.sourcingStatus}
                          onChange={(e) => onUpdateSourcingStatus(item.id, e.target.value as SourcingStatus)}
                          className={`bg-slate-950 text-[11px] font-mono border rounded px-2 py-1 cursor-pointer outline-none ${
                            item.sourcingStatus === 'bulk_delivered'
                              ? 'border-emerald-700 text-emerald-300'
                              : item.sourcingStatus === 'delayed'
                              ? 'border-red-700 text-red-300 font-bold'
                              : item.sourcingStatus === 'bulk_ordered'
                              ? 'border-sky-700 text-sky-300'
                              : 'border-slate-700 text-slate-300'
                          }`}
                        >
                          <option value="inquiry">1. Inquiry</option>
                          <option value="lab_dip_phase">2. Lab Dip</option>
                          <option value="swatch_approved">3. Swatch Approved</option>
                          <option value="bulk_ordered">4. Bulk PO Placed</option>
                          <option value="bulk_delivered">5. Bulk Delivered</option>
                          <option value="delayed">! Delayed / Risk</option>
                        </select>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ETA: {formatDateMMDDYYYY(item.etaFactoryDate)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onToggleCriticalRisk(item.id)}
                          title={item.criticalPathRisk ? 'Clear critical risk flag' : 'Flag as critical path bottleneck'}
                          className={`p-1.5 rounded transition-colors ${
                            item.criticalPathRisk 
                              ? 'text-red-400 bg-red-950/60 border border-red-800' 
                              : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (isAdmin) onDeleteItem(item.id);
                          }}
                          disabled={!isAdmin}
                          title={isAdmin ? 'Remove BOM item' : 'Admin Only: Only Super Admin can delete BOM items'}
                          className={`p-1.5 rounded transition-colors ${
                            isAdmin
                              ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800 cursor-pointer'
                              : 'text-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
