import { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../theme/tokens";

type ScreenShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  body: string;
}>;

export function ScreenShell({
  eyebrow,
  title,
  body,
  children,
}: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
        <View style={styles.card}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.lg,
  },
  header: {
    gap: SPACING.sm,
  },
  eyebrow: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.text,
    fontSize: 38,
    fontWeight: "800",
    lineHeight: 42,
  },
  body: {
    color: COLORS.textMuted,
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 520,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.08,
    shadowRadius: 30,
  },
});
