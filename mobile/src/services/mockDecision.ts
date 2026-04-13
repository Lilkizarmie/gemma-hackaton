import { DecisionPayload, DecisionResponse } from "../types/decision";

export function buildMockDecision(payload: DecisionPayload): DecisionResponse {
  const area = payload.land.size;
  const goal = payload.goal;

  const recommendedCrop =
    goal === "food_security"
      ? { id: "cassava", name: "Cassava", score: 0.91 }
      : goal === "low_effort"
        ? { id: "cassava", name: "Cassava", score: 0.88 }
        : { id: "soybean", name: "Soybean", score: 0.9 };

  const recommendedReasons = [
    `Matches the broad growing conditions we track for ${payload.location.state}.`,
    `Suitable for the ${payload.season} season.`,
    goal === "profit"
      ? "Shows strong profit potential for the selected field size."
      : goal === "food_security"
        ? "Supports a food security goal with dependable output."
        : "Keeps field management relatively simple."
  ];

  const recommendedBreakdown = {
    regionalFit: 1,
    seasonalFit: 1,
    goalFit: 1,
    budgetFit: payload.budget ? 1 : 0.7,
    economicsFit: recommendedCrop.id === "cassava" ? 0.68 : 0.82,
    effortFit: recommendedCrop.id === "cassava" ? 0.9 : 0.7,
    preferenceFit: 0
  };

  const calculations =
    recommendedCrop.id === "cassava"
      ? {
          fieldAreaHectares: area,
          seedRequiredKg: Number((100 * area).toFixed(2)),
          fertilizer: {
            npkBags: Number((1 * area).toFixed(2)),
            ureaBags: 0
          },
          estimatedCostNgn: Number((95000 * area).toFixed(2)),
          estimatedYieldTons: Number((10 * area).toFixed(2)),
          estimatedRevenueNgn: Number((400000 * area).toFixed(2)),
          estimatedProfitNgn: Number((305000 * area).toFixed(2))
        }
      : {
          fieldAreaHectares: area,
          seedRequiredKg: Number((60 * area).toFixed(2)),
          fertilizer: {
            npkBags: Number((1 * area).toFixed(2)),
            ureaBags: 0
          },
          estimatedCostNgn: Number((119000 * area).toFixed(2)),
          estimatedYieldTons: Number((2.2 * area).toFixed(2)),
          estimatedRevenueNgn: Number((704000 * area).toFixed(2)),
          estimatedProfitNgn: Number((585000 * area).toFixed(2))
        };

  return {
    recommendedCrop: {
      ...recommendedCrop,
      reasons: recommendedReasons,
      scoreBreakdown: recommendedBreakdown
    },
    calculations,
    explanation: {
      reasonSummary: `${recommendedCrop.name} is a strong fit for ${payload.location.state} in the ${payload.season} season and matches your ${formatGoal(goal)} objective.`,
      farmerAdvice: [
        "Buy inputs before planting begins so the field schedule stays on track.",
        "Use the field size estimate to guide spending and avoid overbuying.",
        "Inspect the field every week and react quickly to weed or nutrient issues."
      ],
      actionPlan: [
        "Confirm the field boundary and area before buying inputs.",
        `Buy the required seed and fertilizer for ${recommendedCrop.name.toLowerCase()}.`,
        `Plant during the ${payload.season} season with the correct spacing.`,
        "Maintain weeding and input application on schedule.",
        "Prepare labor, transport, and storage before harvest."
      ]
    },
    rankedOptions: [
      {
        ...recommendedCrop,
        reasons: recommendedReasons,
        scoreBreakdown: recommendedBreakdown
      },
      {
        id: "maize",
        name: "Maize",
        score: 0.84,
        reasons: [
          `Suitable for the ${payload.season} season.`,
          "Offers a balanced fit across cost, yield, and effort."
        ],
        scoreBreakdown: {
          regionalFit: 0.8,
          seasonalFit: 1,
          goalFit: 0.9,
          budgetFit: payload.budget ? 0.9 : 0.7,
          economicsFit: 0.74,
          effortFit: 0.7,
          preferenceFit: 0
        }
      },
      {
        id: "cassava",
        name: "Cassava",
        score: 0.82,
        reasons: [
          "Operational difficulty is relatively manageable.",
          "Works as a stable fallback option for this field."
        ],
        scoreBreakdown: {
          regionalFit: 0.8,
          seasonalFit: 1,
          goalFit: 0.85,
          budgetFit: payload.budget ? 0.95 : 0.7,
          economicsFit: 0.68,
          effortFit: 0.9,
          preferenceFit: 0
        }
      }
    ],
    meta: {
      state: payload.location.state,
      season: payload.season,
      goal,
      aiMode: "mock-fallback",
      responseSource: "mobile_mock",
      modelProvider: "mock"
    }
  };
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
