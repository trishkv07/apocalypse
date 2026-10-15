import React from 'react';
import { CellData, ThreatCategory, ThreatLevel } from '../types';
import { ShieldAlert, RefreshCw, AlertOctagon, Ban, Skull, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { playClickSound, playThreatAlert, playRecalculateChime } from '../utils/sound';

interface ThreatControlSectionProps {
  cells: CellData[];
  selectedThreatCellId: string;
  onChangeThreatCell: (id: string) => void;
  selectedThreatLevel: ThreatLevel;
  onChangeThreatLevel: (level: ThreatLevel) => void;
  selectedThreatCategory: ThreatCategory;
  onChangeThreatCategory: (cat: ThreatCategory) => void;
  onReportThreat: () => void;
  onRecalculate: () => void;
  onClearAllThreats: () => void;
  onInjectRandomHazards: () => void;
  statusMessage: string;
}

export const ThreatControlSection: React.FC<ThreatControlSectionProps> = ({
  cells,
  selectedThreatCellId,
  onChangeThreatCell,
  selectedThreatLevel,
  onChangeThreatLevel,
  selectedThreatCategory,
  onChangeThreatCategory,
  onReportThreat,
  onRecalculate,
  onClearAllThreats,
  onInjectRandomHazards,
  statusMessage,
}) => {
  return (
    <section id="threat-control" className="bg-[#171717] border border-[#292929] rounded-xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-[#292929]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#FAFAFA] tracking-tight font-sans">
            Threat Control
          </h2>
          <p className="text-xs text-[#A0A0A0] font-sans">
            Dynamic hazard reporting & real-time path replanning
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onInjectRandomHazards();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#292929] bg-[#202020] text-xs font-sans font-medium text-[#FAFAFA] hover:bg-[#252525] transition-colors cursor-pointer"
            title="Simulate random field intelligence updates"
          >
            <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Simulate Intel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClearAllThreats();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#292929] bg-[#202020] text-xs font-sans font-medium text-[#FAFAFA] hover:bg-[#252525] transition-colors cursor-pointer"
            title="Clear all recorded hazards"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Clear Grid</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end">
        {/* Cell Location Select */}
        <div className="md:col-span-4">
          <label htmlFor="threatCell" className="block text-xs font-sans font-medium text-[#A0A0A0] mb-1.5">
            Target Sector / Coordinate:
          </label>
          <div className="relative">
            <select
              id="threatCell"
              aria-label="Threat location"
              value={selectedThreatCellId}
              onChange={(e) => {
                playClickSound();
                onChangeThreatCell(e.target.value);
              }}
              className="w-full bg-[#202020] border border-[#292929] rounded-md px-3 py-2 text-xs sm:text-sm text-[#FAFAFA] font-sans focus:border-[#F59E0B] focus:outline-none transition-colors cursor-pointer"
            >
              {cells.map((c) => {
                const threatLabel =
                  c.threatLevel === 0
                    ? 'Clear'
                    : c.threatLevel === 1
                    ? 'Low'
                    : c.threatLevel === 2
                    ? 'Med'
                    : c.threatLevel === 3
                    ? 'High'
                    : 'BLOCKED';
                return (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.name} [{threatLabel}]
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Threat Level Modifier */}
        <div className="md:col-span-4">
          <label className="block text-xs font-sans font-medium text-[#A0A0A0] mb-1.5">
            Threat Severity to Apply:
          </label>
          <div className="grid grid-cols-5 gap-1 p-1 bg-[#202020] rounded-md border border-[#292929]">
            {[
              { level: 0 as ThreatLevel, label: 'Clear', color: 'text-[#10B981]' },
              { level: 1 as ThreatLevel, label: 'Low', color: 'text-[#EAB308]' },
              { level: 2 as ThreatLevel, label: 'Med', color: 'text-[#F97316]' },
              { level: 3 as ThreatLevel, label: 'High', color: 'text-[#EF4444]' },
              { level: 4 as ThreatLevel, label: 'Block', color: 'text-[#F43F5E] font-bold' },
            ].map((opt) => (
              <button
                key={opt.level}
                type="button"
                onClick={() => {
                  playClickSound();
                  onChangeThreatLevel(opt.level);
                }}
                className={`py-1.5 text-center text-xs font-sans rounded transition-colors cursor-pointer ${
                  selectedThreatLevel === opt.level
                    ? 'bg-[#292929] text-[#FAFAFA] shadow-xs font-semibold'
                    : 'text-[#A0A0A0] hover:text-[#FAFAFA]'
                }`}
              >
                <span className={opt.color}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Threat Category */}
        <div className="md:col-span-2">
          <label className="block text-xs font-sans font-medium text-[#A0A0A0] mb-1.5">
            Hazard Type:
          </label>
          <select
            value={selectedThreatCategory}
            onChange={(e) => {
              playClickSound();
              onChangeThreatCategory(e.target.value as ThreatCategory);
            }}
            className="w-full bg-[#202020] border border-[#292929] rounded-md px-2.5 py-2 text-xs text-[#FAFAFA] font-sans focus:border-[#F59E0B] focus:outline-none cursor-pointer"
          >
            <option value="patrol">Hostiles / Swarm</option>
            <option value="radiation">Radiation</option>
            <option value="rubble">Rubble</option>
            <option value="biohazard">Biohazard</option>
            <option value="clear">Clear</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="md:col-span-2 flex flex-col gap-2">
          {/* Required #reportThreat button */}
          <button
            id="reportThreat"
            type="button"
            onClick={() => {
              playThreatAlert();
              onReportThreat();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold font-sans tracking-wide shadow-md transition-colors cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-white" />
            <span>Report New Threat</span>
          </button>
        </div>
      </div>

      {/* Recalculate and Status line */}
      <div className="mt-4 pt-3 border-t border-[#292929] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Required #recalculate button */}
        <button
          id="recalculate"
          type="button"
          onClick={() => {
            playRecalculateChime();
            onRecalculate();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#F59E0B] hover:bg-[#D97706] text-[#090909] text-xs sm:text-sm font-bold font-sans tracking-wide shadow-md transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-[#090909]" />
          <span>Recalculate Route</span>
        </button>

        {/* Required #message status live element */}
        <div className="flex-1 min-w-0">
          <p
            id="message"
            role="status"
            aria-live="polite"
            className="text-xs font-sans text-[#FAFAFA] bg-[#202020] border border-[#292929] rounded-md px-3 py-2 break-words"
          >
            {statusMessage || 'System ready. Select a sector to report threats or recalculate route.'}
          </p>
        </div>
      </div>
    </section>
  );
};
