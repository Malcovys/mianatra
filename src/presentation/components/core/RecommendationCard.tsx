import { AppButton, AppCard, AppText, StatusBadge } from "@/src/presentation/components/shared";
import { colors } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Image, View } from "react-native";

type RecommendationCourse = { subject: string; title: string };

type RecommendationCardProps = {
  course: RecommendationCourse;
  onContinue: () => void;
};

export function RecommendationCard({ course, onContinue }: RecommendationCardProps) {
  return (
    <AppCard className="gap-4 border-[#F2B84B] bg-[#F2B84B]">
      <View className="flex-row items-center gap-3">
        <View className="flex-1 gap-2">
          <AppText variant="label">À faire maintenant</AppText>
          <AppText variant="heading">{course.subject}</AppText>
          <AppText variant="subtitle">{course.title}</AppText>
          <AppText tone="secondary">
            Tu avais des difficultés sur la lecture des graphiques.
          </AppText>
          <View className="flex-row items-center gap-2">
            <FontAwesome5 name="clock" size={16} color={colors.textSecondary} />
            <AppText tone="secondary">Environ 10 minutes</AppText>
          </View>
        </View>
        <Image
          source={require("../../../assets/mianatra/image_mini_function_graph.png")}
          accessibilityLabel="Miniature du graphique de fonction"
          accessibilityIgnoresInvertColors
          className="h-[108px] w-[108px] rotate-3 rounded-2xl border-[3px] border-[#FFFDF8]"
        />
      </View>
      <StatusBadge label="Lecture des graphiques" tone="progress" />
      <AppButton
        title="Continuer ma révision"
        iconName="arrow-right"
        iconPosition="right"
        onPress={onContinue}
      />
    </AppCard>
  );
}
