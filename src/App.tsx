/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  CellData,
  GridCoord,
  RouteAnalysisData,
  ScavengeStrategy,
  SurvivorSupplies,
  ThreatCategory,
  ThreatLevel,
} from './types';
import {
  createInitialGrid,
  calculateDijkstraRoute,
  idToCoord,
  coordToId,
  GRID_ROWS,
  GRID_COLS,
} from './utils/dijkstra';
import {
  getMuted,
  setMuted as setSoundMuted,
  playClickSound,
  playRadarPing,
  playRecalculateChime,
  playThreatAlert,
} from './utils/sound';
import { Header } from './components/Header';
import { CityGrid } from './components/CityGrid';
import { SuppliesSection } from './components/SuppliesSection';
import { ThreatControlSection } from './components/ThreatControlSection';
import { RouteAnalysisSection } from './components/RouteAnalysisSection';
import { CellInspectorModal } from './components/CellInspectorModal';
import { ManifestModal } from './components/ManifestModal';
import { ExpeditionSetupModal } from './components/ExpeditionSetupModal';
import { OfflineGpsTracker } from './components/OfflineGpsTracker';
import { EmergencyHavenModal } from './components/EmergencyHavenModal';

const STORAGE_GRID_KEY = 'beacon_survival_grid_v2_40cell';
const STORAGE_SUPPLIES_KEY = 'beacon_survival_supplies_v1';

