import { AppCard, AppText } from "@/src/presentation/components/shared";
import { Image, type ImageSourcePropType } from "react-native";
type RevisionSectionData = {
  title: string;
  text?: string;
  image?: "function-graph";
  formula?: string;
  formulaDetail?: string;
};

const revisionImages: Record<"function-graph", ImageSourcePropType> = {
  "function-graph": require("../../../../assets/mianatra/image_function_graph_exercise.png"),
};

type RevisionSectionProps = {
  section: RevisionSectionData;
};

export function RevisionSection({ section }: RevisionSectionProps) {
  return (
    <AppCard className="gap-3">
      <AppText variant="subtitle">{section.title}</AppText>
      {section.text ? <AppText tone="secondary">{section.text}</AppText> : null}
      {section.image ? (
        <Image
          source={revisionImages[section.image]}
          accessibilityLabel={`Illustration : ${section.title}`}
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          className="h-[190px] w-full rounded-2xl bg-[#FFFDF8]"
        />
      ) : null}
      {section.formula ? (
        <AppText variant="heading" className="italic">
          {section.formula}
        </AppText>
      ) : null}
      {section.formulaDetail ? (
        <AppText tone="secondary">{section.formulaDetail}</AppText>
      ) : null}
    </AppCard>
  );
}
