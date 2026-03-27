import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthForm } from "../components/AuthForm";
import {
  isGoogleSignInAvailable,
  signIn,
  signInWithGoogle,
} from "../lib/auth";
import { RootStackParamList } from "../navigation/RootNavigator";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "SignIn">;

export function SignInScreen({ navigation }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleSubmit(values: { email: string; password: string }) {
    setBusy(true);
    try {
      await signIn(values.email, values.password);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/_ (10).jpeg")}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.scrim} />
      </ImageBackground>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Authentication</Text>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.body}>
              Sign in to browse fresh meals, manage inquiries, and keep your
              orders moving.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <AuthForm
            busy={busy}
            ctaLabel="Sign In"
            googleLabel="Continue with Google"
            googleStatusMessage={
              isGoogleSignInAvailable()
                ? "Google sign-in is available in native development and production builds."
                : "Google sign-in is only available in a native development build or app store build."
            }
            helperLabel="Create an account instead"
            title="Welcome back"
            onGooglePress={handleGoogleSignIn}
            onSecondaryPress={() => navigation.navigate("SignUp")}
            onSubmit={handleSubmit}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.text,
    flex: 1,
    overflow: "hidden",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    resizeMode: "cover",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14, 18, 24, 0.30)",
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: SPACING.md,
  },
  hero: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  header: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(17, 21, 26, 0.42)",
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    maxWidth: 520,
    padding: SPACING.lg,
  },
  eyebrow: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.surface,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 38,
  },
  body: {
    color: "#E5E8ED",
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    width: "100%",
  },
});
