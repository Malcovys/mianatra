import { AppCard, AppText } from "@/src/presentation/components/shared";
import type { CourseRecentActivity } from "@/src/presentation/features/courses";
import { colors, fonts } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { View } from "react-native";

type RecentActivityListProps = {
  activities: CourseRecentActivity[];
};

export function RecentActivityList({ activities }: RecentActivityListProps) {
  return (
    <AppCard
      className="gap-3 rounded-2xl bg-[#FFFDF8] px-4 py-4"
      style={{
        shadowColor: "#6E442A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <AppText className="text-[17px] leading-6 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
        Dernières activités
      </AppText>
      {activities.length === 0 ? (
        <AppText tone="secondary" className="text-[14px] leading-5">
          Aucune activité pour le moment.
        </AppText>
      ) : null}
      {activities.map((activity, index) => (
        <View
          key={activity.id}
          className={[
            "min-h-12 flex-row items-center gap-3 py-1",
            index < activities.length - 1 ? "border-b border-[#E8D9C7]" : "",
          ].join(" ")}
        >
          <View className="h-8 w-8 items-center justify-center rounded-full bg-[#FAF1E2]">
            <FontAwesome5 name={activity.iconName} size={14} color={colors.textSecondary} />
          </View>
          <AppText numberOfLines={2} className="flex-1 text-[14px] leading-5 text-[#6F6259]">
            {activity.title}
          </AppText>
          <AppText className="text-[14px] leading-5 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
            {activity.score}%
          </AppText>
        </View>
      ))}
    </AppCard>
  );
}
