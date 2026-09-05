import { AppCard, AppText } from "@/src/presentation/components/shared";
import { colors, fonts } from "@/src/theme";
import { View } from "react-native";
import { CourseProgressRing } from "./CourseProgressRing";

type CourseProgressCardProps = {
  progress: number;
  mastered: number;
  progressing: number;
  needsWork: number;
  notStarted?: number;
};

export function CourseProgressCard({
  progress,
  mastered,
  progressing,
  needsWork,
  notStarted = 0,
}: CourseProgressCardProps) {
  return (
    <AppCard
      className="gap-3 rounded-2xl border-[#DDE6D8] bg-[#EAF0E3] p-4"
      style={{
        shadowColor: "#6E442A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <AppText variant="label" className="text-[15px] leading-5" style={{ fontFamily: fonts.bold }}>
        Progression du chapitre
      </AppText>
      <View className="flex-row items-center gap-4">
        <CourseProgressRing
          value={progress}
          mastered={mastered}
          progressing={progressing}
          needsWork={needsWork}
          notStarted={notStarted}
          size={92}
        />
        <View className="flex-1 gap-2.5">
          <LegendRow color={colors.secondary} label="Maîtrisé" value={`${mastered} notions`} />
          <LegendRow color={colors.accent} label="En progression" value={`${progressing} notions`} />
          <LegendRow color={colors.primary} label="À renforcer" value={`${needsWork} notions`} />
          {notStarted > 0 ? <LegendRow color={colors.surfaceSoft} label="Non commencé" value={`${notStarted} notions`} /> : null}
        </View>
      </View>
    </AppCard>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <AppText className="flex-1 text-[13px] leading-[18px]">{label}</AppText>
      <AppText variant="label" className="text-[12px] leading-[18px]">{value}</AppText>
    </View>
  );
}
