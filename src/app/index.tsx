import {
  AppScreen,
} from "@/src/components/shared";
import { SchoolSubjectCard } from "../components/core/SchoolSubjectCard";


/** Screen */
export default function HomeScreen() {

  return (
    <AppScreen contentClassName="gap-4 pb-10 pt-3">
      <SchoolSubjectCard
        subject={{
          id: '1',
          name: 'React Native',
          chapterCount: 10,
          coverUri: 'https://legacy.reactjs.org/logo-og.png'
        }}
        onPress={() => {}}
      />
    </AppScreen>
  );
}