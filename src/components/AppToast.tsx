import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToastStore } from "../store/toastStore";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";

function backgroundForTone(tone: "success" | "error" | "info") {
  if (tone === "success") {
    return "#22311A";
  }

  if (tone === "error") {
    return "#4D241E";
  }

  return "#1B1F26";
}

export function AppToast() {
  const insets = useSafeAreaInsets();
  const hideToast = useToastStore((state) => state.hideToast);
  const id = useToastStore((state) => state.id);
  const message = useToastStore((state) => state.message);
  const tone = useToastStore((state) => state.tone);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    if (!message) {
      Animated.parallel([
        Animated.timing(opacity, {
          duration: 160,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: 160,
          toValue: -24,
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    opacity.setValue(0);
    translateY.setValue(-24);

    Animated.parallel([
      Animated.timing(opacity, {
        duration: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        damping: 16,
        mass: 0.9,
        stiffness: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [id, message, opacity, translateY]);

  if (!message) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          opacity,
          paddingTop: Math.max(insets.top, SPACING.sm),
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={hideToast}
        style={[styles.toast, { backgroundColor: backgroundForTone(tone) }]}
      >
        <Text style={styles.text}>{message}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    left: 0,
    paddingHorizontal: SPACING.md,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 200,
  },
  toast: {
    borderRadius: RADIUS.md,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.18,
    shadowRadius: 22,
  },
  text: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
});
