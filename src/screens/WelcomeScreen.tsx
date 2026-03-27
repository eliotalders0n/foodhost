import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../store/authStore";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  const isConfigured = useAuthStore((state) => state.isConfigured);
  const authError = useAuthStore((state) => state.error);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/_ (9).jpeg")}
        style={styles.background}
        imageStyle={styles.heroImageStyle}
      >
        <View style={styles.scrim} />
      </ImageBackground>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.heroOverlay}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Appetite</Text>
            <Text style={styles.title}>Buy and sell fresh meals around you.</Text>
            <Text style={styles.body}>
              Explore local food, publish your own listings, and manage inquiries
              from one simple marketplace.
            </Text>
            {!isConfigured ? (
              <Text style={styles.warning}>
                Service is temporarily unavailable. Please try again shortly.
              </Text>
            ) : authError ? (
              <Text style={styles.warning}>{authError}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actionsWrap}>
          <View style={styles.actions}>
            <Pressable style={styles.button} onPress={() => navigation.navigate("SignIn")}>
              <Text style={styles.buttonText}>Sign In</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("SignUp")}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.text,
    overflow: "hidden",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  heroImageStyle: {
    resizeMode: "cover",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9, 12, 18, 0.24)",
  },
  heroOverlay: {
    left: 0,
    padding: SPACING.lg,
    position: "absolute",
    right: 0,
    top: 0,
  },
  heroCopy: {
    backgroundColor: "rgba(18, 22, 27, 0.32)",
    borderRadius: RADIUS.lg,
    gap: SPACING.md,
    marginTop: SPACING.xl,
    padding: SPACING.lg,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.surface,
    fontSize: 39,
    fontWeight: "800",
    lineHeight: 43,
  },
  body: {
    color: "#D3D8DF",
    fontSize: 16,
    lineHeight: 25,
  },
  button: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  actions: {
    gap: SPACING.md,
  },
  actionsWrap: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    bottom: 0,
    left: 0,
    position: "absolute",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    right: 0,
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  warning: {
    color: "#FFB4A8",
    fontSize: 14,
    lineHeight: 20,
  },
});
