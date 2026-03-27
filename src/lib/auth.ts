import { isRunningInExpoGo } from "expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  type Persistence,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import { firebaseApp } from "./firebase";

const rnGetReactNativePersistence = (
  require("firebase/auth") as {
    getReactNativePersistence?: (
      storage: typeof AsyncStorage
    ) => Persistence;
  }
).getReactNativePersistence;

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";

let hasConfiguredGoogleSignin = false;

// Lazy-load Google Sign-in to avoid crashing in Expo Go
type GoogleSigninModule = typeof import("@react-native-google-signin/google-signin");
let googleSigninModule: GoogleSigninModule | null = null;

function getGoogleSignin(): GoogleSigninModule {
  if (!googleSigninModule) {
    googleSigninModule = require("@react-native-google-signin/google-signin");
  }
  return googleSigninModule;
}

export const auth = (() => {
  if (!firebaseApp) {
    return null;
  }

  if (Platform.OS === "web") {
    return getAuth(firebaseApp);
  }

  try {
    if (!rnGetReactNativePersistence) {
      return getAuth(firebaseApp);
    }

    return initializeAuth(firebaseApp, {
      persistence: rnGetReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(firebaseApp);
  }
})();

function requireAuth() {
  if (!auth) {
    throw new Error("Firebase Auth is not configured.");
  }

  return auth;
}

function ensureGoogleSigninConfigured() {
  if (Platform.OS === "web") {
    throw new Error("Google sign-in is currently available on native mobile builds only.");
  }

  if (isRunningInExpoGo()) {
    throw new Error(
      "Google sign-in requires a development build or standalone app. Expo Go does not support this native sign-in flow."
    );
  }

  if (!googleWebClientId) {
    throw new Error(
      "Google sign-in is not configured yet. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your environment."
    );
  }

  if (!hasConfiguredGoogleSignin) {
    getGoogleSignin().GoogleSignin.configure({
      iosClientId: googleIosClientId || undefined,
      webClientId: googleWebClientId,
    });
    hasConfiguredGoogleSignin = true;
  }
}

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(requireAuth(), email.trim(), password);
}

export function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
}

export async function signInWithGoogle() {
  ensureGoogleSigninConfigured();

  const {
    GoogleSignin,
    isCancelledResponse,
    isErrorWithCode,
    isSuccessResponse,
    statusCodes,
  } = getGoogleSignin();

  try {
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) {
      throw new Error("Google sign-in was cancelled.");
    }

    if (!isSuccessResponse(response)) {
      throw new Error("Google sign-in did not complete.");
    }

    const idToken = response.data.idToken;

    if (!idToken) {
      throw new Error(
        "Google did not return an ID token. Check your Google client IDs and Firebase setup."
      );
    }

    return signInWithCredential(
      requireAuth(),
      GoogleAuthProvider.credential(idToken)
    );
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error("Google sign-in is already in progress.");
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error("Google Play Services are not available on this device.");
      }
    }

    throw error instanceof Error ? error : new Error("Google sign-in failed.");
  }
}

export async function logOut() {
  await signOut(requireAuth());

  if (Platform.OS !== "web" && !isRunningInExpoGo()) {
    try {
      await getGoogleSignin().GoogleSignin.signOut();
    } catch {
      // Ignore native Google sign-out failures so Firebase sign-out still succeeds.
    }
  }
}

export function isGoogleSignInAvailable() {
  return Platform.OS !== "web" && !isRunningInExpoGo();
}

export type AuthUser = User;
