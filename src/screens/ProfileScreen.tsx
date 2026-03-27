import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { NavigationProp } from "@react-navigation/native";

import { ScreenShell } from "../components/ScreenShell";
import { logOut } from "../lib/auth";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../store/authStore";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [busy, setBusy] = useState(false);
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);

  async function handleLogOut() {
    setBusy(true);
    try {
      await logOut();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenShell
      eyebrow="Profile"
      title={profile?.displayName ?? "Your profile"}
      body="Keep your account details current so buyers and sellers can reach the right person in the right place."
    >
      <View style={styles.heroRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.displayName ?? user?.email ?? "U").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.heroMeta}>
          <Text style={styles.stage}>{user?.email ?? "Signed in"}</Text>
          {profile ? (
            <Text style={styles.meta}>
              {profile.accountType} · {profile.district}, {profile.province}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons color={COLORS.textMuted} name="person-outline" size={18} />
          <Text style={styles.infoText}>{profile?.displayName ?? "No display name yet"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons color={COLORS.textMuted} name="mail-outline" size={18} />
          <Text style={styles.infoText}>{user?.email ?? "No email available"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons color={COLORS.textMuted} name="location-outline" size={18} />
          <Text style={styles.infoText}>
            {profile ? `${profile.district}, ${profile.province}` : "Location missing"}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("App", { screen: "Inbox" })}
        >
          <Text style={styles.secondaryButtonText}>View Inbox</Text>
        </Pressable>
      <Pressable disabled={busy} style={styles.button} onPress={handleLogOut}>
        {busy ? (
          <ActivityIndicator color={COLORS.text} />
        ) : (
          <Text style={styles.buttonText}>Log Out</Text>
        )}
      </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.md,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
  },
  heroMeta: {
    flex: 1,
    gap: 4,
  },
  stage: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 24,
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
    padding: SPACING.md,
  },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
  },
  infoText: {
    color: COLORS.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  button: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
