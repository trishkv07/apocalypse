import React, { useState } from 'react';
import { CellData, ScavengeStrategy, SurvivorSupplies } from '../types';
import {
  Compass,
  MapPin,
  Radio,
  Apple,
  Droplet,
  HeartPulse,
  ShieldAlert,
  Zap,
  CheckCircle2,
  X,
  ArrowRight,
  Shield,
  Footprints,
} from 'lucide-react';
import { playClickSound, playRecalculateChime } from '../utils/sound';

interface ExpeditionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  cells: CellData[];
  initialSupplies: SurvivorSupplies;
  currentStartId: string;
  currentDestId: string;
  currentStrategy: ScavengeStrategy;
  onCalibrate: (
    startId: string,
    destId: string,
    supplies: SurvivorSupplies,
    strategy: ScavengeStrategy
  ) => void;
}

export const ExpeditionSetupModal: React.FC<ExpeditionSetupModalProps> = ({
  isOpen,
  onClose,
  cells,
  initialSupplies,
  currentStartId,
  currentDestId,
  currentStrategy,
  onCalibrate,
}) => {
  const [selectedStartId, setSelectedStartId] = useState(currentStartId || 'A1');
  const [selectedDestId, setSelectedDestId] = useState(currentDestId || 'E5');
  const [food, setFood] = useState(initialSupplies.food);
  const [water, setWater] = useState(initialSupplies.water);
  const [medicine, setMedicine] = useState(initialSupplies.medicine);
  const [strategy, setStrategy] = useState<ScavengeStrategy>(currentStrategy || 'auto');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playRecalculateChime();
    onCalibrate(
      selectedStartId,
      selectedDestId,
      {
        food: Math.max(0, food),
        water: Math.max(0, water),
        medicine: Math.max(0, medicine),
      },
      strategy
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090909]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-[#171717] border border-[#292929] rounded-xl max-w-xl w-full p-6 shadow-2xl text-xs my-8 text-[#FAFAFA]">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#292929]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shadow-[0_0_14px_rgba(245,158,11,0.25)] shrink-0">
              <Compass className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold text-[#FAFAFA] tracking-tight">
                  Expedition Pre-Flight Calibration
                </h2>
              </div>
              <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                Specify your settlement base camp & inventory before establishing your survival route.
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
            aria-label="Close setup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 1: Settlement Base Camp & Evacuation Target */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#10B981]" />
                <span>1. Settlement Base Camp (Start Location):</span>
              </label>
              <select
                value={selectedStartId}
                onChange={(e) => {
                  playClickSound();
                  setSelectedStartId(e.target.value);
                }}
                className="w-full bg-[#202020] border border-[#292929] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#FAFAFA] font-sans focus:border-[#10B981] focus:outline-none transition-colors cursor-pointer"
              >
                {cells.map((c) => (
                  <option key={`start-${c.id}`} value={c.id}>
                    Sector {c.id} — {c.name} {c.threatLevel > 0 ? `(Threat: Lvl ${c.threatLevel})` : '(Safe Zone)'}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#A0A0A0] mt-1">
                Select the fortified sanctuary where your survivors are currently situated.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-[#F59E0B]" />
                <span>Evacuation Haven Target (Extraction LZ):</span>
              </label>
              <select
                value={selectedDestId}
                onChange={(e) => {
                  playClickSound();
                  setSelectedDestId(e.target.value);
                }}
                className="w-full bg-[#202020] border border-[#292929] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#FAFAFA] font-sans focus:border-[#F59E0B] focus:outline-none transition-colors cursor-pointer"
              >
                {cells.map((c) => (
                  <option key={`dest-${c.id}`} value={c.id}>
                    Sector {c.id} — {c.name} {c.threatLevel === 4 ? '(BLOCKED HAZARD)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STEP 2: Current Survivor Provisions */}
          <div>
            <label className="block text-xs font-semibold text-[#FAFAFA] mb-2 flex items-center gap-1.5">
              <Apple className="w-4 h-4 text-[#F59E0B]" />
              <span>2. Current Survivor Resources:</span>
            </label>

            <div className="grid grid-cols-3 gap-3">
              {/* Food */}
              <div className="bg-[#202020] p-3 rounded-lg border border-[#292929] flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[#F59E0B] font-bold mb-1.5">
                  <Apple className="w-4 h-4 text-[#F59E0B]" />
                  <span>Food Rations</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={food}
                  onChange={(e) => setFood(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#171717] border border-[#292929] rounded-md px-2.5 py-1.5 text-base font-bold text-[#FAFAFA] text-center focus:border-[#F59E0B] focus:outline-none"
                />
                <span className="text-[10px] text-[#A0A0A0] block text-center mt-1">1 unit / move</span>
              </div>

              {/* Water */}
              <div className="bg-[#202020] p-3 rounded-lg border border-[#292929] flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[#06B6D4] font-bold mb-1.5">
                  <Droplet className="w-4 h-4 text-[#06B6D4]" />
                  <span>Water (L)</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={water}
                  onChange={(e) => setWater(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#171717] border border-[#292929] rounded-md px-2.5 py-1.5 text-base font-bold text-[#FAFAFA] text-center focus:border-[#06B6D4] focus:outline-none"
                />
                <span className="text-[10px] text-[#A0A0A0] block text-center mt-1">1 liter / move</span>
              </div>

              {/* Medicine */}
              <div className="bg-[#202020] p-3 rounded-lg border border-[#292929] flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[#10B981] font-bold mb-1.5">
                  <HeartPulse className="w-4 h-4 text-[#10B981]" />
                  <span>Medicine</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={medicine}
                  onChange={(e) => setMedicine(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#171717] border border-[#292929] rounded-md px-2.5 py-1.5 text-base font-bold text-[#FAFAFA] text-center focus:border-[#10B981] focus:outline-none"
                />
                <span className="text-[10px] text-[#A0A0A0] block text-center mt-1">Trauma kits</span>
              </div>
            </div>

            <div className="text-[11px] text-[#A0A0A0] mt-2.5 bg-[#202020] p-2.5 rounded-lg border border-[#292929] leading-relaxed">
              <span className="text-[#F59E0B] font-semibold">Smart Resource Calibration:</span> If supplies are insufficient for direct transit, BEACON will automatically reroute to scavenge from nearby food depots or water reserves while actively evading zombie hot zones.
            </div>
          </div>

          {/* STEP 3: Traversal Strategy */}
          <div>
            <label className="block text-xs font-semibold text-[#FAFAFA] mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#FACC15]" />
              <span>3. Traversal Priority Strategy:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setStrategy('auto');
                }}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  strategy === 'auto'
                    ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#FAFAFA]'
                    : 'bg-[#202020] border-[#292929] text-[#A0A0A0] hover:text-[#FAFAFA] hover:border-[#383838]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-[#FAFAFA]">
                  <Compass className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Auto-Scavenge</span>
                </div>
                <div className="text-[10px] text-[#A0A0A0] leading-snug">
                  Collects supplies on route if low, avoids red zones.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setStrategy('stealth');
                }}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  strategy === 'stealth'
                    ? 'bg-[#10B981]/15 border-[#10B981] text-[#FAFAFA]'
                    : 'bg-[#202020] border-[#292929] text-[#A0A0A0] hover:text-[#FAFAFA] hover:border-[#383838]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-[#FAFAFA]">
                  <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Stealth Evasion</span>
                </div>
                <div className="text-[10px] text-[#A0A0A0] leading-snug">
                  Strictly avoids all zombies, patrols, & biohazards.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setStrategy('speed');
                }}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  strategy === 'speed'
                    ? 'bg-[#06B6D4]/15 border-[#06B6D4] text-[#FAFAFA]'
                    : 'bg-[#202020] border-[#292929] text-[#A0A0A0] hover:text-[#FAFAFA] hover:border-[#383838]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-[#FAFAFA]">
                  <Footprints className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span>Direct Speed</span>
                </div>
                <div className="text-[10px] text-[#A0A0A0] leading-snug">
                  Fastest route directly to evacuation haven.
                </div>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-[#292929] flex items-center justify-between">
            <span className="text-[11px] text-[#A0A0A0]">
              Deterministic offline calculation
            </span>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#090909] font-bold text-xs tracking-wide transition-all shadow-lg cursor-pointer"
            >
              <span>Calibrate Survival Route</span>
              <ArrowRight className="w-4 h-4 text-[#090909]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
