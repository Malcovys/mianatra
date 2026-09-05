import { View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "./AppButton";
import { AppCard } from "./AppCard";
import { AppScreen } from "./AppScreen";
import { AppText } from "./AppText";
import { ScreenHeader } from "./ScreenHeader";

type ScreenPlaceholderProps = {
  title: string;
  description: string;
  showBack?: boolean;
};

export function ScreenPlaceholder({
  title,
  description,
  showBack = true,
}: ScreenPlaceholderProps) {
  return (
    <AppScreen>
      <ScreenHeader title={title} showBack={showBack} />
      <View className="flex-1 justify-center">
        <AppCard className="gap-4">
          <AppText variant="subtitle">{title}</AppText>
          <AppText tone="secondary">{description}</AppText>
          {showBack ? (
            <AppButton
              title="Retour"
              iconName="arrow-left"
              variant="secondary"
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
            />
          ) : null}
        </AppCard>
      </View>
    </AppScreen>
  );
}
