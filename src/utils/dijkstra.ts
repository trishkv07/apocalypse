/**
 * Dijkstra Pathfinding Algorithm & Resource-Aware City Grid Engine for BEACON
 */

import { CellData, GridCoord, RouteAnalysisData, RouteStep, ScavengeStrategy, SurvivorSupplies, ThreatLevel } from '../types';

export const GRID_ROWS = 5;
export const GRID_COLS = 8;
export const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const ROW_LABELS = ['1', '2', '3', '4', '5'];

export function coordToId(r: number, c: number): string {
  if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return 'A1';
  return `${COL_LABELS[c]}${ROW_LABELS[r]}`;
}

export function idToCoord(id: string): GridCoord | null {
  if (!id || id.length < 2) return null;
  const colLetter = id.charAt(0).toUpperCase();
  const rowNumber = id.charAt(1);

  const c = COL_LABELS.indexOf(colLetter);
  const r = ROW_LABELS.indexOf(rowNumber);

  if (r === -1 || c === -1) return null;
  return { r, c };
}

// Generate the 40-cell regional survivor grid (8 columns A-H x 5 rows 1-5)
export function createInitialGrid(): CellData[] {
  const cells: CellData[] = [];

  const defaultLocations: Record<
    string,
    {
      name: string;
      supply?: 'food' | 'water' | 'medicine';
      amount?: number;
      threat?: ThreatLevel;
      threatDesc?: string;
    }
  > = {
    // ROW 1: North Rim & Coast Corridor
    'A1': { name: 'Survivor Bunker Alpha', threat: 0 }, // Start Default
    'B1': { name: 'Commercial Strip & Old Bazaar', threat: 0 },
    'C1': { name: 'Fire Station 9 & First Response', threat: 0 },
    'D1': { name: 'Red Cross Emergency Clinic', supply: 'medicine', amount: 3, threat: 0 },
    'E1': { name: 'Riverside Water Purification Post', supply: 'water', amount: 4, threat: 0 },
    'F1': { name: 'Ration Distribution Warehouse', supply: 'food', amount: 5, threat: 0 },
    'G1': { name: 'Cargo Harbor Marine Terminal', threat: 0 },
    'H1': { name: 'North Aviation Helipad LZ', threat: 1, threatDesc: 'High wind gusts & debris' },

    // ROW 2: North Arterial & Transit Junction
    'A2': { name: 'North Rail Freight Yards', threat: 0 },
    'B2': { name: 'Supermarket Depot', supply: 'food', amount: 4, threat: 0 },
    'C2': { name: 'Downtown Urgent Care Center', supply: 'medicine', amount: 2, threat: 0 },
    'D2': { name: 'Industrial Rail Sheds', threat: 0 },
    'E2': { name: 'University Science Complex', threat: 0 }, // Trekkable trail to D3
    'F2': { name: 'Hydroelectric Power Substation', threat: 0 },
    'G2': { name: 'Telecom Relay Bunker', threat: 0 },
    'H2': { name: 'Mountain Spring Pump House', supply: 'water', amount: 5, threat: 0 },

    // ROW 3: Central Civic & River District
    'A3': { name: 'Police Armory Precinct', threat: 1, threatDesc: 'Reinforced checkpoint barriers' },
    'B3': { name: 'Metro Central Concourse', threat: 0 },
    'C3': { name: 'River Ferry Landing & Docks (Cable Ferry to D4)', threat: 0 },
    'D3': { name: 'City Hall & Central Plaza', threat: 0 }, // Trekkable shortcut destination from E2
    'E3': { name: 'Radio Relay Mast', threat: 0 },
    'F3': { name: 'Botanical Research Greenhouse', threat: 0 },
    'G3': { name: 'Cold Storage Food Depot', supply: 'food', amount: 3, threat: 0 },
    'H3': { name: 'Coastal Beacon Lighthouse', threat: 0 },

    // ROW 4: South Industrial & Waterworks
    'A4': { name: 'Farm Fresh Food Depot', supply: 'food', amount: 4, threat: 0 },
    'B4': { name: 'Highway Cloverleaf Overpass', threat: 1, threatDesc: 'Structural road cracks' },
    'C4': { name: 'Water Filtration Plant', supply: 'water', amount: 6, threat: 0 },
    'D4': { name: 'Bakery Cache & River Wharf (Cable Ferry to C3)', supply: 'food', amount: 3, threat: 0 },
    'E4': { name: 'South Highway Checkpoint', threat: 0 },
    'F4': { name: 'Rainwater Cistern Facility', supply: 'water', amount: 4, threat: 0 },
    'G4': { name: 'Harbor Shipyard Drydock', threat: 0 },
    'H4': { name: 'Trauma Response Medical Station', supply: 'medicine', amount: 4, threat: 0 },

    // ROW 5: Southern Haven Corridor
    'A5': { name: 'Disaster Relief Staging LZ', threat: 0 },
    'B5': { name: 'Municipal Reservoir Station', supply: 'water', amount: 5, threat: 0 },
    'C5': { name: 'Transit Maintenance Depot', threat: 0 },
    'D5': { name: 'High-Rise Corporate Ruins', threat: 1, threatDesc: 'Shattered glass hazard' },
    'E5': { name: 'Haven Extraction Beacon', threat: 0 }, // Evac Haven Default
    'F5': { name: 'Quarry Mining Outpost', threat: 0 },
    'G5': { name: 'St. Jude Field Hospital', supply: 'medicine', amount: 5, threat: 0 },
    'H5': { name: 'Fortified Coastal Sanctuary', threat: 0 }, // Secondary Evac Haven
  };

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const id = coordToId(r, c);
      const loc = defaultLocations[id] || { name: `Sector ${id}`, threat: 0 };

      cells.push({
        id,
        r,
        c,
        name: loc.name,
        threatLevel: loc.threat ?? 0,
        threatCategory: loc.threat ? 'patrol' : 'clear',
        threatDescription: loc.threatDesc || '',
        supplyType: loc.supply ?? 'none',
        supplyAmount: loc.amount ?? 0,
        isStart: r === 0 && c === 0, // A1 default
        isDestination: r === 4 && c === 4, // E5 default
        elevationCost: 1.0,
      });
    }
  }

  return cells;
}

