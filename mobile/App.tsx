import React, { useMemo, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { FieldSetupData, GoalSelectionData, Step } from "./src/types/app";
import { DecisionResponse, DecisionPayload } from "./src/types/decision";
import FieldSetupScreen from "./src/screens/FieldSetupScreen";
import GoalSelectionScreen from "./src/screens/GoalSelectionScreen";
import RecommendationScreen from "./src/screens/RecommendationScreen";
import { createDecisionPayload } from "./src/services/payload";
import { requestDecision } from "./src/services/api";

const initialFieldData: FieldSetupData = {
  fieldName: "",
  state: "",
  country: "",
  season: "rainy",
  points: [],
  areaHectares: 0
};

export default function App(): React.JSX.Element {
  const [step, setStep] = useState<Step>("field");
  const [fieldData, setFieldData] = useState<FieldSetupData>(initialFieldData);
  const [goalData, setGoalData] = useState<GoalSelectionData>({
    goal: "profit",
    budget: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DecisionResponse | null>(null);

  const payload = useMemo<DecisionPayload | null>(() => {
    if (!fieldData.points.length || fieldData.areaHectares <= 0) {
      return null;
    }

    return createDecisionPayload(fieldData, goalData);
  }, [fieldData, goalData]);

  async function handleSubmitDecision(): Promise<void> {
    if (!payload) {
      setError("Please map a valid field before requesting a recommendation.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await requestDecision(payload);
      setResult(response);
      setStep("result");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : "Failed to get recommendation";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {step === "field" ? (
          <FieldSetupScreen
            value={fieldData}
            onChange={setFieldData}
            onNext={() => {
              setError(null);
              setStep("goal");
            }}
          />
        ) : null}

        {step === "goal" ? (
          <GoalSelectionScreen
            value={goalData}
            loading={loading}
            error={error}
            onChange={setGoalData}
            onBack={() => setStep("field")}
            onSubmit={handleSubmitDecision}
          />
        ) : null}

        {step === "result" && result ? (
          <RecommendationScreen
            result={result}
            onRestart={() => {
              setResult(null);
              setError(null);
              setStep("field");
            }}
            onBack={() => setStep("goal")}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F1E8"
  },
  container: {
    flex: 1
  }
});
