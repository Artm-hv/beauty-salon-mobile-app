import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Text, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MOCK_MASTERS, Master, ClientItem, AppointmentItem } from '../../services/mockData';
import { apiClient } from '../../services/api';

// Каталог послуг салону "Svoya Nail Studio"
const AVAILABLE_SERVICES = [
  { id: 's-1', name: 'Комплексний манікюр + покриття', price: 700, duration: '1 год 30 хв' },
  { id: 's-2', name: 'Нарощування нігтів (гелеве)', price: 1100, duration: '2 год 00 хв' },
  { id: 's-3', name: 'Апаратний педикюр', price: 850, duration: '1 год 30 хв' },
  { id: 's-4', name: 'Зняття + гігієнічний манікюр', price: 450, duration: '1 год 00 хв' },
  { id: 's-5', name: 'Дизайн нігтів (складний розпис)', price: 250, duration: '30 хв' },
];

const ORDER_SOURCES = ['По телефону', 'Instagram', 'Онлайн-запис', 'Viber', 'На місці'];

// Динамічне визначення поточної дати за системним календарем (сьогоднішній день)
const getTodayIsoDate = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (dateStr: string): string => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const ukrDays = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const ukrMonthsFull = [
      'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
      'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
    ];
    const dayOfWeek = ukrDays[dateObj.getDay()];
    const dayNum = dateObj.getDate();
    const month = ukrMonthsFull[dateObj.getMonth()];
    return `${dayOfWeek}, ${dayNum} ${month} ${y} р.`;
  } catch {
    return dateStr;
  }
};

// Доступні робочі години салону для запису
const AVAILABLE_TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

const UKR_MONTHS_NAMES = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

const WEEKDAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

/**
 * Екран: Нове бронювання
 * Зона відповідальності: Розробник 2 (Артем Гіжовський)
 * Підключено збереження до REST API (POST /api/bookings, POST /api/clients)
 */
