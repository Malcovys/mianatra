import "@/global.css";
import { MigrationGate } from "@/src/presentation/app/MigrationGate";
import { GluestackUIProvider } from '@/src/presentation/components/ui/gluestack-ui-provider';
import { Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";


export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GluestackUIProvider>
        <MigrationGate>
          <Stack screenOptions={{ headerShown: false }} />
        </MigrationGate>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}
