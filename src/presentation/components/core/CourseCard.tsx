import { AppCard, AppText, ProgressBar } from "@/src/presentation/components/shared";
import { colors } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Pressable, View } from "react-native";

export type CourseCardData = {
  id: string;
  title: string;
  subject: string;
  grade?: string;
  pageCount: number;
  progress: number;
  iconName?: React.ComponentProps<typeof FontAwesome5>["name"] | string | null;
  color?: string | null;
  focusText?: string | null;
};

type CourseCardProps = {
  course: CourseCardData;
  onPress: () => void;
};

export function CourseCard({ course, onPress }: CourseCardProps) {
  const pageLabel = `${course.pageCount} page${course.pageCount > 1 ? "s" : ""}`;
  const secondaryLine = [course.subject, course.grade, pageLabel].filter(Boolean).join(" • ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${course.title}`}
      onPress={onPress}
      className="active:opacity-80"
    >
      <AppCard className="flex-row items-center gap-4 p-4">
        <View
          accessibilityLabel={`Icône ${course.subject}`}
          className="h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: course.color ?? colors.secondary }}
        >
          <FontAwesome5
            name={course.iconName ?? "book-open"}
            size={26}
            color={colors.white}
          />
        </View>
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <AppText variant="subtitle">{course.title}</AppText>
              <AppText tone="secondary">{secondaryLine}</AppText>
            </View>
            <AppText variant="label">{course.progress}%</AppText>
          </View>
          <ProgressBar
            value={course.progress}
            accessibilityLabel={`Progression ${course.title}`}
          />
          <AppText tone="secondary">{course.focusText ?? "Pas encore révisé"}</AppText>
        </View>
      </AppCard>
    </Pressable>
  );
}
