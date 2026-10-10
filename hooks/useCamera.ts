import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

/**
 * Сенсор 1: Камера (expo-image-picker)
 * Фотофіксація результату роботи майстра при завершенні візиту
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export function useCamera() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Відкриття системної камери пристрою
  const takePhoto = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Доступ до камери',
          'Будь ласка, надайте додатку дозвіл на використання камери для фотофіксації послуги.'
        );
        setIsLoading(false);
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      setIsLoading(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        return uri;
      }
      return null;
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Помилка камери', 'Не вдалося зробити знімок.');
      return null;
    }
  };

  // Вибір фото з галереї (альтернатива для симулятора / тесту)
  const pickPhotoFromGallery = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      setIsLoading(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        return uri;
      }
      return null;
    } catch {
      setIsLoading(false);
      return null;
    }
  };

  const clearPhoto = () => setPhotoUri(null);

  return {
    photoUri,
    setPhotoUri,
    takePhoto,
    pickPhotoFromGallery,
    clearPhoto,
    isLoading,
  };
}
