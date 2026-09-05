import { AppText } from "@/src/presentation/components/shared";
import { colors, fonts } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Pressable } from "react-native";

type AddPageButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function AddPageButton({ onPress, disabled = false }: AddPageButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Choisir des images depuis la galerie"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={["min-h-[62px] flex-row items-center justify-center gap-3 rounded-2xl border border-dashed border-[#D94B24] bg-[#FFF3EA] active:opacity-75", disabled ? "opacity-50" : ""].join(" ")}
    >
      <FontAwesome5 name="plus" size={18} color={colors.primary} />
      <AppText variant="label" className="text-[15px] leading-5 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
        Choisir des images
      </AppText>
    </Pressable>
  );
}
