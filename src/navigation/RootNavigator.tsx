import { NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AppTabs, type AppTabParamList } from "./AppTabs";
import { AuthLoadingScreen } from "../screens/AuthLoadingScreen";
import { ListingDetailScreen } from "../screens/ListingDetailScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { useAuthStore } from "../store/authStore";

export type RootStackParamList = {
  AuthLoading: undefined;
  Onboarding: undefined;
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  App: NavigatorScreenParams<AppTabParamList> | undefined;
  ListingDetail: { listingId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const profile = useAuthStore((state) => state.profile);
  const profileStatus = useAuthStore((state) => state.profileStatus);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  if (
    status === "idle" ||
    status === "loading" ||
    (user && (profileStatus === "idle" || profileStatus === "loading"))
  ) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
      </Stack.Navigator>
    );
  }

  if (user) {
    if (!profile) {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      );
    }

    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="App" component={AppTabs} />
        <Stack.Screen
          name="ListingDetail"
          component={ListingDetailScreen}
          options={{
            headerShown: true,
            headerBackTitle: "Home",
            title: "Listing",
            headerStyle: {
              backgroundColor: "#FFFDF8",
            },
          }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
