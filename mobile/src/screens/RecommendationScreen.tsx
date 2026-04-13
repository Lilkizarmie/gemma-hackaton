import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MetricCard from "../components/MetricCard";
import OptionCard from "../components/OptionCard";
import PrimaryButton from "../components/PrimaryButton";
import StepHeader from "../components/StepHeader";
import { DecisionResponse } from "../types/decision";

interface RecommendationScreenProps {
  result: DecisionResponse;
  onRestart: () => void;
  onBack: () => void;
}

export default function RecommendationScreen({
  result,
  onRestart,
  onBack
}: RecommendationScreenProps): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <StepHeader
        eyebrow="Decision ready"
        title={result.recommendedCrop.name}
        subtitle={result.explanation.reasonSummary}
      />

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Recommended crop</Text>
        <Text style={styles.heroTitle}>{result.recommendedCrop.name}</Text>
        <Text style={styles.heroMeta}>
          Goal: {formatGoal(result.meta.goal)} · Season: {result.meta.season} · Confidence score:{" "}
          {result.recommendedCrop.score.toFixed(2)}
        </Text>
        <View style={styles.scoreTrack}>
          <View
            style={[
              styles.scoreFill,
              { width: `${Math.max(8, Math.min(100, result.recommendedCrop.score * 100))}%` }
            ]}
          />
        </View>
      </View>

      <View style={styles.summaryStrip}>
        <View style={styles.summaryStripCard}>
          <Text style={styles.summaryStripLabel}>Why this works</Text>
          <Text style={styles.summaryStripValue}>Strong fit for {result.meta.state}</Text>
        </View>
        <View style={styles.summaryStripCard}>
          <Text style={styles.summaryStripLabel}>Delivery mode</Text>
          <Text style={styles.summaryStripValue}>{formatDeliveryMode(result)}</Text>
        </View>
      </View>

      <View
        style={[
          styles.statusCard,
          result.meta.responseSource === "backend" ? styles.statusCardLive : styles.statusCardFallback
        ]}
      >
        <Text style={styles.statusTitle}>
          {result.meta.responseSource === "backend" ? "Live backend result" : "Demo-safe fallback result"}
        </Text>
        <Text style={styles.statusText}>
          {result.meta.responseSource === "backend"
            ? `Recommendation came from the RootRise backend using ${formatModelProvider(result.meta.modelProvider)}.`
            : "The app could not reach the backend, so it used the built-in deterministic mobile fallback to keep the demo moving."}
        </Text>
      </View>

      <View style={styles.snapshotCard}>
        <Text style={styles.snapshotLabel}>Decision snapshot</Text>
        <Text style={styles.snapshotText}>
          Plant {result.recommendedCrop.name.toLowerCase()} on{" "}
          {result.calculations.fieldAreaHectares} hectares for an estimated{" "}
          {formatCurrency(result.calculations.estimatedProfitNgn)} profit if conditions hold.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Why RootRise chose this crop</Text>
        {result.recommendedCrop.reasons.map((reason) => (
          <Text key={reason} style={styles.listItem}>
            - {reason}
          </Text>
        ))}
        <View style={styles.breakdownGrid}>
          <MetricCard
            label="Regional fit"
            value={formatPercent(result.recommendedCrop.scoreBreakdown.regionalFit)}
          />
          <MetricCard
            label="Season fit"
            value={formatPercent(result.recommendedCrop.scoreBreakdown.seasonalFit)}
          />
          <MetricCard
            label="Goal fit"
            value={formatPercent(result.recommendedCrop.scoreBreakdown.goalFit)}
          />
          <MetricCard
            label="Economics"
            value={formatPercent(result.recommendedCrop.scoreBreakdown.economicsFit)}
          />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="Field size" value={`${result.calculations.fieldAreaHectares} ha`} />
        <MetricCard label="Seed" value={`${result.calculations.seedRequiredKg} kg`} />
        <MetricCard label="Cost" value={formatCurrency(result.calculations.estimatedCostNgn)} />
        <MetricCard label="Yield" value={`${result.calculations.estimatedYieldTons} tons`} />
        <MetricCard label="Revenue" value={formatCurrency(result.calculations.estimatedRevenueNgn)} />
        <MetricCard label="Profit" value={formatCurrency(result.calculations.estimatedProfitNgn)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Input plan</Text>
        <Text style={styles.bodyText}>
          NPK 15-15-15: {result.calculations.fertilizer.npkBags} bags
        </Text>
        <Text style={styles.bodyText}>Urea: {result.calculations.fertilizer.ureaBags} bags</Text>
        <Text style={styles.bodyHint}>
          These input estimates are deterministic and come from the planning engine, not from free-form AI text.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Farmer advice</Text>
        {result.explanation.farmerAdvice.map((advice) => (
          <Text key={advice} style={styles.listItem}>
            - {advice}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Action plan</Text>
        {result.explanation.actionPlan.map((step, index) => (
          <Text key={`${index + 1}-${step}`} style={styles.listItem}>
            {index + 1}. {step}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Compare top options</Text>
        <Text style={styles.bodyHint}>
          RootRise ranked multiple crops before choosing the best fit for this field and goal.
        </Text>
        <View style={styles.optionStack}>
          {result.rankedOptions.map((option, index) => (
            <OptionCard
              key={option.id}
              rank={index + 1}
              name={option.name}
              score={option.score}
              reason={option.reasons[0]}
              highlighted={index === 0}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Back" onPress={onBack} variant="ghost" />
        <PrimaryButton title="Map another field" onPress={onRestart} />
      </View>
    </ScrollView>
  );
}

function formatCurrency(value: number): string {
  return `NGN ${Math.round(value).toLocaleString()}`;
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

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatModelProvider(provider: "ollama" | "mock"): string {
  return provider === "ollama" ? "local Gemma through Ollama" : "mock AI mode";
}

function formatDeliveryMode(result: DecisionResponse): string {
  if (result.meta.responseSource === "mobile_mock") {
    return "mobile fallback";
  }

  if (result.meta.modelProvider === "ollama") {
    return "backend + Gemma";
  }

  return "backend + mock AI";
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 32
  },
  heroCard: {
    backgroundColor: "#1D4D2F",
    borderRadius: 24,
    padding: 20,
    gap: 10
  },
  heroLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#C7D9B7",
    fontWeight: "700",
    letterSpacing: 0.5
  },
  heroTitle: {
    fontSize: 34,
    color: "#F7F4EA",
    fontWeight: "900"
  },
  heroMeta: {
    fontSize: 14,
    color: "#E2E9D8",
    lineHeight: 20
  },
  scoreTrack: {
    marginTop: 6,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(247,244,234,0.2)",
    overflow: "hidden"
  },
  scoreFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#C7D9B7"
  },
  summaryStrip: {
    flexDirection: "row",
    gap: 12
  },
  summaryStripCard: {
    flex: 1,
    backgroundColor: "#E5EBD9",
    borderRadius: 18,
    padding: 14,
    gap: 4
  },
  summaryStripLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    color: "#4A4E43",
    fontWeight: "700"
  },
  summaryStripValue: {
    fontSize: 16,
    color: "#1D4D2F",
    fontWeight: "800"
  },
  snapshotCard: {
    backgroundColor: "#FFF8E8",
    borderRadius: 20,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E8D9A8"
  },
  snapshotLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#8B6A12",
    fontWeight: "800"
  },
  snapshotText: {
    fontSize: 17,
    lineHeight: 25,
    color: "#3B331E",
    fontWeight: "700"
  },
  statusCard: {
    borderRadius: 20,
    padding: 16,
    gap: 6,
    borderWidth: 1
  },
  statusCardLive: {
    backgroundColor: "#EEF8EF",
    borderColor: "#B8D9BC"
  },
  statusCardFallback: {
    backgroundColor: "#FFF3E6",
    borderColor: "#E8C28F"
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1D4D2F"
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4A4E43"
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12
  },
  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 6
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    gap: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1F16"
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4A4E43"
  },
  bodyHint: {
    fontSize: 13,
    lineHeight: 19,
    color: "#7A7F5D"
  },
  listItem: {
    fontSize: 15,
    lineHeight: 23,
    color: "#4A4E43"
  },
  optionStack: {
    gap: 10
  },
  actions: {
    gap: 12
  }
});
