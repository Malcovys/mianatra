import { AppText } from "@/src/presentation/components/shared";
import { colors } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Image, Pressable, View } from "react-native";

export type DisplayCoursePage = {
  id: string;
  sourceUri: string;
  fileName?: string;
};

type CoursePageItemProps = {
  page: DisplayCoursePage;
  index: number;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onRemove: (id: string) => void;
  onMoveLeft: (id: string) => void;
  onMoveRight: (id: string) => void;
};

export function CoursePageItem({
  page,
  index,
  canMoveLeft,
  canMoveRight,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: CoursePageItemProps) {
  const pageNumber = index + 1;

  return (
    <View className="aspect-[4/5] flex-1 overflow-hidden rounded-2xl border border-[#E8D9C7] bg-[#FAF1E2]">
      <Image
        source={{ uri: page.sourceUri }}
        accessibilityLabel={`Page ${pageNumber}${page.fileName ? `, ${page.fileName}` : ""}`}
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        className="h-full w-full"
      />
      <View className="absolute bottom-2 left-2 h-9 w-9 items-center justify-center rounded-full bg-[#D94B24]">
        <AppText variant="label" tone="inverse">
          {pageNumber}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Supprimer la page ${pageNumber}`}
        onPress={() => onRemove(page.id)}
        className="absolute right-2 top-2 h-10 w-10 items-center justify-center rounded-full border border-[#E8D9C7] bg-[#FFFDF8] active:opacity-80"
      >
        <FontAwesome5 name="times" size={16} color={colors.textPrimary} />
      </Pressable>
      <View className="absolute bottom-2 right-2 flex-row gap-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Déplacer la page ${pageNumber} avant`}
          accessibilityState={{ disabled: !canMoveLeft }}
          disabled={!canMoveLeft}
          onPress={() => onMoveLeft(page.id)}
          className={["h-8 w-8 items-center justify-center rounded-full border border-[#E8D9C7] bg-[#FFFDF8] active:opacity-80", !canMoveLeft ? "opacity-35" : ""].join(" ")}
        >
          <FontAwesome5 name="arrow-left" size={14} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Déplacer la page ${pageNumber} après`}
          accessibilityState={{ disabled: !canMoveRight }}
          disabled={!canMoveRight}
          onPress={() => onMoveRight(page.id)}
          className={["h-8 w-8 items-center justify-center rounded-full border border-[#E8D9C7] bg-[#FFFDF8] active:opacity-80", !canMoveRight ? "opacity-35" : ""].join(" ")}
        >
          <FontAwesome5 name="arrow-right" size={14} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
