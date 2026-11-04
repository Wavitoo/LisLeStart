import {
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
} from "@expo-google-fonts/barlow-condensed";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
} from "@expo-google-fonts/jetbrains-mono";
import { Manrope_400Regular, Manrope_600SemiBold } from "@expo-google-fonts/manrope";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DarkTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/auth/AuthContext";
import type { RootStackParamList } from "./src/navigation";
import { AccountScreen } from "./src/screens/AccountScreen";
import { LeaderboardScreen } from "./src/screens/LeaderboardScreen";
import { PickemScreen } from "./src/screens/PickemScreen";
import { PredictionsScreen } from "./src/screens/PredictionsScreen";
import { TournamentsScreen } from "./src/screens/TournamentsScreen";
import { colors, fonts, touchTarget } from "./src/theme";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const theme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.lime,
    background: colors.nuit,
    card: colors.tabbar,
    text: colors.craie,
    border: colors.line,
    notification: colors.corail,
  },
};

/** Icône pleine sur l'onglet actif, contour sinon : l'état ne repose pas que sur le lime. */
function tabIcon(active: IconName, inactive: IconName) {
  return ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <MaterialCommunityIcons name={focused ? active : inactive} color={color} size={size} />
  );
}

/** Barre d'onglets de la maquette : Pronos · Pick'em · Arbres · Classement. */
function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="Arbres"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.lime,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.bodyStrong, fontSize: 12 },
        tabBarItemStyle: { minHeight: touchTarget },
        tabBarStyle: { backgroundColor: colors.tabbar, borderTopColor: colors.line },
      }}
    >
      <Tab.Screen
        name="Pronos"
        component={PredictionsScreen}
        options={{ tabBarIcon: tabIcon("bullseye-arrow", "bullseye") }}
      />
      <Tab.Screen
        name="Pick'em"
        component={PickemScreen}
        options={{ tabBarIcon: tabIcon("checkbox-marked", "checkbox-marked-outline") }}
      />
      <Tab.Screen
        name="Arbres"
        component={TournamentsScreen}
        options={{ tabBarIcon: tabIcon("tournament", "tournament") }}
      />
      <Tab.Screen
        name="Classement"
        component={LeaderboardScreen}
        options={{ tabBarIcon: tabIcon("chart-bar", "chart-bar") }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    Manrope_400Regular,
    Manrope_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={theme}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.tabbar },
              headerTintColor: colors.craie,
              headerTitleStyle: { fontFamily: fonts.heading },
              contentStyle: { backgroundColor: colors.nuit },
            }}
          >
            <Stack.Screen name="Onglets" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="Compte"
              component={AccountScreen}
              options={{ title: "MON COMPTE" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
