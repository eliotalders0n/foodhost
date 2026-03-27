import { create } from "zustand";

import type { AuthUser } from "../lib/auth";
import type { UserProfile } from "../types/domain";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";
type ProfileStatus = "idle" | "loading" | "ready" | "missing";

type AuthState = {
  error: string | null;
  isConfigured: boolean;
  profile: UserProfile | null;
  profileStatus: ProfileStatus;
  status: AuthStatus;
  user: AuthUser | null;
  setConfigured: (isConfigured: boolean) => void;
  setError: (error: string | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setProfileStatus: (status: ProfileStatus) => void;
  setStatus: (status: AuthStatus) => void;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  error: null,
  isConfigured: true,
  profile: null,
  profileStatus: "idle",
  status: "idle",
  user: null,
  setConfigured: (isConfigured) => set({ isConfigured }),
  setError: (error) => set({ error }),
  setProfile: (profile) => set({ profile }),
  setProfileStatus: (profileStatus) => set({ profileStatus }),
  setStatus: (status) => set({ status }),
  setUser: (user) =>
    set({
      profile: null,
      profileStatus: user ? "idle" : "missing",
      status: user ? "authenticated" : "unauthenticated",
      user,
    }),
}));
