import type { TextStyle } from "react-native";

/** Couleurs de la charte Seedline (docs/brand.md). */
export const colors = {
  nuit: "#0F1222",
  tabbar: "#12162A",
  surface: "#181C30",
  surfaceRaised: "#1F2440",
  line: "#292F4D",
  craie: "#F2F4FA",
  muted: "#9BA0B3",
  lime: "#C6F432",
  violet: "#8B7BFF",
  corail: "#FF8A65",
  limeSoft: "#2C3625",
  violetSoft: "#25254A",
  corailSoft: "#3A282E",
} as const;

/** Pas de 4 px. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 } as const;

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

/** Cible tactile minimale (dp). */
export const touchTarget = 48;

export const fonts = {
  title: "BarlowCondensed_800ExtraBold",
  heading: "BarlowCondensed_700Bold",
  body: "Manrope_400Regular",
  bodyStrong: "Manrope_600SemiBold",
  data: "JetBrainsMono_600SemiBold",
  dataSmall: "JetBrainsMono_400Regular",
} as const;

/** Échelle typographique de la charte ; les titres sont toujours en capitales. */
export const type = {
  title: { fontFamily: fonts.title, fontSize: 32, lineHeight: 36, textTransform: "uppercase" },
  heading: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 24, textTransform: "uppercase" },
  section: { fontFamily: fonts.heading, fontSize: 15, lineHeight: 20, textTransform: "uppercase" },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodyStrong, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.bodyStrong, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  data: { fontFamily: fonts.data, fontSize: 15, lineHeight: 20 },
} satisfies Record<string, TextStyle>;
