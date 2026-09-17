import { SubjectCard } from "@/src/components/core";
import {
  AppButton,
  AppScreen,
} from "@/src/components/shared";
import { colors } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

type Subject = {
  id: string;
  name: string;
  chapterCount: number;
}


/** Screen */
export default function HomeScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  return (
    <AppScreen contentClassName="gap-4 pb-10 pt-3">
      <View className="items-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Parameters"
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-80"
        >
          <FontAwesome5 name="cog" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View className="gap-3">
        {subjects.map((subject) => (
            <SubjectCard key={subject.id}
              subject={{
                id: subject.id,
                name: subject.name,
                chapterCount: subject.chapterCount
              }}
              onPress={() => router.push({ pathname: "/subject/[subjectId]", params: { subject.id } }) }
            />
          ))
        }
      </View>

      <AppButton
        title="Ajouter un cours"
        iconName="plus"
        onPress={() => router.push("/course/add")}
        className="min-h-[54px]"
      />
    </AppScreen>
  );
}