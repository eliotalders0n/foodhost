import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenShell } from "../components/ScreenShell";
import { upsertUserProfile } from "../lib/firestore";
import { useAuthStore } from "../store/authStore";
import type { AccountType } from "../types/domain";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";

export function OnboardingScreen() {
  const user = useAuthStore((state) => state.user);
  const [accountType, setAccountType] = useState<AccountType>("seller");
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!user?.uid || !user.email) {
      setError("A signed-in user is required.");
      return;
    }

    if (!displayName.trim() || !district.trim() || !province.trim()) {
      setError("Display name, district, and province are required.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await upsertUserProfile(user.uid, user.email, {
        accountType,
        displayName: displayName.trim(),
        district: district.trim(),
        province: province.trim(),
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Profile setup failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenShell
      eyebrow="Onboarding"
      title="Create your marketplace profile"
      body="The rebuild stores profile data separately from Firebase Auth so marketplace roles and listing ownership stay explicit."
    >
      <View style={styles.toggleRow}>
        {(["seller", "buyer"] as const).map((value) => (
          <Pressable
            key={value}
            onPress={() => setAccountType(value)}
            style={[
              styles.toggle,
              accountType === value ? styles.toggleActive : undefined,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                accountType === value ? styles.toggleTextActive : undefined,
              ]}
            >
              {value === "seller" ? "Seller" : "Buyer"}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        onChangeText={setDisplayName}
        placeholder="Display name"
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
        value={displayName}
      />
      <TextInput
        onChangeText={setDistrict}
        placeholder="District"
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
        value={district}
      />
      <TextInput
        onChangeText={setProvince}
        placeholder="Province"
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
        value={province}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable disabled={busy} onPress={handleSubmit} style={styles.primaryButton}>
        {busy ? (
          <ActivityIndicator color={COLORS.text} />
        ) : (
          <Text style={styles.primaryButtonText}>Save Profile</Text>
        )}
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  toggle: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: SPACING.sm,
  },
  toggleActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  toggleText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  toggleTextActive: {
    color: COLORS.text,
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
  error: {
    color: "#A03317",
    fontSize: 14,
    lineHeight: 20,
  },
});
