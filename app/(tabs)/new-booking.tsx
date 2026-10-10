import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  Chip,
  IconButton,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MOCK_MASTERS } from '../../services/mockData';
import { Colors } from '../../constants/colors';

// Каталог послуг салону "Svoya Nail Studio"
const AVAILABLE_SERVICES = [
  { id: 's-1', name: 'Комплексний манікюр + покриття', price: 700, duration: '1 год 30 хв' },
  { id: 's-2', name: 'Нарощування нігтів (гелеве)', price: 1100, duration: '2 год 00 хв' },
  { id: 's-3', name: 'Апаратний педикюр', price: 850, duration: '1 год 30 хв' },
  { id: 's-4', name: 'Зняття + гігієнічний манікюр', price: 450, duration: '1 год 00 хв' },
  { id: 's-5', name: 'Дизайн нігтів (складний розпис)', price: 250, duration: '30 хв' },
];

const TIME_SLOTS = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00'];
const SOURCES = ['Instagram', 'По телефону', 'Viber', 'TikTok', 'На місці'];

/**
 * Екран 5: Оформлення нового запису (NewBookingScreen)
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export default function NewBookingScreen() {
  const router = useRouter();

  // Стан форми
  const [selectedDate, setSelectedDate] = useState('2026-10-10');
  const [selectedSlot, setSelectedSlot] = useState('11:30');
  const [selectedMasterId, setSelectedMasterId] = useState(MOCK_MASTERS[1].id);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(['s-1']);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedSource, setSelectedSource] = useState('Instagram');
  const [notes, setNotes] = useState('');

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Підрахунок суми вибраних послуг
  const selectedServices = AVAILABLE_SERVICES.filter((s) => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const toggleService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      if (selectedServiceIds.length > 1) {
        setSelectedServiceIds(selectedServiceIds.filter((item) => item !== id));
      }
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
    }
  };

  const handleSaveBooking = () => {
    if (!clientName.trim()) {
      Alert.alert('Помилка', "Введіть ім'я клієнта");
      return;
    }
    if (!clientPhone.trim()) {
      Alert.alert('Помилка', 'Введіть контактний номер телефону');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSnackbarVisible(true);
      // Очищення форми або повернення в календар
      setTimeout(() => {
        router.push('/(tabs)/calendar');
      }, 1200);
    }, 600);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>Новий запис</Text>
          <Text style={styles.subtitle}>Оформлення бронювання послуги салону</Text>
        </View>

        {/* 1. Блок «Майстер» */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>1. Оберіть майстра</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {MOCK_MASTERS.map((m) => {
              const isSelected = selectedMasterId === m.id;
              return (
                <Chip
                  key={m.id}
                  selected={isSelected}
                  onPress={() => setSelectedMasterId(m.id)}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  textStyle={[styles.chipText, isSelected && styles.chipTextActive]}
                >
                  {m.name}
                </Chip>
              );
            })}
          </ScrollView>
        </Surface>

        {/* 2. Блок «Дата та слот часу» */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>2. Дата та час (10 жовтня 2026)</Text>
          <Text style={styles.sectionHint}>Доступні слоти майстра:</Text>
          <View style={styles.slotsWrap}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotButton, isSelected && styles.slotButtonActive]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <MaterialCommunityIcons
                    name="clock-time-four-outline"
                    size={13}
                    color={isSelected ? '#000000' : '#8E8E93'}
                  />
                  <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Surface>

        {/* 3. Блок «Послуги» */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>3. Послуги з прайс-листа</Text>
          {AVAILABLE_SERVICES.map((serv) => {
            const isSelected = selectedServiceIds.includes(serv.id);
            return (
              <TouchableOpacity
                key={serv.id}
                style={[styles.serviceItem, isSelected && styles.serviceItemActive]}
                onPress={() => toggleService(serv.id)}
              >
                <View style={styles.serviceLeft}>
                  <MaterialCommunityIcons
                    name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={20}
                    color={isSelected ? '#C68A2C' : '#636366'}
                  />
                  <View>
                    <Text style={styles.serviceNameText}>{serv.name}</Text>
                    <Text style={styles.serviceDurationText}>{serv.duration}</Text>
                  </View>
                </View>
                <Text style={styles.servicePriceText}>{serv.price} ₴</Text>
              </TouchableOpacity>
            );
          })}
        </Surface>

        {/* 4. Блок «Клієнт» */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>4. Дані клієнта</Text>
          <TextInput
            label="Ім'я та прізвище"
            value={clientName}
            onChangeText={setClientName}
            mode="outlined"
            style={styles.input}
            textColor="#FFFFFF"
            placeholder="Олена Мельник"
          />
          <TextInput
            label="Номер телефону"
            value={clientPhone}
            onChangeText={setClientPhone}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            textColor="#FFFFFF"
            placeholder="+38067..."
          />
        </Surface>

        {/* 5. Джерело запису та примітки */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>5. Джерело та примітки</Text>
          <Text style={styles.sectionHint}>Звідки клієнт:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {SOURCES.map((source) => {
              const isSelected = selectedSource === source;
              return (
                <Chip
                  key={source}
                  selected={isSelected}
                  onPress={() => setSelectedSource(source)}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  textStyle={[styles.chipText, isSelected && styles.chipTextActive]}
                >
                  {source}
                </Chip>
              );
            })}
          </ScrollView>

          <TextInput
            label="Внутрішній коментар / примітки"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            style={[styles.input, { marginTop: 12 }]}
            textColor="#FFFFFF"
            placeholder="Любить каву з молоком, алергія на ацетон..."
          />
        </Surface>
      </ScrollView>

      {/* 6. Нижня панель підсумку */}
      <Surface style={styles.bottomBar} elevation={4}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomLabel}>Загальна сума:</Text>
          <Text style={styles.bottomPrice}>{totalPrice} ₴</Text>
          <Text style={styles.bottomTime}>Час: {selectedSlot} (10 жовт)</Text>
        </View>

        <Button
          mode="contained"
          onPress={handleSaveBooking}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
          buttonColor="#FFFFFF"
          textColor="#000000"
          contentStyle={{ paddingVertical: 6 }}
        >
          Зберегти запис
        </Button>
      </Surface>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1500}
        style={{ backgroundColor: '#133E1D' }}
      >
        <Text style={{ color: '#34D399', fontWeight: 'bold' }}>
          ✓ Запис успішно створено та додано в розклад!
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
  scrollContent: {
    paddingTop: 45,
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242426',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#1C1C1E',
  },
  chipActive: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#C68A2C',
  },
  chipText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  slotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  slotButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  slotText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  slotTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  serviceItemActive: {
    backgroundColor: 'rgba(198, 138, 44, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  serviceNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  serviceDurationText: {
    color: '#8E8E93',
    fontSize: 11,
  },
  servicePriceText: {
    color: '#C68A2C',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#161616',
    marginBottom: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#161616',
    borderTopWidth: 1,
    borderTopColor: '#242426',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bottomInfo: {
    flex: 1,
  },
  bottomLabel: {
    color: '#8E8E93',
    fontSize: 11,
  },
  bottomPrice: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  bottomTime: {
    color: '#34D399',
    fontSize: 11,
  },
  saveButton: {
    borderRadius: 10,
  },
});
