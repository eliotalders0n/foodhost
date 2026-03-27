import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../theme/tokens";

type Props = {
  busy?: boolean;
  ctaLabel: string;
  googleLabel?: string;
  googleStatusMessage?: string | null;
  helperLabel: string;
  title: string;
  onGooglePress?: () => Promise<void>;
  onSubmit: (values: { email: string; password: string }) => Promise<void>;
  onSecondaryPress: () => void;
};

export function AuthForm({
  busy = false,
  ctaLabel,
  googleLabel,
  googleStatusMessage = null,
  helperLabel,
  title,
  onGooglePress,
  onSubmit,
  onSecondaryPress,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      await onSubmit({ email, password });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Authentication failed."
      );
    }
  }

  async function handleGooglePress() {
    if (!onGooglePress) {
      return;
    }

    setError(null);

    try {
      await onGooglePress();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Google sign-in failed."
      );
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>{title}</Text>
      {onGooglePress ? (
        <>
          <Pressable disabled={busy} onPress={handleGooglePress} style={styles.googleButton}>
            <Ionicons color={COLORS.text} name="logo-google" size={18} />
            <Text style={styles.googleButtonText}>
              {googleLabel ?? "Continue with Google"}
            </Text>
          </Pressable>
          {googleStatusMessage ? (
            <Text style={styles.googleStatus}>{googleStatusMessage}</Text>
          ) : null}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or use email</Text>
            <View style={styles.dividerLine} />
          </View>
        </>
      ) : null}
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="name@example.com"
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
        value={email}
      />
      <TextInput
        autoCapitalize="none"
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry
        style={styles.input}
        value={password}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable disabled={busy} onPress={handleSubmit} style={styles.primaryButton}>
        {busy ? (
          <ActivityIndicator color={COLORS.text} />
        ) : (
          <Text style={styles.primaryButtonText}>{ctaLabel}</Text>
        )}
      </Pressable>
      <Pressable onPress={onSecondaryPress} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>{helperLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: SPACING.md,
  },
  formTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "700",
  },
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  error: {
    color: "#A03317",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  secondaryButtonText: {
    color: COLORS.accentDeep,
    fontSize: 15,
    fontWeight: "600",
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    gap: SPACING.xs,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: SPACING.md,
  },
  googleButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  googleStatus: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
  },
  dividerLine: {
    backgroundColor: COLORS.border,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
