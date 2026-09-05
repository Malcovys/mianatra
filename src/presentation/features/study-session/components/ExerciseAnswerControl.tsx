import { AppText } from "@/src/presentation/components/shared";
import { colors, fonts } from "@/src/theme";
import { Pressable, TextInput, View } from "react-native";
import { getAnswerControlKind, type SessionAnswerExercise } from "../utils/session-answer-rendering";

type ExerciseAnswerControlProps = {
  exercise: SessionAnswerExercise;
  answer: string;
  onChangeAnswer: (answer: string) => void;
};

export function ExerciseAnswerControl({
  exercise,
  answer,
  onChangeAnswer,
}: ExerciseAnswerControlProps) {
  const kind = getAnswerControlKind(exercise.type);

  if (kind === "short_answer" || kind === "numeric") {
    return (
      <View className="gap-3">
        <AppText variant="label" className="text-[15px] leading-5" style={{ fontFamily: fonts.bold }}>
          Ta réponse
        </AppText>
        <TextInput
          accessibilityLabel="Réponse de l'exercice"
          autoCapitalize="none"
          inputMode={kind === "numeric" ? "decimal" : "text"}
          keyboardType={kind === "numeric" ? "decimal-pad" : "default"}
          onChangeText={onChangeAnswer}
          placeholder={kind === "numeric" ? "Écris un nombre" : "Écris ta réponse"}
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          className="min-h-[54px] rounded-2xl border border-[#E8D9C7] bg-[#FFFDF8] px-4 text-[15px] leading-6 text-[#2F241F]"
          style={{ fontFamily: fonts.medium }}
          value={answer}
        />
      </View>
    );
  }

  if (kind === "unsupported") {
    return (
      <View className="gap-3">
        <AppText variant="label" className="text-[15px] leading-5" style={{ fontFamily: fonts.bold }}>
          {"Ce type d'exercice n'est pas pris en charge."}
        </AppText>
        <AppText tone="secondary" className="text-[14px] leading-5">
          Retourne au cours ou réessaie plus tard.
        </AppText>
      </View>
    );
  }

  const options = kind === "true_false" ? ["Vrai", "Faux"] : exercise.options ?? [];

  return (
    <View accessibilityRole="radiogroup" className="gap-2.5">
      <AppText variant="label" className="text-[15px] leading-5" style={{ fontFamily: fonts.bold }}>
        Choisis une réponse
      </AppText>
      <View className="gap-2">
        {options.map((option) => {
          const selected = option === answer;

          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityLabel={`Réponse ${option}`}
              accessibilityState={{ selected }}
              key={option}
              onPress={() => onChangeAnswer(option)}
              className={[
                "min-h-[48px] flex-row items-center gap-3 rounded-2xl border px-3.5 py-2.5 active:opacity-85",
                selected ? "border-[#D94B24] bg-[#FFF0EA]" : "border-[#E8D9C7] bg-[#FFFDF8]",
              ].join(" ")}
              style={
                selected
                  ? {
                      shadowColor: "#D94B24",
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.12,
                      shadowRadius: 8,
                      elevation: 2,
                    }
                  : undefined
              }
            >
              <View className={["h-5 w-5 items-center justify-center rounded-full border-2", selected ? "border-[#D94B24] bg-[#D94B24]" : "border-[#E8D9C7]"].join(" ")}>
                {selected ? <View className="h-2 w-2 rounded-full bg-white" /> : null}
              </View>
              <AppText className="flex-1 text-[15px] leading-5 text-[#2F241F]" style={{ fontFamily: fonts.semibold }}>
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
