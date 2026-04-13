import { buildCalculations } from "./calculation.service";
import { generateExplanation } from "./ai.service";
import { calculatePolygonAreaSquareMeters, squareMetersToHectares } from "../utils/geometry";
import { DecisionRequest, DecisionResponse } from "../types/decision";
import { getRankedCrops } from "./scoring.service";

export async function generateDecision(input: DecisionRequest): Promise<DecisionResponse> {
  const fieldAreaSquareMeters = calculatePolygonAreaSquareMeters(input.field.boundary);
  const derivedHectares = squareMetersToHectares(fieldAreaSquareMeters);
  const fieldAreaHectares = input.land?.size && input.land.size > 0 ? input.land.size : derivedHectares;

  if (fieldAreaHectares <= 0) {
    throw new Error("Field area must be greater than zero");
  }

  const rankedCrops = getRankedCrops(input, fieldAreaHectares);
  const topCrop = rankedCrops[0];
  const calculations = buildCalculations(topCrop.crop, fieldAreaHectares);
  const explanation = await generateExplanation(input, topCrop.crop.name, calculations, topCrop.reasons);

  return {
    recommendedCrop: {
      id: topCrop.crop.id,
      name: topCrop.crop.name,
      score: topCrop.score,
      reasons: topCrop.reasons,
      scoreBreakdown: topCrop.scoreBreakdown
    },
    calculations,
    explanation,
    rankedOptions: rankedCrops.slice(0, 3).map((item) => ({
      id: item.crop.id,
      name: item.crop.name,
      score: item.score,
      reasons: item.reasons,
      scoreBreakdown: item.scoreBreakdown
    })),
    meta: {
      state: input.location.state,
      season: input.season ?? "rainy",
      goal: input.goal,
      aiMode: process.env.AI_MODE ?? "mock",
      responseSource: "backend",
      modelProvider: (process.env.AI_MODE ?? "mock") === "ollama" ? "ollama" : "mock"
    }
  };
}
