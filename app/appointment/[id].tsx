import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  IconButton,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCamera } from '../../hooks/useCamera';
import { MOCK_APPOINTMENTS } from '../../services/mockData';

/**
 * Екран 6: Картка деталей візиту та фотофіксація (AppointmentDetailScreen)
 * Сенсор 1: Камера (expo-image-picker)
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Пошук запису (або перший тестовий запис)
  const appointment = MOCK_APPOINTMENTS.find((a) => a.id === id) || MOCK_APPOINTMENTS[0];

  // Хук сенсора камери
  const { photoUri, takePhoto, pickPhotoFromGallery, clearPhoto, isLoading } = useCamera();

  const [status, setStatus] = useState<string>('IN_PROGRESS');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleCompleteVisit = () => {
    if (!photoUri) {
      Alert.alert(
        'Увага: Фотофіксація',
        'Рекомендується зробити фотографію виконаної роботи перед завершенням візиту.',
        [
          { text: 'Зробити фото', onPress: () => takePhoto() },
          {
            text: 'Завершити без фото',
            style: 'destructive',
            onPress: () => {
              setStatus('COMPLETED');
              setSnackbarVisible(true);
            },
          },
        ]
      );
      return;
    }

    setStatus('COMPLETED');
    setSnackbarVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* 1. Верхня панель */}
      <View style={styles.topBar}>
        <IconButton
          icon="arrow-left"
          iconColor="#FFFFFF"
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Деталі візиту #{appointment.id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 2. Картка клієнта та послуги */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.statusRow}>
            <Text style={styles.timeTitle}>
              {appointment.startTime} - {appointment.endTime}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: status === 'COMPLETED' ? '#133E1D' : '#452B07' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: status === 'COMPLETED' ? '#34D399' : '#FBBF24' },
                ]}
              >
                {status === 'COMPLETED' ? 'Завершено' : 'В процесі'}
              </Text>
            </View>
          </View>

          <Text style={styles.serviceName}>{appointment.serviceName}</Text>
          <Text style={styles.priceTag}>{appointment.price} ₴</Text>

          <View style={styles.divider} />

          <View style={styles.infoLine}>
            <MaterialCommunityIcons name="account" size={18} color="#C68A2C" />
            <Text style={styles.infoLabel}>Клієнт:</Text>
            <Text style={styles.infoValue}>{appointment.clientName}</Text>
          </View>

          <View style={styles.infoLine}>
            <MaterialCommunityIcons name="phone" size={18} color="#C68A2C" />
            <Text style={styles.infoLabel}>Телефон:</Text>
            <Text style={styles.infoValue}>{appointment.clientPhone}</Text>
          </View>

          <View style={styles.infoLine}>
            <MaterialCommunityIcons name="calendar" size={18} color="#C68A2C" />
            <Text style={styles.infoLabel}>Дата:</Text>
            <Text style={styles.infoValue}>{appointment.date} (10 жовтня)</Text>
          </View>
        </Surface>

        {/* 3. БЛОК СЕНСОРА КАМЕРИ (Фотофіксація результату) */}
        <Surface style={styles.cameraCard} elevation={1}>
          <View style={styles.cameraHeader}>
            <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.cameraTitle}>Сенсор: Фотофіксація результату</Text>
          </View>
          <Text style={styles.cameraDesc}>
            Майстер фіксує виконану роботу (манікюр/педикюр) перед закриттям візиту для захисту бізнесу.
          </Text>

          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.deletePhotoBtn} onPress={clearPhoto}>
                <MaterialCommunityIcons name="close-circle" size={26} color="#FF453A" />
              </TouchableOpacity>
              <Text style={styles.photoSuccessText}>✓ Фото успішно зафіксовано до візиту</Text>
            </View>
          ) : (
            <View style={styles.cameraButtonsRow}>
              <Button
                mode="contained"
                icon="camera"
                onPress={takePhoto}
                loading={isLoading}
                style={styles.camBtn}
                buttonColor="#C68A2C"
                textColor="#FFFFFF"
              >
                Зробити фото
              </Button>
              <Button
                mode="outlined"
                icon="image"
                onPress={pickPhotoFromGallery}
                style={styles.galleryBtn}
                textColor="#FFFFFF"
              >
                Галерея
              </Button>
            </View>
          )}
        </Surface>

        {/* 4. Кнопки дій */}
        <View style={styles.actionsBox}>
          <Button
            mode="contained"
            icon="check-circle"
            onPress={handleCompleteVisit}
            style={styles.completeBtn}
            buttonColor={status === 'COMPLETED' ? '#2C2C2E' : '#30D158'}
            textColor="#FFFFFF"
            disabled={status === 'COMPLETED'}
          >
            {status === 'COMPLETED' ? 'Візит успішно завершено' : 'Завершити візит'}
          </Button>

          <View style={styles.subActionsRow}>
            <Button mode="text" textColor="#8E8E93" style={{ flex: 1 }}>
              Перенести
            </Button>
            <Button mode="text" textColor="#FF453A" style={{ flex: 1 }}>
              Скасувати
            </Button>
          </View>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={{ backgroundColor: '#133E1D' }}
      >
        <Text style={{ color: '#34D399', fontWeight: 'bold' }}>
          ✓ Візит #{appointment.id} завершено, фото прикріплено до замовлення!
        </Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 45,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#242426',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  serviceName: {
    color: '#E5E5EA',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  priceTag: {
    color: '#C68A2C',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginVertical: 12,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoLabel: {
    color: '#8E8E93',
    fontSize: 13,
    width: 65,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  cameraCard: {
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cameraTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cameraDesc: {
    color: '#8E8E93',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  cameraButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  camBtn: {
    flex: 1,
    borderRadius: 10,
  },
  galleryBtn: {
    flex: 1,
    borderRadius: 10,
    borderColor: '#3A3A3C',
  },
  photoContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#000000',
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 13,
  },
  photoSuccessText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  actionsBox: {
    marginTop: 8,
  },
  completeBtn: {
    borderRadius: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  subActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
