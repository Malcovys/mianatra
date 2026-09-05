import { AppCard, AppText } from "@/src/presentation/components/shared";
import type { CourseResultCounters } from "@/src/presentation/features/courses";
import { colors, fonts } from "@/src/theme";
import { View } from "react-native";

type CourseResultSummaryProps = {
  counters: CourseResultCounters;
};

export function CourseResultSummary({ counters }: CourseResultSummaryProps) {
  return (
    <View className="flex-row gap-2">
      <CounterCard label="Maîtrisé" value={`${counters.mastered} notions`} color={colors.secondary} />
      <CounterCard label="En progression" value={`${counters.progressing} notions`} color={colors.accent} />
      <CounterCard label="À renforcer" value={`${counters.needsWork} notions`} color={colors.primary} />
      {counters.notStarted > 0 ? <CounterCard label="À découvrir" value={`${counters.notStarted} notions`} color={colors.textMuted} /> : null}
    </View>
  );
}

function CounterCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <AppCard
      className="min-h-[88px] flex-1 justify-center gap-1.5 rounded-2xl px-3 py-3"
      style={{ borderColor: color, backgroundColor: "#FFFDF8" }}
    >
      <View className="h-2 w-8 rounded-full" style={{ backgroundColor: color }} />
      <AppText numberOfLines={2} className="text-[12px] leading-4" style={{ color, fontFamily: fonts.bold }}>
        {label}
      </AppText>
      <AppText numberOfLines={1} className="text-[13px] leading-5 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
        {value}
      </AppText>
    </AppCard>
  );
}
