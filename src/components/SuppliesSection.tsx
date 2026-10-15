import React from 'react';
import { SurvivorSupplies, RouteAnalysisData } from '../types';
import { Apple, Droplet, HeartPulse, Plus, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface SuppliesSectionProps {
  supplies: SurvivorSupplies;
  onUpdateSupplies: (updater: (prev: SurvivorSupplies) => SurvivorSupplies) => void;
  analysis: RouteAnalysisData;
}

export const SuppliesSection: React.FC<SuppliesSectionProps> = ({
  supplies,
  onUpdateSupplies,
  analysis,
}) => {
  const foodDeficit = analysis.isReachable ? Math.max(0, analysis.foodRequired - supplies.food) : 0;
  const waterDeficit = analysis.isReachable ? Math.max(0, analysis.waterRequired - supplies.water) : 0;
  const hasDeficit = foodDeficit > 0 || waterDeficit > 0;

  const handleAdjust = (type: keyof SurvivorSupplies, delta: number) => {
    playClickSound();
    onUpdateSupplies((prev) => ({
      ...prev,
      [type]: Math.max(0, Math.min(99, prev[type] + delta)),
    }));
  };

  return (
    <section id="supplies" className="bg-[#171717] border border-[#292929] rounded-xl p-4 sm:p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#292929]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#FAFAFA] tracking-tight font-sans">
            Survivor Supplies
          </h2>
          <p className="text-xs text-[#A0A0A0] font-sans">
            Expedition rations & medical stores
          </p>
        </div>

        {analysis.isReachable && (
          <div className="flex items-center gap-1.5 text-xs font-sans">
            {hasDeficit ? (
              <span className="flex items-center gap-1 text-[#F43F5E] bg-[#F43F5E]/10 px-2.5 py-0.5 rounded-full border border-[#F43F5E]/30 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F43F5E]" />
                <span>Deficit Detected</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full border border-[#10B981]/30 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Sufficient Reserves</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid of supply cards containing required divs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Food Card */}
        <div className="bg-[#202020] border border-[#292929] rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                <Apple className="w-4.5 h-4.5 text-[#F59E0B]" />
              </div>
              <div>
                {/* Required #food div */}
                <div id="food" className="text-lg font-bold font-sans text-[#FAFAFA] tabular-nums">
                  Food: {supplies.food}
                </div>
                <div className="text-[11px] text-[#A0A0A0] font-sans">Rations / Pack</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleAdjust('food', -1)}
                className="w-7 h-7 rounded border border-[#292929] bg-[#171717] text-[#FAFAFA] hover:bg-[#292929] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                title="Decrease food"
                aria-label="Decrease food"
              >
                <Minus className="w-3 h-3 text-[#A0A0A0] hover:text-[#FAFAFA]" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjust('food', 1)}
                className="w-7 h-7 rounded border border-[#292929] bg-[#171717] text-[#FAFAFA] hover:bg-[#292929] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                title="Increase food"
                aria-label="Increase food"
              >
                <Plus className="w-3 h-3 text-[#A0A0A0] hover:text-[#FAFAFA]" />
              </button>
            </div>
          </div>

          {/* Planned usage telemetry */}
          <div className="mt-3 pt-2.5 border-t border-[#292929] text-[11px] font-sans text-[#A0A0A0] flex justify-between items-center">
            <span>Route burn:</span>
            <span className={foodDeficit > 0 ? 'text-[#F43F5E] font-semibold' : 'text-[#FAFAFA]'}>
              {analysis.foodRequired} needed {foodDeficit > 0 ? `(-${foodDeficit})` : ''}
            </span>
          </div>
        </div>

        {/* Water Card */}
        <div className="bg-[#202020] border border-[#292929] rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4] shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                <Droplet className="w-4.5 h-4.5 text-[#06B6D4]" />
              </div>
              <div>
                {/* Required #water div */}
                <div id="water" className="text-lg font-bold font-sans text-[#FAFAFA] tabular-nums">
                  Water: {supplies.water}
                </div>
                <div className="text-[11px] text-[#A0A0A0] font-sans">Liters Purified</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleAdjust('water', -1)}
                className="w-7 h-7 rounded border border-[#292929] bg-[#171717] text-[#FAFAFA] hover:bg-[#292929] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                title="Decrease water"
                aria-label="Decrease water"
              >
                <Minus className="w-3 h-3 text-[#A0A0A0] hover:text-[#FAFAFA]" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjust('water', 1)}
                className="w-7 h-7 rounded border border-[#292929] bg-[#171717] text-[#FAFAFA] hover:bg-[#292929] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                title="Increase water"
                aria-label="Increase water"
              >
                <Plus className="w-3 h-3 text-[#A0A0A0] hover:text-[#FAFAFA]" />
              </button>
            </div>
          </div>

          {/* Planned usage telemetry */}
          <div className="mt-3 pt-2.5 border-t border-[#292929] text-[11px] font-sans text-[#A0A0A0] flex justify-between items-center">
            <span>Route burn:</span>
            <span className={waterDeficit > 0 ? 'text-[#F43F5E] font-semibold' : 'text-[#FAFAFA]'}>
              {analysis.waterRequired} needed {waterDeficit > 0 ? `(-${waterDeficit})` : ''}
            </span>
          </div>
        </div>

        {/* Medicine Card */}
        <div className="bg-[#202020] border border-[#292929] rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <HeartPulse className="w-4.5 h-4.5 text-[#10B981]" />
              </div>
              <div>
                {/* Required #medicine div */}
                <div id="medicine" className="text-lg font-bold font-sans text-[#FAFAFA] tabular-nums">
                  Medicine: {supplies.medicine}
                </div>
                <div className="text-[11px] text-[#A0A0A0] font-sans">Medkits / Stims</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleAdjust('medicine', -1)}
                className="w-7 h-7 rounded border border-[#292929] bg-[#171717] text-[#FAFAFA] hover:bg-[#292929] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                title="Decrease medicine"
                aria-label="Decrease medicine"
              >
                <Minus className="w-3 h-3 text-[#A0A0A0] hover:text-[#FAFAFA]" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjust('medicine', 1)}
                className="w-7 h-7 rounded border border-[#292929] bg-[#171717] text-[#FAFAFA] hover:bg-[#292929] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                title="Increase medicine"
                aria-label="Increase medicine"
              >
                <Plus className="w-3 h-3 text-[#A0A0A0] hover:text-[#FAFAFA]" />
              </button>
            </div>
          </div>

          {/* Planned usage telemetry */}
          <div className="mt-3 pt-2.5 border-t border-[#292929] text-[11px] font-sans text-[#A0A0A0] flex justify-between items-center">
            <span>Hazard defense:</span>
            <span className="text-[#FAFAFA]">
              {analysis.medicineRequired > 0 ? `${analysis.medicineRequired} recommended` : 'None required'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
