import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface MetricCardProps {
  label: string;
  value: string;
}

export default function MetricCard({ label, value }: MetricCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    gap: 6,
    minWidth: "47%"
  },
  label: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#7A7F5D",
    fontWeight: "700"
  },
  value: {
    fontSize: 20,
    color: "#1A1F16",
    fontWeight: "800"
  }
});

