import React, { useState } from 'react';
import { FootwearProject, BOMItem } from '../types/footwear';
import { BOMCostBreakdown } from '../utils/footwearErpLogic';
import { 
  DollarSign, 
  PieChart, 
  TrendingUp, 
  Ship, 
  Layers, 
  HelpCircle, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface CostingBreakdownProps {
  project: FootwearProject;
  bomCost: BOMCostBreakdown;
  bom: BOMItem[];
}

export const CostingBreakdown: React.FC<CostingBreakdownProps> = ({
  project,
  bomCost,
  bom,
}) => {
  const [dutyRatePercent, setDutyRatePercent] = useState<number>(11.0); // Footwear average tariff rate
  const [freightPerPairUSD, setFreightPerPairUSD] = useState<number>(2.4); // Ocean 40ft container amortized
  const [toolingAmortizationUSD, setToolingAmortizationUSD] = useState<number>(1.25); // Amortized mold cost across 32k pairs

  // Calculations
  const landedCostUSD = Number(
    (
      bomCost.projectedFOB +
      freightPerPairUSD +
      (bomCost.projectedFOB * (dutyRatePercent / 100)) +
      toolingAmortizationUSD
    ).toFixed(2)
  );

  const wholesalePriceUSD = Number((bomCost.projectedFOB * 2.0).toFixed(2));
  const wholesaleMarginPercent = Number(
    (((wholesalePriceUSD - landedCostUSD) / wholesalePriceUSD) * 100).toFixed(1)
  );

  const dtcMarginPercent = Number(
    (((project.targetRRPUSD - landedCostUSD) / project.targetRRPUSD) * 100).toFixed(1)
  );

  return (
    <div className="space-y-6">
      {/* Top FOB Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">FOB Costing &amp; Landed Margin Analysis</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Commercialized production costing model based on current Bill of Materials yield and Tier-1 factory labor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Volume:</span>
            <span className="text-xs font-mono font-bold text-white px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
              {project.orderVolumePairs.toLocaleString()} Pairs
            </span>
          </div>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400">Total Material Cost</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              ${bomCost.totalMaterialCost.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Sum of upper, sole, lining, and packaging BOM
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400">Factory Assembly &amp; Overhead</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              ${bomCost.overheadAndLaborEstimate.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Cut-stitch, sole lasting, bonding, AQL inspection
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400">Current Projected FOB</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                ${bomCost.projectedFOB.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">target: ${project.targetFOBUSD.toFixed(2)}</span>
            </div>
            <p className={`text-[11px] font-mono mt-1 ${bomCost.varianceFromTarget > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              Variance: {bomCost.varianceFromTarget > 0 ? `+$${bomCost.varianceFromTarget}` : `-$${Math.abs(bomCost.varianceFromTarget)}`} ({bomCost.variancePercent}%)
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Category Breakdown Table & Landed Cost Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Component Breakdown Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="text-sm font-semibold text-white">Cost Breakdown by Category</h4>

          <div className="space-y-2 text-xs">
            {[
              { label: 'Upper Components (Mesh, Hotmelt, Collar)', cost: bomCost.upperCost, percent: Math.round((bomCost.upperCost / bomCost.totalMaterialCost) * 100) },
              { label: 'Bottom & Sole Unit (Foam, Rubber, Carbon)', cost: bomCost.soleCost, percent: Math.round((bomCost.soleCost / bomCost.totalMaterialCost) * 100) },
              { label: 'Lining & Sockliner Foams', cost: bomCost.liningCost, percent: Math.round((bomCost.liningCost / bomCost.totalMaterialCost) * 100) },
              { label: 'Hardware & Laces', cost: bomCost.hardwareCost, percent: Math.round((bomCost.hardwareCost / bomCost.totalMaterialCost) * 100) },
              { label: 'Packaging & FSC Shoebox', cost: bomCost.packagingCost, percent: Math.round((bomCost.packagingCost / bomCost.totalMaterialCost) * 100) },
            ].map((cat, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-slate-200">{cat.label}</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${cat.percent}%` }} />
                  </div>
                </div>

                <div className="text-right font-mono shrink-0">
                  <div className="font-bold text-white">${cat.cost.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-400">{cat.percent}% of BOM</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Landed Cost & Margins Calculator */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="text-sm font-semibold text-white">Landed Cost &amp; Margin Simulator</h4>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Projected Factory FOB</span>
              <span className="font-mono text-white font-bold">${bomCost.projectedFOB.toFixed(2)}</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400">Import Tariff / Duty (%)</span>
                <span className="font-mono text-slate-200">{dutyRatePercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={dutyRatePercent}
                onChange={(e) => setDutyRatePercent(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400">Ocean Freight / Pair ($USD)</span>
                <span className="font-mono text-slate-200">${freightPerPairUSD.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.2"
                value={freightPerPairUSD}
                onChange={(e) => setFreightPerPairUSD(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400">Amortized Mold Tooling</span>
              <span className="font-mono text-slate-200">${toolingAmortizationUSD.toFixed(2)}</span>
            </div>

            {/* Total Landed Cost Banner */}
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-300 font-semibold block">Total Estimated Landed Cost</span>
                <span className="text-[11px] text-slate-400">Delivery into US Central DC</span>
              </div>
              <span className="text-xl font-bold font-mono text-emerald-400">${landedCostUSD.toFixed(2)}</span>
            </div>

            {/* Margin Comparisons */}
            <div className="pt-2 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Target Retail (RRP)</span>
                <span className="font-mono text-white font-bold">${project.targetRRPUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">DTC Direct Gross Margin</span>
                <span className="font-mono text-emerald-400 font-bold">{dtcMarginPercent}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Wholesale Channel Margin</span>
                <span className="font-mono text-slate-300 font-bold">{wholesaleMarginPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
