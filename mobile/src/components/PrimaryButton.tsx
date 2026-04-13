import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "solid" | "ghost";
}

export default function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = "solid"
}: PrimaryButtonProps): React.JSX.Element {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        variant === "solid" ? styles.solid : styles.ghost,
        (disabled || loading) ? styles.disabled : null
      ]}
    >
      {loading ? <ActivityIndicator color={variant === "solid" ? "#F3F1E8" : "#1D4D2F"} /> : null}
      <Text style={[styles.text, variant === "solid" ? styles.solidText : styles.ghostText]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18
  },
  solid: {
    backgroundColor: "#1D4D2F"
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1D4D2F"
  },
  disabled: {
    opacity: 0.5
  },
  text: {
    fontSize: 16,
    fontWeight: "700"
  },
  solidText: {
    color: "#F3F1E8"
  },
  ghostText: {
    color: "#1D4D2F"
  }
});

