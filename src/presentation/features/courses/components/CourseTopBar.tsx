import { AppText } from "@/src/presentation/components/shared";
import { colors, fonts } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

type CourseTopBarProps = {
  title: string;
  onOptionsPress?: () => void;
};

export function CourseTopBar({ title, onOptionsPress }: CourseTopBarProps) {
  return (
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
        numberOfLines={1}
        className="flex-1 text-center text-[20px] leading-6"
        style={{ fontFamily: fonts.bold }}
      >
        {title}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Options du cours"
        accessibilityState={{ disabled: !onOptionsPress }}
        disabled={!onOptionsPress}
        onPress={onOptionsPress}
        className={["h-10 w-10 items-center justify-center rounded-full active:opacity-80", !onOptionsPress ? "opacity-35" : ""].join(" ")}
      >
        <FontAwesome5 name="ellipsis-h" size={19} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}
