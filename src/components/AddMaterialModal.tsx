import React, { useState } from 'react';
import { BOMItem, MaterialCategory, SourcingStatus } from '../types/footwear';
import { X, Plus, Layers } from 'lucide-react';

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMaterial: (newItem: BOMItem) => void;
}

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({
  isOpen,
  onClose,
  onAddMaterial,
}) => {
  if (!isOpen) return null;

  const [componentName, setComponentName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('upper');
  const [materialName, setMaterialName] = useState('');
  const [materialCode, setMaterialCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierCountry, setSupplierCountry] = useState('Vietnam');
  const [leadTimeWeeks, setLeadTimeWeeks] = useState(6);
  const [moq, setMoq] = useState(1000);
  const [unit, setUnit] = useState<'m²' | 'pair' | 'pcs' | 'kg'>('m²');
  const [yieldPerPair, setYieldPerPair] = useState(0.25);
  const [unitCostUSD, setUnitCostUSD] = useState(14.0);
  const [etaFactoryDate, setEtaFactoryDate] = useState('2027-02-15');
  const [sourcingStatus, setSourcingStatus] = useState<SourcingStatus>('inquiry');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentName.trim() || !materialName.trim()) return;

    const totalCostUSD = Number((yieldPerPair * unitCostUSD).toFixed(2));
    const newItem: BOMItem = {
      id: `bom-user-${Date.now()}`,
      componentName,
      category,
      materialName,
      materialCode: materialCode || `MAT-${Math.floor(100 + Math.random() * 900)}`,
      supplierName,
      supplierCountry,
      leadTimeWeeks: Number(leadTimeWeeks),
      moq: Number(moq),
      unit,
      yieldPerPair: Number(yieldPerPair),
      unitCostUSD: Number(unitCostUSD),
      totalCostUSD,
      labDipStatus: 'pending',
      labDipRound: 1,
      colorConfirmStatus: 'pending',
      colorConfirmRound: 1,
      testStatus: 'pending',
      sourcingStatus,
      etaFactoryDate,
      criticalPathRisk: false,
      airwayBill: undefined,
      airwayBillCarrier: undefined,
      arrivalHistory: [],
      notes,
    };

    onAddMaterial(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Add BOM Material Component</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add material modal"
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: Component & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Component Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Vamp Jacquard Mesh, Shank, Counter"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="upper">Upper Component</option>
                <option value="sole">Bottom / Sole Tooling</option>
                <option value="lining">Lining &amp; Foams</option>
                <option value="hardware">Hardware &amp; Fasteners</option>
                <option value="packaging">Packaging &amp; Trims</option>
              </select>
            </div>
          </div>

          {/* Row 2: Material Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Material Specification <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cordura 500D Ballistic Nylon"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Material SKU Code</label>
              <input
                type="text"
                placeholder="e.g. NYL-500D-BLK"
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 3: Supplier & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Supplier / Tannery / Mill</label>
              <input
                type="text"
                placeholder="e.g. Toray Industries, Chamatex, Vibram"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Country of Origin</label>
              <input
                type="text"
                placeholder="e.g. Vietnam, Taiwan, Italy, Japan"
                value={supplierCountry}
                onChange={(e) => setSupplierCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 4: Lead Time, MOQ & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Lead Time (Weeks)</label>
              <input
                type="number"
                min={1}
                max={52}
                value={leadTimeWeeks}
                onChange={(e) => setLeadTimeWeeks(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">MOQ</label>
              <input
                type="number"
                min={1}
                value={moq}
                onChange={(e) => setMoq(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="m²">Square Meter (m²)</option>
                <option value="pair">Pair (pr)</option>
                <option value="pcs">Piece (pcs)</option>
                <option value="kg">Kilogram (kg)</option>
              </select>
            </div>
          </div>

          {/* Row 5: Yield & Unit Cost -> Total pair cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Yield / Pair</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={yieldPerPair}
                onChange={(e) => setYieldPerPair(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Unit Cost ($USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCostUSD}
                onChange={(e) => setUnitCostUSD(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Cost / Pair</label>
              <div className="p-2 text-emerald-400 font-mono font-bold text-sm">
                ${(yieldPerPair * unitCostUSD).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Row 6: Factory ETA & Sourcing Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Factory Delivery ETA</label>
              <input
                type="date"
                value={etaFactoryDate}
                onChange={(e) => setEtaFactoryDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Sourcing Pipeline Status</label>
              <select
                value={sourcingStatus}
                onChange={(e) => setSourcingStatus(e.target.value as SourcingStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="inquiry">Price &amp; Tech Inquiry</option>
                <option value="lab_dip_phase">Lab Dip / Strike-Off Phase</option>
                <option value="swatch_approved">Swatch Approved</option>
                <option value="bulk_ordered">Bulk Purchase Order Placed</option>
                <option value="bulk_delivered">Bulk Delivered in Factory</option>
                <option value="delayed">Delayed / Risk Flag</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Technical Notes / Specs</label>
            <input
              type="text"
              placeholder="e.g. Color standard Pantone 19-4028 TCX, Water-repellent C0 DWR finish."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-md font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Bill of Materials</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