// Threat cost mapping for Dijkstra edge weights
export function getThreatCost(level: ThreatLevel): number {
  switch (level) {
    case 0:
      return 1.0; // Baseline movement cost
    case 1:
      return 3.0; // Low risk: notable detour penalty
    case 2:
      return 7.0; // Medium risk: heavy penalty
    case 3:
      return 15.0; // High danger / zombie swarm: avoid at all costs
    case 4:
      return Infinity; // Blocked / impassable
    default:
      return 1.0;
  }
}

export function getThreatRiskScore(level: ThreatLevel): number {
  switch (level) {
    case 0: return 0;
    case 1: return 2;
    case 2: return 5;
    case 3: return 12;
    case 4: return 30;
    default: return 0;
  }
}

/**
 * Standard Dijkstra shortest path between two specific points
 */
function dijkstraLeg(
  start: GridCoord,
  dest: GridCoord,
  cellMap: Map<string, CellData>,
  allowDiagonal: boolean
): { path: GridCoord[]; cost: number } | null {
  const startKey = `${start.r},${start.c}`;
  const destKey = `${dest.r},${dest.c}`;

  const startCell = cellMap.get(startKey);
  const destCell = cellMap.get(destKey);
  if (!startCell || !destCell || startCell.threatLevel === 4 || destCell.threatLevel === 4) {
    return null;
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, GridCoord | null>();
  const visited = new Set<string>();

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      dist.set(`${r},${c}`, Infinity);
      prev.set(`${r},${c}`, null);
    }
  }

  dist.set(startKey, 0);

  while (visited.size < GRID_ROWS * GRID_COLS) {
    let uKey: string | null = null;
    let uDist = Infinity;

    for (const [key, d] of dist.entries()) {
      if (!visited.has(key) && d < uDist) {
        uDist = d;
        uKey = key;
      }
    }

    if (!uKey || uDist === Infinity || uKey === destKey) {
      break;
    }

    visited.add(uKey);
    const [ur, uc] = uKey.split(',').map(Number);

    const neighbors: GridCoord[] = [
      { r: ur - 1, c: uc },
      { r: ur + 1, c: uc },
      { r: ur, c: uc - 1 },
      { r: ur, c: uc + 1 },
    ];

    if (allowDiagonal) {
      neighbors.push(
        { r: ur - 1, c: uc - 1 },
        { r: ur - 1, c: uc + 1 },
        { r: ur + 1, c: uc - 1 },
        { r: ur + 1, c: uc + 1 }
      );
    }

    for (const n of neighbors) {
      if (n.r < 0 || n.r >= GRID_ROWS || n.c < 0 || n.c >= GRID_COLS) continue;
      const nKey = `${n.r},${n.c}`;
      if (visited.has(nKey)) continue;

      const neighborCell = cellMap.get(nKey);
      if (!neighborCell) continue;

      const cost = getThreatCost(neighborCell.threatLevel) * neighborCell.elevationCost;
      if (cost === Infinity) continue;

      const isDiagonal = n.r !== ur && n.c !== uc;
      const stepCost = isDiagonal ? cost * 1.414 : cost;

      const alt = uDist + stepCost;
      if (alt < (dist.get(nKey) ?? Infinity)) {
        dist.set(nKey, alt);
        prev.set(nKey, { r: ur, c: uc });
      }
    }
  }

  if (dist.get(destKey) === Infinity) {
    return null;
  }

  const path: GridCoord[] = [];
  let curr: GridCoord | null = dest;

  while (curr) {
    path.unshift(curr);
    curr = prev.get(`${curr.r},${curr.c}`) ?? null;
  }

  return { path, cost: dist.get(destKey) ?? 0 };
}

