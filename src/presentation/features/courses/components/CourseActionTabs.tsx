import { AppText } from "@/src/presentation/components/shared";
import { colors, fonts } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Pressable, View } from "react-native";

type CourseActionTab = {
  id: string;
  label: string;
  iconName: string;
  onPress: () => void;
  disabled?: boolean;
};

type CourseActionTabsProps = {
  tabs: CourseActionTab[];
};

export function CourseActionTabs({ tabs }: CourseActionTabsProps) {
  return (
    <View className="flex-row border-b border-[#EFE1D0] bg-[#FFFDF8] px-2 py-2">
      {tabs.map((tab, index) => (
        <Pressable
          key={tab.id}
          accessibilityRole="button"
          accessibilityLabel={tab.label}
          accessibilityState={{ disabled: tab.disabled ?? false }}
          disabled={tab.disabled}
          onPress={tab.onPress}
          className={[
            "min-h-[60px] flex-1 items-center justify-center gap-1 rounded-xl px-1.5 py-1.5 active:bg-[#FAF1E2]",
            index > 0 ? "ml-1" : "",
            tab.disabled ? "opacity-45" : "",
          ].join(" ")}
        >
          <View className="h-7 w-7 items-center justify-center rounded-full bg-[#FAF1E2]">
            <FontAwesome5 name={tab.iconName} size={13} color={colors.textPrimary} />
          </View>
          <AppText
            variant="label"
            numberOfLines={2}
            className="text-center text-[11px] leading-[14px]"
            style={{ fontFamily: fonts.semibold }}
          >
            {tab.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}
