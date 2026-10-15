import React from 'react';
import { RouteAnalysisData, RouteStep } from '../types';
import {
  Compass,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Play,
  Square,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Anchor,
  Info,
} from 'lucide-react';
import { playClickSound, playRadarPing } from '../utils/sound';

interface RouteAnalysisSectionProps {
  analysis: RouteAnalysisData;
  isSimulating: boolean;
  activeSimulationStep: number | null;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onStepSimulation: () => void;
}

export const RouteAnalysisSection: React.FC<RouteAnalysisSectionProps> = ({
  analysis,
  isSimulating,
  activeSimulationStep,
  onStartSimulation,
  onStopSimulation,
  onStepSimulation,
}) => {
  return (
    <section id="route-analysis" className="bg-[#171717] border border-[#292929] rounded-xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-[#292929]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#FAFAFA] tracking-tight font-sans">
            Route Analysis
          </h2>
          <p className="text-xs text-[#A0A0A0] font-sans">
            Telemetry metrics, hazard exposure, and waypoint itinerary
          </p>
        </div>

        {/* Simulation Controls */}
        {analysis.isReachable && analysis.steps.length > 0 && (
          <div className="flex items-center gap-2">
            {!isSimulating ? (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onStartSimulation();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#06B6D4] hover:bg-[#0891B2] text-[#090909] font-sans text-xs font-bold transition-colors cursor-pointer"
                title="Play turn-by-turn route simulation"
              >
                <Play className="w-3.5 h-3.5 fill-current text-[#090909]" />
                <span>Simulate Route</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onStepSimulation();
                  }}
                  className="px-2.5 py-1.5 rounded-md border border-[#06B6D4] bg-[#06B6D4]/15 text-[#06B6D4] font-sans text-xs font-medium hover:bg-[#06B6D4]/25 transition-colors cursor-pointer"
                >
                  Step Next
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onStopSimulation();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#EF4444] hover:bg-[#DC2626] text-white font-sans text-xs font-bold transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-white" />
                  <span>Halt</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Required Telemetry Paragraphs with High Visibility */}
      <div className="space-y-3 mb-5">
        <div className="bg-[#202020] border border-[#292929] rounded-lg p-3.5">
          <div className="text-xs uppercase text-[#A0A0A0] mb-1.5 flex items-center gap-2 font-medium">
            <Compass className="w-4 h-4 text-[#F59E0B]" />
            <span className="font-sans">Navigation Path Summary:</span>
          </div>
          {/* Required #routeSummary paragraph */}
          <p
            id="routeSummary"
            className="text-xs sm:text-sm font-sans text-[#FAFAFA] break-words leading-relaxed"
          >
            {analysis.summaryText || 'Calculating route...'}
          </p>
        </div>

        <div className="bg-[#202020] border border-[#292929] rounded-lg p-3.5">
          <div className="text-xs uppercase text-[#A0A0A0] mb-1.5 flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-[#F43F5E]" />
            <span className="font-sans">Hazard Risk Evaluation:</span>
          </div>
          {/* Required #riskSummary paragraph */}
          <p
            id="riskSummary"
            className="text-xs sm:text-sm font-sans text-[#FAFAFA] break-words leading-relaxed"
          >
            {analysis.riskText || 'Assessing grid threat factors...'}
          </p>
        </div>
      </div>

      {/* KPI Telemetry Strip */}
      {analysis.isReachable ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 font-sans">
          <div className="bg-[#202020] border border-[#292929] rounded-lg p-3">
            <span className="text-[11px] uppercase text-[#A0A0A0] block">Total Distance</span>
            <div className="text-lg font-bold text-[#FAFAFA] tabular-nums mt-0.5">
              {analysis.totalDistanceKm} <span className="text-xs font-normal text-[#A0A0A0]">km</span>
            </div>
            <span className="text-[11px] text-[#A0A0A0]">{analysis.steps.length - 1} grid steps</span>
          </div>

          <div className="bg-[#202020] border border-[#292929] rounded-lg p-3">
            <span className="text-[11px] uppercase text-[#A0A0A0] block">Estimated Transit</span>
            <div className="text-lg font-bold text-[#FAFAFA] tabular-nums mt-0.5">
              {analysis.estimatedHours} <span className="text-xs font-normal text-[#A0A0A0]">hrs</span>
            </div>
            <span className="text-[11px] text-[#A0A0A0]">At safe overland pace</span>
          </div>

          <div className="bg-[#202020] border border-[#292929] rounded-lg p-3">
            <span className="text-[11px] uppercase text-[#A0A0A0] block">Total Risk Index</span>
            <div className={`text-lg font-bold tabular-nums mt-0.5 ${analysis.totalRiskScore > 10 ? 'text-[#F43F5E]' : 'text-[#10B981]'}`}>
              {analysis.totalRiskScore} <span className="text-xs font-normal text-[#A0A0A0]">pts</span>
            </div>
            <span className="text-[11px] text-[#A0A0A0]">
              {analysis.totalRiskScore === 0 ? 'Zero Threat Path' : 'Hazard Exposure'}
            </span>
          </div>

          <div className="bg-[#202020] border border-[#292929] rounded-lg p-3">
            <span className="text-[11px] uppercase text-[#A0A0A0] block">Hazards Evaded</span>
            <div className="text-lg font-bold text-[#06B6D4] tabular-nums mt-0.5">
              {analysis.hazardsAvoided} <span className="text-xs font-normal text-[#A0A0A0]">sites</span>
            </div>
            <span className="text-[11px] text-[#A0A0A0]">Bypassed via Dijkstra</span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-[#F43F5E]/40 bg-[#F43F5E]/10 text-[#F43F5E] text-xs font-sans flex items-center gap-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-[#F43F5E] shrink-0" />
          <div>
            <strong className="block text-sm text-[#FAFAFA]">Rerouting Failure: Target Isolated</strong>
            All orthogonal avenues from start to extraction are currently severed by impassable barricades or extreme threat concentrations. Remove one or more roadblocks above to restore viability.
          </div>
        </div>
      )}

      {/* Cable Ferry River Crossing Active Alert */}
      {analysis.isReachable && analysis.hasCableFerryCrossing && (
        <div className="bg-[#0e2439] border border-[#38bdf8]/60 rounded-xl p-3.5 mb-5 shadow-lg flex items-start gap-3 animate-pulse">
          <div className="p-2.5 rounded-lg bg-[#38bdf8]/20 text-[#38bdf8] shrink-0 border border-[#38bdf8]/40">
            <Anchor className="w-5 h-5 text-[#38bdf8]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] font-sans">
                River Water Transit Protocol: Cable Ferry Crossing Active
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#38bdf8]/25 text-[#38bdf8] font-bold border border-[#38bdf8]/50">
                Sector C3 ⇄ Sector D4
              </span>
            </div>
            <p className="text-xs text-[#FAFAFA] leading-relaxed font-sans">
              This expedition itinerary routes survivors across the <strong>Blackwater River</strong> via the <strong>C3 ⇄ D4 Cable Ferry</strong>. Survivors must board the manual steel-winch pontoon barge between the <em>C3 River Ferry Landing & Docks</em> (north bank) and the <em>D4 Bakery River Wharf</em> (south bank). This safe water crossing allows bypassing the collapsed Central Metro Highway Bridge without hazardous detours.
            </p>
          </div>
        </div>
      )}

      {/* Strategic River Crossing Directives (Beacon Reference) */}
      <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl p-3 sm:p-3.5 mb-5">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#292929]">
          <div className="flex items-center gap-2">
            <Anchor className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="text-xs font-bold uppercase tracking-wide text-[#FAFAFA] font-sans">
              River Crossings & Water Obstacle Guide
            </span>
          </div>
          <span className="text-[10px] text-[#A0A0A0] font-sans">Blackwater River Barrier</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
          <div className="p-2 rounded-lg bg-[#142334] border border-[#38bdf8]/30 flex items-start gap-2">
            <span className="text-sm shrink-0">⚓</span>
            <div>
              <div className="font-bold text-[#38bdf8] text-[11px] flex items-center gap-1.5">
                <span>C3 ⇄ D4 Cable Ferry & Pontoon</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40">Active</span>
              </div>
              <p className="text-[11px] text-[#A0A0A0] mt-0.5 leading-snug">
                Operational low-water manual cable barge & floating pontoon. Direct walkable link between C3 docks & D4 wharf.
              </p>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[#202020] border border-[#2e2e2e] flex items-start gap-2">
            <span className="text-sm shrink-0">🌉</span>
            <div>
              <div className="font-bold text-[#FAFAFA] text-[11px] flex items-center gap-1.5">
                <span>E3 ⇄ E4 Haven Suspension Bridge</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">Intact</span>
              </div>
              <p className="text-[11px] text-[#A0A0A0] mt-0.5 leading-snug">
                Reinforced high-clearance bridge along University Corridor into the Southern Haven.
              </p>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[#202020] border border-[#2e2e2e] flex items-start gap-2">
            <span className="text-sm shrink-0">🌉</span>
            <div>
              <div className="font-bold text-[#FAFAFA] text-[11px] flex items-center gap-1.5">
                <span>B3 ⇄ B4 West Truss Bridge</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">Intact</span>
              </div>
              <p className="text-[11px] text-[#A0A0A0] mt-0.5 leading-snug">
                Heavy industrial road bridge connecting West Concourse with South Industrial cloverleaf.
              </p>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[#261317] border border-[#f43f5e]/30 flex items-start gap-2">
            <span className="text-sm shrink-0">❌</span>
            <div>
              <div className="font-bold text-[#f43f5e] text-[11px] flex items-center gap-1.5">
                <span>C3 ⇄ C4 Central Metro Span</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/40">Collapsed</span>
              </div>
              <p className="text-[11px] text-[#A0A0A0] mt-0.5 leading-snug">
                Broadway bridge center span dropped into river ravine. Impassable structural disaster zone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Waypoint Itinerary Breakdown */}
      {analysis.isReachable && analysis.steps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-sans font-bold text-[#FAFAFA] uppercase tracking-wide">
              Waypoint Log & Projected Inventory
            </h3>
            <span className="text-[11px] font-sans text-[#A0A0A0]">
              {analysis.steps.length} Sectors Traversed
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto rounded-lg border border-[#292929] divide-y divide-[#292929] font-sans text-xs bg-[#171717]">
            {analysis.steps.map((step, idx) => {
              const isCurrentSim = activeSimulationStep === idx;
              return (
                <div
                  key={`${step.cellId}-${idx}`}
                  className={`p-2.5 flex items-center justify-between gap-3 transition-colors ${
                    isCurrentSim
                      ? 'bg-[#06B6D4]/15 border-l-2 border-[#06B6D4]'
                      : step.isCableFerryCrossing
                      ? 'bg-[#38bdf8]/10 border-l-2 border-[#38bdf8]'
                      : idx === 0
                      ? 'bg-[#10B981]/10'
                      : idx === analysis.steps.length - 1
                      ? 'bg-[#F59E0B]/10'
                      : 'hover:bg-[#202020]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      step.isCableFerryCrossing
                        ? 'bg-[#38bdf8] text-[#090909] border-[#ffffff]'
                        : 'bg-[#202020] border-[#292929] text-[#FAFAFA]'
                    }`}>
                      {step.isCableFerryCrossing ? '⚓' : idx === 0 ? 'S' : idx === analysis.steps.length - 1 ? 'E' : idx}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#FAFAFA]">{step.cellId}</span>
                        <span className="text-[#A0A0A0] truncate">{step.name}</span>
                        {step.isCableFerryCrossing && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/40">
                            CABLE FERRY
                          </span>
                        )}
                      </div>
                      {step.transitNote && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#38bdf8]">
                          <Anchor className="w-3 h-3 text-[#38bdf8] shrink-0" />
                          <span>{step.transitNote}</span>
                        </div>
                      )}
                      {step.scavenged && (
                        <span className="text-[11px] text-[#10B981] font-medium block mt-0.5">
                          Scavenged: +{step.scavenged.amount} {step.scavenged.type}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#A0A0A0] shrink-0 font-sans">
                    <div>
                      <span className="text-[#A0A0A0]">Risk: </span>
                      <span className={step.threatLevel > 0 ? 'text-[#F59E0B] font-semibold' : 'text-[#A0A0A0]'}>
                        {step.threatLevel === 0 ? 'Safe' : `Lvl ${step.threatLevel}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A0A0A0]">Food: </span>
                      <span className="text-[#FAFAFA] tabular-nums font-semibold">{step.foodLeft}</span>
                    </div>
                    <div>
                      <span className="text-[#A0A0A0]">Water: </span>
                      <span className="text-[#FAFAFA] tabular-nums font-semibold">{step.waterLeft}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
