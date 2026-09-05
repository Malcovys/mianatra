import { Button, ButtonText } from "@/src/presentation/components/ui/button";
import { colors, fonts } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { ActivityIndicator } from "react-native";

type AppButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonIconName = React.ComponentProps<typeof FontAwesome5>["name"];

type AppButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "action" | "children" | "size" | "variant"
> & {
  title: string;
  variant?: AppButtonVariant;
  loading?: boolean;
  iconName?: ButtonIconName;
  iconPosition?: "left" | "right";
};

export function AppButton({
  title,
  variant = "primary",
  loading = false,
  disabled = false,
  iconName,
  iconPosition = "left",
  style,
  className,
  accessibilityLabel,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const textClassName = variant === "primary" ? "text-white" : "text-[#2F241F]";
  const iconColor = variant === "primary" ? colors.white : colors.textPrimary;
  const rootClassName = [
    "min-h-[54px] min-w-11 flex-row items-center justify-center gap-2 rounded-full border px-6 py-3 active:opacity-80 disabled:opacity-50",
    variant === "primary" ? "border-[#D94B24] bg-[#D94B24]" : "",
    variant === "secondary" ? "border-[#E8D9C7] bg-[#FFF7E8]" : "",
    variant === "tertiary" ? "border-[#F2B84B] bg-[#FFF3D2]" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const icon = iconName ? (
    <FontAwesome5 name={iconName} size={16} color={iconColor} />
  ) : null;

  return (
    <Button
      {...props}
      action={variant === "primary" ? "primary" : "secondary"}
      variant={variant === "primary" || variant === "tertiary" ? "solid" : "outline"}
      size="xl"
      className={rootClassName}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={style}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.white : colors.primary} />
      ) : (
        <>
          {iconPosition === "left" ? icon : null}
          <ButtonText
            className={["text-base font-bold leading-5 tracking-normal", textClassName].join(" ")}
            style={{ fontFamily: fonts.bold }}
          >
            {title}
          </ButtonText>
          {iconPosition === "right" ? icon : null}
        </>
      )}
    </Button>
  );
}
