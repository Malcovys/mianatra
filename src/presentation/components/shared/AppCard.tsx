import { View, type ViewProps } from "react-native";

type AppCardProps = ViewProps & {
  children: React.ReactNode;
  className?: string;
};

export function AppCard({ children, className, ...props }: AppCardProps) {
  return (
    <View
      {...props}
      className={["rounded-[20px] border border-[#E8D9C7] bg-[#FFFDF8] p-5", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </View>
  );
}
