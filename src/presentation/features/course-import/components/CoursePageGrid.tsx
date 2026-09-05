import { View } from "react-native";
import { CoursePageItem, type DisplayCoursePage } from "./CoursePageItem";

type CoursePageGridProps = {
  pages: DisplayCoursePage[];
  onRemove: (id: string) => void;
  onMoveLeft: (id: string) => void;
  onMoveRight: (id: string) => void;
};

export function CoursePageGrid({
  pages,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: CoursePageGridProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {pages.map((page, index) => (
        <View key={page.id} className="w-[46%]">
          <CoursePageItem
            page={page}
            index={index}
            canMoveLeft={index > 0}
            canMoveRight={index < pages.length - 1}
            onRemove={onRemove}
            onMoveLeft={onMoveLeft}
            onMoveRight={onMoveRight}
          />
        </View>
      ))}
    </View>
  );
}
