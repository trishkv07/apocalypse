import React, { useState, useMemo } from 'react';
import { CellData, GridCoord, ThreatLevel } from '../types';
import {
  AlertOctagon,
  ShieldCheck,
  MapPin,
  Compass,
  ArrowRight,
  Radio,
  CheckCircle2,
  X,
  Apple,
  Droplet,
  HeartPulse,
} from 'lucide-react';
import { playClickSound, playRecalculateChime } from '../utils/sound';
import { findNextSafestSector } from '../utils/dijkstra';

interface EmergencyHavenModalProps {
  isOpen: boolean;
  onClose: () => void;
  compromisedCell: CellData | null;
  threatLevel: ThreatLevel;
  threatCategory: string;
  cells: CellData[];
  startCoord: GridCoord;
  onConfirmNewDestination: (newDestId: string) => void;
}

export const EmergencyHavenModal: React.FC<EmergencyHavenModalProps> = ({
  isOpen,
  onClose,
  compromisedCell,
  threatLevel,
  threatCategory,
  cells,
  startCoord,
  onConfirmNewDestination,
}) => {
  // Find recommended next safest sector
  const recommendedSafest = useMemo(() => {
    if (!compromisedCell) return null;
    return findNextSafestSector(cells, startCoord, compromisedCell.id);
  }, [cells, startCoord, compromisedCell]);

  const [selectedDestId, setSelectedDestId] = useState<string>('');

  // Default selection to recommended safest
  React.useEffect(() => {
    if (recommendedSafest) {
      setSelectedDestId(recommendedSafest.id);
    }
  }, [recommendedSafest]);

  if (!isOpen || !compromisedCell) return null;

  // Safe candidates for selection (not start, not compromised, threat < 4)
  const safeCandidates = cells.filter(
    (c) => c.id !== compromisedCell.id && !c.isStart && c.threatLevel < 4
  );

  const handleAcceptRecommended = () => {
    if (!recommendedSafest) return;
    playRecalculateChime();
    onConfirmNewDestination(recommendedSafest.id);
    onClose();
  };

  const handleConfirmSelected = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDestId) return;
    playRecalculateChime();
    onConfirmNewDestination(selectedDestId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090909]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-[#171717] border border-[#292929] rounded-xl max-w-lg w-full p-6 shadow-2xl text-xs my-8 text-[#FAFAFA]">
        {/* Header with High Alert Pulsing Red */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#292929]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444] shadow-[0_0_14px_rgba(239,68,68,0.3)] shrink-0 animate-pulse">
              <AlertOctagon className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
                <h2 className="text-base sm:text-lg font-bold text-[#FAFAFA] tracking-tight">
                  Destination Compromised!
                </h2>
              </div>
              <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                Hazard reported at extraction point. Emergency recalibration required.
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
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hazard Briefing Banner */}
        <div className="bg-[#202020] border border-[#EF4444]/40 rounded-lg p-3.5 mb-5 space-y-1.5">
          <div className="flex items-center gap-2 text-[#EF4444] font-semibold text-xs">
            <MapPin className="w-4 h-4 text-[#EF4444]" />
            <span>
              Target Sector {compromisedCell.id} — {compromisedCell.name}
            </span>
          </div>
          <p className="text-[#A0A0A0] text-xs leading-relaxed">
            A <span className="text-[#FAFAFA] font-medium">Level {threatLevel} Hazard</span> ({threatCategory}) was reported directly at your destination. Survivors cannot safely extract to this location. Please designate your new evacuation haven so BEACON can recalibrate the survival route.
          </p>
        </div>

        {/* Top Recommendation: Next Safest Point */}
        {recommendedSafest && (
          <div className="bg-[#10B981]/10 border border-[#10B981]/35 rounded-xl p-4 mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#10B981] font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>Recommended Next Safest Haven</span>
              </div>
              <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded font-bold border border-[#10B981]/30">
                0 Hazards · Safe Passage
              </span>
            </div>

            <div className="bg-[#171717]/80 rounded-lg p-3 border border-[#292929] flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-[#FAFAFA]">
                  Sector {recommendedSafest.id} — {recommendedSafest.name}
                </div>
                <div className="text-[11px] text-[#A0A0A0] mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>Row {recommendedSafest.r + 1}, Col {['A', 'B', 'C', 'D', 'E'][recommendedSafest.c]}</span>
                  {recommendedSafest.supplyType !== 'none' && (
                    <span className="flex items-center gap-1 text-[#F59E0B]">
                      {recommendedSafest.supplyType === 'food' && <Apple className="w-3 h-3 text-[#F59E0B]" />}
                      {recommendedSafest.supplyType === 'water' && <Droplet className="w-3 h-3 text-[#06B6D4]" />}
                      {recommendedSafest.supplyType === 'medicine' && <HeartPulse className="w-3 h-3 text-[#10B981]" />}
                      Has {recommendedSafest.supplyType} reserve
                    </span>
                  )}
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-between justify-center text-[#10B981] shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAcceptRecommended}
              className="w-full py-2.5 px-4 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#090909] font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
            >
              <span>Accept Recommended Haven ({recommendedSafest.id}) & Calibrate Route</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Alternative Selection: Choose Any Safe Sector */}
        <form onSubmit={handleConfirmSelected} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-[#F59E0B]" />
              <span>Or Designate Another Evacuation Haven:</span>
            </label>
            <select
              value={selectedDestId}
              onChange={(e) => {
                playClickSound();
                setSelectedDestId(e.target.value);
              }}
              className="w-full bg-[#202020] border border-[#292929] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#FAFAFA] font-sans focus:border-[#F59E0B] focus:outline-none transition-colors cursor-pointer"
            >
              {safeCandidates.map((c) => (
                <option key={`alt-haven-${c.id}`} value={c.id}>
                  Sector {c.id} — {c.name} {c.threatLevel === 0 ? '(Safe Zone)' : `(Threat: Lvl ${c.threatLevel})`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#292929] text-[#A0A0A0] hover:text-[#FAFAFA] text-xs font-medium border border-[#292929] transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="submit"
              disabled={!selectedDestId}
              className="px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-[#090909] text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#090909]" />
              <span>Calibrate Route to Sector {selectedDestId}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
