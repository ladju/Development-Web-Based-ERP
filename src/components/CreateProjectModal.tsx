import React, { useState } from 'react';
import { FootwearProject, DevelopmentStage, ProjectTrack } from '../types/footwear';
import { X, Plus, Sparkles, Zap, TestTube2, Calendar, Factory } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: FootwearProject) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [productNumber, setProductNumber] = useState(`PWI-${Math.floor(10000 + Math.random() * 90000)}`);
  const [productCode, setProductCode] = useState(`PC-2027-${Math.floor(100 + Math.random() * 900)}`);
  const [sku, setSku] = useState('');
  const [developer, setDeveloper] = useState('Budi Santoso (Sr. Developer)');
  const [team, setTeam] = useState('Running Dev Team');
  const [project, setProject] = useState('AeroStride Speed');
  const [trackType, setTrackType] = useState<ProjectTrack>('inline');
  const [currentStage, setCurrentStage] = useState<DevelopmentStage>('gtm_1');
  const [isRelineRequired, setIsRelineRequired] = useState(false);
  const [pulloverTrialType, setPulloverTrialType] = useState<'new_pattern' | 'new_model_last' | 'new_material'>('new_pattern');
  const [collabPartner, setCollabPartner] = useState('');
  const [category, setCategory] = useState<FootwearProject['category']>('Road Running');
  const [season, setSeason] = useState<FootwearProject['season']>('S1-27');
  const [tier1Factory, setTier1Factory] = useState('PWI2 Dev Plant 4 (Serang, Banten)');
  const [targetFOBUSD, setTargetFOBUSD] = useState(38.0);
  const [targetRRPUSD, setTargetRRPUSD] = useState(190.0);
  const [targetXFDate, setTargetXFDate] = useState('2027-04-15');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: FootwearProject = {
      id: `proj-custom-${Date.now()}`,
      sku: sku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      productNumber: productNumber.trim() || `PWI-${Math.floor(10000 + Math.random() * 90000)}`,
      productCode: productCode.trim() || `PC-2027-${Math.floor(100 + Math.random() * 900)}`,
      developer: developer.trim() || 'PWI2 Tech Developer',
      team: team.trim() || 'Running Dev Team',
      project: project.trim() || name.trim(),
      silhouette: 'Performance Athletic Footwear',
      category,
      season: trackType === 'inline' ? season : trackType === 'pullover' ? 'S1-27' : 'S2-26',
      trackType,
      currentStage,
      isRelineRequired,
      isSalesmanSampleRequired: currentStage === 'salesman_sample' || trackType === 'inline',
      pulloverTrialType: trackType === 'pullover' ? pulloverTrialType : undefined,
      collabPartner: trackType === 'smu' ? collabPartner : undefined,
      speedTargetDays: trackType === 'speed' ? 60 : undefined,
      gender: 'Unisex',
      lastCode: 'PWI2-LAST-01',
      outsoleMoldId: 'MOLD-TRIAL-01',
      midsoleMoldId: 'MOLD-TRIAL-01',
      tier1Factory,
      sampleRoomLead: 'Sample Room Manager',
      targetFOBUSD: Number(targetFOBUSD),
      currentFOBUSD: Number(targetFOBUSD),
      targetRRPUSD: Number(targetRRPUSD),
      orderVolumePairs: trackType === 'pullover' ? 500 : trackType === 'smu' ? 5000 : 25000,
      status: 'development',
      techPackFreezeDate: '2026-11-01',
      bulkMaterialCutWeek: '2027-02-15',
      targetXFDate,
      targetETD: '2027-04-22',
      targetETA: '2027-05-25',
      colorwayName: 'First Proto White',
      colorwayCode: 'CW-01',
      heroImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      bom: [],
      samples: [],
      milestones: [
        {
          id: `ms-init-1`,
          phase: 'concept',
          title: 'Initial Tech Pack Release',
          description: 'Kick-off spec release.',
          plannedDate: '2026-11-15',
          status: 'on_track',
          isCriticalPath: true,
          delayDays: 0,
          owner: 'Design Lead',
          deliverable: 'Tech Pack package',
        },
      ],
    };

    onCreateProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Initiate Footwear Development Project</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Project Track Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Select Development Track
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'inline', label: 'Inline Calendar', icon: Calendar, desc: 'Regular seasonal' },
                { id: 'smu', label: 'Special Make Up', icon: Sparkles, desc: 'Collab / Exclusive' },
                { id: 'speed', label: 'Speed Track', icon: Zap, desc: '60-90d quick turn' },
                { id: 'pullover', label: 'Pullover Trial', icon: TestTube2, desc: 'Pattern/material test' },
                { id: 'xtr', label: 'XTR Workshop', icon: Factory, desc: 'Small-run / legacy' },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = trackType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTrackType(t.id as ProjectTrack)}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <Icon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Footwear Model Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AeroStride Elite 3, Veloce Low"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Style SKU Code</label>
              <input
                type="text"
                placeholder="e.g. ASP3-SS27-01"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Conditional Fields based on Track */}
          {trackType === 'smu' && (
            <div>
              <label className="block text-purple-300 font-semibold mb-1">
                SMU Collab Partner / Account
              </label>
              <input
                type="text"
                placeholder="e.g. Kith NYC, Dover Street Market, Olympic Athlete Edition"
                value={collabPartner}
                onChange={(e) => setCollabPartner(e.target.value)}
                className="w-full bg-slate-950 border border-purple-900/60 rounded-md p-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {trackType === 'pullover' && (
            <div>
              <label className="block text-cyan-300 font-semibold mb-1">
                Pullover Trial Scope
              </label>
              <select
                value={pulloverTrialType}
                onChange={(e) => setPulloverTrialType(e.target.value as any)}
                className="w-full bg-slate-950 border border-cyan-900/60 rounded-md p-2 text-white focus:outline-none"
              >
                <option value="new_pattern">New Upper Pattern &amp; Last Fitting Trial</option>
                <option value="new_model_last">New Silhouette &amp; Outsole Tooling Trial</option>
                <option value="new_material">New Upper/Foam Material Exploration</option>
              </select>
            </div>
          )}

          {/* Product Number, Product Code, Developer, Team, Project */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Product Number</label>
              <input
                type="text"
                value={productNumber}
                onChange={(e) => setProductNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Product Code</label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Developer Lead</label>
              <input
                type="text"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Dev Team</label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Running Dev Team">Running Dev Team</option>
                <option value="Trail & Outdoor Team">Trail &amp; Outdoor Team</option>
                <option value="Sportstyle Court Team">Sportstyle Court Team</option>
                <option value="Special Projects / SMU Team">Special Projects / SMU Team</option>
                <option value="Innovation & Advance R&D">Innovation &amp; Advance R&D</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Project Initiative Name</label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. AeroStride Speed, TerraGrip"
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Initial Stage & Reline Needed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Starting Stage</label>
              <select
                value={currentStage}
                onChange={(e) => setCurrentStage(e.target.value as DevelopmentStage)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white focus:outline-none"
              >
                <option value="gtm_1">1. GTM 1 (Go-To-Market 1)</option>
                <option value="gtm_2">2. GTM 2 (Go-To-Market 2)</option>
                <option value="line_confirm">3. Line Confirm</option>
                <option value="reline_confirm">4. Reline Confirm</option>
                <option value="salesman_sample">5. Salesman Sample (SS)</option>
                <option value="production_confirm">6. Production Confirm (Final)</option>
                <option value="fsc">7. FSC (Final Sample Confirmation)</option>
                <option value="xtr">8. XTR (Workshop Small-Run / Legacy Order)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Reline Required?</label>
              <select
                value={isRelineRequired ? 'yes' : 'no'}
                onChange={(e) => setIsRelineRequired(e.target.value === 'yes')}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white focus:outline-none"
              >
                <option value="no">No (Skips Reline direct to Prod Confirm)</option>
                <option value="yes">Yes (Undergoes Reline Confirm review)</option>
              </select>
            </div>
          </div>

          {trackType === 'inline' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Production Season (2 seasons/year)</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono focus:outline-none"
              >
                <option value="S1-27">S1-27 (2027 Season 1)</option>
                <option value="S2-26">S2-26 (2026 Season 2)</option>
                <option value="S1-26">S1-26 (2026 Season 1)</option>
              </select>
            </div>
          )}

          {/* Category & Tier 1 Factory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white focus:outline-none"
              >
                <option value="Road Running">Road Running</option>
                <option value="Ultra Trail">Ultra Trail</option>
                <option value="Sportstyle Court">Sportstyle Court</option>
                <option value="Fast Hiking">Fast Hiking</option>
                <option value="Lifestyle Collab">Lifestyle Collab</option>
                <option value="R&D Concept">R&D Concept</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tier-1 Factory</label>
              <input
                type="text"
                value={tier1Factory}
                onChange={(e) => setTier1Factory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Target XF Date */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target XF Date</label>
            <input
              type="date"
              value={targetXFDate}
              onChange={(e) => setTargetXFDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-md font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
