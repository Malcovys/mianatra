import { AppText } from "@/src/components/shared";
import { ImageBackground, Pressable } from "react-native";

export type SchoolSubjectData = {
  id: string;
  name: string;
  chapterCount: number;
  coverUri: string;
};

type SchoolSubjectCardProps = {
  subject: SchoolSubjectData;
  onPress: () => void;
};

export function SchoolSubjectCard({ subject, onPress }: SchoolSubjectCardProps) {
  const chapterLabel = `${subject.chapterCount} chapitre${subject.chapterCount > 1 ? "s" : ""}`;

  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-80 h-32"
    >
      <ImageBackground 
        source={{ uri: subject.coverUri }}
        resizeMode="cover"
        className="flex-1 p-4"
        imageStyle={{ borderRadius: 12 }}
      >
        <AppText variant="title" tone="inverse">{subject.name}</AppText>
        <AppText  tone="inverse">{chapterLabel}</AppText>
      </ImageBackground>
    </Pressable>
  );
}
