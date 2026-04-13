import { DecisionCalculations, DecisionRequest } from "../types/decision";

export function buildExplanationPrompt(
  input: DecisionRequest,
  cropName: string,
  calculations: DecisionCalculations,
  recommendationReasons: string[]
): string {
  const formattedReasons =
    recommendationReasons.length > 0
      ? recommendationReasons.map((reason, index) => `${index + 1}. ${reason}`).join("\n")
      : "1. No explicit scoring reasons were provided.";

  return [
    "You are RootRise AI, an agricultural planning assistant for smallholder farmers.",
    "Your job is to explain a recommendation that has already been computed by the decision engine.",
    "Use only the facts and numbers provided below.",
    "Do not invent values.",
    "Do not mention any input, risk, tool, or farming practice that was not provided.",
    "Do not mention irrigation, pest control, soil testing, crop rotation, or funding unless the input explicitly includes them.",
    "Use simple, practical language suitable for a farmer.",
    `State: ${input.location.state}`,
    `Country: ${input.location.country}`,
    `Goal: ${input.goal}`,
    `Season: ${input.season ?? "rainy"}`,
    `Crop: ${cropName}`,
    `Field size: ${calculations.fieldAreaHectares} hectares`,
    `Seed required: ${calculations.seedRequiredKg} kg`,
    `NPK bags: ${calculations.fertilizer.npkBags}`,
    `Urea bags: ${calculations.fertilizer.ureaBags}`,
    `Estimated cost: NGN ${calculations.estimatedCostNgn}`,
    `Estimated yield: ${calculations.estimatedYieldTons} tons`,
    `Estimated revenue: NGN ${calculations.estimatedRevenueNgn}`,
    `Estimated profit: NGN ${calculations.estimatedProfitNgn}`,
    "Decision engine reasons:",
    formattedReasons,
    "The action plan must stay close to these facts.",
    "The action plan should focus on land preparation, buying inputs, planting, fertilizer application when relevant, monitoring, and harvest preparation.",
    "If urea bags are 0, do not mention urea.",
    "If NPK bags are 0, do not mention NPK.",
    "Do not mention both fertilizers unless both are present in the data.",
    "The reasonSummary must be one short sentence that explains why this crop fits the farmer's state, season, and goal.",
    "The reasonSummary must mention the crop name, state, season, and one concrete outcome such as estimated profit, revenue, cost, or manageable difficulty.",
    "Base the reasonSummary on the decision engine reasons above instead of generic phrases like market demand, yield potential, or given conditions.",
    "Each farmerAdvice item must be short, specific, and grounded in the provided recommendation.",
    "Each actionPlan item must be a concrete next step and must not introduce unsupported assumptions.",
    "Do not include markdown fences.",
    "Do not include explanatory text before or after the JSON.",
    "Return strictly valid JSON in this shape:",
    "{\"reasonSummary\":\"string\",\"farmerAdvice\":[\"string\",\"string\",\"string\"],\"actionPlan\":[\"string\",\"string\",\"string\",\"string\"]}"
  ].join("\n");
}
