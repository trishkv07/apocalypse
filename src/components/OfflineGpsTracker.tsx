import React from 'react';
import { CellData, RouteStep } from '../types';
import {
  Navigation,
  AlertOctagon,
  ChevronRight,
  RotateCcw,
  Play,
  Square,
  Apple,
  Droplet,
  Anchor,
} from 'lucide-react';
import { playClickSound, playThreatAlert, playRadarPing } from '../utils/sound';

interface OfflineGpsTrackerProps {
  currentStepIndex: number;
  routeSteps: RouteStep[];
  currentCell: CellData | null;
  onAdvanceStep: () => void;
  onResetGps: () => void;
  onReportThreatAtCurrentLocation: (cellId: string) => void;
  isAutoWalking: boolean;
  onToggleAutoWalk: () => void;
}

export const OfflineGpsTracker: React.FC<OfflineGpsTrackerProps> = ({
  currentStepIndex,
  routeSteps,
  currentCell,
  onAdvanceStep,
  onResetGps,
  onReportThreatAtCurrentLocation,
  isAutoWalking,
  onToggleAutoWalk,
}) => {
  if (!currentCell || routeSteps.length === 0) return null;

  const currentStep = routeSteps[currentStepIndex] || routeSteps[0];
  const isAtDestination = currentStepIndex >= routeSteps.length - 1;

  const handleReportThreat = () => {
    playThreatAlert();
    onReportThreatAtCurrentLocation(currentCell.id);
  };

  return (
    <div className="bg-[#0F0F0F] border border-[#292929] rounded-xl p-4 font-sans text-xs shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#292929]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4] shadow-[0_0_12px_rgba(6,182,212,0.25)] animate-pulse">
            <Navigation className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#FAFAFA] text-sm font-sans">Offline GPS Field Tracker</span>
              <span className="text-[10px] font-semibold text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded-full border border-[#06B6D4]/30">
                Satellite Fix: OK
              </span>
            </div>
            <span className="text-[11px] text-[#A0A0A0] font-sans">
              Traversing route step {currentStepIndex + 1} of {routeSteps.length}
            </span>
          </div>
        </div>

        {/* Current Coordinates Telemetry */}
        <div className="text-right">
          <div className="text-[#F59E0B] font-bold text-sm font-sans">
            Sector {currentCell.id}
          </div>
          <div className="text-[11px] text-[#A0A0A0] truncate max-w-[200px] font-sans">
            {currentCell.name}
          </div>
        </div>
      </div>

      {/* Real-time Field Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3 text-xs">
        <div className="bg-[#171717] p-2.5 rounded-lg border border-[#292929]">
          <span className="text-[11px] text-[#A0A0A0] block">Current Food</span>
          <span className="font-bold text-[#FAFAFA] flex items-center gap-1.5 mt-0.5">
            <Apple className="w-3.5 h-3.5 text-[#F59E0B]" />
            {currentStep.foodLeft} rations
          </span>
        </div>

        <div className="bg-[#171717] p-2.5 rounded-lg border border-[#292929]">
          <span className="text-[11px] text-[#A0A0A0] block">Current Water</span>
          <span className="font-bold text-[#FAFAFA] flex items-center gap-1.5 mt-0.5">
            <Droplet className="w-3.5 h-3.5 text-[#06B6D4]" />
            {currentStep.waterLeft} liters
          </span>
        </div>

        <div className="bg-[#171717] p-2.5 rounded-lg border border-[#292929]">
          <span className="text-[11px] text-[#A0A0A0] block">Local Hazard Risk</span>
          <span
            className={`font-bold mt-0.5 block ${
              currentCell.threatLevel > 0 ? 'text-[#F43F5E]' : 'text-[#10B981]'
            }`}
          >
            {currentCell.threatLevel === 0 ? 'Clear (0 Risk)' : `Threat Level ${currentCell.threatLevel}`}
          </span>
        </div>

        <div className="bg-[#171717] p-2.5 rounded-lg border border-[#292929]">
          <span className="text-[11px] text-[#A0A0A0] block">Expedition Status</span>
          <span className="font-bold text-[#FAFAFA] mt-0.5 block">
            {isAtDestination ? 'Extracted at Haven' : 'En Route'}
          </span>
        </div>
      </div>

      {/* Special Transit / Cable Ferry Instruction Banner */}
      {currentStep.transitNote && (
        <div className="mb-3 p-2.5 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/40 text-[#38bdf8] flex items-center gap-2">
          <Anchor className="w-4 h-4 text-[#38bdf8] shrink-0" />
          <span className="font-semibold text-xs leading-snug">{currentStep.transitNote}</span>
        </div>
      )}

      {/* Primary Action Row: Step Forward & Report Threat At Current Location */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-[#292929]">
        {/* Step Forward / Walk Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              playRadarPing(850 + currentStepIndex * 30);
              onAdvanceStep();
            }}
            disabled={isAtDestination}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-40 disabled:cursor-not-allowed text-[#090909] font-bold text-xs transition-colors cursor-pointer"
            title="Advance survivor one sector along calculated road path"
          >
            <span>Advance Step (Walk)</span>
            <ChevronRight className="w-4 h-4 text-[#090909]" />
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onToggleAutoWalk();
            }}
            className={`px-3 py-2 rounded-md font-bold transition-colors cursor-pointer ${
              isAutoWalking
                ? 'bg-[#F59E0B] text-[#090909]'
                : 'bg-[#202020] border border-[#292929] hover:bg-[#252525] text-[#FAFAFA]'
            }`}
            title="Auto-walk along route"
          >
            {isAutoWalking ? <Square className="w-3.5 h-3.5 fill-current text-[#090909]" /> : <Play className="w-3.5 h-3.5 fill-current text-[#F59E0B]" />}
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onResetGps();
            }}
            className="p-2 rounded-md bg-[#202020] border border-[#292929] hover:bg-[#252525] text-[#A0A0A0] hover:text-[#FAFAFA] transition-colors cursor-pointer"
            title="Reset GPS to Base Camp"
          >
            <RotateCcw className="w-4 h-4 text-[#A0A0A0]" />
          </button>
        </div>

        {/* User's Key Request: "report a new threat in my current location as well" */}
        <button
          type="button"
          onClick={handleReportThreat}
          className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold tracking-wide transition-colors shadow-md cursor-pointer text-xs"
          title="Report Zombie Swarm or Obstacle at current GPS sector and recalculate route immediately"
        >
          <AlertOctagon className="w-4 h-4 text-white" />
          <span>Report Threat at Current Location ({currentCell.id})</span>
        </button>
      </div>
    </div>
  );
};
