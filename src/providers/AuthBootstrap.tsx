import { PropsWithChildren, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/auth";
import { subscribeToUserProfile } from "../lib/firestore";
import { isFirebaseConfigured } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";

export function AuthBootstrap({ children }: PropsWithChildren) {
  const setConfigured = useAuthStore((state) => state.setConfigured);
  const setError = useAuthStore((state) => state.setError);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setProfileStatus = useAuthStore((state) => state.setProfileStatus);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    setConfigured(isFirebaseConfigured && Boolean(auth));

    if (!isFirebaseConfigured || !auth) {
      setStatus("unauthenticated");
      setError("Firebase configuration is missing.");
      return;
    }

    setStatus("loading");
    let unsubscribeProfile: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribeProfile();
        setError(null);
        setUser(user);

        if (!user) {
          setProfile(null);
          setProfileStatus("missing");
          return;
        }

        setProfileStatus("loading");
        unsubscribeProfile = subscribeToUserProfile(
          user.uid,
          (profile) => {
            setProfile(profile);
            setProfileStatus(profile ? "ready" : "missing");
          },
          (error) => {
            setError(error.message);
            setProfileStatus("missing");
          }
        );
      },
      (error) => {
        setError(error.message);
        setStatus("unauthenticated");
      }
    );

    return () => {
      unsubscribeProfile();
      unsubscribeAuth();
    };
  }, [
    setConfigured,
    setError,
    setProfile,
    setProfileStatus,
    setStatus,
    setUser,
  ]);

  return children;
}
