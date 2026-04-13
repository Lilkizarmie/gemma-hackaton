export type Goal = "profit" | "food_security" | "low_effort";
export type Season = "rainy" | "dry";

export interface MapPoint {
  latitude: number;
  longitude: number;
}

export interface DecisionPayload {
  field: {
    name: string;
    boundary: {
      type: "Polygon";
      coordinates: number[][][];
    };
  };
  location: {
    state: string;
    country: string;
  };
  land: {
    size: number;
    unit: "hectare";
  };
  goal: Goal;
  season: Season;
  budget?: number;
}

export interface DecisionResponse {
  recommendedCrop: {
    id: string;
    name: string;
    score: number;
    reasons: string[];
    scoreBreakdown: Record<string, number>;
  };
  calculations: {
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
  };
  explanation: {
    reasonSummary: string;
    farmerAdvice: string[];
    actionPlan: string[];
  };
  rankedOptions: {
    id: string;
    name: string;
    score: number;
    reasons: string[];
    scoreBreakdown: Record<string, number>;
  }[];
  meta: {
    state: string;
    season: Season;
    goal: Goal;
    aiMode: string;
    responseSource: "backend" | "mobile_mock";
    modelProvider: "ollama" | "mock";
  };
}