/**
 * Intelligent Resource-Aware Dijkstra Routing
 * Takes into account survivor resources, red danger zones, and scavenge stores
 */
export function calculateDijkstraRoute(
  cells: CellData[],
  startCoord: GridCoord,
  destCoord: GridCoord,
  supplies: SurvivorSupplies,
  allowDiagonal: boolean = true,
  strategy: ScavengeStrategy = 'auto'
): RouteAnalysisData {
  const cellMap = new Map<string, CellData>();
  cells.forEach((cell) => cellMap.set(`${cell.r},${cell.c}`, cell));

  // 1. Direct safest route evaluation
  const directLeg = dijkstraLeg(startCoord, destCoord, cellMap, allowDiagonal);
  if (!directLeg) {
    return createUnreachableResult(startCoord, destCoord, cells);
  }

/**
 * Validates whether a candidate depot detour is strictly en route towards destination:
 * 1. Depots must NOT be start or destination (destination already handles arrival).
 * 2. CRITICAL BUG FIX: Paths leading to any depot MUST NOT cross or pass through destCoord!
 *    If destCoord is visited before reaching a depot, the survivor has already reached their haven.
 * 3. The survivor must have enough resources to reach the first depot without perishing.
 * 4. The direct path to destination must not already be closer and safer than trekking outward to a depot.
 * 5. The combined path must be clean (no circular loops or backtracking).
 * 6. The destination must ONLY appear as the final destination node.
 */
function isValidEnRouteDepotPath(
  startCoord: GridCoord,
  destCoord: GridCoord,
  depotCoords: GridCoord[],
  legPaths: GridCoord[][],
  supplies: SurvivorSupplies,
  needFood: boolean,
  needWater: boolean,
  directMoves: number
): boolean {
  // 1. A depot cannot be the destination itself or start
  for (const d of depotCoords) {
    if (d.r === destCoord.r && d.c === destCoord.c) return false;
    if (d.r === startCoord.r && d.c === startCoord.c) return false;
  }

  // 2. CRITICAL FIX: The path to any depot MUST NOT pass through destCoord!
  for (let i = 0; i < legPaths.length - 1; i++) {
    const leg = legPaths[i];
    const hasDest = leg.some((pt) => pt.r === destCoord.r && pt.c === destCoord.c);
    if (hasDest) {
      return false; // Destination reached prematurely before depot!
    }
  }

  // 3. First leg distance check: If direct distance to destination is already <= moves to first depot,
  // detouring outward burns more resources than reaching destination directly!
  const firstLegMoves = legPaths[0].length - 1;
  if (directMoves <= firstLegMoves) {
    return false;
  }

  // 4. Survivor must have enough supplies to reach the first depot
  if (needFood && supplies.food < firstLegMoves) {
    return false;
  }
  if (needWater && supplies.water < firstLegMoves) {
    return false;
  }

  // 5. Build combined path
  let combined: GridCoord[] = [...legPaths[0]];
  for (let i = 1; i < legPaths.length; i++) {
    combined = [...combined, ...legPaths[i].slice(1)];
  }

  // 6. Combined path must be a simple path without cycles/backtracking
  const seen = new Set<string>();
  for (const pt of combined) {
    const key = `${pt.r},${pt.c}`;
    if (seen.has(key)) {
      return false; // Re-visits sector
    }
    seen.add(key);
  }

  // 7. Destination must ONLY appear as the final node
  for (let i = 0; i < combined.length - 1; i++) {
    if (combined[i].r === destCoord.r && combined[i].c === destCoord.c) {
      return false;
    }
  }

  return true;
}

  let chosenPath = directLeg.path;
  let depotsVisited: string[] = [];
  let isResourceDeficitAvoided = false;

  const directMoves = directLeg.path.length - 1;
  const foodNeeded = directMoves * 1;
  const waterNeeded = directMoves * 1;

  const hasFoodDeficit = supplies.food < foodNeeded;
  const hasWaterDeficit = supplies.water < waterNeeded;

  // Check if destination itself has the needed supplies
  const destCell = cellMap.get(`${destCoord.r},${destCoord.c}`);
  const destProvidesFood = destCell?.supplyType === 'food' && (destCell?.supplyAmount ?? 0) > 0;
  const destProvidesWater = destCell?.supplyType === 'water' && (destCell?.supplyAmount ?? 0) > 0;

  // 2. Resource-Aware Scavenge Detour Logic
  // Detours are only sought when there is a true resource deficit for direct transit
  // and destination itself doesn't provide the remedy upon arrival.
  if (strategy !== 'speed' && strategy !== 'stealth' && (hasFoodDeficit || hasWaterDeficit)) {
    const needFood = hasFoodDeficit && !destProvidesFood;
    const needWater = hasWaterDeficit && !destProvidesWater;

    if (needFood || needWater) {
      // Find valid depots that are not the destination or start
      const foodDepots = cells.filter(
        (c) =>
          c.supplyType === 'food' &&
          c.threatLevel < 4 &&
          !(c.r === destCoord.r && c.c === destCoord.c) &&
          !(c.r === startCoord.r && c.c === startCoord.c)
      );
      const waterDepots = cells.filter(
        (c) =>
          c.supplyType === 'water' &&
          c.threatLevel < 4 &&
          !(c.r === destCoord.r && c.c === destCoord.c) &&
          !(c.r === startCoord.r && c.c === startCoord.c)
      );

      let bestScavengePath: GridCoord[] | null = null;
      let lowestCombinedCost = Infinity;
      let bestDepotIds: string[] = [];

      // Case A: Needs both food and water
      if (needFood && needWater && foodDepots.length > 0 && waterDepots.length > 0) {
        // Try Food first then Water
        for (const fd of foodDepots) {
          for (const wd of waterDepots) {
            const leg1 = dijkstraLeg(startCoord, { r: fd.r, c: fd.c }, cellMap, allowDiagonal);
            const leg2 = dijkstraLeg({ r: fd.r, c: fd.c }, { r: wd.r, c: wd.c }, cellMap, allowDiagonal);
            const leg3 = dijkstraLeg({ r: wd.r, c: wd.c }, destCoord, cellMap, allowDiagonal);

            if (
              leg1 &&
              leg2 &&
              leg3 &&
              isValidEnRouteDepotPath(
                startCoord,
                destCoord,
                [{ r: fd.r, c: fd.c }, { r: wd.r, c: wd.c }],
                [leg1.path, leg2.path, leg3.path],
                supplies,
                needFood,
                needWater,
                directMoves
              )
            ) {
              const totalCost = leg1.cost + leg2.cost + leg3.cost;
              if (totalCost < lowestCombinedCost) {
                lowestCombinedCost = totalCost;
                bestScavengePath = [...leg1.path, ...leg2.path.slice(1), ...leg3.path.slice(1)];
                bestDepotIds = [fd.id, wd.id];
              }
            }
          }
        }

        // Also try Water first then Food
        for (const wd of waterDepots) {
          for (const fd of foodDepots) {
            const leg1 = dijkstraLeg(startCoord, { r: wd.r, c: wd.c }, cellMap, allowDiagonal);
            const leg2 = dijkstraLeg({ r: wd.r, c: wd.c }, { r: fd.r, c: fd.c }, cellMap, allowDiagonal);
            const leg3 = dijkstraLeg({ r: fd.r, c: fd.c }, destCoord, cellMap, allowDiagonal);

            if (
              leg1 &&
              leg2 &&
              leg3 &&
              isValidEnRouteDepotPath(
                startCoord,
                destCoord,
                [{ r: wd.r, c: wd.c }, { r: fd.r, c: fd.c }],
                [leg1.path, leg2.path, leg3.path],
                supplies,
                needFood,
                needWater,
                directMoves
              )
            ) {
              const totalCost = leg1.cost + leg2.cost + leg3.cost;
              if (totalCost < lowestCombinedCost) {
                lowestCombinedCost = totalCost;
                bestScavengePath = [...leg1.path, ...leg2.path.slice(1), ...leg3.path.slice(1)];
                bestDepotIds = [wd.id, fd.id];
              }
            }
          }
        }
      }

      // Case B: Needs only food
      if (needFood && (!bestScavengePath || !needWater) && foodDepots.length > 0) {
        for (const fd of foodDepots) {
          const leg1 = dijkstraLeg(startCoord, { r: fd.r, c: fd.c }, cellMap, allowDiagonal);
          const leg2 = dijkstraLeg({ r: fd.r, c: fd.c }, destCoord, cellMap, allowDiagonal);
          if (
            leg1 &&
            leg2 &&
            isValidEnRouteDepotPath(
              startCoord,
              destCoord,
              [{ r: fd.r, c: fd.c }],
              [leg1.path, leg2.path],
              supplies,
              true,
              false,
              directMoves
            )
          ) {
            const totalCost = leg1.cost + leg2.cost;
            if (totalCost < lowestCombinedCost) {
              lowestCombinedCost = totalCost;
              bestScavengePath = [...leg1.path, ...leg2.path.slice(1)];
              bestDepotIds = [fd.id];
            }
          }
        }
      }

      // Case C: Needs only water
      if (needWater && (!bestScavengePath || !needFood) && waterDepots.length > 0) {
        for (const wd of waterDepots) {
          const leg1 = dijkstraLeg(startCoord, { r: wd.r, c: wd.c }, cellMap, allowDiagonal);
          const leg2 = dijkstraLeg({ r: wd.r, c: wd.c }, destCoord, cellMap, allowDiagonal);
          if (
            leg1 &&
            leg2 &&
            isValidEnRouteDepotPath(
              startCoord,
              destCoord,
              [{ r: wd.r, c: wd.c }],
              [leg1.path, leg2.path],
              supplies,
              false,
              true,
              directMoves
            )
          ) {
            const totalCost = leg1.cost + leg2.cost;
            if (totalCost < lowestCombinedCost) {
              lowestCombinedCost = totalCost;
              bestScavengePath = [...leg1.path, ...leg2.path.slice(1)];
              bestDepotIds = [wd.id];
            }
          }
        }
      }

      if (bestScavengePath) {
        chosenPath = bestScavengePath;
        depotsVisited = bestDepotIds;
        isResourceDeficitAvoided = true;
      }
    }
  }

  // 3. Build step-by-step telemetry
  const pathCellIds = chosenPath.map((pt) => coordToId(pt.r, pt.c));
  
  // Check if route includes the C3 <-> D4 cable ferry river crossing
  let hasCableFerryCrossing = false;
  for (let i = 0; i < pathCellIds.length - 1; i++) {
    const a = pathCellIds[i];
    const b = pathCellIds[i + 1];
    if ((a === 'C3' && b === 'D4') || (a === 'D4' && b === 'C3')) {
      hasCableFerryCrossing = true;
      break;
    }
  }

  let totalRisk = 0;
  let runningFood = supplies.food;
  let runningWater = supplies.water;
  let runningMedicine = supplies.medicine;

  const steps: RouteStep[] = [];
  let accCost = 0;
  const visitedDepotSet = new Set<string>();

  chosenPath.forEach((pt, idx) => {
    const cell = cellMap.get(`${pt.r},${pt.c}`)!;
    const cellId = coordToId(pt.r, pt.c);

    if (idx > 0) {
      runningFood = Math.max(0, runningFood - 1);
      runningWater = Math.max(0, runningWater - 1);
      accCost += getThreatCost(cell.threatLevel);
    }

    totalRisk += getThreatRiskScore(cell.threatLevel);

    // Scavenge collection (only once per depot)
    let scavengedInfo = undefined;
    if (cell.supplyType !== 'none' && cell.supplyAmount > 0 && !visitedDepotSet.has(cellId)) {
      visitedDepotSet.add(cellId);
      if (cell.supplyType === 'food') runningFood += cell.supplyAmount;
      if (cell.supplyType === 'water') runningWater += cell.supplyAmount;
      if (cell.supplyType === 'medicine') runningMedicine += cell.supplyAmount;
      scavengedInfo = {
        type: cell.supplyType,
        amount: cell.supplyAmount,
      };
    }

    if (cell.threatLevel >= 2 && runningMedicine > 0 && idx > 0) {
      runningMedicine = Math.max(0, runningMedicine - 1);
    }

    // Determine special transit notes (e.g. Cable Ferry across Blackwater River)
    const prevCellId = idx > 0 ? coordToId(chosenPath[idx - 1].r, chosenPath[idx - 1].c) : null;
    const nextCellId = idx < chosenPath.length - 1 ? coordToId(chosenPath[idx + 1].r, chosenPath[idx + 1].c) : null;
    let isFerryStep = false;
    let transitNote: string | undefined = undefined;

    if (
      (cellId === 'C3' && (nextCellId === 'D4' || prevCellId === 'D4')) ||
      (cellId === 'D4' && (nextCellId === 'C3' || prevCellId === 'C3'))
    ) {
      isFerryStep = true;
      if (nextCellId === 'D4') {
        transitNote = '⚓ Board Cable Ferry: Winch pontoon barge southbound across Blackwater River to D4 River Wharf.';
      } else if (nextCellId === 'C3') {
        transitNote = '⚓ Board Cable Ferry: Winch pontoon barge northbound across Blackwater River to C3 Ferry Landing.';
      } else if (prevCellId === 'C3') {
        transitNote = '⚓ Disembarked Cable Ferry at D4 River Wharf from C3.';
      } else if (prevCellId === 'D4') {
        transitNote = '⚓ Disembarked Cable Ferry at C3 Ferry Landing from D4.';
      }
    } else if (cellId === 'C3') {
      transitNote = '⚓ C3 North River Ferry Slip & Docks (Cable Ferry connection to D4 Wharf).';
    } else if (cellId === 'D4') {
      transitNote = '⚓ D4 South River Wharf & Bakery Cache (Cable Ferry connection to C3 Landing).';
    }

    steps.push({
      coord: pt,
      cellId,
      name: cell.name,
      stepIndex: idx,
      threatLevel: cell.threatLevel,
      threatCategory: cell.threatCategory,
      scavenged: scavengedInfo,
      accumulatedCost: Math.round(accCost * 10) / 10,
      foodLeft: runningFood,
      waterLeft: runningWater,
      medicineLeft: runningMedicine,
      transitNote,
      isCableFerryCrossing: isFerryStep,
    });
  });

  const stepCount = chosenPath.length - 1;
  let rawDistance = 0;
  for (let i = 0; i < chosenPath.length - 1; i++) {
    const dr = chosenPath[i + 1].r - chosenPath[i].r;
    const dc = chosenPath[i + 1].c - chosenPath[i].c;
    rawDistance += Math.hypot(dr, dc) * 1.2;
  }
  const distanceKm = Math.round(rawDistance * 10) / 10;
  const estimatedHours = Math.round((distanceKm / 3.2) * 10) / 10;

  const foodRequired = stepCount * 1;
  const waterRequired = stepCount * 1;
  const medicineRequired = steps.filter((s) => s.threatLevel >= 2).length;

  const totalGridHazards = cells.filter((c) => c.threatLevel > 0).length;
  const hazardsOnPath = steps.filter((s) => s.threatLevel > 0).length;
  const hazardsAvoided = Math.max(0, totalGridHazards - hazardsOnPath);

  const pathArrowString = pathCellIds.join(' → ');
  const destId = coordToId(destCoord.r, destCoord.c);
  const statusNote = isResourceDeficitAvoided
    ? `Provisions Replenished via ${depotsVisited.join(' & ')} · Safe Traversal Guaranteed`
    : supplies.food >= foodRequired && supplies.water >= waterRequired
    ? 'Supplies Sufficient'
    : destProvidesFood || destProvidesWater
    ? `Provisions at Base Camp ${destId} (${destCell?.name})`
    : `Direct Transit to ${destId} Prioritized (Fastest Safe Path)`;

  const ferryNote = hasCableFerryCrossing
    ? ' · ⚓ INCLUDES C3 ⇄ D4 CABLE FERRY WATER CROSSING'
    : '';

  const summaryText = `${pathArrowString} (${stepCount} moves | ${distanceKm} km | ETA: ${estimatedHours}h | Consumes: ${foodRequired} Food, ${waterRequired} Water · ${statusNote}${ferryNote})`;

  let riskCategory = 'Low Risk';
  if (totalRisk >= 15) riskCategory = 'High Risk';
  else if (totalRisk >= 6) riskCategory = 'Moderate Risk';

  const riskText = `Total Exposure Risk: ${totalRisk} (${riskCategory}) · Hazards Avoided: ${hazardsAvoided} of ${totalGridHazards} · Confidence: ${Math.max(10, 100 - totalRisk * 4)}%`;

  return {
    isReachable: true,
    path: chosenPath,
    pathCellIds,
    steps,
    totalDistanceKm: distanceKm,
    totalRiskScore: totalRisk,
    estimatedHours,
    foodRequired,
    waterRequired,
    medicineRequired,
    hazardsAvoided,
    summaryText,
    riskText,
    depotsVisited,
    isResourceDeficitAvoided,
    hasCableFerryCrossing,
  };
}

