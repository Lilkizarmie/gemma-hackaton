export type Goal = "profit" | "food_security" | "low_effort";
export type Season = "rainy" | "dry";

export interface PolygonBoundary {
  type: "Polygon";
  coordinates: number[][][];
}

export interface FieldInput {
  name?: string;
  boundary: PolygonBoundary;
}

export interface LocationInput {
  state: string;
  country: string;
}

export interface LandInput {
  size?: number;
  unit?: "hectare" | "hectares";
}

export interface DecisionRequest {
  field: FieldInput;
  location: LocationInput;
  land?: LandInput;
  goal: Goal;
  season?: Season;
  budget?: number;
  preferredCropId?: string;
}

export interface CropRecord {
  id: string;
  name: string;
  regions: string[];
  season: Season[];
  goals: Goal[];
  seed_per_hectare_kg: number;
  yield_per_hectare_tons: number;
  avg_price_per_ton_ngn: number;
  base_cost_per_hectare_ngn: number;
  difficulty_score: number;
  water_need_score: number;
  fertilizer_profile: {
    npk_15_15_15_bags_per_hectare?: number;
    urea_bags_per_hectare?: number;
  };
}

export interface RankedCrop {
  crop: CropRecord;
  score: number;
  scoreBreakdown: Record<string, number>;
  reasons: string[];
}

export interface DecisionCalculations {
  fieldAreaHectares: number;
  seedRequiredKg: number;
  fertilizer: {
    npkBags: number;
    ureaBags: number;
  };
  estimatedCostNgn: number;
  estimatedYieldTons: number;
  estimatedRevenueNgn: number;
  estimatedProfitNgn: number;
}

export interface ExplanationResult {
  reasonSummary: string;
  farmerAdvice: string[];
  actionPlan: string[];
}

export interface DecisionResponse {
  recommendedCrop: {
    id: string;
    name: string;
    score: number;
    reasons: string[];
    scoreBreakdown: Record<string, number>;
  };
  calculations: DecisionCalculations;
  explanation: ExplanationResult;
  rankedOptions: Array<{
    id: string;
    name: string;
    score: number;
    reasons: string[];
    scoreBreakdown: Record<string, number>;
  }>;
  meta: {
    state: string;
    season: Season;
    goal: Goal;
    aiMode: string;
    responseSource: "backend";
    modelProvider: "ollama" | "mock";
  };
}
