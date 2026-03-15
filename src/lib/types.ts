export type DatasetId =
  | "roadworks"
  | "disruptions"
  | "collisions"
  | "traffic-orders";

export type CyclingImpact = "High" | "Medium" | "Low" | "Minimal";
export type TrafficOrderImpact =
  | "Positive"
  | "Negative"
  | "Neutral"
  | "Needs Review";
export type CollisionSeverity = "Fatal" | "Serious" | "Slight";

export interface RoadworkRecord {
  name: string;
  permitReference: string;
  borough: string;
  streetName: string;
  promoter: string;
  workCategory: string;
  trafficManagement: string;
  workStatus: string;
  proposedStart: string | null;
  proposedEnd: string | null;
  actualStart: string | null;
  cyclingImpact: CyclingImpact;
  cyclingSummary: string;
  coordinates: string;
  nearbyInfrastructure: string;
}

export interface DisruptionRecord {
  name: string;
  disruptionId: string;
  borough: string;
  category: string;
  status: string;
  severity: string;
  location: string;
  startTime: string | null;
  endTime: string | null;
  description: string;
  cyclingImpact: CyclingImpact;
  cyclingSummary: string;
  coordinates: string;
  nearbyInfrastructure: string;
}

export interface CollisionRecord {
  name: string;
  collisionReference: string;
  borough: string;
  date: string | null;
  time: string;
  severity: CollisionSeverity;
  numberOfCyclistsHurt: number;
  worstCyclistSeverity: CollisionSeverity;
  otherVehicles: string;
  roadName: string;
  speedLimit: number;
  junctionDetail: string;
  lightConditions: string;
  weather: string;
  roadSurface: string;
  coordinates: string;
  dataYear: string;
}

export interface TrafficOrderRecord {
  name: string;
  dtroId: string;
  borough: string;
  regulationType: string[];
  locationDescription: string;
  streetName: string;
  madeDate: string | null;
  effectiveDate: string | null;
  endDate: string | null;
  authority: string;
  actionType: string;
  cyclingImpact: TrafficOrderImpact;
  cyclingSummary: string;
  coordinates: string;
  nearbyInfrastructure: string;
}

export interface FilterState {
  visibleLayers: Set<DatasetId>;
  boroughs: Set<string>;
  impactLevels: Set<string>;
  dateRange: { start: Date | null; end: Date | null };
}
