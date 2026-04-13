import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import StepHeader from "../components/StepHeader";
import { GoalSelectionData } from "../types/app";
import { Goal } from "../types/decision";

interface GoalSelectionScreenProps {
  value: GoalSelectionData;
  loading: boolean;
  error: string | null;
  onChange: (value: GoalSelectionData) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const goalOptions: { id: Goal; title: string; description: string }[] = [
  {
    id: "profit",
    title: "Maximize profit",
    description: "Prioritize the crop that gives the strongest financial upside."
  },
  {
    id: "food_security",
    title: "Food security",
    description: "Prioritize reliable household supply and strong staple value."
  },
  {
    id: "low_effort",
    title: "Low effort",
    description: "Prioritize crops that are easier to manage during the season."
  }
];

export default function GoalSelectionScreen({
  value,
  loading,
  error,
  onChange,
  onBack,
  onSubmit
}: GoalSelectionScreenProps): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <StepHeader
        eyebrow="Step 2"
        title="Choose the goal"
        subtitle="Tell RootRise what matters most for this field so the recommendation is optimized for the right outcome."
      />

      <View style={styles.options}>
        {goalOptions.map((option) => {
          const selected = value.goal === option.id;

          return (
            <View
              key={option.id}
              style={[styles.optionCard, selected ? styles.optionCardSelected : null]}
            >
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
              <PrimaryButton
                title={selected ? "Selected" : "Select"}
                onPress={() => onChange({ ...value, goal: option.id })}
                variant={selected ? "solid" : "ghost"}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.budgetCard}>
        <Text style={styles.label}>Optional budget (NGN)</Text>
        <TextInput
          value={value.budget}
          onChangeText={(budget) => onChange({ ...value, budget })}
          placeholder="200000"
          keyboardType="numeric"
          style={styles.input}
        />
        <Text style={styles.hint}>Leave this empty if you want the engine to optimize without a budget cap.</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
        <PrimaryButton title="Back" onPress={onBack} variant="ghost" />
        <PrimaryButton title="Get recommendation" onPress={onSubmit} loading={loading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 32
  },
  options: {
    gap: 14
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    gap: 12
  },
  optionCardSelected: {
    borderWidth: 2,
    borderColor: "#1D4D2F"
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1F16"
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4A4E43"
  },
  budgetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    gap: 10
  },
  label: {
    fontSize: 13,
    color: "#4A4E43",
    fontWeight: "700"
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8D1C2",
    paddingHorizontal: 14,
    backgroundColor: "#FBF9F4"
  },
  hint: {
    fontSize: 13,
    color: "#7A7F5D",
    lineHeight: 18
  },
  errorText: {
    color: "#A63D2F",
    fontSize: 14,
    fontWeight: "600"
  },
  actions: {
    gap: 12
  }
});

