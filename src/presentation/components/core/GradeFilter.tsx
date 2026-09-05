import { AppText } from "@/src/presentation/components/shared";
import { Pressable, View } from "react-native";

type GradeFilterProps = {
  values: string[];
  selectedValue: string;
  onChange: (value: string) => void;
};

export function GradeFilter({ values, selectedValue, onChange }: GradeFilterProps) {
  return (
    <View className="flex-row gap-2" accessibilityRole="tablist">
      {values.map((value) => {
        const isSelected = value === selectedValue;

        return (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityLabel={`Filtre ${value}`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(value)}
            className={[
              "min-h-12 flex-1 items-center justify-center rounded-2xl border",
              isSelected ? "border-[#D94B24] bg-[#D94B24]" : "border-[#E8D9C7] bg-[#FAF1E2]",
            ].join(" ")}
          >
            <AppText variant="label" tone={isSelected ? "inverse" : "primary"}>
              {value}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
