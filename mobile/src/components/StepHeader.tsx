import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StepHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export default function StepHeader({
  eyebrow,
  title,
  subtitle
}: StepHeaderProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#7A7F5D"
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1F16"
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4A4E43"
  }
});

