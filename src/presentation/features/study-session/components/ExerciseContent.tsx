import { AppCard, AppText, StatusBadge } from "@/src/presentation/components/shared";
import { fonts } from "@/src/theme";
import { Image, View } from "react-native";

type ExerciseContentProps = {
  exercise: {
    title: string;
    question: string;
    conceptName: string;
    generatedFromWeakness?: string;
    image?: "function-graph";
  };
};

export function ExerciseContent({ exercise }: ExerciseContentProps) {
  return (
    <AppCard
      accessibilityLabel={`Exercice ${exercise.title}`}
      className="gap-3.5 rounded-2xl bg-[#FFFDF8] px-4 py-4"
      style={{
        shadowColor: "#6E442A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View className="flex-row flex-wrap gap-2">
        <StatusBadge label={exercise.conceptName} tone="progress" />
        {exercise.generatedFromWeakness ? (
          <StatusBadge label="Série ciblée" tone="warning" />
        ) : null}
      </View>
      {exercise.image === "function-graph" ? (
        <Image
          source={require("../../../../assets/mianatra/image_function_graph_exercise.png")}
          accessibilityIgnoresInvertColors
          accessibilityLabel="Graphique d'une parabole utilisé pour répondre à l'exercice"
          resizeMode="cover"
          className="h-[210px] w-full rounded-2xl border border-[#E8D9C7]"
        />
      ) : null}
      <View className="gap-2.5">
        <AppText className="text-[16px] leading-5 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
          {exercise.title}
        </AppText>
        <AppText tone="secondary" className="text-[15px] leading-[22px]">
          {exercise.question}
        </AppText>
      </View>
    </AppCard>
  );
}
