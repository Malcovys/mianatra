import { AppCard, AppText, ProgressBar } from "@/src/presentation/components/shared";
import { colors, fonts } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Pressable, View } from "react-native";

export type SubjectCardData = {
  id: string;
  name: string;
  color?: string | null;
  iconName?: React.ComponentProps<typeof FontAwesome5>["name"] | string | null;
  chapterCount: number;
  progress: number;
  mainWeakness?: string | null;
};

type SubjectCardProps = {
  subject: SubjectCardData;
  onPress: () => void;
};

export function SubjectCard({ subject, onPress }: SubjectCardProps) {
  const chapterLabel = `${subject.chapterCount} chapitre${subject.chapterCount > 1 ? "s" : ""}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir la matière ${subject.name}`}
      onPress={onPress}
      className="active:opacity-80"
    >
      <AppCard
        className="flex-row items-center gap-3 rounded-xl px-3.5 py-3"
        style={{
          shadowColor: "#6E442A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.07,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <View
          accessibilityLabel={`Icône ${subject.name}`}
          className="h-[48px] w-[48px] items-center justify-center rounded-xl"
          style={{
            backgroundColor: subject.color ?? colors.secondary,
            shadowColor: subject.color ?? colors.secondary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <FontAwesome5
            name={subject.iconName ?? "book-open"}
            size={20}
            color={colors.white}
          />
        </View>
        <View className="flex-1 gap-1.5">
          <View className="flex-row items-start gap-3">
            <View className="min-w-0 flex-1">
              <AppText
                variant="label"
                numberOfLines={1}
                className="text-[15px] leading-[19px]"
                style={{ fontFamily: fonts.bold }}
              >
                {subject.name}
              </AppText>
              <AppText tone="secondary" numberOfLines={1} className="text-[12px] leading-[15px]">
                {chapterLabel}
              </AppText>
            </View>
            <AppText variant="label" className="text-[13px] leading-5">
              {subject.progress}%
            </AppText>
          </View>
          <ProgressBar
            value={subject.progress}
            accessibilityLabel={`Progression ${subject.name}`}
            className="h-[7px]"
          />
          <AppText tone="secondary" numberOfLines={1} className="text-[12px] leading-[15px]">
            {subject.mainWeakness ? `À renforcer : ${subject.mainWeakness}` : "Pas encore révisé"}
          </AppText>
        </View>
      </AppCard>
    </Pressable>
  );
}
