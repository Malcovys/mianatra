import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AppScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  className?: string;
  contentClassName?: string;
  contentStyle?: StyleProp<ViewStyle>;
};

export function AppScreen({
  children,
  scroll = true,
  padded = true,
  className,
  contentClassName,
  contentStyle,
}: AppScreenProps) {
  const paddedClassName = padded ? (scroll ? "p-5" : "flex-1 p-5") : "";
  const content = (
    <View className={[paddedClassName, contentClassName].filter(Boolean).join(" ")} style={contentStyle}>
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} className={["flex-1 bg-[#FFF7E8]", className].filter(Boolean).join(" ")}>
      {scroll ? (
        <ScrollView
          contentContainerClassName="grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
