import { DecisionRequest, Goal } from "../types/decision";

const allowedGoals: Goal[] = ["profit", "food_security", "low_effort"];

export function validateDecisionRequest(payload: unknown): DecisionRequest {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be a valid object");
  }

  const request = payload as Partial<DecisionRequest>;

  if (!request.field?.boundary?.coordinates?.[0]?.length) {
    throw new Error("Field boundary coordinates are required");
  }

  if (!request.location?.state?.trim()) {
    throw new Error("Location state is required");
  }

  if (!request.location?.country?.trim()) {
    throw new Error("Location country is required");
  }

  if (!request.goal || !allowedGoals.includes(request.goal)) {
    throw new Error("Goal must be one of: profit, food_security, low_effort");
  }

  if (request.budget != null && request.budget < 0) {
    throw new Error("Budget cannot be negative");
  }

  return {
    field: request.field,
    location: {
      state: request.location.state.trim(),
      country: request.location.country.trim()
    },
    land: request.land,
    goal: request.goal,
    season: request.season ?? "rainy",
    budget: request.budget,
    preferredCropId: request.preferredCropId
  };
}

