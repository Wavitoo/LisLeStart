import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

/** Pile racine : les onglets, et par-dessus le compte ou l'arbre d'un tournoi. */
export type RootStackParamList = {
  Onglets: undefined;
  Compte: undefined;
  /** Arbre d'un tournoi ; le nom sert de titre en attendant le chargement. */
  Tournoi: { tournamentId: string; name: string };
};

export const useRootNavigation = () =>
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();
