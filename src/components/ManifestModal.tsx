import React, { useState } from 'react';
import { RouteAnalysisData, SurvivorSupplies } from '../types';
import { X, Copy, Check, Printer, FileText, ShieldAlert, Radio } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface ManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: RouteAnalysisData;
  supplies: SurvivorSupplies;
}

export const ManifestModal: React.FC<ManifestModalProps> = ({
  isOpen,
  onClose,
  analysis,
  supplies,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const manifestText = `================================================
BEACON // OFFLINE SURVIVAL ROUTE MANIFEST
TACTICAL EXTRACTION DISPATCH
================================================
Status: ${analysis.isReachable ? 'ROUTE ACTIVE' : 'UNREACHABLE / CODE RED'}
Generated: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC

[1] TRAVERSAL SUMMARY
------------------------------------------------
Primary Vector: ${analysis.pathCellIds.join(' -> ')}
Total Waypoints: ${analysis.pathCellIds.length} sectors
Total Distance: ${analysis.totalDistanceKm} km
Estimated Overland Transit: ${analysis.estimatedHours} hours

[2] THREAT EVALUATION
------------------------------------------------
Cumulative Hazard Risk: ${analysis.totalRiskScore} points
Hazards Successfully Avoided: ${analysis.hazardsAvoided} sites
Risk Summary: ${analysis.riskText}

[3] SURVIVOR PROVISIONS LOG
------------------------------------------------
Starting Depot: Food: ${supplies.food} | Water: ${supplies.water} | Medicine: ${supplies.medicine}
Expedition Consumption: ${analysis.foodRequired} Food | ${analysis.waterRequired} Water
Projected Reserve At Evac:
  - Food: ${Math.max(0, supplies.food - analysis.foodRequired)}
  - Water: ${Math.max(0, supplies.water - analysis.waterRequired)}
  - Medicine: ${Math.max(0, supplies.medicine - analysis.medicineRequired)}

[4] TURN-BY-TURN WAYPOINT INSTRUCTIONS
------------------------------------------------
${analysis.steps
  .map(
    (s, idx) =>
      `Leg #${idx}: Sector ${s.cellId} [${s.name}] | Threat: ${
        s.threatLevel === 0 ? 'Clear' : 'Level ' + s.threatLevel
      }${s.scavenged ? ` | Scavenged: +${s.scavenged.amount} ${s.scavenged.type}` : ''}`
  )
  .join('\n')}

================================================
END OF MANIFEST // TRANSMIT VIA RADIO FREQ 146.520
================================================`;

  const handleCopy = () => {
    playClickSound();
    navigator.clipboard.writeText(manifestText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    playClickSound();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090909]/85 backdrop-blur-md flex items-center justify-center p-4 font-sans text-xs">
      <div className="bg-[#171717] border border-[#292929] rounded-xl max-w-2xl w-full p-5 shadow-2xl flex flex-col max-h-[85vh] text-[#FAFAFA]">
        <div className="flex items-center justify-between pb-3 border-b border-[#292929]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center text-[#A855F7]">
              <FileText className="w-4 h-4 text-[#A855F7]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#FAFAFA] tracking-tight">
                Emergency Route Manifest
              </h3>
              <p className="text-[11px] text-[#A0A0A0]">
                Pre-formatted dispatch for ham radio broadcast and offline field notes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-md text-[#A0A0A0] hover:text-[#FAFAFA] hover:bg-[#202020] transition-colors cursor-pointer"
            aria-label="Close manifest"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-4 flex-1 overflow-y-auto bg-[#0F0F0F] p-4 rounded-lg border border-[#292929] text-[#FAFAFA] whitespace-pre font-sans text-xs leading-relaxed select-all">
          {manifestText}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#292929]">
          <span className="text-[11px] text-[#A0A0A0]">
            Formatted for radio relay & field dispatch
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#292929] bg-[#202020] text-[#FAFAFA] hover:bg-[#252525] hover:border-[#383838] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Print Briefing</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#090909] font-bold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#090909]" /> : <Copy className="w-3.5 h-3.5 text-[#090909]" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Manifest'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
