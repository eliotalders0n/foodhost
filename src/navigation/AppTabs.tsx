import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { ExploreScreen } from "../screens/ExploreScreen";
import { InboxScreen } from "../screens/InboxScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SellScreen } from "../screens/SellScreen";
import { COLORS } from "../theme/tokens";

export type AppTabParamList = {
  Explore: undefined;
  Sell: undefined;
  Inbox: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: ({ color, focused, size }) => {
          const iconName = (() => {
            if (route.name === "Explore") {
              return focused ? "compass" : "compass-outline";
            }

            if (route.name === "Sell") {
              return focused ? "add-circle" : "add-circle-outline";
            }

            if (route.name === "Inbox") {
              return focused ? "chatbubbles" : "chatbubbles-outline";
            }

            return focused ? "person-circle" : "person-circle-outline";
          })();

          return <Ionicons color={color} name={iconName} size={size + 2} />;
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          height: 76,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: COLORS.shadow,
          shadowOffset: {
            width: 0,
            height: -12,
          },
          shadowOpacity: 0.05,
          shadowRadius: 20,
        },
      })}
    >
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Sell" component={SellScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
