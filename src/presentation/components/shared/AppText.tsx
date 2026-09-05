import { Text, type TextProps } from "react-native";
import { fonts, typography } from "@/src/theme";

type AppTextVariant = keyof typeof typography;
type AppTextTone = "primary" | "secondary" | "muted" | "inverse" | "error";

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  tone?: AppTextTone;
  className?: string;
};

const toneClassName: Record<AppTextTone, string> = {
  primary: "text-[#2F241F]",
  secondary: "text-[#6E5D53]",
  muted: "text-[#9B887B]",
  inverse: "text-white",
  error: "text-[#B53434]",
};

const variantClassName: Record<AppTextVariant, string> = {
  title: "text-[28px] leading-[34px] font-extrabold",
  heading: "text-[22px] leading-7 font-bold",
  subtitle: "text-lg leading-6 font-bold",
  body: "text-base leading-6 font-normal",
  caption: "text-[13px] leading-[18px] font-medium",
  label: "text-[15px] leading-5 font-bold",
};

export function AppText({
  variant = "body",
  tone = "primary",
  className,
  style,
  children,
  ...props
}: AppTextProps) {
  const fontFamily = {
    title: fonts.title,
    heading: fonts.heading,
    subtitle: fonts.bold,
    body: fonts.body,
    caption: fonts.medium,
    label: fonts.bold,
  }[variant];

  return (
    <Text
      {...props}
      style={[{ fontFamily }, style]}
      className={["tracking-normal", variantClassName[variant], toneClassName[tone], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Text>
  );
}
