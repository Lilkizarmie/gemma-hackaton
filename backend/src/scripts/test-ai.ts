import { generateExplanation } from "../services/ai.service";

async function main(): Promise<void> {
  const result = await generateExplanation(
    {
      field: {
        name: "North Field",
        boundary: {
          type: "Polygon",
          coordinates: [[[3.947, 7.3775], [3.95, 7.3775], [3.95, 7.38], [3.947, 7.38], [3.947, 7.3775]]]
        }
      },
      location: {
        state: "Oyo",
        country: "Nigeria"
      },
      goal: "profit",
      season: "rainy"
    },
    "Soybean",
    {
      fieldAreaHectares: 2,
      seedRequiredKg: 120,
      fertilizer: {
        npkBags: 2,
        ureaBags: 0
      },
      estimatedCostNgn: 238000,
      estimatedYieldTons: 4.4,
      estimatedRevenueNgn: 1408000,
      estimatedProfitNgn: 1170000
    },
    [
      "Matches the growing conditions we track for Oyo.",
      "Suitable for the rainy season.",
      "Shows strong profit potential based on expected yield, market price, and cost."
    ]
  );

  console.log("AI mode:", process.env.AI_MODE ?? "mock");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("AI smoke test failed.");
  console.error(error);
  process.exit(1);
});