function createUnreachableResult(
  startCoord: GridCoord,
  destCoord: GridCoord,
  cells: CellData[]
): RouteAnalysisData {
  const startId = coordToId(startCoord.r, startCoord.c);
  const destId = coordToId(destCoord.r, destCoord.c);
  const totalGridHazards = cells.filter((c) => c.threatLevel > 0).length;

  return {
    isReachable: false,
    path: [],
    pathCellIds: [],
    steps: [],
    totalDistanceKm: 0,
    totalRiskScore: 999,
    estimatedHours: 0,
    foodRequired: 0,
    waterRequired: 0,
    medicineRequired: 0,
    hazardsAvoided: totalGridHazards,
    summaryText: `NO VIABLE ROUTE: Unable to trace route from ${startId} to ${destId}. Critical blockades or extreme hazards severed all connections.`,
    riskText: `CRITICAL THREAT: Destination unreachable (0% Traversal Confidence). Remove barriers or establish emergency bypass.`,
    depotsVisited: [],
    isResourceDeficitAvoided: false,
  };
}

/**
 * Automatically evaluates the grid to locate the next safest destination point
 * when the current destination is compromised by a hazard.
 */
export function findNextSafestSector(
  cells: CellData[],
  startCoord: GridCoord,
  compromisedDestId: string
): CellData | null {
  const candidates = cells.filter(
    (c) => c.id !== compromisedDestId && !c.isStart && c.threatLevel < 4
  );

  if (candidates.length === 0) return null;

  const scored = candidates.map((cell) => {
    // 1. Threat penalty (threat level 0 is top priority)
    let score = cell.threatLevel * 100;

    // 2. Distance from start
    const dist = Math.abs(cell.r - startCoord.r) + Math.abs(cell.c - startCoord.c);
    score += dist * 4;

    // 3. Haven / Fortified zone priority bonus
    const lowerName = cell.name.toLowerCase();
    if (
      lowerName.includes('haven') ||
      lowerName.includes('lz') ||
      lowerName.includes('bunker') ||
      lowerName.includes('vault') ||
      lowerName.includes('depot')
    ) {
      score -= 20;
    }

    // 4. Supply station bonus
    if (cell.supplyType !== 'none') {
      score -= 8;
    }

    return { cell, score };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.cell || null;
}
