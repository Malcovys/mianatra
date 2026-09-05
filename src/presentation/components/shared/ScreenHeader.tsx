import { Pressable, View } from "react-native";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { colors, spacing } from "@/src/theme";
import { AppText } from "./AppText";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
};

export function ScreenHeader({ title, subtitle, showBack = false }: ScreenHeaderProps) {
  return (
    <View className="mb-5 flex-row items-center gap-3">
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Revenir en arrière"
          hitSlop={spacing[2]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          className="h-11 w-11 items-center justify-center rounded-full border border-[#E8D9C7] bg-[#FFFDF8] active:opacity-80"
        >
          <FontAwesome5 name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>
      ) : null}
      <View className="flex-1 gap-1">
        <AppText variant="heading">{title}</AppText>
        {subtitle ? (
          <AppText variant="body" tone="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
