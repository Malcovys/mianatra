import {
  AppButton,
  AppScreen,
} from "@/src/components/shared";
import * as ImagePicker from 'expo-image-picker';
import { useState } from "react";
import { Alert, Image } from "react-native";

// const DATA = [
//   { id: '1', name: 'First Item', chapterCount: 1, coverUri: 'https://legacy.reactjs.org/logo-og.png' },
//   { id: '2', name: 'Second Item', chapterCount: 1, coverUri: 'https://legacy.reactjs.org/logo-og.png' },
//   { id: '3', name: 'Third Item', chapterCount: 1, coverUri: 'https://legacy.reactjs.org/logo-og.png' },
// ];

/** Screen */
export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null)

  const takePhoto = async () => {
    // Camera access always requires the user's permission.
    // Taking a photo also requires a device with a camera. The iOS Simulator
    // does not have one, so use a physical device to test this button.
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the camera is required.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <AppScreen 
      className="pt-3"
      contentClassName="flex-1 p-0"
      scroll={false}
    >
      {/* <FlatList 
        keyExtractor={item => item.id} 
        contentContainerClassName="gap-2 flex-1 px-5"
        data={DATA}
        renderItem={({ item }) => (
          <SchoolSubjectCard
            subject={item}
            onPress={() => {}}
          />
        )}
      /> */}
      {image && <Image source={{ uri: image }} className="h-40 w-40" />}

      <AppButton title="Ajouter" onPress={takePhoto}/>
    </AppScreen>
  );
}