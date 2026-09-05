import { AppText } from "@/src/presentation/components/shared";
import { Pressable, View } from "react-native";

type ClassSelectorProps = {
  grades: string[];
  selectedGrade: string;
  onSelect: (grade: string) => void;
};

export function ClassSelector({ grades, selectedGrade, onSelect }: ClassSelectorProps) {
  return (
    <View className="flex-row gap-2" accessibilityRole="radiogroup">
      {grades.map((grade) => {
        const isSelected = grade === selectedGrade;

        return (
          <Pressable
            key={grade}
            accessibilityRole="radio"
            accessibilityLabel={`Classe ${grade}`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(grade)}
            className={[
              "min-h-[48px] flex-1 items-center justify-center rounded-xl border",
              isSelected ? "border-[#D94B24] bg-[#D94B24]" : "border-[#E8D9C7] bg-[#FFFDF8]",
            ].join(" ")}
          >
            <AppText variant="label" tone={isSelected ? "inverse" : "primary"} className="text-[15px]">
              {grade}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
