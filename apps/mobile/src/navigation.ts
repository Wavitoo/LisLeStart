import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

/** Pile racine : les onglets, et l'écran Compte ouvert par-dessus depuis n'importe quel onglet. */
export type RootStackParamList = {
  Onglets: undefined;
  Compte: undefined;
};

export const useRootNavigation = () =>
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();
