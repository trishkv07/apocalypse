import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CellData, RouteStep, ThreatLevel } from '../types';
import {
  Compass,
  Navigation,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Crosshair,
  MapPin,
  Radio,
  ShieldAlert,
  Apple,
  Droplet,
  HeartPulse,
  Footprints,
  AlertTriangle,
  Skull,
  Ban,
  Maximize2,
  Anchor,
} from 'lucide-react';
import { playClickSound, playRadarPing } from '../utils/sound';

interface WideGoogleMapProps {
  cells: CellData[];
  pathCellIds: string[];
  routeSteps: RouteStep[];
  selectedCellId: string;
  onSelectCell: (id: string) => void;
  recalculatedTimestamp: number;
}

// 40-Sector Realistic Google Offline Map Dimensions (2000 x 1100 Canvas)
const MAP_W = 2000;
const MAP_H = 1100;

export const WideGoogleMap: React.FC<WideGoogleMapProps> = ({
  cells,
  pathCellIds,
  routeSteps,
  selectedCellId,
  onSelectCell,
  recalculatedTimestamp,
}) => {
  // Map styles: 'vector' (Google Dark Carto), 'satellite' (Thermal / Infrared GIS), 'topo' (Topographic Contour)
  const [mapStyle, setMapStyle] = useState<'vector' | 'satellite' | 'topo'>('vector');

  // Map viewport pan & zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Mouse coordinate readout for Google Maps telemetry
  const [mouseCoord, setMouseCoord] = useState<{ lat: string; lng: string; elev: string }>({
    lat: '47.6062° N',
    lng: '122.3321° W',
    elev: '34m',
  });

  // Layer toggles
  const [showThreatRadii, setShowThreatRadii] = useState(true);
  const [showBuildingDetails, setShowBuildingDetails] = useState(true);
  const [showStreetNames, setShowStreetNames] = useState(true);
  const [showGulliesAndWater, setShowGulliesAndWater] = useState(true);
  const [showTrekkingTrails, setShowTrekkingTrails] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if current expedition route utilizes the C3 <-> D4 cable ferry river crossing
  const isRouteUsingCableFerry = useMemo(() => {
    for (let i = 0; i < routeSteps.length - 1; i++) {
      const a = routeSteps[i].cellId;
      const b = routeSteps[i + 1].cellId;
      if ((a === 'C3' && b === 'D4') || (a === 'D4' && b === 'C3')) {
        return true;
      }
    }
    return false;
  }, [routeSteps]);

  // Quick pan/zoom focus on the Cable Ferry crossing [C3 ⇄ D4]
  const handleFocusCableFerry = () => {
    playClickSound();
    playRadarPing(920);
    setZoom(1.35);
    setPan({ x: -220, y: -170 });
    onSelectCell('C3');
  };

  // Route Director motion state
  const [directorProgress, setDirectorProgress] = useState(0);
  const [isBlinkingRecalibrate, setIsBlinkingRecalibrate] = useState(false);
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameRef = useRef<number | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  // Trigger blinking and flash on route recalibration
  useEffect(() => {
    if (recalculatedTimestamp > 0) {
      setIsBlinkingRecalibrate(true);
      setDirectorProgress(0);
      const timer = setTimeout(() => {
        setIsBlinkingRecalibrate(false);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [recalculatedTimestamp]);

  // Sector Coordinates mapping on the wide 2000x1100 canvas across 8 columns and 5 rows (40 cells)
  // Designed along natural terrain contours so streets and gullies are organic and curvy
  const sectorCenters: Record<string, { x: number; y: number }> = useMemo(() => {
    const centers: Record<string, { x: number; y: number }> = {};
    const colXs = [150, 390, 640, 890, 1140, 1390, 1630, 1860];
    const rowYs = [130, 340, 560, 780, 970];

    // Organic deltas for each of the 40 sectors (curving terrain & uneven road layout)
    const organicDeltas: Record<string, { dx: number; dy: number }> = {
      // Row 1
      'A1': { dx: -8, dy: 6 },
      'B1': { dx: 14, dy: -12 },
      'C1': { dx: -10, dy: 14 },
      'D1': { dx: 12, dy: -8 },
      'E1': { dx: -14, dy: 10 },
      'F1': { dx: 16, dy: -6 },
      'G1': { dx: -12, dy: 12 },
      'H1': { dx: 10, dy: -10 },

      // Row 2
      'A2': { dx: -16, dy: -8 },
      'B2': { dx: 18, dy: 16 },
      'C2': { dx: -22, dy: -14 },
      'D2': { dx: 20, dy: 12 },
      'E2': { dx: -18, dy: -16 },
      'F2': { dx: 15, dy: 14 },
      'G2': { dx: -20, dy: -12 },
      'H2': { dx: 14, dy: 18 },

      // Row 3
      'A3': { dx: 12, dy: -10 },
      'B3': { dx: -16, dy: 14 },
      'C3': { dx: 22, dy: -18 },
      'D3': { dx: -14, dy: 16 },
      'E3': { dx: 18, dy: -14 },
      'F3': { dx: -16, dy: 12 },
      'G3': { dx: 18, dy: -16 },
      'H3': { dx: -12, dy: 14 },

      // Row 4
      'A4': { dx: -14, dy: 12 },
      'B4': { dx: 16, dy: -16 },
      'C4': { dx: -18, dy: 14 },
      'D4': { dx: 20, dy: -12 },
      'E4': { dx: -12, dy: 16 },
      'F4': { dx: 18, dy: -14 },
      'G4': { dx: -16, dy: 12 },
      'H4': { dx: 15, dy: -16 },

      // Row 5
      'A5': { dx: -10, dy: -14 },
      'B5': { dx: 16, dy: 18 },
      'C5': { dx: -14, dy: -12 },
      'D5': { dx: 18, dy: 16 },
      'E5': { dx: -16, dy: -14 },
      'F5': { dx: 14, dy: 15 },
      'G5': { dx: -18, dy: -12 },
      'H5': { dx: 16, dy: 14 },
    };

    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 8; c++) {
        const id = `${cols[c]}${r + 1}`;
        const delta = organicDeltas[id] || { dx: 0, dy: 0 };
        centers[id] = {
          x: colXs[c] + delta.dx,
          y: rowYs[r] + delta.dy,
        };
      }
    }
    return centers;
  }, []);

  // Compute smooth, organic, road-following and trail-following curved SVG path
  // Uses cubic Bezier curves with organic bow factors so routes follow curvy avenues, boulevards, and diagonal foot trails
  const routeSvgPath = useMemo(() => {
    if (routeSteps.length < 2) return '';
    const pts = routeSteps.map((s) => sectorCenters[s.cellId]).filter(Boolean);
    if (pts.length < 2) return '';

    let d = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 0; i < routeSteps.length - 1; i++) {
      const s1 = routeSteps[i];
      const s2 = routeSteps[i + 1];
      const p1 = sectorCenters[s1.cellId];
      const p2 = sectorCenters[s2.cellId];
      if (!p1 || !p2) continue;

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;

      // Case 1: Horizontal transit along wavy avenues
      if (s1.coord.r === s2.coord.r) {
        const bow = (s1.coord.r % 2 === 0 ? 1 : -1) * (dx > 0 ? 24 : -24);
        const cp1x = p1.x + dx * 0.35;
        const cp1y = p1.y + bow;
        const cp2x = p1.x + dx * 0.65;
        const cp2y = p2.y + bow * 0.75;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      // Case 2: Vertical transit along curving boulevards
      else if (s1.coord.c === s2.coord.c) {
        const bow = (s1.coord.c % 2 === 0 ? 1 : -1) * (dy > 0 ? 26 : -26);
        const cp1x = p1.x + bow;
        const cp1y = p1.y + dy * 0.35;
        const cp2x = p1.x + bow * 0.75;
        const cp2y = p1.y + dy * 0.65;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      // Case 3: Diagonal Trekking Trail (e.g. E2 -> D3, A1 -> B2, etc.)
      else {
        // Natural gentle S-curve / arc along the walkable trail or gully
        const dist = Math.hypot(dx, dy);
        const perpX = -(dy / dist) * 22;
        const perpY = (dx / dist) * 22;
        const cp1x = p1.x + dx * 0.35 + perpX;
        const cp1y = p1.y + dy * 0.35 + perpY;
        const cp2x = p1.x + dx * 0.65 - perpX * 0.5;
        const cp2y = p1.y + dy * 0.65 - perpY * 0.5;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
    }

    return d;
  }, [routeSteps, sectorCenters]);

  // Director position
  const [directorPos, setDirectorPos] = useState<{ x: number; y: number; angle: number }>({
    x: 150,
    y: 130,
    angle: 0,
  });

  // Continuous loop for route director motion along the curves
  useEffect(() => {
    let currentProg = 0;

    const animate = (time: number) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (pathRef.current && routeSvgPath) {
        const pathLength = pathRef.current.getTotalLength();
        if (pathLength > 0) {
          const speedFactor = 1 / 7.0; // ~7 seconds per roundtrip
          currentProg = (currentProg + delta * speedFactor) % 1;
          setDirectorProgress(currentProg);

          const distance = currentProg * pathLength;
          const currentPt = pathRef.current.getPointAtLength(distance);
          const aheadPt = pathRef.current.getPointAtLength(Math.min(pathLength, distance + 10));
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
  }, [routeSvgPath]);

  // Drag pan handlers
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    const lat = (47.6062 - (relY - 0.5) * 0.06).toFixed(4);
    const lng = (122.3321 + (relX - 0.5) * 0.1).toFixed(4);
    const elev = Math.round(24 + (1 - relY) * 55);

    setMouseCoord({
      lat: `${lat}° N`,
      lng: `${lng}° W`,
      elev: `${elev}m`,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    playClickSound();
    setZoom((prev) => Math.min(2.5, Math.max(0.7, prev + delta)));
  };

  const handleResetView = () => {
    playClickSound();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Search filter matching cell
  const searchedCell = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return (
      cells.find(
        (c) =>
          c.id.toLowerCase() === q ||
          c.name.toLowerCase().includes(q) ||
          c.supplyType.toLowerCase().includes(q)
      ) || null
    );
  }, [searchQuery, cells]);

  return (
    <div className="w-full flex flex-col gap-2 select-none font-sans">
      {/* 1. Google Maps Top Search & Layer Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0F0F0F] border border-[#292929] rounded-t-xl backdrop-blur-md">
        {/* Left: Google Search Bar for Offline Map */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#A0A0A0] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 40 sectors: 'Clinic', 'E2', 'D3', 'Reservoir', 'Bakery'..."
              className="w-full bg-[#202020] border border-[#292929] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#FAFAFA] placeholder-[#A0A0A0] font-sans focus:outline-none focus:border-[#F59E0B]"
            />
            {searchedCell && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onSelectCell(searchedCell.id);
                  setSearchQuery('');
                }}
                className="absolute right-2 top-1.5 px-2 py-0.5 rounded bg-[#F59E0B] hover:bg-[#D97706] text-[#090909] text-[10px] font-bold font-sans cursor-pointer"
              >
                Go to {searchedCell.id}
              </button>
            )}
          </div>
        </div>

        {/* Center: Map Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#202020] rounded-lg border border-[#292929] text-xs font-sans">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setMapStyle('vector');
            }}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              mapStyle === 'vector'
                ? 'bg-[#292929] text-[#FAFAFA] font-bold border border-[#383838] shadow-xs'
                : 'text-[#A0A0A0] hover:text-[#FAFAFA]'
            }`}
          >
            Tactical Vector
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setMapStyle('satellite');
            }}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              mapStyle === 'satellite'
                ? 'bg-[#292929] text-[#06B6D4] font-bold border border-[#383838] shadow-xs'
                : 'text-[#A0A0A0] hover:text-[#FAFAFA]'
            }`}
          >
            Infrared Recon
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setMapStyle('topo');
            }}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              mapStyle === 'topo'
                ? 'bg-[#292929] text-[#10B981] font-bold border border-[#383838] shadow-xs'
                : 'text-[#A0A0A0] hover:text-[#FAFAFA]'
            }`}
          >
            Topographic
          </button>
        </div>

        {/* Right: Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowTrekkingTrails(!showTrekkingTrails);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
              showTrekkingTrails
                ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981] font-medium'
                : 'bg-[#202020] border-[#292929] text-[#A0A0A0]'
            }`}
            title="Trekking Trails, Footpaths & Cross-District Shortcuts"
          >
            <Footprints className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Trekkable Trails</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowThreatRadii(!showThreatRadii);
            }}
            className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
              showThreatRadii
                ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444] font-medium'
                : 'bg-[#202020] border-[#292929] text-[#A0A0A0]'
            }`}
          >
            Hazard Radii
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowGulliesAndWater(!showGulliesAndWater);
            }}
            className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
              showGulliesAndWater
                ? 'bg-[#06B6D4]/15 border-[#06B6D4]/40 text-[#06B6D4] font-medium'
                : 'bg-[#202020] border-[#292929] text-[#A0A0A0]'
            }`}
          >
            River & Ravines
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowBuildingDetails(!showBuildingDetails);
            }}
            className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
              showBuildingDetails
                ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B] font-medium'
                : 'bg-[#202020] border-[#292929] text-[#A0A0A0]'
            }`}
          >
            Buildings
          </button>

          {/* Quick Target: Cable Ferry [C3 ⇄ D4] */}
          <button
            type="button"
            onClick={handleFocusCableFerry}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-bold transition-all cursor-pointer ${
              isRouteUsingCableFerry
                ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.4)] animate-pulse'
                : 'bg-[#182330] border-[#38bdf8]/50 hover:bg-[#1e2f42] text-[#38bdf8]'
            }`}
            title="Locate and highlight the C3 ⇄ D4 Cable Ferry river crossing"
          >
            <Anchor className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Cable Ferry [C3 ⇄ D4]</span>
            {isRouteUsingCableFerry && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Interactive Map Viewport (Widescreen 2000x1100 Canvas) */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full h-[540px] sm:h-[640px] lg:h-[720px] bg-[#090909] border-x border-b border-[#292929] rounded-b-xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
      >
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            shapeRendering: 'geometricPrecision',
          }}
        >
          <defs>
            {/* Glow filters for tactical curved route line */}
            <filter id="vectorRouteGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Recalibration alert flash glow */}
            <filter id="alertRecalibrateGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="14" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Cable Ferry Beacon Glow filter */}
            <filter id="cableFerryGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Tactical Grid Pattern */}
            <pattern id="offlineCartoGrid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#171e2e" strokeWidth="0.7" opacity="0.35" />
              <circle cx="0" cy="0" r="1.5" fill="#334155" opacity="0.4" />
            </pattern>

            {/* Topographic Elevation Contours */}
            <pattern id="contourTopo" width="240" height="240" patternUnits="userSpaceOnUse">
              <path
                d="M 0 40 Q 60 70 120 40 T 240 40 M 0 100 Q 70 140 140 100 T 240 100 M 0 160 Q 50 190 130 160 T 240 160 M 0 220 Q 90 250 170 220 T 240 220"
                fill="none"
                stroke="#10b981"
                strokeWidth="0.8"
                opacity="0.18"
              />
            </pattern>

            {/* Water Flow Linear Gradient */}
            <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#071b2b" />
              <stop offset="50%" stopColor="#09253b" />
              <stop offset="100%" stopColor="#051422" />
            </linearGradient>

            {/* Hazard Red Pulse Pattern */}
            <radialGradient id="hazardPulseRadial">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
              <stop offset="65%" stopColor="#ef4444" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ========================================================
              LAYER 1: BACKGROUND, SATELLITE / TERRAIN CONTOURS
             ======================================================== */}
          {/* Base Earth Fill */}
          <rect
            width={MAP_W}
            height={MAP_H}
            fill={mapStyle === 'satellite' ? '#070b12' : mapStyle === 'topo' ? '#07100b' : '#090d15'}
          />

          {/* Google Cartographic Grid */}
          <rect width={MAP_W} height={MAP_H} fill="url(#offlineCartoGrid)" />

          {/* Topographic Lines if enabled or topo mode */}
          {mapStyle === 'topo' && <rect width={MAP_W} height={MAP_H} fill="url(#contourTopo)" />}

          {/* ========================================================
              LAYER 2: CURVING WATERWAYS, RIVER & RAVINES (Authentic Organic Curves)
             ======================================================== */}
          {showGulliesAndWater && (
            <g>
              {/* Natural Meandering Blackwater River passing through the district */}
              <path
                d="M -50 490 C 220 530, 480 430, 720 520 C 960 610, 1220 460, 1480 540 C 1720 620, 1920 490, 2050 510 L 2050 630 C 1920 610, 1720 740, 1480 660 C 1220 580, 960 730, 720 640 C 480 550, 220 650, -50 610 Z"
                fill="url(#riverGradient)"
                stroke="#0369a1"
                strokeWidth="2.5"
                opacity="0.88"
              />

              {/* River Flow Direction Waves */}
              <path
                d="M 120 560 Q 320 510 520 545 M 760 585 Q 980 540 1180 575 M 1380 600 Q 1580 555 1780 590"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.3"
                strokeDasharray="14 10"
              />

              {/* Waterway Labels */}
              <text x="320" y="585" fill="#38bdf8" opacity="0.6" fontSize="10" fontWeight="bold" fontFamily="sans-serif" letterSpacing="3">
                BLACKWATER RAVINE // NAVIGATION WATERWAY
              </text>
              <text x="1350" y="625" fill="#38bdf8" opacity="0.6" fontSize="10" fontWeight="bold" fontFamily="sans-serif" letterSpacing="3">
                EAST BASIN ESTUARY
              </text>
            </g>
          )}

          {/* ========================================================
              LAYER 3: CURVED ROAD NETWORK (Uneven, Curvy Avenues & Boulevards)
             ======================================================== */}
          {/* Curved East-West Avenues (Avenues 1 to 5) */}
          {[
            { id: 'h1', d: 'M -30 130 C 350 100, 750 160, 1150 115 C 1500 80, 1800 150, 2030 130', name: 'NORTH RIM PARKWAY' },
            { id: 'h2', d: 'M -30 340 C 360 375, 760 315, 1160 365 C 1520 315, 1810 360, 2030 340', name: 'MERCER EXPRESSWAY' },
            { id: 'h3', d: 'M -30 560 C 380 535, 780 590, 1180 535 C 1540 585, 1820 540, 2030 560', name: 'BROADWAY CIVIC CONCOURSE' },
            { id: 'h4', d: 'M -30 780 C 360 815, 760 755, 1160 810 C 1520 755, 1830 800, 2030 780', name: 'RIVERSIDE BOULEVARD' },
            { id: 'h5', d: 'M -30 970 C 380 940, 780 1000, 1180 945 C 1540 995, 1840 950, 2030 970', name: 'SOUTHERN HAVEN CORRIDOR' },
          ].map((road) => (
            <g key={road.id}>
              {/* Roadbed border */}
              <path d={road.d} stroke="#1b2434" strokeWidth="28" fill="none" strokeLinecap="round" />
              {/* Road Asphalt */}
              <path d={road.d} stroke="#121824" strokeWidth="24" fill="none" strokeLinecap="round" />
              {/* Center dividing dashed strip */}
              <path d={road.d} stroke="#475569" strokeWidth="1.5" fill="none" strokeDasharray="16 12" />
            </g>
          ))}

          {/* Curved North-South Boulevards (Boulevards A to H) */}
          {[
            { id: 'vA', d: 'M 150 -20 C 130 260, 175 560, 145 810 C 135 960, 165 1050, 150 1120', name: '1ST OUTPOST AVE' },
            { id: 'vB', d: 'M 390 -20 C 415 250, 370 570, 405 825 C 420 960, 385 1050, 390 1120', name: 'ST. JUDE PARKWAY' },
            { id: 'vC', d: 'M 640 -20 C 615 260, 665 560, 630 815 C 615 960, 650 1050, 640 1120', name: 'BROADWAY CONCOURSE' },
            { id: 'vD', d: 'M 890 -20 C 915 250, 870 570, 905 825 C 920 960, 885 1050, 890 1120', name: 'CIVIC ARTERY FREEWAY' },
            { id: 'vE', d: 'M 1140 -20 C 1120 270, 1165 570, 1130 825 C 1115 960, 1150 1050, 1140 1120', name: 'UNIVERSITY CORRIDOR' },
            { id: 'vF', d: 'M 1390 -20 C 1415 250, 1370 580, 1405 835 C 1420 960, 1385 1050, 1390 1120', name: 'HYDRO POWER WAY' },
            { id: 'vG', d: 'M 1630 -20 C 1610 260, 1655 570, 1620 825 C 1605 960, 1640 1050, 1630 1120', name: 'HARBOR TERMINAL HIGHWAY' },
            { id: 'vH', d: 'M 1860 -20 C 1880 260, 1840 570, 1875 830 C 1890 960, 1850 1050, 1860 1120', name: 'COASTLINE SANCTUARY BYPASS' },
          ].map((road) => (
            <g key={road.id}>
              <path d={road.d} stroke="#1b2434" strokeWidth="28" fill="none" strokeLinecap="round" />
              <path d={road.d} stroke="#121824" strokeWidth="24" fill="none" strokeLinecap="round" />
              <path d={road.d} stroke="#475569" strokeWidth="1.5" fill="none" strokeDasharray="16 12" />
            </g>
          ))}

          {/* ========================================================
              LAYER 4: WALKABLE TREKKING TRAILS & GULLIES (8-directional pedestrian shortcuts)
             ======================================================== */}
          {showTrekkingTrails && (
            <g stroke="#10b981" strokeWidth="4" fill="none" opacity="0.85" strokeLinecap="round">
              {/* THE USER'S EXACT SHORTCUT: Trekkable trail from E2 (University) to D3 (City Hall Plaza) */}
              <g>
                <path
                  d="M 1122 324 C 1040 380, 960 440, 876 576"
                  stroke="#10b981"
                  strokeWidth="5"
                  strokeDasharray="8 6"
                />
                <text x="970" y="445" fill="#34d399" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                  TREKKABLE GULLY TRAIL [E2 ⇄ D3]
                </text>
              </g>

              {/* Other walkable shortcuts across open terrain, parks, and ravines */}
              <path d="M 142 136 C 240 220, 310 260, 408 356" stroke="#10b981" strokeWidth="3" strokeDasharray="6 6" />
              <path d="M 408 356 C 500 420, 560 460, 662 542" stroke="#10b981" strokeWidth="3" strokeDasharray="6 6" />
              
              <path d="M 910 768 C 990 840, 1050 880, 1124 956" stroke="#10b981" strokeWidth="3" strokeDasharray="6 6" />
              <path d="M 1406 124 C 1480 200, 1530 250, 1610 328" stroke="#10b981" strokeWidth="3" strokeDasharray="6 6" />
              <path d="M 1648 544 C 1720 630, 1780 690, 1875 764" stroke="#10b981" strokeWidth="3" strokeDasharray="6 6" />
              <path d="M 1408 766 C 1480 840, 1540 890, 1612 958" stroke="#10b981" strokeWidth="3" strokeDasharray="6 6" />
            </g>
          )}

          {/* ========================================================
              MAJOR RIVER CROSSING: CABLE FERRY & FLOATING PONTOON [C3 ⇄ D4]
              (Prominently highlighted crossing spanning Blackwater River)
             ======================================================== */}
          <g
            id="cable-ferry-crossing"
            className="cursor-pointer transition-opacity"
            onClick={handleFocusCableFerry}
          >
            {/* 1. Water corridor highlight halo across Blackwater River */}
            <path
              d="M 662 542 C 730 610, 820 690, 910 768"
              stroke={isRouteUsingCableFerry ? '#fbbf24' : '#0284c7'}
              strokeWidth={isRouteUsingCableFerry ? '36' : '26'}
              strokeLinecap="round"
              fill="none"
              opacity={isRouteUsingCableFerry ? 0.4 : 0.22}
              filter="url(#cableFerryGlow)"
            />

            {/* 2. Dual High-Tension Steel Winch Cables */}
            {/* Guide cable 1 (Main Winch Cable) */}
            <path
              d="M 660 540 C 728 608, 818 688, 908 766"
              stroke="#091422"
              strokeWidth="5"
              fill="none"
            />
            <path
              d="M 660 540 C 728 608, 818 688, 908 766"
              stroke={isRouteUsingCableFerry ? '#fbbf24' : '#38bdf8'}
              strokeWidth="2.5"
              strokeDasharray="6 3"
              fill="none"
            />
            {/* Guide cable 2 (Parallel Return Cable) */}
            <path
              d="M 664 544 C 732 612, 822 692, 912 770"
              stroke="#0284c7"
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
              opacity="0.85"
            />

            {/* Active Route Pulse along cable if currently traversed */}
            {isRouteUsingCableFerry && (
              <path
                d="M 662 542 C 730 610, 820 690, 910 768"
                stroke="#f59e0b"
                strokeWidth="6"
                strokeDasharray="14 14"
                className="animate-route-flow"
                fill="none"
                opacity="0.9"
              />
            )}

            {/* 3. North Pier Slip (Sector C3 Docks) */}
            <g transform="translate(646, 530)">
              {/* Wooden Pier Platform */}
              <rect x="0" y="0" width="46" height="26" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              {/* Plank details */}
              <line x1="11" y1="2" x2="11" y2="24" stroke="#334155" strokeWidth="1" />
              <line x1="23" y1="2" x2="23" y2="24" stroke="#334155" strokeWidth="1" />
              <line x1="35" y1="2" x2="35" y2="24" stroke="#334155" strokeWidth="1" />
              {/* Bollards */}
              <circle cx="8" cy="8" r="3" fill="#38bdf8" />
              <circle cx="38" cy="8" r="3" fill="#38bdf8" />
              {/* Pulsing Beacon Ring */}
              <circle cx="23" cy="13" r="16" fill="#38bdf8" opacity="0.3" className="animate-ping" />
              <circle cx="23" cy="13" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            </g>
            {/* North Pier Label */}
            <rect x="575" y="518" width="138" height="19" rx="4" fill="#091422" stroke="#38bdf8" strokeWidth="1" />
            <text x="644" y="531" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
              ⚓ C3 NORTH FERRY SLIP
            </text>

            {/* 4. South Pier Wharf (Sector D4 River Wharf) */}
            <g transform="translate(866, 720)">
              {/* Wooden Wharf Platform */}
              <rect x="0" y="0" width="46" height="26" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              {/* Plank details */}
              <line x1="11" y1="2" x2="11" y2="24" stroke="#334155" strokeWidth="1" />
              <line x1="23" y1="2" x2="23" y2="24" stroke="#334155" strokeWidth="1" />
              <line x1="35" y1="2" x2="35" y2="24" stroke="#334155" strokeWidth="1" />
              {/* Bollards */}
              <circle cx="8" cy="18" r="3" fill="#38bdf8" />
              <circle cx="38" cy="18" r="3" fill="#38bdf8" />
              {/* Pulsing Beacon Ring */}
              <circle cx="23" cy="13" r="16" fill="#38bdf8" opacity="0.3" className="animate-ping" />
              <circle cx="23" cy="13" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            </g>
            {/* South Wharf Label */}
            <rect x="846" y="750" width="144" height="19" rx="4" fill="#091422" stroke="#38bdf8" strokeWidth="1" />
            <text x="918" y="763" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
              ⚓ D4 SOUTH RIVER WHARF
            </text>

            {/* 5. Mid-River Cable Pontoon Ferry (The Vessel) */}
            <g transform="translate(755, 624)">
              {/* Water Ripple Wake behind barge */}
              <path d="M -16 16 C 5 28, 45 28, 66 16" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.75" />
              <path d="M -24 22 C 0 36, 50 36, 74 22" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 4" fill="none" opacity="0.45" />

              {/* Pontoon Outriggers */}
              <rect x="-6" y="-3" width="10" height="34" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
              <rect x="46" y="-3" width="10" height="34" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />

              {/* Main Barge Deck */}
              <rect
                x="2"
                y="0"
                width="46"
                height="28"
                rx="4"
                fill="#0a192f"
                stroke={isRouteUsingCableFerry ? '#fbbf24' : '#38bdf8'}
                strokeWidth={isRouteUsingCableFerry ? 3 : 2}
              />

              {/* Center Winch Gear & Cable Guide */}
              <rect x="18" y="4" width="14" height="20" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
              <circle cx="25" cy="14" r="5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="25" cy="14" r="2" fill="#ffffff" />

              {/* Handrails */}
              <line x1="4" y1="2" x2="46" y2="2" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="4" y1="26" x2="46" y2="26" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />

              {/* Ferry Anchor Symbols */}
              <text x="10" y="17" fill="#38bdf8" fontSize="10" fontWeight="bold">
                ⚓
              </text>
              <text x="34" y="17" fill="#38bdf8" fontSize="10" fontWeight="bold">
                ⚓
              </text>
            </g>

            {/* 6. Prominent Floating Tactical Callout Banner with Status */}
            <g transform="translate(668, 584)">
              <rect
                x="0"
                y="0"
                width="206"
                height="34"
                rx="6"
                fill="#031322"
                stroke={isRouteUsingCableFerry ? '#f59e0b' : '#38bdf8'}
                strokeWidth={isRouteUsingCableFerry ? 2.5 : 1.5}
                filter="url(#cableFerryGlow)"
              />
              <circle
                cx="18"
                cy="17"
                r="8"
                fill={isRouteUsingCableFerry ? '#f59e0b' : '#10b981'}
                className="animate-pulse"
              />
              <text x="18" y="20" textAnchor="middle" fill="#090909" fontSize="9" fontWeight="bold">
                ⚓
              </text>
              <text
                x="32"
                y="15"
                fill={isRouteUsingCableFerry ? '#fbbf24' : '#38bdf8'}
                fontSize="10"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                CABLE FERRY [C3 ⇄ D4]
              </text>
              <text
                x="32"
                y="26.5"
                fill={isRouteUsingCableFerry ? '#fde68a' : '#94a3b8'}
                fontSize="8"
                fontFamily="sans-serif"
                fontWeight="500"
              >
                {isRouteUsingCableFerry
                  ? '★ ACTIVE EXPEDITION ROUTE · WATER TRANSIT'
                  : 'OPERATIONAL MANUAL STEEL PONTOON'}
              </text>
            </g>
          </g>

          {/* Bridges crossing over Blackwater River */}
          {/* Bridge 1: West Cross-Bridge (Col B: x≈390) */}
          <g>
            <rect x="368" y="475" width="44" height="120" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <rect x="360" y="505" width="60" height="12" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
            <rect x="360" y="565" width="60" height="12" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
            <text x="420" y="540" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">
              WEST TRUSS BRIDGE
            </text>
          </g>

          {/* Bridge 2: Central Metro Highway Bridge (Col C: x≈640) - Collapsed Zone C2/C3 */}
          <g>
            <rect x="618" y="470" width="44" height="120" rx="4" fill="#182030" stroke="#f43f5e" strokeWidth="2" strokeDasharray="6 3" />
            <rect x="618" y="510" width="44" height="30" fill="#0b2438" opacity="0.85" />
            <line x1="612" y1="510" x2="668" y2="510" stroke="#e11d48" strokeWidth="2" />
            <line x1="612" y1="540" x2="668" y2="540" stroke="#e11d48" strokeWidth="2" />
            <text x="670" y="530" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
              COLLAPSED SPAN (HAZARD)
            </text>
          </g>

          {/* Bridge 3: University Corridor Suspension Bridge (Col E: x≈1140) */}
          <g>
            <rect x="1118" y="480" width="44" height="120" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <rect x="1110" y="510" width="60" height="12" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="1110" y="570" width="60" height="12" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="1170" y="545" fill="#38bdf8" fontSize="8" fontFamily="sans-serif">
              HAVEN SUSPENSION BRIDGE
            </text>
          </g>

          {/* Bridge 4: Harbor Terminal Bridge (Col G: x≈1630) */}
          <g>
            <rect x="1608" y="485" width="44" height="120" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
            <rect x="1600" y="515" width="60" height="12" rx="2" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
            <rect x="1600" y="575" width="60" height="12" rx="2" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
            <text x="1660" y="550" fill="#10b981" fontSize="8" fontFamily="sans-serif">
              HARBOR STEEL ARCH
            </text>
          </g>

          {/* Street Name Labels */}
          {showStreetNames && (
            <g fill="#64748b" fontSize="9" fontFamily="sans-serif" letterSpacing="1">
              <text x="25" y="118">NORTH RIM PARKWAY</text>
              <text x="25" y="328">MERCER EXPRESSWAY</text>
              <text x="25" y="548">BROADWAY CIVIC CONCOURSE</text>
              <text x="25" y="768">RIVERSIDE BOULEVARD</text>
              <text x="25" y="958">SOUTHERN HAVEN CORRIDOR</text>
            </g>
          )}

          {/* ========================================================
              LAYER 5: URBAN DISTRICTS & UNEVEN ORGANIC PARCELS (40 Sectors)
             ======================================================== */}
          {cells.map((cell) => {
            const center = sectorCenters[cell.id];
            if (!center) return null;

            const isSelected = selectedCellId === cell.id;
            const isPath = pathCellIds.includes(cell.id);
            const w = 175;
            const h = 135;
            const bx = center.x - w / 2;
            const by = center.y - h / 2;

            // Organic polygon contour path for each sector parcel (Uneven, non-square curved boundary)
            const parcelPolygon = `
              M ${bx + 14} ${by}
              Q ${bx + w / 2} ${by - 8} ${bx + w - 16} ${by + 4}
              Q ${bx + w + 6} ${by + h / 2} ${bx + w - 12} ${by + h - 12}
              Q ${bx + w / 2} ${by + h + 8} ${bx + 14} ${by + h - 6}
              Q ${bx - 8} ${by + h / 2} ${bx + 14} ${by}
              Z
            `;

            return (
              <g
                key={`sector-${cell.id}`}
                onClick={() => {
                  playClickSound();
                  playRadarPing(800 + (cell.r + cell.c) * 35);
                  onSelectCell(cell.id);
                }}
                className="cursor-pointer transition-transform"
              >
                {/* Sector Base Parcel Boundary (Organic Non-Square Shape) */}
                <path
                  d={parcelPolygon}
                  fill={
                    cell.isStart
                      ? '#0b261a'
                      : cell.isDestination
                      ? '#2a1a06'
                      : cell.threatLevel === 4
                      ? '#2b0d14'
                      : isPath
                      ? '#1c1a14'
                      : '#0d131f'
                  }
                  stroke={
                    isSelected
                      ? '#06b6d4'
                      : isPath
                      ? '#f59e0b'
                      : cell.threatLevel === 4
                      ? '#f43f5e'
                      : cell.threatLevel > 0
                      ? '#ea580c'
                      : '#1e293b'
                  }
                  strokeWidth={isSelected ? 3 : isPath ? 2.5 : 1}
                  opacity={0.94}
                />

                {/* Coordinate Tag in top-left of block */}
                <rect
                  x={bx + 10}
                  y={by + 6}
                  width="28"
                  height="16"
                  rx="3"
                  fill="#171e2e"
                  stroke={isPath ? '#f59e0b' : '#27354a'}
                  strokeWidth="1"
                />
                <text
                  x={bx + 24}
                  y={by + 17.5}
                  textAnchor="middle"
                  fill={isPath ? '#fbbf24' : '#94a3b8'}
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {cell.id}
                </text>

                {/* Sector Name */}
                <text
                  x={bx + 42}
                  y={by + 17.5}
                  fill="#f1f5f9"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {cell.name.length > 17 ? cell.name.substring(0, 16) + '..' : cell.name}
                </text>

                {/* Architectural Footprints inside the parcel */}
                {showBuildingDetails && (
                  <g opacity={0.9}>
                    {cell.isStart ? (
                      // START: Fortified Survivor Compound Alpha
                      <g>
                        <rect x={bx + 14} y={by + 30} width={w - 28} height={h - 42} rx="4" fill="#0d231b" stroke="#10b981" strokeWidth="1.5" />
                        <rect x={bx + 22} y={by + 40} width="52" height="34" rx="2" fill="#144d3b" stroke="#34d399" strokeWidth="1" />
                        <circle cx={bx + w - 42} cy={by + 58} r="16" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                        <text x={bx + w - 42} cy={by + 62} textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold">
                          BUNKER
                        </text>
                      </g>
                    ) : cell.isDestination ? (
                      // DESTINATION: Haven Extraction Beacon & LZ Runway
                      <g>
                        <rect x={bx + 14} y={by + 30} width={w - 28} height={h - 42} rx="4" fill="#2d1c08" stroke="#f59e0b" strokeWidth="1.5" />
                        <rect x={bx + 22} y={by + 42} width={w - 44} height="20" rx="2" fill="#451a03" stroke="#f59e0b" strokeWidth="1" strokeDasharray="6 4" />
                        <circle cx={bx + w - 38} cy={by + 76} r="14" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
                        <text x={bx + 28} y={by + 56} fill="#fef08a" fontSize="8.5" fontWeight="bold">
                          EXTRACTION LZ
                        </text>
                      </g>
                    ) : cell.supplyType === 'food' ? (
                      // Food Supermarket / Cold Storage / Ration Depot
                      <g>
                        <rect x={bx + 16} y={by + 32} width={w - 32} height={h - 48} rx="3" fill="#261b0c" stroke="#f59e0b" strokeWidth="1" />
                        <circle cx={bx + 38} cy={by + 58} r="12" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1" />
                        <text x={bx + 38} y={by + 62} textAnchor="middle" fill="#f59e0b" fontSize="10">
                          🍎
                        </text>
                        <text x={bx + 58} y={by + 55} fill="#f59e0b" fontSize="8.5" fontWeight="bold">
                          FOOD STORE
                        </text>
                        <text x={bx + 58} y={by + 68} fill="#fbbf24" fontSize="8">
                          +{cell.supplyAmount} Rations
                        </text>
                      </g>
                    ) : cell.supplyType === 'water' ? (
                      // Water Filtration / Reservoir / Cistern Plant
                      <g>
                        <rect x={bx + 16} y={by + 32} width={w - 32} height={h - 48} rx="3" fill="#08202d" stroke="#06b6d4" strokeWidth="1" />
                        <circle cx={bx + 38} cy={by + 58} r="12" fill="#06b6d4" fillOpacity="0.25" stroke="#06b6d4" strokeWidth="1" />
                        <text x={bx + 38} y={by + 62} textAnchor="middle" fill="#06b6d4" fontSize="10">
                          💧
                        </text>
                        <text x={bx + 58} y={by + 55} fill="#06b6d4" fontSize="8.5" fontWeight="bold">
                          WATER SUPPLY
                        </text>
                        <text x={bx + 58} y={by + 68} fill="#38bdf8" fontSize="8">
                          +{cell.supplyAmount} Liters
                        </text>
                      </g>
                    ) : cell.supplyType === 'medicine' ? (
                      // Red Cross Medical Clinic / Hospital
                      <g>
                        <rect x={bx + 16} y={by + 32} width={w - 32} height={h - 48} rx="3" fill="#1a121d" stroke="#10b981" strokeWidth="1" />
                        <circle cx={bx + 38} cy={by + 58} r="12" fill="#10b981" fillOpacity="0.25" stroke="#10b981" strokeWidth="1" />
                        {/* Red Cross Emblem */}
                        <rect x={bx + 35} y={by + 50} width="6" height="16" rx="1" fill="#ef4444" />
                        <rect x={bx + 30} y={by + 55} width="16" height="6" rx="1" fill="#ef4444" />
                        <text x={bx + 58} y={by + 55} fill="#10b981" fontSize="8.5" fontWeight="bold">
                          MEDICAL CLINIC
                        </text>
                        <text x={bx + 58} y={by + 68} fill="#34d399" fontSize="8">
                          +{cell.supplyAmount} Med Kits
                        </text>
                      </g>
                    ) : (
                      // Urban buildings, residential blocks, warehouses, research wings
                      <g>
                        <rect x={bx + 16} y={by + 32} width="46" height="38" rx="2" fill="#141c2b" stroke="#223048" strokeWidth="1" />
                        <rect x={bx + 68} y={by + 32} width="38" height="24" rx="2" fill="#172033" stroke="#24344d" strokeWidth="1" />
                        <rect x={bx + 68} y={by + 60} width="42" height="20" rx="2" fill="#131b2a" stroke="#1f2c42" strokeWidth="1" />
                        <rect x={bx + 114} y={by + 34} width="34" height="46" rx="2" fill="#151e2e" stroke="#23324a" strokeWidth="1" />
                      </g>
                    )}
                  </g>
                )}

                {/* Supply Icon Badge in top-right of block */}
                {cell.supplyType !== 'none' && (
                  <g transform={`translate(${bx + w - 40}, ${by + 6})`}>
                    <rect
                      x="0"
                      y="0"
                      width="30"
                      height="15"
                      rx="3"
                      fill={
                        cell.supplyType === 'food'
                          ? '#f59e0b'
                          : cell.supplyType === 'water'
                          ? '#06b6d4'
                          : '#10b981'
                      }
                      fillOpacity="0.25"
                      stroke={
                        cell.supplyType === 'food'
                          ? '#f59e0b'
                          : cell.supplyType === 'water'
                          ? '#06b6d4'
                          : '#10b981'
                      }
                      strokeWidth="1"
                    />
                    <text
                      x="15"
                      y="11"
                      textAnchor="middle"
                      fill={
                        cell.supplyType === 'food'
                          ? '#f59e0b'
                          : cell.supplyType === 'water'
                          ? '#06b6d4'
                          : '#10b981'
                      }
                      fontSize="8.5"
                      fontWeight="bold"
                    >
                      +{cell.supplyAmount}
                    </text>
                  </g>
                )}

                {/* Threat Indicator / Danger Badge */}
                {cell.threatLevel > 0 && (
                  <g transform={`translate(${bx + 16}, ${by + h - 28})`}>
                    <rect
                      x="0"
                      y="0"
                      width="54"
                      height="16"
                      rx="3"
                      fill={
                        cell.threatLevel === 4
                          ? '#f43f5e'
                          : cell.threatLevel === 3
                          ? '#ef4444'
                          : cell.threatLevel === 2
                          ? '#f97316'
                          : '#eab308'
                      }
                      fillOpacity="0.25"
                      stroke={
                        cell.threatLevel === 4
                          ? '#f43f5e'
                          : cell.threatLevel === 3
                          ? '#ef4444'
                          : cell.threatLevel === 2
                          ? '#f97316'
                          : '#eab308'
                      }
                      strokeWidth="1"
                    />
                    <text
                      x="27"
                      y="11.5"
                      textAnchor="middle"
                      fill={
                        cell.threatLevel === 4
                          ? '#f43f5e'
                          : cell.threatLevel === 3
                          ? '#ef4444'
                          : cell.threatLevel === 2
                          ? '#f97316'
                          : '#eab308'
                      }
                      fontSize="8.5"
                      fontWeight="bold"
                    >
                      {cell.threatLevel === 4 ? 'BLOCKED' : `LVL ${cell.threatLevel} HAZ`}
                    </text>
                  </g>
                )}

                {/* Base Camp / Destination Marker Pin Overlay */}
                {cell.isStart && (
                  <g transform={`translate(${center.x - 12}, ${center.y - 28})`}>
                    <circle cx="12" cy="12" r="14" fill="#10b981" opacity="0.3" className="animate-ping" />
                    <circle cx="12" cy="12" r="10" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                    <text x="12" y="15" textAnchor="middle" fill="#090909" fontSize="9" fontWeight="bold">
                      A
                    </text>
                  </g>
                )}

                {cell.isDestination && (
                  <g transform={`translate(${center.x - 12}, ${center.y - 28})`}>
                    <circle cx="12" cy="12" r="16" fill="#f59e0b" opacity="0.3" className="animate-ping" />
                    <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                    <text x="12" y="15" textAnchor="middle" fill="#090909" fontSize="9" fontWeight="bold">
                      B
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ========================================================
              LAYER 6: HAZARD THREAT RADII OVERLAY
             ======================================================== */}
          {showThreatRadii && (
            <g pointerEvents="none">
              {cells
                .filter((c) => c.threatLevel > 0)
                .map((cell) => {
                  const center = sectorCenters[cell.id];
                  if (!center) return null;

                  const radius =
                    cell.threatLevel === 4
                      ? 90
                      : cell.threatLevel === 3
                      ? 80
                      : cell.threatLevel === 2
                      ? 65
                      : 50;

                  return (
                    <g key={`hazard-radius-${cell.id}`}>
                      <circle
                        cx={center.x}
                        cy={center.y}
                        r={radius}
                        fill="url(#hazardPulseRadial)"
                        stroke={cell.threatLevel === 4 ? '#f43f5e' : '#ef4444'}
                        strokeWidth="1.5"
                        strokeDasharray={cell.threatLevel === 4 ? '4 4' : '6 3'}
                        opacity="0.8"
                      />
                      {cell.threatLevel === 4 && (
                        <circle
                          cx={center.x}
                          cy={center.y}
                          r={radius + 15}
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="1"
                          strokeDasharray="2 4"
                          opacity="0.4"
                        />
                      )}
                    </g>
                  );
                })}
            </g>
          )}

          {/* ========================================================
              LAYER 7: REALISTIC CURVED ROUTE LINE & ROUTE DIRECTOR
             ======================================================== */}
          {routeSvgPath && (
            <g pointerEvents="none">
              {/* 1. Recalibration pulse flash halo */}
              {isBlinkingRecalibrate && (
                <path
                  d={routeSvgPath}
                  stroke="#f59e0b"
                  strokeWidth="24"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#alertRecalibrateGlow)"
                  className="animate-pulse"
                  opacity="0.75"
                />
              )}

              {/* 2. Outer Tactical Route Glow */}
              <path
                d={routeSvgPath}
                stroke="#d97706"
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#vectorRouteGlow)"
                opacity="0.5"
              />

              {/* 3. Dark Asphalt Backing for contrast against terrain */}
              <path
                d={routeSvgPath}
                stroke="#090909"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />

              {/* 4. Main Bright Amber Tactical Route Line */}
              <path
                ref={pathRef}
                d={routeSvgPath}
                stroke="#f59e0b"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 5. Animated Directional Flow Dash */}
              <path
                d={routeSvgPath}
                stroke="#ffffff"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="16 28"
                className="animate-route-flow"
                opacity="0.85"
              />

              {/* 6. Step Waypoint Nodes along the route */}
              {routeSteps.map((s, idx) => {
                const pt = sectorCenters[s.cellId];
                if (!pt) return null;
                const isStart = idx === 0;
                const isEnd = idx === routeSteps.length - 1;

                return (
                  <g key={`step-node-${s.cellId}-${idx}`} transform={`translate(${pt.x}, ${pt.y})`}>
                    <circle
                      cx="0"
                      cy="0"
                      r={isStart || isEnd ? 12 : 7}
                      fill={isStart ? '#10b981' : isEnd ? '#f59e0b' : '#171717'}
                      stroke={isStart ? '#ffffff' : isEnd ? '#ffffff' : '#f59e0b'}
                      strokeWidth={isStart || isEnd ? 2.5 : 2}
                    />
                    {!isStart && !isEnd && (
                      <circle cx="0" cy="0" r="3.5" fill="#f59e0b" />
                    )}
                  </g>
                );
              })}

              {/* 7. Animated Route Director (Mobile Survivor Beacon moving along curves) */}
              <g
                transform={`translate(${directorPos.x}, ${directorPos.y}) rotate(${directorPos.angle})`}
                className="transition-transform duration-75"
              >
                {/* Sonar Radar Wave */}
                <circle cx="0" cy="0" r="22" fill="#06b6d4" opacity="0.3" className="animate-ping" />
                {/* Director Core Glow */}
                <circle cx="0" cy="0" r="14" fill="#06b6d4" stroke="#ffffff" strokeWidth="2.5" />
                {/* Directional Chevron Arrow facing movement tangent */}
                <path d="M 5 0 L -3 -5 L -1 0 L -3 5 Z" fill="#090909" />
              </g>
            </g>
          )}
        </svg>

        {/* 3. Tactical Map Overlay Controls (Bottom-Right Floating HUD) */}
        <div className="absolute right-4 bottom-4 flex flex-col gap-2 z-20 font-sans">
          <div className="flex items-center gap-1 bg-[#171717]/90 backdrop-blur-md p-1 rounded-lg border border-[#292929] shadow-xl">
            <button
              type="button"
              onClick={() => handleZoom(0.2)}
              className="p-2 text-[#FAFAFA] hover:bg-[#202020] rounded-md transition-colors cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-[#FAFAFA]" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(-0.2)}
              className="p-2 text-[#FAFAFA] hover:bg-[#202020] rounded-md transition-colors cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-[#FAFAFA]" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="p-2 text-[#A0A0A0] hover:text-[#FAFAFA] hover:bg-[#202020] rounded-md transition-colors cursor-pointer"
              title="Reset View"
              aria-label="Reset View"
            >
              <RotateCcw className="w-4 h-4 text-[#A0A0A0]" />
            </button>
          </div>

          {/* Quick Telemetry Chip */}
          <div className="bg-[#171717]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#292929] text-[10px] text-[#A0A0A0] flex items-center justify-between gap-3 shadow-xl font-sans">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3 h-3 text-[#06B6D4]" />
              <span>{mouseCoord.lat}, {mouseCoord.lng}</span>
            </span>
            <span className="text-[#10B981] font-semibold">{mouseCoord.elev}</span>
          </div>
        </div>

        {/* 4. Recalibration Banner Toast */}
        {isBlinkingRecalibrate && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-[#090909] px-4 py-1.5 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce z-30 font-sans">
            <Radio className="w-4 h-4 animate-spin" />
            <span>ROUTE RECALIBRATED // OPTIMAL PATH RE-ESTABLISHED</span>
          </div>
        )}
      </div>
    </div>
  );
};
