import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { COLORS, SPACING } from "../theme/tokens";

export function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={COLORS.accent} size="large" />
      <Text style={styles.text}>Restoring session…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  text: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
});
