export const fonts = {
  brand: "Fraunces_700Bold",
  title: "PlusJakartaSans_800ExtraBold",
  heading: "PlusJakartaSans_700Bold",
  body: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
} as const;

export type FontName = keyof typeof fonts;