export default function App() {
  // Initial Survivor Supplies default: Food: 6, Water: 8, Medicine: 2 (as specified in prompt template)
  const [supplies, setSupplies] = useState<SurvivorSupplies>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SUPPLIES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { food: 6, water: 8, medicine: 2 };
  });

  // 40-Cell Regional City Grid state (8 cols x 5 rows)
  const [cells, setCells] = useState<CellData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GRID_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === GRID_ROWS * GRID_COLS) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return createInitialGrid();
  });

  // Selected cell for inspecting / threat assignment
  const [selectedCellId, setSelectedCellId] = useState<string>('C3');

  // Threat control parameters
  const [threatLevelToApply, setThreatLevelToApply] = useState<ThreatLevel>(2);
  const [threatCategoryToApply, setThreatCategoryToApply] = useState<ThreatCategory>('patrol');

  // Live status message for #message element
  const [statusMessage, setStatusMessage] = useState<string>(
    'BEACON offline routing matrix initialized. 40-sector regional grid online.'
  );

  // Mute audio
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => getMuted());

  // Modal states
  const [inspectingCell, setInspectingCell] = useState<CellData | null>(null);
  const [isManifestOpen, setIsManifestOpen] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(true); // Prompts survivor initially for resources & base camp
  const [compromisedHavenData, setCompromisedHavenData] = useState<{
    compromisedCell: CellData;
    threatLevel: ThreatLevel;
    threatCategory: string;
  } | null>(null);

  // Traversal & Scavenge strategy: 'auto' | 'stealth' | 'speed'
  const [scavengeStrategy, setScavengeStrategy] = useState<ScavengeStrategy>('auto');

  // Trekkable & Walkable Trails (allows diagonal shortcuts across gullies/alleys e.g. E2 -> D3)
  const [allowTrekkableTrails, setAllowTrekkableTrails] = useState<boolean>(true);

  // Offline GPS Tracker state
  const [gpsStepIndex, setGpsStepIndex] = useState<number>(0);
  const [isGpsAutoWalking, setIsGpsAutoWalking] = useState<boolean>(false);
  const gpsTimerRef = useRef<number | null>(null);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeSimulationStep, setActiveSimulationStep] = useState<number | null>(null);
  const simulationTimerRef = useRef<number | null>(null);

  // Recalibration notification timestamp for Route Director blinking animation
  const [recalculatedTimestamp, setRecalculatedTimestamp] = useState<number>(Date.now());

  // Identify Start and Destination coordinates
  const startCoord = useMemo<GridCoord>(() => {
    const startCell = cells.find((c) => c.isStart);
    if (startCell) return { r: startCell.r, c: startCell.c };
    return { r: 0, c: 0 }; // Default A1
  }, [cells]);

  const destCoord = useMemo<GridCoord>(() => {
    const destCell = cells.find((c) => c.isDestination);
    if (destCell) return { r: destCell.r, c: destCell.c };
    return { r: 4, c: 4 }; // Default E5
  }, [cells]);

  // Compute Dijkstra route whenever cells, coordinates, supplies, strategy, or trail mode change
  const routeAnalysis = useMemo<RouteAnalysisData>(() => {
    return calculateDijkstraRoute(
      cells,
      startCoord,
      destCoord,
      supplies,
      allowTrekkableTrails,
      scavengeStrategy
    );
  }, [cells, startCoord, destCoord, supplies, allowTrekkableTrails, scavengeStrategy]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GRID_KEY, JSON.stringify(cells));
    } catch {
      // ignore
    }
  }, [cells]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SUPPLIES_KEY, JSON.stringify(supplies));
    } catch {
      // ignore
    }
  }, [supplies]);

  // Count active hazards
  const activeHazardsCount = useMemo(() => {
    return cells.filter((c) => c.threatLevel > 0).length;
  }, [cells]);

  // Mute toggle
  const handleToggleMute = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    setSoundMuted(next);
  };

  // Select cell on grid
  const handleSelectCell = (cellId: string) => {
    setSelectedCellId(cellId);
    const target = cells.find((c) => c.id === cellId);
    if (target) {
      setInspectingCell(target);
    }
  };

  // Report Threat handler for #reportThreat
  const handleReportThreat = useCallback(() => {
    const targetCell = cells.find((c) => c.id === selectedCellId);
    if (!targetCell) {
      setStatusMessage(`Invalid sector selection: "${selectedCellId}".`);
      return;
    }

    // Determine description
    const desc =
      threatLevelToApply === 4
        ? 'Impassable barrier / structural collapse'
        : threatLevelToApply === 3
        ? 'Critical bio-contaminant or lethal sniper nest'
        : threatLevelToApply === 2
        ? 'Moderate hostile patrols and barricade'
        : threatLevelToApply === 1
        ? 'Scattered hostile scouts and rubble'
        : 'Recon confirmed sector is clear';

    setCells((prev) =>
      prev.map((c) =>
        c.id === selectedCellId
          ? {
              ...c,
              threatLevel: threatLevelToApply,
              threatCategory: threatLevelToApply === 0 ? 'clear' : threatCategoryToApply,
              threatDescription: desc,
            }
          : c
      )
    );

    const levelText =
      threatLevelToApply === 0
        ? 'cleared'
        : threatLevelToApply === 4
        ? 'BLOCKED (Impassable)'
        : `set to Level ${threatLevelToApply} (${threatCategoryToApply})`;

    setStatusMessage(`Threat reported at ${selectedCellId}: ${levelText}. Route recalculation applied.`);
    setRecalculatedTimestamp(Date.now());
    if (inspectingCell && inspectingCell.id === selectedCellId) {
      setInspectingCell((prev) => (prev ? { ...prev, threatLevel: threatLevelToApply } : null));
    }

    // If destination was compromised by a hazard, prompt survivor for new destination point
    if (targetCell.isDestination && threatLevelToApply > 0) {
      setCompromisedHavenData({
        compromisedCell: targetCell,
        threatLevel: threatLevelToApply,
        threatCategory: threatCategoryToApply,
      });
    }
  }, [cells, selectedCellId, threatLevelToApply, threatCategoryToApply, inspectingCell]);

  // Recalculate Route handler for #recalculate
  const handleRecalculate = useCallback(() => {
    // Re-trigger Dijkstra evaluation
    const analysis = calculateDijkstraRoute(
      cells,
      startCoord,
      destCoord,
      supplies,
      allowTrekkableTrails,
      scavengeStrategy
    );
    setRecalculatedTimestamp(Date.now());
    if (analysis.isReachable) {
      setStatusMessage(
        `Route recalculated successfully: ${analysis.steps.length - 1} moves across ${analysis.totalDistanceKm} km. Cumulative risk: ${analysis.totalRiskScore}.`
      );
    } else {
      setStatusMessage(
        `Warning: Target ${coordToId(destCoord.r, destCoord.c)} is unreachable under current grid threats!`
      );
    }
  }, [cells, startCoord, destCoord, supplies, allowTrekkableTrails, scavengeStrategy]);

  // Clear all hazards on the grid
  const handleClearAllThreats = () => {
    setCells((prev) =>
      prev.map((c) => ({
        ...c,
        threatLevel: 0,
        threatCategory: 'clear',
        threatDescription: '',
      }))
    );
    setRecalculatedTimestamp(Date.now());
    setStatusMessage('All sector hazards cleared. Baseline Manhattan distance route established.');
  };

  // Simulate random disaster / field intelligence
  const handleInjectRandomHazards = () => {
    const randomized = cells.map((c) => {
      // Preserve start and dest
      if (c.isStart || c.isDestination) return c;
      const roll = Math.random();
      if (roll < 0.25) {
        const lvl = (Math.floor(Math.random() * 3) + 1) as ThreatLevel;
        const cats: ThreatCategory[] = ['patrol', 'radiation', 'rubble', 'biohazard'];
        return {
          ...c,
          threatLevel: lvl,
          threatCategory: cats[Math.floor(Math.random() * cats.length)],
        };
      }
      return {
        ...c,
        threatLevel: 0 as ThreatLevel,
        threatCategory: 'clear' as ThreatCategory,
      };
    });

    setCells(randomized);
    setRecalculatedTimestamp(Date.now());
    playThreatAlert();
    setStatusMessage('Dynamic reconnaissance received: Grid hazard topology updated.');
  };

  // Reset entire grid to initial conditions
  const handleResetGrid = () => {
    const initial = createInitialGrid();
    setCells(initial);
    setSupplies({ food: 6, water: 8, medicine: 2 });
    setSelectedCellId('C3');
    setStatusMessage('System reset to default reconnaissance conditions (Food: 6, Water: 8, Med: 2).');
    playRecalculateChime();
  };

  // Update specific cell from modal
  const handleUpdateCell = (updated: Partial<CellData>) => {
    if (!inspectingCell) return;
    setCells((prev) =>
      prev.map((c) => (c.id === inspectingCell.id ? { ...c, ...updated } : c))
    );
    setInspectingCell((prev) => (prev ? { ...prev, ...updated } : null));
    setStatusMessage(`Sector ${inspectingCell.id} updated.`);

    if (
      inspectingCell.isDestination &&
      updated.threatLevel !== undefined &&
      updated.threatLevel > 0
    ) {
      setCompromisedHavenData({
        compromisedCell: inspectingCell,
        threatLevel: updated.threatLevel,
        threatCategory: updated.threatCategory || 'hazard',
      });
      setInspectingCell(null);
    }
  };

  // Change Start cell
  const handleSetStart = (cellId: string) => {
    setCells((prev) =>
      prev.map((c) => ({
        ...c,
        isStart: c.id === cellId,
      }))
    );
    setRecalculatedTimestamp(Date.now());
    setStatusMessage(`Base Camp designated at ${cellId}. Route recalculated.`);
  };

  // Change Destination cell
  const handleSetDestination = (cellId: string) => {
    setCells((prev) =>
      prev.map((c) => ({
        ...c,
        isDestination: c.id === cellId,
      }))
    );
    setRecalculatedTimestamp(Date.now());
    setStatusMessage(`Evacuation Haven designated at ${cellId}. Route recalculated.`);
  };

  // Turn-by-turn simulation loop
  const handleStartSimulation = () => {
    if (!routeAnalysis.isReachable || routeAnalysis.steps.length === 0) return;
    setIsSimulating(true);
    setActiveSimulationStep(0);
    playRadarPing(880);

    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);

    simulationTimerRef.current = window.setInterval(() => {
      setActiveSimulationStep((prev) => {
        if (prev === null) return 0;
        const next = prev + 1;
        if (next >= routeAnalysis.steps.length) {
          clearInterval(simulationTimerRef.current!);
          setIsSimulating(false);
          playRecalculateChime();
          setStatusMessage('Transit simulation complete: Survivor reached Evacuation Haven safely.');
          return prev;
        }
        playRadarPing(800 + next * 35);
        return next;
      });
    }, 750);
  };

  const handleStopSimulation = () => {
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    setIsSimulating(false);
    setActiveSimulationStep(null);
  };

  const handleStepSimulation = () => {
    setActiveSimulationStep((prev) => {
      if (prev === null) return 0;
      const next = prev + 1;
      if (next >= routeAnalysis.steps.length) {
        setIsSimulating(false);
        return prev;
      }
      playRadarPing(800 + next * 35);
      return next;
    });
  };

  // Current GPS cell along the route
  const currentGpsCell = useMemo(() => {
    if (routeAnalysis.steps.length === 0) return null;
    const currentStep = routeAnalysis.steps[gpsStepIndex] || routeAnalysis.steps[0];
    return cells.find((c) => c.id === currentStep.cellId) || null;
  }, [routeAnalysis.steps, gpsStepIndex, cells]);

  // Expedition Pre-Flight Calibration Handler
  const handleCalibrateExpedition = (
    startId: string,
    destId: string,
    newSupplies: SurvivorSupplies,
    strategy: ScavengeStrategy
  ) => {
    setCells((prev) =>
      prev.map((c) => ({
        ...c,
        isStart: c.id === startId,
        isDestination: c.id === destId,
      }))
    );
    setSupplies(newSupplies);
    setScavengeStrategy(strategy);
    setGpsStepIndex(0);
    setRecalculatedTimestamp(Date.now());
    setStatusMessage(
      `Expedition calibrated: Base at ${startId}, Haven at ${destId}. Strategy: ${strategy}. Route optimized for resource survivability.`
    );
  };

  // Offline GPS Tracker Step Advance
  const handleAdvanceGpsStep = () => {
    if (gpsStepIndex < routeAnalysis.steps.length - 1) {
      setGpsStepIndex((prev) => prev + 1);
    }
  };

  const handleResetGps = () => {
    setGpsStepIndex(0);
    setIsGpsAutoWalking(false);
  };

  const handleToggleAutoWalk = () => {
    setIsGpsAutoWalking((prev) => !prev);
  };

  // Auto-walk GPS tracker effect
  useEffect(() => {
    if (isGpsAutoWalking) {
      gpsTimerRef.current = window.setInterval(() => {
        setGpsStepIndex((prev) => {
          if (prev >= routeAnalysis.steps.length - 1) {
            setIsGpsAutoWalking(false);
            playRecalculateChime();
            return prev;
          }
          playRadarPing(820 + (prev + 1) * 30);
          return prev + 1;
        });
      }, 1200);
    } else {
      if (gpsTimerRef.current) clearInterval(gpsTimerRef.current);
    }
    return () => {
      if (gpsTimerRef.current) clearInterval(gpsTimerRef.current);
    };
  }, [isGpsAutoWalking, routeAnalysis.steps.length]);

  // User's key requirement: "Report Threat at Current Location"
  const handleReportThreatAtCurrentLocation = (cellId: string) => {
    const targetCell = cells.find((c) => c.id === cellId);
    setCells((prev) =>
      prev.map((c) =>
        c.id === cellId
          ? {
              ...c,
              threatLevel: 3, // Zombie swarm / High threat
              threatCategory: 'patrol',
              threatDescription: 'Zombie swarm encountered during GPS transit',
            }
          : c
      )
    );
    setSelectedCellId(cellId);
    setRecalculatedTimestamp(Date.now());
    setStatusMessage(
      `🚨 EMERGENCY: Threat reported at current GPS sector [${cellId}]! Route instantly recalculated to avoid danger.`
    );

    if (targetCell?.isDestination) {
      setCompromisedHavenData({
        compromisedCell: targetCell,
        threatLevel: 3,
        threatCategory: 'patrol',
      });
    }
  };

  // Handler when survivor designates a new destination point after current haven is compromised
  const handleConfirmNewEmergencyDestination = (newDestId: string) => {
    setCells((prev) =>
      prev.map((c) => ({
        ...c,
        isDestination: c.id === newDestId,
      }))
    );
    setRecalculatedTimestamp(Date.now());
    setStatusMessage(
      `Emergency Haven established at Sector ${newDestId}. Survival route recalibrated to next safest point.`
    );
    playRecalculateChime();
    setCompromisedHavenData(null);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      if (gpsTimerRef.current) clearInterval(gpsTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#090909] text-[#FAFAFA] font-sans selection:bg-[#F59E0B] selection:text-[#090909] flex flex-col">
      {/* Header conforming to Top Bar Contract and containing exact tags <h1>BEACON</h1> and <p>Offline Survival Route Planner</p> */}
      <Header
        isMuted={isAudioMuted}
        onToggleMute={handleToggleMute}
        onResetGrid={handleResetGrid}
        onOpenManifest={() => setIsManifestOpen(true)}
        onOpenSetup={() => setIsSetupModalOpen(true)}
        activeHazardsCount={activeHazardsCount}
      />

      {/* Semantic Main Container with the 4 required sections */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* SECTION 1: City Map */}
        <section id="city-map" className="bg-[#171717] border border-[#292929] rounded-xl p-4 sm:p-5 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#292929]">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#FAFAFA] tracking-tight font-sans">
                City Map
              </h2>
              <p className="text-xs text-[#A0A0A0] font-sans">
                40-Sector Regional Grid (A1 to H5) · Authentic Offline Cartography
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#A0A0A0] font-sans">
              {/* Trekkable Trails Toggle */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setAllowTrekkableTrails((prev) => !prev);
                  setStatusMessage(
                    !allowTrekkableTrails
                      ? 'Walkable & Trekkable Trails ENABLED: Diagonal shortcuts (e.g. E2 ⇄ D3) across gullies and footpaths active.'
                      : 'Paved Roadways Only: Strict orthogonal street network enforced.'
                  );
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-sans font-medium transition-colors cursor-pointer ${
                  allowTrekkableTrails
                    ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
                    : 'bg-[#202020] border-[#292929] text-[#A0A0A0] hover:text-[#FAFAFA]'
                }`}
                title="Toggle between diagonal walkable/trekkable trails and rigid paved street roads"
              >
                <span className={`w-2 h-2 rounded-full ${allowTrekkableTrails ? 'bg-[#10B981] animate-pulse' : 'bg-[#A0A0A0]'}`} />
                <span>Trails & Shortcuts: {allowTrekkableTrails ? 'ON (8-Way Trek)' : 'OFF (Paved Only)'}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[#A0A0A0]">Origin:</span>
                <span className="text-[#10B981] font-bold">{coordToId(startCoord.r, startCoord.c)}</span>
                <span className="text-[#292929]">→</span>
                <span className="text-[#A0A0A0]">Haven:</span>
                <span className="text-[#F59E0B] font-bold">{coordToId(destCoord.r, destCoord.c)}</span>
              </div>
            </div>
          </div>

          {/* Renders the required <div id="cityGrid"> inside #city-map */}
          <CityGrid
            cells={cells}
            pathCellIds={routeAnalysis.pathCellIds}
            routeSteps={routeAnalysis.steps}
            selectedCellId={selectedCellId}
            onSelectCell={handleSelectCell}
            activeSimulationStep={activeSimulationStep !== null ? activeSimulationStep : gpsStepIndex}
            recalculatedTimestamp={recalculatedTimestamp}
          />

          {/* Integrated Offline GPS Field Tracker */}
          <OfflineGpsTracker
            currentStepIndex={gpsStepIndex}
            routeSteps={routeAnalysis.steps}
            currentCell={currentGpsCell}
            onAdvanceStep={handleAdvanceGpsStep}
            onResetGps={handleResetGps}
            onReportThreatAtCurrentLocation={handleReportThreatAtCurrentLocation}
            isAutoWalking={isGpsAutoWalking}
            onToggleAutoWalk={handleToggleAutoWalk}
          />
        </section>

        {/* 2-Column Responsive Layout for Supplies & Threat Control */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECTION 2: Survivor Supplies */}
          <SuppliesSection
            supplies={supplies}
            onUpdateSupplies={setSupplies}
            analysis={routeAnalysis}
          />

          {/* SECTION 3: Threat Control */}
          <ThreatControlSection
            cells={cells}
            selectedThreatCellId={selectedCellId}
            onChangeThreatCell={setSelectedCellId}
            selectedThreatLevel={threatLevelToApply}
            onChangeThreatLevel={setThreatLevelToApply}
            selectedThreatCategory={threatCategoryToApply}
            onChangeThreatCategory={setThreatCategoryToApply}
            onReportThreat={handleReportThreat}
            onRecalculate={handleRecalculate}
            onClearAllThreats={handleClearAllThreats}
            onInjectRandomHazards={handleInjectRandomHazards}
            statusMessage={statusMessage}
          />
        </div>

        {/* SECTION 4: Route Analysis */}
        <RouteAnalysisSection
          analysis={routeAnalysis}
          isSimulating={isSimulating}
          activeSimulationStep={activeSimulationStep}
          onStartSimulation={handleStartSimulation}
          onStopSimulation={handleStopSimulation}
          onStepSimulation={handleStepSimulation}
        />
      </main>

      {/* Offline Footer */}
      <footer className="border-t border-[#292929] bg-[#0F0F0F] px-4 py-4 text-center text-xs text-[#A0A0A0] font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BEACON // Tactical Offline Survival Navigation Protocol</span>
          <span>Zero external dependencies · Local execution · WCAG AA calibrated</span>
        </div>
      </footer>

      {/* Expedition Setup / Calibration Wizard */}
      <ExpeditionSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        cells={cells}
        initialSupplies={supplies}
        currentStartId={coordToId(startCoord.r, startCoord.c)}
        currentDestId={coordToId(destCoord.r, destCoord.c)}
        currentStrategy={scavengeStrategy}
        onCalibrate={handleCalibrateExpedition}
      />

      {/* Inspector Modal for tapped cells */}
      {inspectingCell && (
        <CellInspectorModal
          cell={inspectingCell}
          onClose={() => setInspectingCell(null)}
          onUpdateCell={handleUpdateCell}
          onSetStart={handleSetStart}
          onSetDestination={handleSetDestination}
        />
      )}

      {/* Emergency Route Manifest Briefing Modal */}
      <ManifestModal
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
        analysis={routeAnalysis}
        supplies={supplies}
      />

      {/* Emergency Haven Reroute Modal (triggered when destination point is compromised) */}
      {compromisedHavenData && (
        <EmergencyHavenModal
          isOpen={!!compromisedHavenData}
          onClose={() => setCompromisedHavenData(null)}
          compromisedCell={compromisedHavenData.compromisedCell}
          threatLevel={compromisedHavenData.threatLevel}
          threatCategory={compromisedHavenData.threatCategory}
          cells={cells}
          startCoord={startCoord}
          onConfirmNewDestination={handleConfirmNewEmergencyDestination}
        />
      )}
    </div>
  );
}
