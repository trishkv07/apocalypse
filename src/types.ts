/**
 * Types for BEACON - Offline Survival Route Planner
 */

export type ThreatLevel = 0 | 1 | 2 | 3 | 4; // 0 = Safe, 1 = Low, 2 = Medium, 3 = High, 4 = Impassable/Blocked

export type ThreatCategory = 'clear' | 'patrol' | 'radiation' | 'rubble' | 'biohazard';

export type SupplyStationType = 'none' | 'food' | 'water' | 'medicine';

export interface GridCoord {
  r: number; // 0 to 4 (Row 1 to 5)
  c: number; // 0 to 4 (Col A to E)
}

export interface CellData {
  id: string; // e.g. "A1", "C3", "E5"
  r: number;
  c: number;
  name: string;
  threatLevel: ThreatLevel;
  threatCategory: ThreatCategory;
  threatDescription?: string;
  supplyType: SupplyStationType;
  supplyAmount: number;
  isStart?: boolean;
  isDestination?: boolean;
  elevationCost: number; // terrain cost variation (1.0 default)
}

export interface RouteStep {
  coord: GridCoord;
  cellId: string;
  name: string;
  stepIndex: number;
  threatLevel: ThreatLevel;
  threatCategory: ThreatCategory;
  scavenged?: {
    type: SupplyStationType;
    amount: number;
  };
  accumulatedCost: number;
  foodLeft: number;
  waterLeft: number;
  medicineLeft: number;
  transitNote?: string;
  isCableFerryCrossing?: boolean;
}

export type ScavengeStrategy = 'auto' | 'stealth' | 'speed';

export interface RouteAnalysisData {
  isReachable: boolean;
  path: GridCoord[];
  pathCellIds: string[];
  steps: RouteStep[];
  totalDistanceKm: number;
  totalRiskScore: number;
  estimatedHours: number;
  foodRequired: number;
  waterRequired: number;
  medicineRequired: number;
  hazardsAvoided: number;
  summaryText: string;
  riskText: string;
  depotsVisited: string[];
  isResourceDeficitAvoided?: boolean;
  hasCableFerryCrossing?: boolean;
}

export interface SurvivorSupplies {
  food: number;
  water: number;
  medicine: number;
}
