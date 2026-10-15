import React, { useEffect, useState, useMemo, useRef } from 'react';
import { CellData, GridCoord, RouteStep, ThreatLevel } from '../types';
import {
  MapPin,
  Radio,
  Apple,
  Droplet,
  HeartPulse,
  AlertTriangle,
  Skull,
  Ban,
  ShieldAlert,
  Compass,
  Eye,
  Navigation,
} from 'lucide-react';
import { playClickSound, playRadarPing } from '../utils/sound';

interface RealtimeStreetCityMapProps {
  cells: CellData[];
  pathCellIds: string[];
  routeSteps: RouteStep[];
  selectedCellId: string;
  onSelectCell: (id: string) => void;
  recalculatedTimestamp: number;
}

export const RealtimeStreetCityMap: React.FC<RealtimeStreetCityMapProps> = ({
  cells,
  pathCellIds,
  routeSteps,
  selectedCellId,
  onSelectCell,
  recalculatedTimestamp,
}) => {
  // SVG ViewBox coordinates: 5x5 blocks.
  // Map dimensions: width 1000 x height 1000
  // Each block: width 140, height 140
  // Road width: 44
  // Padding around map: 40
  const MAP_SIZE = 1000;
  const PADDING = 50;
  const BLOCK_SIZE = 144;
  const ROAD_WIDTH = 45;

  // Layer toggles
  const [showThreatRadii, setShowThreatRadii] = useState(true);
  const [showBuildingLabels, setShowBuildingLabels] = useState(true);
  const [showStreetNames, setShowStreetNames] = useState(true);
  const [directorSpeed, setDirectorSpeed] = useState<number>(1); // 1x, 2x

  // Route Director motion state
  const [directorProgress, setDirectorProgress] = useState(0); // 0 to 1 along path
  const [isBlinkingRecalibrate, setIsBlinkingRecalibrate] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Trigger blinking route director on recalculation
  useEffect(() => {
    if (recalculatedTimestamp > 0) {
      setIsBlinkingRecalibrate(true);
      setDirectorProgress(0); // Reset to start of new route
      const timer = setTimeout(() => {
        setIsBlinkingRecalibrate(false);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [recalculatedTimestamp]);

  // Compute cell center coordinate in SVG space (x, y)
  const getCellCenter = (r: number, c: number) => {
    const x = PADDING + c * (BLOCK_SIZE + ROAD_WIDTH) + BLOCK_SIZE / 2;
    const y = PADDING + r * (BLOCK_SIZE + ROAD_WIDTH) + BLOCK_SIZE / 2;
    return { x, y };
  };

  // Compute road network route points that strictly follow streets between blocks
  const roadWaypoints = useMemo(() => {
    if (routeSteps.length === 0) return [];

    const pts: { x: number; y: number }[] = [];

    // Helper: get sector road exit/entry junction
    routeSteps.forEach((step, idx) => {
      const center = getCellCenter(step.coord.r, step.coord.c);

      if (idx === 0) {
        pts.push(center);
      } else {
        const prevStep = routeSteps[idx - 1];
        const prevCenter = getCellCenter(prevStep.coord.r, prevStep.coord.c);

        // Turn via road intersection
        if (prevStep.coord.r !== step.coord.r && prevStep.coord.c !== step.coord.c) {
          // Diagonal corner: route through intermediate street intersection
          const cornerR = prevStep.coord.r;
          const cornerC = step.coord.c;
          const corner = getCellCenter(cornerR, cornerC);
          pts.push(corner);
        }

        pts.push(center);
      }
    });

    return pts;
  }, [routeSteps]);

  // Build SVG path string for the route
  const routeSvgPath = useMemo(() => {
    if (roadWaypoints.length < 2) return '';
    return roadWaypoints.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [roadWaypoints]);

  // Route path length and current director point
  const pathRef = useRef<SVGPathElement | null>(null);
  const [directorPos, setDirectorPos] = useState<{ x: number; y: number; angle: number }>({
    x: roadWaypoints[0]?.x || 120,
    y: roadWaypoints[0]?.y || 120,
    angle: 0,
  });

  // Continuous animation loop for moving Route Director
  useEffect(() => {
    let currentProg = 0;

    const animate = (time: number) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (pathRef.current && routeSvgPath) {
        const pathLength = pathRef.current.getTotalLength();
        if (pathLength > 0) {
          // Speed: complete route in 6 seconds / directorSpeed
          const speedFactor = (1 / 6) * directorSpeed;
          currentProg = (currentProg + delta * speedFactor) % 1;
          setDirectorProgress(currentProg);

          const distance = currentProg * pathLength;
          const currentPt = pathRef.current.getPointAtLength(distance);

          // Get angle for vehicle rotation
          const aheadPt = pathRef.current.getPointAtLength(Math.min(pathLength, distance + 4));
          const angle = (Math.atan2(aheadPt.y - currentPt.y, aheadPt.x - currentPt.x) * 180) / Math.PI;

          setDirectorPos({ x: currentPt.x, y: currentPt.y, angle });
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [routeSvgPath, directorSpeed]);

  // Street names for rows and columns
  const horizontalStreets = [
    'Northern Perimeter Way',
    'Mercer Avenue',
    'Broadway Boulevard',
    'Riverside Arterial',
    'Southern Haven Express',
    'Harbor Ridge Road',
  ];

  const verticalStreets = [
    '1st District Blvd',
    'St. Jude Parkway',
    'Central Metro Avenue',
    'Oakland Corridor',
    'Beacon Highway',
    'East Coast Gateway',
  ];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Real-time Map Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900/90 border border-slate-800 rounded-md text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">Real-Time Street Cartography</span>
          </div>
          <span className="text-slate-700" aria-hidden="true">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Director Status:</span>
            {isBlinkingRecalibrate ? (
              <span className="text-amber-300 font-bold animate-ping inline-flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                <span>RECALIBRATING...</span>
              </span>
            ) : (
              <span className="text-cyan-400 font-medium inline-flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                <span>IN MOTION</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Speed Toggle */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setDirectorSpeed((prev) => (prev === 1 ? 2 : 1));
            }}
            className="px-2 py-1 rounded border border-slate-800 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle route director transit speed"
          >
            Speed: <span className="text-amber-400 font-bold">{directorSpeed}x</span>
          </button>

          {/* Toggle Threat Radii */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowThreatRadii(!showThreatRadii);
            }}
            className={`px-2 py-1 rounded border transition-colors ${
              showThreatRadii
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                : 'border-slate-800 bg-slate-800/60 text-slate-400'
            }`}
          >
            Threat Zones
          </button>

          {/* Toggle Labels */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowBuildingLabels(!showBuildingLabels);
            }}
            className={`px-2 py-1 rounded border transition-colors ${
              showBuildingLabels
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-800 bg-slate-800/60 text-slate-400'
            }`}
          >
            Buildings
          </button>

          {/* Toggle Streets */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowStreetNames(!showStreetNames);
            }}
            className={`px-2 py-1 rounded border transition-colors ${
              showStreetNames
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-slate-800 bg-slate-800/60 text-slate-400'
            }`}
          >
            Streets
          </button>
        </div>
      </div>

      {/* SVG Real-time Map Canvas */}
      <div className="relative w-full aspect-square bg-[#0b0f19] border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
        <svg
          viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
          className="w-full h-full select-none"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          <defs>
            {/* Filter for route glow */}
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Filter for threat radial hazard glow */}
            <filter id="threatGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Radial gradient for Low Threat */}
            <radialGradient id="gradThreatLow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </radialGradient>

            {/* Radial gradient for Med Threat */}
            <radialGradient id="gradThreatMed" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.55" />
              <stop offset="65%" stopColor="#f97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </radialGradient>

            {/* Radial gradient for High Threat */}
            <radialGradient id="gradThreatHigh" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.65" />
              <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </radialGradient>

            {/* Radial gradient for Blocked / Impassable */}
            <radialGradient id="gradThreatBlocked" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.80" />
              <stop offset="75%" stopColor="#e11d48" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.05" />
            </radialGradient>

            {/* Road Asphalt Texture Pattern */}
            <pattern id="roadHatch" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="#151b28" />
              <line x1="0" y1="0" x2="20" y2="20" stroke="#1b2333" strokeWidth="1" />
            </pattern>

            {/* Blocked hazard diagonal stripe pattern */}
            <pattern id="blockedTape" width="16" height="16" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <rect width="8" height="16" fill="#be123c" fillOpacity="0.35" />
              <rect x="8" width="8" height="16" fill="#1e1b4b" fillOpacity="0.45" />
            </pattern>
          </defs>

          {/* 1. MAP BASE CANVAS & RIVER / WATERWAY FEATURE */}
          <rect width={MAP_SIZE} height={MAP_SIZE} fill="#0d111a" />

          {/* Waterway flowing diagonally from top-left to bottom-right through C1/C2/D2 area */}
          <path
            d="M 0 380 Q 220 400 380 430 T 700 520 T 1000 580 L 1000 640 Q 680 580 370 480 T 0 430 Z"
            fill="#092032"
            opacity="0.8"
          />
          <path
            d="M 0 405 Q 220 425 380 455 T 700 545 T 1000 605"
            stroke="#0e3a5a"
            strokeWidth="3"
            fill="none"
            strokeDasharray="16 12"
            opacity="0.6"
          />

          {/* 2. ROAD NETWORK (Asphalt strips, intersections, lane striping) */}
          {/* Horizontal Roads */}
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const y = PADDING + idx * (BLOCK_SIZE + ROAD_WIDTH) - ROAD_WIDTH / 2;
            return (
              <g key={`h-road-${idx}`}>
                {/* Road surface */}
                <rect x="0" y={y} width={MAP_SIZE} height={ROAD_WIDTH} fill="url(#roadHatch)" />
                {/* Road curbs */}
                <line x1="0" y1={y} x2={MAP_SIZE} y2={y} stroke="#2a354c" strokeWidth="1.5" />
                <line
                  x1="0"
                  y1={y + ROAD_WIDTH}
                  x2={MAP_SIZE}
                  y2={y + ROAD_WIDTH}
                  stroke="#2a354c"
                  strokeWidth="1.5"
                />
                {/* Dashed center line */}
                <line
                  x1="0"
                  y1={y + ROAD_WIDTH / 2}
                  x2={MAP_SIZE}
                  y2={y + ROAD_WIDTH / 2}
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="12 10"
                />
                {/* Street name */}
                {showStreetNames && (
                  <text
                    x="20"
                    y={y + ROAD_WIDTH / 2 + 3.5}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    letterSpacing="1"
                  >
                    {horizontalStreets[idx]}
                  </text>
                )}
              </g>
            );
          })}

          {/* Vertical Roads */}
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const x = PADDING + idx * (BLOCK_SIZE + ROAD_WIDTH) - ROAD_WIDTH / 2;
            return (
              <g key={`v-road-${idx}`}>
                {/* Road surface */}
                <rect x={x} y="0" width={ROAD_WIDTH} height={MAP_SIZE} fill="url(#roadHatch)" />
                {/* Road curbs */}
                <line x1={x} y1="0" x2={x} y2={MAP_SIZE} stroke="#2a354c" strokeWidth="1.5" />
                <line
                  x1={x + ROAD_WIDTH}
                  y1="0"
                  x2={x + ROAD_WIDTH}
                  y2={MAP_SIZE}
                  stroke="#2a354c"
                  strokeWidth="1.5"
                />
                {/* Dashed center line */}
                <line
                  x1={x + ROAD_WIDTH / 2}
                  y1="0"
                  x2={x + ROAD_WIDTH / 2}
                  y2={MAP_SIZE}
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="12 10"
                />
                {/* Street name */}
                {showStreetNames && (
                  <text
                    x={x + ROAD_WIDTH / 2 + 3.5}
                    y={MAP_SIZE - 20}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    letterSpacing="1"
                    transform={`rotate(-90, ${x + ROAD_WIDTH / 2 + 3.5}, ${MAP_SIZE - 20})`}
                  >
                    {verticalStreets[idx]}
                  </text>
                )}
              </g>
            );
          })}

          {/* Crosswalk markings at intersections */}
          {[0, 1, 2, 3, 4, 5].map((rIdx) =>
            [0, 1, 2, 3, 4, 5].map((cIdx) => {
              const ix = PADDING + cIdx * (BLOCK_SIZE + ROAD_WIDTH) - ROAD_WIDTH / 2;
              const iy = PADDING + rIdx * (BLOCK_SIZE + ROAD_WIDTH) - ROAD_WIDTH / 2;
              return (
                <rect
                  key={`crosswalk-${rIdx}-${cIdx}`}
                  x={ix}
                  y={iy}
                  width={ROAD_WIDTH}
                  height={ROAD_WIDTH}
                  fill="#182030"
                  stroke="#334155"
                  strokeWidth="0.5"
                />
              );
            })
          )}

          {/* 3. CITY BLOCKS & REALISTIC ARCHITECTURAL FOOTPRINTS */}
          {cells.map((cell) => {
            const bx = PADDING + cell.c * (BLOCK_SIZE + ROAD_WIDTH);
            const by = PADDING + cell.r * (BLOCK_SIZE + ROAD_WIDTH);
            const isSelected = selectedCellId === cell.id;
            const isPath = pathCellIds.includes(cell.id);

            return (
              <g
                key={`block-${cell.id}`}
                onClick={() => {
                  playClickSound();
                  playRadarPing(800 + (cell.r + cell.c) * 40);
                  onSelectCell(cell.id);
                }}
                className="cursor-pointer transition-transform"
              >
                {/* City Block Foundation */}
                <rect
                  x={bx}
                  y={by}
                  width={BLOCK_SIZE}
                  height={BLOCK_SIZE}
                  rx="6"
                  fill="#121824"
                  stroke={isSelected ? '#38bdf8' : isPath ? '#f59e0b' : '#222d3f'}
                  strokeWidth={isSelected ? 2.5 : isPath ? 2 : 1}
                />

                {/* Interior Courtyard / Sidewalk border */}
                <rect
                  x={bx + 6}
                  y={by + 6}
                  width={BLOCK_SIZE - 12}
                  height={BLOCK_SIZE - 12}
                  rx="4"
                  fill="#161f30"
                  stroke="#1e293b"
                  strokeWidth="1"
                />

                {/* Sector Coordinate Stamp */}
                <text
                  x={bx + 12}
                  y={by + 22}
                  fill={isPath ? '#fbbf24' : '#64748b'}
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {cell.id}
                </text>

                {/* Specific Detailed Architectural Footprints based on Sector Type */}
                {cell.isStart ? (
                  // START: Survivor Bunker & Fortified Compound
                  <g>
                    {/* Compound walls */}
                    <rect
                      x={bx + 14}
                      y={by + 28}
                      width={BLOCK_SIZE - 28}
                      height={BLOCK_SIZE - 38}
                      rx="3"
                      fill="#0f261e"
                      stroke="#10b981"
                      strokeWidth="1.5"
                    />
                    {/* Command Bunker Roof with 3D bevel */}
                    <rect
                      x={bx + 26}
                      y={by + 40}
                      width={BLOCK_SIZE - 52}
                      height={BLOCK_SIZE - 62}
                      rx="2"
                      fill="#164e3b"
                      stroke="#34d399"
                      strokeWidth="1"
                    />
                    {/* Helipad / Tent markings */}
                    <circle cx={bx + BLOCK_SIZE / 2} cy={by + BLOCK_SIZE / 2 + 5} r="14" fill="#047857" opacity="0.6" />
                    <text
                      x={bx + BLOCK_SIZE / 2}
                      y={by + BLOCK_SIZE / 2 + 9}
                      textAnchor="middle"
                      fill="#a7f3d0"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      BASE
                    </text>
                  </g>
                ) : cell.isDestination ? (
                  // EVAC: Haven Extraction Tower & Helipad
                  <g>
                    <rect
                      x={bx + 14}
                      y={by + 28}
                      width={BLOCK_SIZE - 28}
                      height={BLOCK_SIZE - 38}
                      rx="4"
                      fill="#271d0e"
                      stroke="#f59e0b"
                      strokeWidth="2"
                    />
                    {/* Skyscraper roof */}
                    <rect
                      x={bx + 24}
                      y={by + 38}
                      width={BLOCK_SIZE - 48}
                      height={BLOCK_SIZE - 58}
                      rx="3"
                      fill="#452a0a"
                      stroke="#fbbf24"
                      strokeWidth="1"
                    />
                    {/* Helipad "H" */}
                    <circle
                      cx={bx + BLOCK_SIZE / 2}
                      cy={by + BLOCK_SIZE / 2 + 5}
                      r="16"
                      stroke="#fde047"
                      strokeWidth="2"
                      fill="#78350f"
                    />
                    <text
                      x={bx + BLOCK_SIZE / 2}
                      y={by + BLOCK_SIZE / 2 + 10}
                      textAnchor="middle"
                      fill="#fef08a"
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      H
                    </text>
                  </g>
                ) : cell.supplyType === 'food' ? (
                  // Food Supermarket Depot
                  <g>
                    <rect
                      x={bx + 18}
                      y={by + 30}
                      width={BLOCK_SIZE - 36}
                      height={BLOCK_SIZE - 46}
                      rx="2"
                      fill="#1f2b1d"
                      stroke="#10b981"
                      strokeWidth="1"
                    />
                    {/* Skylights / cooling units */}
                    <rect x={bx + 26} y={by + 40} width="22" height="14" fill="#294025" />
                    <rect x={bx + 56} y={by + 40} width="22" height="14" fill="#294025" />
                    <rect x={bx + 86} y={by + 40} width="22" height="14" fill="#294025" />
                    {/* Food badge */}
                    <circle cx={bx + BLOCK_SIZE / 2} cy={by + 76} r="12" fill="#065f46" />
                    <text
                      x={bx + BLOCK_SIZE / 2}
                      y={by + 80}
                      textAnchor="middle"
                      fill="#a7f3d0"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      FOOD
                    </text>
                  </g>
                ) : cell.supplyType === 'water' ? (
                  // Water Filtration Towers
                  <g>
                    <rect
                      x={bx + 18}
                      y={by + 30}
                      width={BLOCK_SIZE - 36}
                      height={BLOCK_SIZE - 46}
                      rx="2"
                      fill="#132a38"
                      stroke="#06b6d4"
                      strokeWidth="1"
                    />
                    {/* Circular Water Silos */}
                    <circle cx={bx + 40} cy={by + 55} r="16" fill="#0e7490" stroke="#22d3ee" strokeWidth="1" />
                    <circle cx={bx + 85} cy={by + 55} r="16" fill="#0e7490" stroke="#22d3ee" strokeWidth="1" />
                    <text
                      x={bx + BLOCK_SIZE / 2}
                      y={by + 92}
                      textAnchor="middle"
                      fill="#67e8f9"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      H₂O PLANT
                    </text>
                  </g>
                ) : cell.supplyType === 'medicine' ? (
                  // Medical Clinic Hospital
                  <g>
                    <rect
                      x={bx + 18}
                      y={by + 30}
                      width={BLOCK_SIZE - 36}
                      height={BLOCK_SIZE - 46}
                      rx="2"
                      fill="#2e1a29"
                      stroke="#ec4899"
                      strokeWidth="1"
                    />
                    {/* Red Cross Symbol on Roof */}
                    <rect x={bx + BLOCK_SIZE / 2 - 4} y={by + 46} width="8" height="24" fill="#f43f5e" rx="1" />
                    <rect x={bx + BLOCK_SIZE / 2 - 12} y={by + 54} width="24" height="8" fill="#f43f5e" rx="1" />
                    <text
                      x={bx + BLOCK_SIZE / 2}
                      y={by + 92}
                      textAnchor="middle"
                      fill="#fbcfe8"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      CLINIC
                    </text>
                  </g>
                ) : (
                  // Standard Urban Building Complex (Varied Heights & Architectural Blocks)
                  <g>
                    {/* Building 1 (High-rise) */}
                    <rect
                      x={bx + 18}
                      y={by + 32}
                      width="42"
                      height="50"
                      rx="2"
                      fill="#1c2538"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    {/* Windows grid on roof */}
                    <rect x={bx + 24} y={by + 38} width="30" height="38" fill="#131b2a" />

                    {/* Building 2 (Lower wing) */}
                    <rect
                      x={bx + 66}
                      y={by + 38}
                      width="44"
                      height="44"
                      rx="2"
                      fill="#1a2333"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    <rect x={bx + 72} y={by + 44} width="32" height="32" fill="#111827" />

                    {/* Industrial/Residential small annex */}
                    <rect
                      x={bx + 26}
                      y={by + 88}
                      width="74"
                      height="24"
                      rx="2"
                      fill="#1e293b"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                  </g>
                )}

                {/* Building / Sector Label */}
                {showBuildingLabels && (
                  <text
                    x={bx + BLOCK_SIZE / 2}
                    y={by + BLOCK_SIZE - 12}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontWeight="500"
                    fontFamily="monospace"
                  >
                    {cell.name.length > 18 ? cell.name.substring(0, 16) + '..' : cell.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* 4. TRANSLUCENT RADIAL THREAT CIRCLES & HAZARD ZONES */}
          {showThreatRadii &&
            cells
              .filter((c) => c.threatLevel > 0)
              .map((cell) => {
                const center = getCellCenter(cell.r, cell.c);
                const isBlocked = cell.threatLevel === 4;

                let radius = 64;
                let strokeColor = '#f59e0b';
                let gradId = 'gradThreatLow';

                if (cell.threatLevel === 1) {
                  radius = 68;
                  strokeColor = '#f59e0b';
                  gradId = 'gradThreatLow';
                } else if (cell.threatLevel === 2) {
                  radius = 82;
                  strokeColor = '#f97316';
                  gradId = 'gradThreatMed';
                } else if (cell.threatLevel === 3) {
                  radius = 98;
                  strokeColor = '#f43f5e';
                  gradId = 'gradThreatHigh';
                } else if (cell.threatLevel === 4) {
                  radius = 110;
                  strokeColor = '#be123c';
                  gradId = 'gradThreatBlocked';
                }

                return (
                  <g key={`threat-radius-${cell.id}`} pointerEvents="none">
                    {/* Pulsing Outer Translucent Circle */}
                    <circle
                      cx={center.x}
                      cy={center.y}
                      r={radius}
                      fill={`url(#${gradId})`}
                      stroke={strokeColor}
                      strokeWidth={isBlocked ? 2.5 : 1.5}
                      strokeDasharray={isBlocked ? '6 4' : '4 4'}
                      opacity={0.85}
                    />

                    {/* Secondary animated outer shockwave */}
                    <circle
                      cx={center.x}
                      cy={center.y}
                      r={radius + 12}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="1"
                      strokeDasharray="2 6"
                      opacity="0.4"
                    />

                    {/* Impassable tape hatching */}
                    {isBlocked && (
                      <circle
                        cx={center.x}
                        cy={center.y}
                        r={radius - 8}
                        fill="url(#blockedTape)"
                        opacity="0.45"
                      />
                    )}

                    {/* Tactical Center Icon */}
                    <circle cx={center.x} cy={center.y} r="14" fill="#18121d" stroke={strokeColor} strokeWidth="1.5" />
                    <text
                      x={center.x}
                      y={center.y + 3.5}
                      textAnchor="middle"
                      fill={strokeColor}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {cell.threatLevel === 4 ? 'BLOCK' : `T-${cell.threatLevel}`}
                    </text>
                  </g>
                );
              })}

          {/* 5. ROAD-FOLLOWING SURVIVAL ROUTE (Luminous Polyline in Motion) */}
          {routeSvgPath && (
            <g pointerEvents="none">
              {/* Reference hidden path for length & director trajectory */}
              <path ref={pathRef} d={routeSvgPath} fill="none" stroke="transparent" strokeWidth="1" />

              {/* Outer Radiant Glow */}
              <path
                d={routeSvgPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.25"
                filter="url(#routeGlow)"
              />

              {/* Main Road Route Centerline */}
              <path
                d={routeSvgPath}
                fill="none"
                stroke="#d97706"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />

              {/* High-visibility animated inner pulse line flowing from Start to End */}
              <path
                d={routeSvgPath}
                fill="none"
                stroke="#fef08a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="16 10"
                className="animate-route-flow"
                style={{
                  strokeDashoffset: `${-directorProgress * 400}`,
                }}
              />

              {/* Waypoint Nodes along the route */}
              {roadWaypoints.map((pt, i) => (
                <circle
                  key={`pt-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill="#fef08a"
                  stroke="#78350f"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          )}

          {/* 6. ROUTE DIRECTOR (Animated Moving Convoy / Vector Tracker in Motion) */}
          {routeSvgPath && (
            <g
              transform={`translate(${directorPos.x}, ${directorPos.y})`}
              pointerEvents="none"
            >
              {/* Glowing Pulse Rings */}
              <circle
                r="18"
                fill={isBlinkingRecalibrate ? '#f59e0b' : '#38bdf8'}
                opacity={isBlinkingRecalibrate ? '0.45' : '0.25'}
                className="animate-ping"
              />

              <circle
                r="11"
                fill={isBlinkingRecalibrate ? '#ea580c' : '#0284c7'}
                stroke="#ffffff"
                strokeWidth="2"
                className={isBlinkingRecalibrate ? 'animate-pulse' : ''}
              />

              {/* Directional Navigation Chevron rotated to match road direction */}
              <g transform={`rotate(${directorPos.angle})`}>
                <polygon points="6,0 -4,-5 -2,0 -4,5" fill="#ffffff" />
              </g>

              {/* HUD Target Callout on Recalculation */}
              {isBlinkingRecalibrate && (
                <g transform="translate(18, -12)">
                  <rect
                    x="0"
                    y="0"
                    width="120"
                    height="18"
                    rx="3"
                    fill="#451a03"
                    stroke="#f59e0b"
                    strokeWidth="1"
                  />
                  <text
                    x="6"
                    y="12"
                    fill="#fef08a"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    VECTOR UPDATED
                  </text>
                </g>
              )}
            </g>
          )}
        </svg>

        {/* Legend in corner of map */}
        <div className="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-xs border border-slate-800 rounded p-2 text-[10px] font-mono text-slate-300 flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Route Director (Live Motion)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-amber-400" />
            <span>Road-Following Vector</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40 border border-rose-500" />
            <span>Hazard Radii (Translucent Zones)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
