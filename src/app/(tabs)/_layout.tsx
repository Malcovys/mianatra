import { colors, fonts } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Tabs } from "expo-router";
import { View, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabIconProps = {
  color: ColorValue;
  name: React.ComponentProps<typeof FontAwesome5>["name"];
};

function TabIcon({ color, name }: TabIconProps) {
  return (
    <View className="h-8 w-14 items-center justify-center">
      <FontAwesome5 name={name} size={20} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 28);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          minHeight: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          paddingHorizontal: 18,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          shadowColor: "#6E442A",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
          elevation: 12,
        },
        tabBarItemStyle: {
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 11,
          lineHeight: 15,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => (
            <TabIcon name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: "Mes cours",
          tabBarIcon: ({ color }) => (
            <TabIcon name="book-open" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