export default function NewBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId?: string }>();

  // Стан вибору майстра (за замовчуванням: null / "Не обрано")
  const [mastersList, setMastersList] = useState<Master[]>(MOCK_MASTERS);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);

  // Стан розкладу та бронювання часу (дата динамічно встановлюється на сьогоднішній день)
  const [appointmentsList, setAppointmentsList] = useState<AppointmentItem[]>([]);
  const [bookingDate, setBookingDate] = useState(getTodayIsoDate());
  const [bookingTime, setBookingTime] = useState('12:00');

  // Календар у модальному вікні та пошук клієнта
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // Стан форми
  const [selectedServices, setSelectedServices] = useState<typeof AVAILABLE_SERVICES>([]);
  const [clientsList, setClientsList] = useState<ClientItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [comment, setComment] = useState('');
  const [orderSource, setOrderSource] = useState('По телефону');

  // Модальні вікна
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  // Новий клієнт
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Функція завантаження майстрів, клієнтів та розкладу з REST API (GET)
  const loadData = useCallback(async () => {
    try {
      const [masters, clients, appointments] = await Promise.all([
        apiClient.getMasters(),
        apiClient.getClients(),
        apiClient.getAppointments(),
      ]);
      if (masters && masters.length > 0) setMastersList(masters);
      setClientsList(clients);
      if (appointments) setAppointmentsList(appointments);

      // Якщо передано clientId (наприклад, з екрану Клієнти), обираємо його автоматично
      if (params.clientId) {
        const found = clients.find((c) => c.id === params.clientId);
        if (found) {
          setSelectedClient(found);
        }
      }
    } catch {}
  }, [params.clientId]);

  // Перевірка зайнятості часового слоту у розкладі обраного майстра
  const getSlotConflict = (
    slotTime: string,
    masterId: string,
    date: string
  ): AppointmentItem | undefined => {
    return appointmentsList.find((app) => {
      if (app.masterId !== masterId) return false;
      if (app.date !== date) return false;

      const [appStartH, appStartM] = (app.startTime || '00:00').split(':').map(Number);
      const [appEndH, appEndM] = (app.endTime || app.startTime || '00:00').split(':').map(Number);
      const [slotH, slotM] = slotTime.split(':').map(Number);

      const appStartMinutes = appStartH * 60 + (appStartM || 0);
      const appEndMinutes = appEndH * 60 + (appEndM || 0);
      const slotMinutes = slotH * 60 + (slotM || 0);

      return slotMinutes >= appStartMinutes && slotMinutes < appEndMinutes;
    });
  };

  const currentSlotConflict = selectedMaster
    ? getSlotConflict(bookingTime, selectedMaster.id, bookingDate)
    : undefined;

  const handleOpenTimeModal = () => {
    try {
      const [y, m] = bookingDate.split('-').map(Number);
      if (y && m) {
        setCalendarYear(y);
        setCalendarMonth(m - 1);
      }
    } catch {}
    setIsTimeModalOpen(true);
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayWeekday = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;

  const filteredClientsForModal = useMemo(() => {
    if (!clientSearchQuery.trim()) return clientsList;
    const q = clientSearchQuery.trim().toLowerCase();
    return clientsList.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(q);
      const phoneMatch = c.phone?.toLowerCase().includes(q);
      const codeMatch = c.cnCode?.toLowerCase().includes(q);
      const tagMatch = c.tags?.some((t) => t.toLowerCase().includes(q));
      return nameMatch || phoneMatch || codeMatch || tagMatch;
    });
  }, [clientsList, clientSearchQuery]);

  // Оновлюємо дані при кожному відкритті екрана "Нове бронювання"
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Підрахунок суми
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const formatMoney = (val: number) => {
    const parts = val.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${integerPart},${parts[1]} ₴`;
  };

  const handleToggleService = (service: (typeof AVAILABLE_SERVICES)[0]) => {
    if (selectedServices.some((s) => s.id === service.id)) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleCreateNewClient = async () => {
    if (!newClientName.trim()) {
      Alert.alert('Помилка', "Введіть ім'я клієнта");
      return;
    }

    try {
      const created = await apiClient.createClient({
        name: newClientName.trim(),
        phone: newClientPhone.trim() || '+380 67 000 0000',
        category: 'NEW',
        tags: ['Новий клієнт'],
      });

      setClientsList((prev) => [created, ...prev]);
      setSelectedClient(created);
      setIsCreateClientOpen(false);
      setNewClientName('');
      setNewClientPhone('');
    } catch {
      Alert.alert('Помилка', 'Не вдалося зберегти клієнта');
    }
  };

  // Збереження бронювання через REST API (POST /api/bookings)
  const handleSave = async () => {
    if (!selectedMaster) {
      Alert.alert('Оберіть майстра', 'Будь ласка, оберіть майстра перед збереженням запису');
      return;
    }

    const conflict = getSlotConflict(bookingTime, selectedMaster.id, bookingDate);
    if (conflict) {
      Alert.alert(
        'Час вже зайнятий!',
        `У майстра ${selectedMaster.name} о ${bookingTime} вже призначено запис:\n"${conflict.serviceName}" (${conflict.clientName}).\n\nБудь ласка, оберіть іншу вільну годину.`
      );
      return;
    }

    setIsSaving(true);
    try {
      const serviceTitle =
        selectedServices.length > 0
          ? selectedServices.map((s) => s.name).join(', ')
          : 'Комплексний манікюр + покриття';
      const price = totalPrice > 0 ? totalPrice : 700;

      // Обчислення кінцевого часу (додаємо 1.5 години)
      const [h, m] = bookingTime.split(':').map(Number);
      const endH = Math.min(21, h + 1);
      const endM = (m + 30) % 60;
      const formattedEndTime = `${String(endH + (m + 30 >= 60 ? 1 : 0)).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      await apiClient.createBooking({
        masterId: selectedMaster.id,
        clientName: selectedClient ? selectedClient.name : 'Анонімний клієнт',
        clientPhone: selectedClient ? selectedClient.phone : '+380 67 000 0000',
        serviceName: serviceTitle,
        date: bookingDate,
        startTime: bookingTime,
        endTime: formattedEndTime,
        price: price,
        notes: comment,
        colorType: 'green',
      });

      setSnackbarVisible(true);
      setTimeout(() => {
        router.push('/(tabs)/calendar');
      }, 1000);
    } catch {
      Alert.alert('Помилка', 'Не вдалося зберегти запис');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Заголовок "Нове бронювання" */}
        <Text style={styles.pageTitle}>Нове бронювання</Text>

        {/* 3. Картка дати та часу */}
        <View style={styles.dateTimeCardWrapper}>
          <View style={styles.floatingBadge}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#FFFFFF" />
          </View>

          <TouchableOpacity
            style={styles.dateTimeContent}
            activeOpacity={0.8}
            onPress={handleOpenTimeModal}
          >
            <View style={styles.dateTimeRow}>
              <Text style={styles.dateTimeText}>
                {formatDisplayDate(bookingDate)} • {bookingTime}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 3.1. Картка "Майстер" - Відкидний список */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Майстер</Text>
          <TouchableOpacity
            style={styles.dropdownSelectorBox}
            activeOpacity={0.75}
            onPress={() => setIsMasterModalOpen(true)}
          >
            <View style={styles.dropdownSelectorLeft}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownSelectorMainText}>
                  {selectedMaster ? selectedMaster.name : 'Не обрано'}
                </Text>
                <Text style={styles.dropdownSelectorSubText}>
                  {selectedMaster ? selectedMaster.specialty : 'Натисніть, щоб обрати майстра'}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="menu-down" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* 4. Картка "Послуги" */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Послуги</Text>

          {/* Вибрані послуги, якщо є */}
          {selectedServices.map((service) => (
            <View key={service.id} style={styles.selectedServiceItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedServiceName}>{service.name}</Text>
                <Text style={styles.selectedServiceMeta}>
                  {service.duration} • {service.price} ₴
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleToggleService(service)}
                style={styles.removeServiceBtn}
              >
                <MaterialCommunityIcons name="close" size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Пунктирна кнопка "+ Додати послугу" */}
          <TouchableOpacity
            style={styles.dashedAddBox}
            activeOpacity={0.7}
            onPress={() => setIsServiceModalOpen(true)}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.dashedAddText}>Додати послугу</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Картка "Клієнт" */}
        <View style={styles.card}>
          <View style={styles.clientHeaderRow}>
            <Text style={styles.cardTitle}>Клієнт</Text>
          </View>

          <TouchableOpacity
            style={styles.clientSelectorBox}
            activeOpacity={0.75}
            onPress={() => {
              loadData();
              setIsClientModalOpen(true);
            }}
          >
            <View style={styles.clientSelectorLeft}>
              <View style={styles.incognitoCircle}>
                <MaterialCommunityIcons
                  name={selectedClient ? 'account' : 'incognito'}
                  size={18}
                  color="#8E8E93"
                />
              </View>
              <Text style={styles.clientSelectorText}>
                {selectedClient
                  ? `${selectedClient.name} (${selectedClient.cnCode || 'Клієнт'})`
                  : 'Не обрано (Анонімний)'}
              </Text>
            </View>
            <MaterialCommunityIcons name="menu-down" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* 7. Картка "Підсумок" */}
        <View style={styles.card}>
          <Text style={styles.summaryTitle}>Підсумок</Text>

          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryLabel}>Проміжний підсумок</Text>
            <Text style={styles.summaryLabel}>Усього за бронювання</Text>
          </View>

          <Text style={styles.summaryAmount}>{formatMoney(totalPrice)}</Text>
        </View>

        {/* 8. Секція "Коментар" та "Джерело замовлення" */}
        <View style={styles.card}>
          {/* Коментар */}
          <TextInput
            placeholder="Коментар"
            placeholderTextColor="#636366"
            value={comment}
            onChangeText={setComment}
            style={styles.commentInput}
            multiline
            numberOfLines={3}
          />

          <View style={styles.cardDivider} />

          {/* Джерело замовлення */}
          <TouchableOpacity
            style={styles.sourceBox}
            activeOpacity={0.75}
            onPress={() => setIsSourceModalOpen(true)}
          >
            <View>
              <Text style={styles.sourceLabel}>Джерело замовлення</Text>
              <Text style={styles.sourceValue}>{orderSource}</Text>
            </View>
            <MaterialCommunityIcons name="menu-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 9. Фіксована нижня панель: "Зберегти" */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Зберегти</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Модальне вікно вибору послуг */}
      <Modal visible={isServiceModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Оберіть послугу</Text>
              <TouchableOpacity onPress={() => setIsServiceModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {AVAILABLE_SERVICES.map((s) => {
                const isChecked = selectedServices.some((item) => item.id === s.id);
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.serviceModalItem}
                    onPress={() => handleToggleService(s)}
                  >
                    <MaterialCommunityIcons
                      name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={isChecked ? '#4CAF50' : '#8E8E93'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceModalName}>{s.name}</Text>
                      <Text style={styles.serviceModalMeta}>{s.duration}</Text>
                    </View>
                    <Text style={styles.serviceModalPrice}>{s.price} ₴</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setIsServiceModalOpen(false)}
            >
              <Text style={styles.modalDoneBtnText}>Готово</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно вибору клієнта */}
      <Modal visible={isClientModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Оберіть клієнта</Text>
              <TouchableOpacity onPress={() => setIsClientModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Рядок пошуку клієнта */}
            <View style={styles.clientModalSearchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color="#8E8E93" />
              <TextInput
                placeholder="Пошук за ім'ям, тегом або номером..."
                placeholderTextColor="#8E8E93"
                value={clientSearchQuery}
                onChangeText={setClientSearchQuery}
                style={styles.clientModalSearchInput}
                autoCapitalize="none"
              />
              {clientSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setClientSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{ maxHeight: 350 }} keyboardShouldPersistTaps="handled">
              {!clientSearchQuery.trim() && (
                <TouchableOpacity
                  style={styles.clientModalItem}
                  onPress={() => {
                    setSelectedClient(null);
                    setIsClientModalOpen(false);
                  }}
                >
                  <MaterialCommunityIcons name="incognito" size={22} color="#8E8E93" />
                  <Text style={styles.clientModalName}>Не обрано (Анонімний)</Text>
                </TouchableOpacity>
              )}

              {filteredClientsForModal.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: '#8E8E93', textAlign: 'center', fontSize: 13, lineHeight: 18 }}>
                    {clientSearchQuery.trim()
                      ? `Клієнтів не знайдено за запитом "${clientSearchQuery}"`
                      : 'База клієнтів порожня.'}
                  </Text>
                </View>
              ) : (
                filteredClientsForModal.map((c: ClientItem) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.clientModalItem}
                    onPress={() => {
                      setSelectedClient(c);
                      setIsClientModalOpen(false);
                    }}
                  >
                    <View style={[styles.modalClientAvatar, { backgroundColor: c.avatarColor }]}>
                      <Text style={styles.modalClientLetter}>{c.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clientModalName}>{c.name}</Text>
                      <Text style={styles.clientModalPhone}>{c.cnCode} • {c.phone}</Text>
                      {c.tags && c.tags.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {c.tags.map((t: string) => (
                            <View key={t} style={styles.clientTagBadge}>
                              <Text style={styles.clientTagText}>{t}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно створення клієнта */}
      <Modal visible={isCreateClientOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Створити нового клієнта</Text>
              <TouchableOpacity onPress={() => setIsCreateClientOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Ім'я та прізвище"
              placeholderTextColor="#8E8E93"
              value={newClientName}
              onChangeText={setNewClientName}
              style={styles.modalInput}
            />

            <TextInput
              placeholder="Номер телефону (+380...)"
              placeholderTextColor="#8E8E93"
              value={newClientPhone}
              onChangeText={setNewClientPhone}
              keyboardType="phone-pad"
              style={styles.modalInput}
            />

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={handleCreateNewClient}
            >
              <Text style={styles.modalDoneBtnText}>Зберегти клієнта</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно вибору джерела */}
      <Modal visible={isSourceModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Джерело замовлення</Text>
              <TouchableOpacity onPress={() => setIsSourceModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {ORDER_SOURCES.map((src) => (
              <TouchableOpacity
                key={src}
                style={styles.sourceOptionItem}
                onPress={() => {
                  setOrderSource(src);
                  setIsSourceModalOpen(false);
                }}
              >
                <Text style={[styles.sourceOptionText, orderSource === src && { color: '#4CAF50', fontWeight: '700' }]}>
                  {src}
                </Text>
                {orderSource === src && (
                  <MaterialCommunityIcons name="check" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Модальне вікно вибору майстра (відкидний список) */}
      <Modal visible={isMasterModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Оберіть майстра</Text>
              <TouchableOpacity onPress={() => setIsMasterModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              <TouchableOpacity
                style={[
                  styles.masterModalItem,
                  selectedMaster === null && styles.masterModalItemActive,
                ]}
                onPress={() => {
                  setSelectedMaster(null);
                  setIsMasterModalOpen(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.masterModalName, selectedMaster === null && { color: '#34D399' }]}>
                    Не обрано
                  </Text>
                  <Text style={styles.masterModalRole}>Майстра не вибрано</Text>
                </View>
                {selectedMaster === null && (
                  <MaterialCommunityIcons name="check" size={22} color="#34D399" />
                )}
              </TouchableOpacity>

              {mastersList.map((m) => {
                const isSelected = selectedMaster?.id === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.masterModalItem,
                      isSelected && styles.masterModalItemActive,
                    ]}
                    onPress={() => {
                      setSelectedMaster(m);
                      setIsMasterModalOpen(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.masterModalName, isSelected && { color: '#34D399' }]}>
                        {m.name}
                      </Text>
                      <Text style={styles.masterModalRole}>{m.specialty}</Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={22} color="#34D399" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно вибору дати (календар) та години */}
      <Modal visible={isTimeModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Ручка шторки */}
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Оберіть дату та час</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedMaster ? `${selectedMaster.name} • ` : ''}{formatDisplayDate(bookingDate)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsTimeModalOpen(false)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Інтерактивний календар місяця */}
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeaderRow}>
                  <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthText}>
                    {UKR_MONTHS_NAMES[calendarMonth]} {calendarYear} р.
                  </Text>
                  <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn}>
                    <MaterialCommunityIcons name="chevron-right" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarWeekdaysRow}>
                  {WEEKDAY_NAMES.map((d) => (
                    <Text key={d} style={styles.calendarWeekdayText}>{d}</Text>
                  ))}
                </View>

                <View style={styles.calendarDaysGrid}>
                  {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                    <View key={`empty-${idx}`} style={styles.calendarDayCell} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dIso = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isSel = dIso === bookingDate;
                    const isToday = dIso === getTodayIsoDate();

                    return (
                      <TouchableOpacity
                        key={dIso}
                        style={[
                          styles.calendarDayCell,
                          isSel && styles.calendarDayCellSelected,
                          isToday && !isSel && styles.calendarDayCellToday,
                        ]}
                        onPress={() => setBookingDate(dIso)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            isSel && styles.calendarDayTextSelected,
                            isToday && !isSel && styles.calendarDayTextToday,
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Заголовок блоку годин */}
              <View style={styles.timeSectionHeaderRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#34D399" />
                <Text style={styles.timeSectionTitle}>
                  Вільні години на обраний день:
                </Text>
              </View>

              {/* Сітка годин у 3 колонки (чиста, лаконічна, без емодзі) */}
              <View style={styles.timeSlotsGrid}>
                {AVAILABLE_TIME_SLOTS.map((slot) => {
                  const conflict = selectedMaster
                    ? getSlotConflict(slot, selectedMaster.id, bookingDate)
                    : undefined;
                  const isSelected = bookingTime === slot;
                  const isOccupied = !!conflict;

                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.timeSlotPill,
                        isSelected && !isOccupied && styles.timeSlotPillSelected,
                        isOccupied && styles.timeSlotPillOccupied,
                      ]}
                      activeOpacity={isOccupied ? 0.9 : 0.75}
                      onPress={() => {
                        if (isOccupied) {
                          Alert.alert(
                            'Час вже зайнятий!',
                            `У майстра ${selectedMaster?.name} о ${slot} (${formatDisplayDate(bookingDate)}) вже є запис: "${conflict?.serviceName}" (${conflict?.clientName}).\n\nБудь ласка, оберіть іншу годину.`
                          );
                          return;
                        }
                        setBookingTime(slot);
                      }}
                    >
                      <Text
                        style={[
                          styles.timeSlotPillText,
                          isSelected && !isOccupied && styles.timeSlotPillTextSelected,
                          isOccupied && styles.timeSlotPillTextOccupied,
                        ]}
                      >
                        {slot}
                      </Text>

                      {isOccupied ? (
                        <Text style={styles.timeSlotOccupiedBadge}>Зайнято</Text>
                      ) : isSelected ? (
                        <MaterialCommunityIcons name="check" size={15} color="#FFFFFF" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Кнопка підтвердження часу */}
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              activeOpacity={0.85}
              onPress={() => setIsTimeModalOpen(false)}
            >
              <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
              <Text style={styles.modalConfirmBtnText}>
                Підтвердити час: {bookingTime}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1500}
        style={{ backgroundColor: '#133E1D' }}
      >
        <Text style={{ color: '#34D399', fontWeight: 'bold' }}>
          ✓ Запис успішно збережено в розклад!
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
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  repeatText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
    marginBottom: 16,
  },
  dateTimeCardWrapper: {
    backgroundColor: '#1C1C20',
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  floatingBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#28282D',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -26,
    marginBottom: 8,
  },
  dateTimeContent: {
    alignItems: 'center',
    width: '100%',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dateTimeText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  newRecordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E3846',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  newRecordText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1C1C20',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  selectedServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  selectedServiceName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedServiceMeta: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  removeServiceBtn: {
    padding: 6,
  },
  dashedAddBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#48484A',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dashedAddText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '500',
  },
  clientHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  createClientBtnText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clientSelectorBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282C',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
  },
  clientSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  incognitoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#25252A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientSelectorText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  noteInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 44,
    paddingVertical: 0,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    color: '#8E8E93',
    fontSize: 13,
  },
  summaryAmount: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  commentInput: {
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282C',
    borderRadius: 12,
    minHeight: 90,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#28282D',
    marginVertical: 14,
  },
  sourceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282C',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sourceLabel: {
    color: '#8E8E93',
    fontSize: 11,
  },
  sourceValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  createdBox: {
    marginTop: 14,
  },
  createdLabel: {
    color: '#8E8E93',
    fontSize: 11,
  },
  createdValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  autoPill: {
    backgroundColor: '#28282D',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  autoPillSelected: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  autoPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  swatchesScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorDotSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    height: 52,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C20',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  serviceModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#28282D',
    gap: 12,
  },
  serviceModalName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceModalMeta: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  serviceModalPrice: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
  },
  clientModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#28282D',
    gap: 12,
  },
  modalClientAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClientLetter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  clientModalName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  clientModalPhone: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  modalInput: {
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282C',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalDoneBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sourceOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#28282D',
  },
  sourceOptionText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  dropdownSelectorBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282C',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 56,
  },
  dropdownSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownSelectorMainText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dropdownSelectorSubText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  masterAvatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  masterAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#28282D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  masterAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  masterModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#28282D',
    marginBottom: 8,
    gap: 12,
    backgroundColor: '#141416',
  },
  masterModalItemActive: {
    borderColor: '#34D399',
    backgroundColor: '#0F291E',
  },
  masterAvatarMedium: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  masterAvatarFallbackMedium: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#28282D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  masterAvatarLetterMedium: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  masterModalName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  masterModalRole: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  modalSubtitle: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  slotConflictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D1414',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginTop: 4,
  },
  slotConflictText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
  slotFreeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F291E',
    borderWidth: 1,
    borderColor: '#166534',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginTop: 4,
  },
  slotFreeText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
  },
  dateStripContainer: {
    width: '100%',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#28282D',
  },
  dateStripScroll: {
    gap: 8,
    paddingHorizontal: 2,
  },
  dateChip: {
    width: 54,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipSelected: {
    backgroundColor: '#1E6F38',
    borderColor: '#4CAF50',
  },
  dateChipDayName: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
  },
  dateChipDayNameSelected: {
    color: '#D1FAE5',
  },
  dateChipDayNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  dateChipDayNumberSelected: {
    color: '#FFFFFF',
  },
  dateChipMonth: {
    color: '#636366',
    fontSize: 10,
    marginTop: 1,
  },
  dateChipMonthSelected: {
    color: '#A7F3D0',
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A3C',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#28282D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDateStripWrapper: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#28282D',
  },
  modalDateStripScroll: {
    gap: 8,
  },
  calendarContainer: {
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282D',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  calendarMonthText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  calendarNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#28282D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calendarWeekdayText: {
    width: '14.28%',
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  calendarDayCellSelected: {
    backgroundColor: '#34D399',
  },
  calendarDayCellToday: {
    borderWidth: 1,
    borderColor: '#34D399',
  },
  calendarDayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#34D399',
    fontWeight: '700',
  },
  timeSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginTop: 2,
  },
  timeSectionTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  clientModalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282D',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
  },
  clientModalSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },
  clientTagBadge: {
    backgroundColor: '#28282D',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clientTagText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  timeSlotPill: {
    width: '31%',
    height: 46,
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282D',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  timeSlotPillSelected: {
    backgroundColor: '#1E6F38',
    borderColor: '#4CAF50',
  },
  timeSlotPillOccupied: {
    backgroundColor: '#161214',
    borderColor: '#381618',
    opacity: 0.8,
  },
  timeSlotPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timeSlotPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeSlotPillTextOccupied: {
    color: '#EF4444',
    fontSize: 12,
  },
  timeSlotOccupiedBadge: {
    color: '#F87171',
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: '#3B1214',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 2,
  },
  modalConfirmBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E6F38',
    borderRadius: 12,
    height: 48,
    marginTop: 14,
    gap: 8,
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
