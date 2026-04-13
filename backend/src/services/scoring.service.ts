import crops from "../data/crops.json";
import { CropRecord, DecisionRequest, Goal, RankedCrop } from "../types/decision";

const cropRecords = crops as CropRecord[];

export function getRankedCrops(input: DecisionRequest, fieldAreaHectares: number): RankedCrop[] {
  const state = input.location.state.trim();
  const normalizedState = normalizeRegionName(state);
  const season = input.season ?? "rainy";
  const goal = input.goal;

  const regionCandidates = cropRecords.filter((crop) =>
    crop.regions.some((region) => normalizeRegionName(region) === normalizedState)
  );

  const initialCandidates = regionCandidates.length > 0 ? regionCandidates : cropRecords;

  const scored = initialCandidates
    .filter((crop) => crop.season.includes(season) && crop.goals.includes(goal))
    .map((crop) => {
      const regionalFit = crop.regions.some((region) => normalizeRegionName(region) === normalizedState) ? 1 : 0.5;
      const scoreBreakdown = {
        regionalFit,
        seasonalFit: crop.season.includes(season) ? 1 : 0,
        goalFit: crop.goals.includes(goal) ? 1 : 0,
        budgetFit: calculateBudgetFit(crop, fieldAreaHectares, input.budget),
        economicsFit: calculateEconomicsFit(crop),
        effortFit: calculateEffortFit(crop, goal),
        preferenceFit: input.preferredCropId === crop.id ? 1 : 0
      };

      const weightedScore =
        scoreBreakdown.regionalFit * 0.2 +
        scoreBreakdown.seasonalFit * 0.15 +
        scoreBreakdown.goalFit * 0.2 +
        scoreBreakdown.budgetFit * 0.15 +
        scoreBreakdown.economicsFit * 0.2 +
        scoreBreakdown.effortFit * 0.05 +
        scoreBreakdown.preferenceFit * 0.05;

      return {
        crop,
        score: Number(weightedScore.toFixed(4)),
        scoreBreakdown,
        reasons: buildReasons(crop, scoreBreakdown, state, season, goal, input.budget)
      };
    })
    .sort((left, right) => right.score - left.score);

  if (scored.length === 0) {
    throw new Error(`No suitable crops found for ${state} during the ${season} season`);
  }

  return scored;
}

function calculateBudgetFit(crop: CropRecord, fieldAreaHectares: number, budget?: number): number {
  if (!budget) {
    return 0.7;
  }

  const estimatedCost = crop.base_cost_per_hectare_ngn * fieldAreaHectares;

  if (estimatedCost <= budget) {
    return 1;
  }

  const overrunRatio = (estimatedCost - budget) / budget;
  return Math.max(0, 1 - overrunRatio);
}

function calculateEconomicsFit(crop: CropRecord): number {
  const revenue = crop.yield_per_hectare_tons * crop.avg_price_per_ton_ngn;
  const profit = revenue - crop.base_cost_per_hectare_ngn;
  const margin = profit / Math.max(revenue, 1);

  return Math.max(0, Math.min(1, margin));
}

function calculateEffortFit(crop: CropRecord, goal: Goal): number {
  if (goal !== "low_effort") {
    return 0.7;
  }

  return 1 - crop.difficulty_score;
}

function normalizeRegionName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+state$/i, "")
    .replace(/\s+/g, " ");
}

function buildReasons(
  crop: CropRecord,
  scoreBreakdown: Record<string, number>,
  state: string,
  season: string,
  goal: Goal,
  budget?: number
): string[] {
  const reasons: string[] = [];

  if (scoreBreakdown.regionalFit >= 1) {
    reasons.push(`Matches the growing conditions we track for ${state}.`);
  } else {
    reasons.push(`No exact ${state} match was found in the dataset, but this crop remains a workable nearby fit.`);
  }

  reasons.push(`Suitable for the ${season} season.`);

  if (goal === "profit" && scoreBreakdown.economicsFit >= 0.7) {
    reasons.push("Shows strong profit potential based on expected yield, market price, and cost.");
  }

  if (goal === "food_security") {
    reasons.push("Supports a food security goal with solid output potential for the field size.");
  }

  if (goal === "low_effort" && scoreBreakdown.effortFit >= 0.5) {
    reasons.push("Requires less management effort than harder-to-run alternatives in the dataset.");
  }

  if (typeof budget === "number" && budget > 0) {
    if (scoreBreakdown.budgetFit >= 1) {
      reasons.push("Estimated cost stays within the stated budget.");
    } else if (scoreBreakdown.budgetFit >= 0.6) {
      reasons.push("Estimated cost is close to the stated budget, so spending should be watched carefully.");
    }
  }

  if (crop.difficulty_score <= 0.45) {
    reasons.push("Operational difficulty is relatively manageable for this crop.");
  }

  return reasons.slice(0, 4);
}
