import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface OptionCardProps {
  rank: number;
  name: string;
  score: number;
  reason?: string;
  highlighted?: boolean;
}

export default function OptionCard({
  rank,
  name,
  score,
  reason,
  highlighted = false
}: OptionCardProps): React.JSX.Element {
  return (
    <View style={[styles.card, highlighted ? styles.cardHighlighted : null]}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.score}>Fit score {score.toFixed(2)}</Text>
        {reason ? <Text style={styles.reason}>{reason}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14
  },
  cardHighlighted: {
    borderWidth: 2,
    borderColor: "#1D4D2F"
  },
  rankBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E5EBD9",
    alignItems: "center",
    justifyContent: "center"
  },
  rankText: {
    color: "#1D4D2F",
    fontWeight: "800"
  },
  content: {
    gap: 4
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1F16"
  },
  score: {
    fontSize: 13,
    color: "#4A4E43"
  },
  reason: {
    fontSize: 13,
    lineHeight: 18,
    color: "#68705E",
    maxWidth: 240
  }
});
