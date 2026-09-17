import { CourseCard } from "@/src/components/core";
import { AppButton, AppScreen, AppText, ScreenHeader } from "@/src/components/shared";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

// function lastReviewedLabel(value: string | null) {
//   return value ? "récente" : "jamais";
// }

type SubjectDetail = {
  id: string;
  name: string;
  chapterCount: number;
  masteredSujectCount: number;
  cours: {
    id: string;
    title: string;
    pageCount: number;
  }[]
}

export default function SubjectDetailScreen() {
  // retrive subject id by url
  // const { subjectId } = useLocalSearchParams<{ subjectId?: string }>();
  // const resolvedSubjectId = Array.isArray(subjectId) ? subjectId[0] : subjectId;

  const [subject, setSubject] = useState<SubjectDetail | null>(null);

  if(subject == null) return null;

  return (
    <AppScreen contentClassName="gap-5 pb-10">
      <ScreenHeader title={subject.name} subtitle={`${subject.chapterCount} chapitre${subject.chapterCount > 1 ? "s" : ""}`} />

      {/* <AppCard className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <AppText variant="subtitle">Progression de la matière</AppText>
          <AppText variant="label">{subject.progress}%</AppText>
        </View>
        <ProgressBar value={subject.progress} accessibilityLabel={`Progression ${subject.name}`} />
        <AppText tone="secondary">
          {subject.mainWeakness ? `À renforcer : ${subject.mainWeakness}` : "Pas encore révisé"}
        </AppText>
      </AppCard> */}

      <View className="gap-3">
        <AppText variant="heading">Chapitres</AppText>
        {subject.cours.map((chapter) => (
            <CourseCard key={chapter.id}
              course={{
                id: chapter.id,
                title: chapter.title,
                subject: subject.name,
                pageCount: chapter.pageCount,
              }}
              onPress={() => router.push({ pathname: "/course/[courseId]", params: { courseId: chapter.id } }) }
            />
          )
        )}
      </View>

      <AppButton
        title="Ajouter un cours"
        iconName="plus"
        onPress={() =>
          router.push({
            pathname: "/course/add",
            params: { subjectId: subject.id },
          })
        }
      />
    </AppScreen>
  );
}
