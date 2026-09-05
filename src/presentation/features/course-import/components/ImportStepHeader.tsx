import { AppText } from "@/src/presentation/components/shared";
import { colors, fonts } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

type ImportStepHeaderProps = {
  currentStep?: 1 | 2 | 3;
  onOptionsPress: () => void;
};

export function ImportStepHeader({ currentStep = 2, onOptionsPress }: ImportStepHeaderProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/courses"))}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-80"
        >
          <FontAwesome5 name="arrow-left" size={19} color={colors.textPrimary} />
        </Pressable>
        <AppText
          variant="subtitle"
          className="flex-1 text-center text-[20px] leading-6"
          style={{ fontFamily: fonts.bold }}
        >
          Ajouter un cours
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Options d'import"
          onPress={onOptionsPress}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-80"
        >
          <FontAwesome5 name="ellipsis-h" size={19} color={colors.textPrimary} />
        </Pressable>
      </View>
      <AppText
        variant="label"
        tone="secondary"
        className="text-center text-[14px] leading-5"
        style={{ fontFamily: fonts.semibold }}
      >
        Étape {currentStep} sur 3
      </AppText>
      <View accessibilityLabel={`Progression d'import : étape ${currentStep} sur 3`} className="flex-row justify-center gap-2">
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            className={["h-1.5 flex-1 rounded-full", step <= currentStep ? "bg-[#D94B24]" : "bg-[#FAF1E2]"].join(" ")}
          />
        ))}
      </View>
    </View>
  );
}
