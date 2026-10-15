import React, { useState } from 'react';
import { CellData, RouteStep, ThreatLevel } from '../types';
import { COL_LABELS, ROW_LABELS } from '../utils/dijkstra';
import {
  MapPin,
  Radio,
  Apple,
  Droplet,
  HeartPulse,
  ShieldAlert,
  Skull,
  Ban,
  AlertTriangle,
  User,
  LayoutGrid,
  Map as MapIcon,
  Columns,
} from 'lucide-react';
import { playClickSound, playRadarPing } from '../utils/sound';
import { WideGoogleMap } from './WideGoogleMap';

interface CityGridProps {
  cells: CellData[];
  pathCellIds: string[];
  routeSteps: RouteStep[];
  selectedCellId: string;
  onSelectCell: (id: string) => void;
  activeSimulationStep: number | null;
  recalculatedTimestamp: number;
}

export const CityGrid: React.FC<CityGridProps> = ({
  cells,
  pathCellIds,
  routeSteps,
  selectedCellId,
  onSelectCell,
  activeSimulationStep,
  recalculatedTimestamp,
}) => {
  // Map View Mode: 'street' (Real-time GIS map), 'matrix' (Sector Grid), 'dual' (Both)
  const [viewMode, setViewMode] = useState<'street' | 'matrix' | 'dual'>('street');

  // Map cell ID to step index in route
  const stepMap = new Map<string, number>();
  routeSteps.forEach((s) => stepMap.set(s.cellId, s.stepIndex));

  const simulationCellId =
    activeSimulationStep !== null && routeSteps[activeSimulationStep]
      ? routeSteps[activeSimulationStep].cellId
      : null;

  const getThreatBadge = (level: ThreatLevel) => {
    switch (level) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[#EAB308] bg-[#EAB308]/15 px-1.5 py-0.5 rounded border border-[#EAB308]/30">
            <AlertTriangle className="w-2.5 h-2.5 text-[#EAB308]" />
            <span>Low</span>
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[#F97316] bg-[#F97316]/15 px-1.5 py-0.5 rounded border border-[#F97316]/30">
            <ShieldAlert className="w-2.5 h-2.5 text-[#F97316]" />
            <span>Med</span>
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[#EF4444] bg-[#EF4444]/15 px-1.5 py-0.5 rounded border border-[#EF4444]/30">
            <Skull className="w-2.5 h-2.5 text-[#EF4444]" />
            <span>High</span>
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-[#F43F5E] bg-[#F43F5E]/20 px-1.5 py-0.5 rounded border border-[#F43F5E]/50">
            <Ban className="w-2.5 h-2.5 text-[#F43F5E]" />
            <span>Blocked</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getSupplyBadge = (cell: CellData) => {
    if (cell.supplyType === 'none' || cell.supplyAmount <= 0) return null;
    if (cell.supplyType === 'food') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[#F59E0B] bg-[#F59E0B]/15 px-1.5 py-0.5 rounded border border-[#F59E0B]/30">
          <Apple className="w-2.5 h-2.5 text-[#F59E0B]" />
          <span>+{cell.supplyAmount} Food</span>
        </span>
      );
    }
    if (cell.supplyType === 'water') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[#06B6D4] bg-[#06B6D4]/15 px-1.5 py-0.5 rounded border border-[#06B6D4]/30">
          <Droplet className="w-2.5 h-2.5 text-[#06B6D4]" />
          <span>+{cell.supplyAmount} Water</span>
        </span>
      );
    }
    if (cell.supplyType === 'medicine') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[#10B981] bg-[#10B981]/15 px-1.5 py-0.5 rounded border border-[#10B981]/30">
          <HeartPulse className="w-2.5 h-2.5 text-[#10B981]" />
          <span>+{cell.supplyAmount} Med</span>
        </span>
      );
    }
    return null;
  };

  // Matrix Grid View component (8 columns A-H x 5 rows 1-5 = 40 cells)
  const renderMatrixGrid = () => (
    <div className="relative bg-[#0F0F0F] border border-[#292929] rounded-xl p-3 sm:p-4 shadow-xl select-none overflow-x-auto">
      <div className="grid grid-cols-[24px_repeat(8,minmax(90px,1fr))] sm:grid-cols-[32px_repeat(8,minmax(115px,1fr))] gap-1.5 sm:gap-2 min-w-[800px]">
        {/* Top-left empty corner */}
        <div className="flex items-center justify-center text-[11px] font-sans font-bold text-[#A0A0A0]">
          SEC
        </div>

        {/* Column headers (A to E) */}
        {COL_LABELS.map((col) => (
          <div
            key={col}
            className="text-center font-sans text-xs sm:text-sm font-bold text-[#A0A0A0] py-1"
          >
            {col}
          </div>
        ))}

        {/* Rows 1 to 5 with Row Header + 5 Cells */}
        {ROW_LABELS.map((rowLabel, rIndex) => (
          <React.Fragment key={rowLabel}>
            <div className="flex items-center justify-center font-sans text-xs sm:text-sm font-bold text-[#A0A0A0]">
              {rowLabel}
            </div>

            {COL_LABELS.map((_, cIndex) => {
              const cell = cells.find((c) => c.r === rIndex && c.c === cIndex);
              if (!cell) return <div key={`${rIndex}-${cIndex}`} />;

              const isPath = pathCellIds.includes(cell.id);
              const stepIndex = stepMap.get(cell.id);
              const isSelected = selectedCellId === cell.id;
              const isSurvivorHere = simulationCellId === cell.id;
              const isBlocked = cell.threatLevel === 4;

              let cellBg = 'bg-[#171717] hover:bg-[#202020]';
              let cellBorder = 'border-[#292929]';

              if (cell.isStart) {
                cellBg = 'bg-[#10B981]/15 hover:bg-[#10B981]/25';
                cellBorder = 'border-[#10B981]/60';
              } else if (cell.isDestination) {
                cellBg = 'bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25';
                cellBorder = 'border-[#F59E0B]/60';
              }

              if (isBlocked) {
                cellBg = 'bg-[#F43F5E]/20 hover:bg-[#F43F5E]/30';
                cellBorder = 'border-[#F43F5E]/60';
              } else if (cell.threatLevel === 3) {
                cellBg = 'bg-[#EF4444]/15 hover:bg-[#EF4444]/25';
                cellBorder = 'border-[#EF4444]/50';
              } else if (cell.threatLevel === 2) {
                cellBg = 'bg-[#F97316]/10 hover:bg-[#F97316]/20';
                cellBorder = 'border-[#F97316]/40';
              }

              if (isPath) {
                cellBorder = 'border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.25)]';
                if (!isBlocked) {
                  cellBg = 'bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25';
                }
              }

              if (isSelected) {
                cellBorder = `${cellBorder} ring-2 ring-[#06B6D4] ring-offset-1 ring-offset-[#090909]`;
              }

              return (
                <button
                  key={cell.id}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    playRadarPing(800 + (rIndex + cIndex) * 40);
                    onSelectCell(cell.id);
                  }}
                  className={`relative text-left p-2 rounded-lg border ${cellBorder} ${cellBg} transition-all duration-150 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] cursor-pointer overflow-hidden font-sans`}
                  aria-label={`Cell ${cell.id}: ${cell.name}, Threat level ${cell.threatLevel}`}
                >
                  <div className="flex items-start justify-between gap-1 w-full z-10">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-xs sm:text-sm font-bold tracking-tight text-[#FAFAFA] group-hover:text-[#F59E0B] transition-colors">
                        {cell.id}
                      </span>

                      {cell.isStart && (
                        <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                          START
                        </span>
                      )}

                      {cell.isDestination && (
                        <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                          EVAC
                        </span>
                      )}
                    </div>

                    {isPath && stepIndex !== undefined && (
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-sans font-bold shrink-0 ${
                          isSurvivorHere
                            ? 'bg-[#06B6D4] text-[#090909] ring-2 ring-[#38BDF8] animate-pulse'
                            : 'bg-[#F59E0B] text-[#090909]'
                        }`}
                        title={`Route Step #${stepIndex}`}
                      >
                        {stepIndex === 0 ? 'S' : stepIndex}
                      </span>
                    )}
                  </div>

                  <div className="my-1 z-10">
                    <p className="text-xs font-medium text-[#FAFAFA] line-clamp-2 leading-tight font-sans">
                      {cell.name}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 mt-auto z-10">
                    {getSupplyBadge(cell)}
                    {getThreatBadge(cell.threatLevel)}
                    {(cell.id === 'C3' || cell.id === 'D4') && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-[#38bdf8] bg-[#38bdf8]/15 px-1.5 py-0.5 rounded border border-[#38bdf8]/35">
                        <span>⚓ Ferry</span>
                      </span>
                    )}
                  </div>

                  {isSurvivorHere && (
                    <div className="absolute inset-0 bg-[#06B6D4]/20 border-2 border-[#06B6D4] rounded-lg flex items-center justify-center z-20 pointer-events-none animate-pulse">
                      <div className="p-1 rounded-full bg-[#06B6D4] text-[#090909] shadow-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-[#090909]" />
                      </div>
                    </div>
                  )}

                  {isBlocked && (
                    <div className="absolute inset-0 opacity-15 pointer-events-none bg-[repeating-linear-gradient(45deg,#F43F5E,#F43F5E_6px,transparent_6px,transparent_12px)]" />
                  )}

                  {isPath && (
                    <div className="absolute inset-0 bg-[#F59E0B]/5 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-3 font-sans">
      {/* View Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#202020] rounded-lg border border-[#292929]">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setViewMode('street');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans font-semibold transition-colors cursor-pointer ${
              viewMode === 'street'
                ? 'bg-[#292929] text-[#FAFAFA] shadow-xs border border-[#383838]'
                : 'text-[#A0A0A0] hover:text-[#FAFAFA]'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Street & Road Map</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setViewMode('matrix');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans font-semibold transition-colors cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-[#292929] text-[#FAFAFA] shadow-xs border border-[#383838]'
                : 'text-[#A0A0A0] hover:text-[#FAFAFA]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Sector Grid</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setViewMode('dual');
            }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans font-semibold transition-colors cursor-pointer ${
              viewMode === 'dual'
                ? 'bg-[#292929] text-[#FAFAFA] shadow-xs border border-[#383838]'
                : 'text-[#A0A0A0] hover:text-[#FAFAFA]'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Dual View</span>
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#A0A0A0]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#10B981]/25 border border-[#10B981] flex items-center justify-center">
              <MapPin className="w-2 h-2 text-[#10B981]" />
            </span>
            <span>Start</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#F59E0B]/25 border border-[#F59E0B] flex items-center justify-center">
              <Radio className="w-2 h-2 text-[#F59E0B]" />
            </span>
            <span>Evac Haven</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#F59E0B]/30 border border-[#F59E0B]" />
            <span>Active Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#F43F5E]/30 border border-[#F43F5E]" />
            <span>Threat Zone</span>
          </div>
        </div>
      </div>

      {/* The required #cityGrid element container housing the requested map */}
      <div id="cityGrid" className="w-full">
        {viewMode === 'street' && (
          <WideGoogleMap
            cells={cells}
            pathCellIds={pathCellIds}
            routeSteps={routeSteps}
            selectedCellId={selectedCellId}
            onSelectCell={onSelectCell}
            recalculatedTimestamp={recalculatedTimestamp}
          />
        )}

        {viewMode === 'matrix' && renderMatrixGrid()}

        {viewMode === 'dual' && (
          <div className="grid grid-cols-1 gap-4">
            <WideGoogleMap
              cells={cells}
              pathCellIds={pathCellIds}
              routeSteps={routeSteps}
              selectedCellId={selectedCellId}
              onSelectCell={onSelectCell}
              recalculatedTimestamp={recalculatedTimestamp}
            />
            <div>{renderMatrixGrid()}</div>
          </div>
        )}
      </div>
    </div>
  );
};
