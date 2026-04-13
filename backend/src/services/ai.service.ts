import { DecisionCalculations, DecisionRequest, ExplanationResult } from "../types/decision";
import { buildExplanationPrompt } from "./prompt-builder.service";
import { generateWithOllama } from "./ollama.service";

export async function generateExplanation(
  input: DecisionRequest,
  cropName: string,
  calculations: DecisionCalculations,
  recommendationReasons: string[] = []
): Promise<ExplanationResult> {
  const aiMode = process.env.AI_MODE ?? "mock";
  const prompt = buildExplanationPrompt(input, cropName, calculations, recommendationReasons);

  if (aiMode === "ollama") {
    try {
      const ollamaResult = await generateWithOllama(prompt);
      return normalizeExplanation(ollamaResult, input, cropName, calculations, recommendationReasons);
    } catch (error) {
      console.warn("Ollama generation failed, falling back to mock explanation.", error);
    }
  }

  return {
    reasonSummary: buildFallbackReasonSummary(input, cropName, calculations, recommendationReasons),
    farmerAdvice: [
      "Buy inputs early so planting is not delayed.",
      "Track your spending from the first week to protect your profit.",
      "Inspect the field regularly and respond quickly to weed or nutrient problems."
    ],
    actionPlan: [
      "Confirm the field is cleared and ready for planting.",
      `Buy ${calculations.seedRequiredKg} kg of ${cropName.toLowerCase()} seed and the required fertilizer before planting day.`,
      `Plant on time for the ${input.season ?? "rainy"} season using the recommended spacing for ${cropName.toLowerCase()}.`,
      "Apply fertilizer at the right growth stage and keep the field weed-free.",
      "Monitor crop growth weekly and prepare labor and storage before harvest."
    ]
  };
}

function normalizeExplanation(
  result: Partial<ExplanationResult>,
  input: DecisionRequest,
  cropName: string,
  calculations: DecisionCalculations,
  recommendationReasons: string[]
): ExplanationResult {
  const bannedPhrases = [
    "irrigation",
    "pest control",
    "soil analysis",
    "soil testing",
    "crop rotation",
    "funding",
    "market demand",
    "yield potential",
    "given conditions"
  ];

  const fallbackAdvice = [
    `Plan around ${calculations.fieldAreaHectares} hectares so you buy only the inputs you need.`,
    `Use the estimated cost of NGN ${Math.round(calculations.estimatedCostNgn).toLocaleString()} to guide spending decisions.`,
    `Track planting and fertilizer timing closely so the ${cropName.toLowerCase()} crop stays on schedule.`
  ];

  const fallbackActionPlan = [
    "Clear and prepare the field before planting begins.",
    `Buy ${calculations.seedRequiredKg} kg of ${cropName.toLowerCase()} seed before planting day.`,
    buildFertilizerStep(calculations),
    `Plant ${cropName.toLowerCase()} during the ${input.season ?? "rainy"} season using the recommended spacing.`,
    "Monitor the field regularly and keep weeds under control.",
    "Prepare labor, transport, and storage before harvest."
  ].filter(Boolean) as string[];

  const normalizedReason =
    normalizeReasonSummary(
      result.reasonSummary ?? "",
      bannedPhrases,
      input,
      cropName,
      calculations,
      recommendationReasons
    ) || buildFallbackReasonSummary(input, cropName, calculations, recommendationReasons);

  const normalizedAdvice = normalizeLines(result.farmerAdvice ?? [], bannedPhrases, fallbackAdvice, 3);
  const normalizedActionPlan = normalizeLines(result.actionPlan ?? [], bannedPhrases, fallbackActionPlan, 6, 4);

  return {
    reasonSummary: normalizedReason,
    farmerAdvice: normalizedAdvice,
    actionPlan: normalizedActionPlan
  };
}

function normalizeLines(
  lines: string[],
  bannedPhrases: string[],
  fallbackLines: string[],
  maxItems: number,
  minItems = 1
): string[] {
  const cleaned = lines
    .map((line) => sanitizeLine(line, bannedPhrases))
    .filter((line): line is string => Boolean(line));

  const merged = [...cleaned];

  for (const fallback of fallbackLines) {
    if (merged.length >= maxItems) {
      break;
    }

    if (!merged.includes(fallback)) {
      merged.push(fallback);
    }
  }

  return merged.slice(0, Math.max(minItems, Math.min(maxItems, merged.length)));
}

function sanitizeLine(line: string, bannedPhrases: string[]): string | null {
  const cleaned = line.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return null;
  }

  const lower = cleaned.toLowerCase();
  if (bannedPhrases.some((phrase) => lower.includes(phrase))) {
    return null;
  }

  return cleaned;
}

function normalizeReasonSummary(
  line: string,
  bannedPhrases: string[],
  input: DecisionRequest,
  cropName: string,
  calculations: DecisionCalculations,
  recommendationReasons: string[]
): string | null {
  const cleaned = sanitizeLine(line, bannedPhrases);

  if (!cleaned) {
    return null;
  }

  const lower = cleaned.toLowerCase();
  const hasState = lower.includes(input.location.state.toLowerCase());
  const hasSeason = lower.includes((input.season ?? "rainy").toLowerCase());
  const hasCrop = lower.includes(cropName.toLowerCase());
  const hasConcreteOutcome =
    lower.includes("profit") ||
    lower.includes("revenue") ||
    lower.includes("cost") ||
    lower.includes("difficulty");

  if (hasState && hasSeason && hasCrop && hasConcreteOutcome) {
    return cleaned;
  }

  return buildFallbackReasonSummary(input, cropName, calculations, recommendationReasons);
}

function buildFertilizerStep(calculations: DecisionCalculations): string {
  const npk = calculations.fertilizer.npkBags;
  const urea = calculations.fertilizer.ureaBags;

  if (npk > 0 && urea > 0) {
    return `Apply ${npk} bags of NPK and ${urea} bags of urea at the recommended growth stages.`;
  }

  if (npk > 0) {
    return `Apply ${npk} bags of NPK at the recommended growth stage.`;
  }

  if (urea > 0) {
    return `Apply ${urea} bags of urea at the recommended growth stage.`;
  }

  return "Follow the planned nutrient schedule for the crop during the season.";
}

function buildFallbackReasonSummary(
  input: DecisionRequest,
  cropName: string,
  calculations: DecisionCalculations,
  recommendationReasons: string[]
): string {
  const season = input.season ?? "rainy";
  const reasonsText = recommendationReasons.join(" ").toLowerCase();
  const fieldArea = calculations.fieldAreaHectares;
  const estimatedProfit = `NGN ${Math.round(calculations.estimatedProfitNgn).toLocaleString()}`;

  if (input.goal === "profit") {
    return `${cropName} is a strong profit choice for ${input.location.state} in the ${season} season because it fits the local crop profile and is projected to return about ${estimatedProfit} from ${fieldArea} hectares.`;
  }

  if (input.goal === "low_effort" || reasonsText.includes("manageable")) {
    return `${cropName} fits ${input.location.state} in the ${season} season because it stays relatively manageable to run while matching the field plan for ${fieldArea} hectares.`;
  }

  return `${cropName} fits ${input.location.state} in the ${season} season because it matches the local crop profile and supports your ${formatGoal(input.goal)} goal on ${fieldArea} hectares.`;
}

function formatGoal(goal: string): string {
  if (goal === "food_security") {
    return "food security";
  }

  if (goal === "low_effort") {
    return "low effort";
  }

  return goal;
}
