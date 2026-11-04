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
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ComingSoonScreen } from "./src/screens/ComingSoonScreen";
import { TournamentsScreen } from "./src/screens/TournamentsScreen";
import { colors, fonts, touchTarget } from "./src/theme";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const Tab = createBottomTabNavigator();

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
      <NavigationContainer theme={theme}>
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
          <Tab.Screen name="Pronos" options={{ tabBarIcon: tabIcon("bullseye-arrow", "bullseye") }}>
            {() => (
              <ComingSoonScreen
                title="Pronos"
                description="Bientôt : pronostique le vainqueur et le score des matchs en direct."
              />
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Pick'em"
            options={{ tabBarIcon: tabIcon("checkbox-marked", "checkbox-marked-outline") }}
          >
            {() => (
              <ComingSoonScreen
                title="Pick'em"
                description="Bientôt : réponds aux questions Pick'em de chaque tournoi."
              />
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Arbres"
            component={TournamentsScreen}
            options={{ tabBarIcon: tabIcon("tournament", "tournament") }}
          />
          <Tab.Screen name="Classement" options={{ tabBarIcon: tabIcon("chart-bar", "chart-bar") }}>
            {() => (
              <ComingSoonScreen
                title="Classement"
                description="Bientôt : ta position, celle de tes amis et tes badges."
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
