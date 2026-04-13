import pricing from "../data/pricing.json";
import { CropRecord, DecisionCalculations } from "../types/decision";

const pricingData = pricing as {
  fertilizer: {
    npk_15_15_15_per_bag_ngn: number;
    urea_per_bag_ngn: number;
  };
  seed: Record<string, number>;
};

export function buildCalculations(crop: CropRecord, fieldAreaHectares: number): DecisionCalculations {
  const seedRequiredKg = round(crop.seed_per_hectare_kg * fieldAreaHectares, 2);
  const npkBags = round((crop.fertilizer_profile.npk_15_15_15_bags_per_hectare ?? 0) * fieldAreaHectares, 2);
  const ureaBags = round((crop.fertilizer_profile.urea_bags_per_hectare ?? 0) * fieldAreaHectares, 2);
  const estimatedYieldTons = round(crop.yield_per_hectare_tons * fieldAreaHectares, 2);
  const estimatedRevenueNgn = round(estimatedYieldTons * crop.avg_price_per_ton_ngn, 2);

  const seedUnitPrice = pricingData.seed[crop.id] ?? 0;
  const seedCost = seedRequiredKg * seedUnitPrice;
  const fertilizerCost =
    npkBags * pricingData.fertilizer.npk_15_15_15_per_bag_ngn +
    ureaBags * pricingData.fertilizer.urea_per_bag_ngn;
  const operatingCost = crop.base_cost_per_hectare_ngn * fieldAreaHectares;
  const estimatedCostNgn = round(operatingCost + seedCost + fertilizerCost, 2);
  const estimatedProfitNgn = round(estimatedRevenueNgn - estimatedCostNgn, 2);

  return {
    fieldAreaHectares: round(fieldAreaHectares, 2),
    seedRequiredKg,
    fertilizer: {
      npkBags,
      ureaBags
    },
    estimatedCostNgn,
    estimatedYieldTons,
    estimatedRevenueNgn,
    estimatedProfitNgn
  };
}

function round(value: number, precision: number): number {
  return Number(value.toFixed(precision));
}

