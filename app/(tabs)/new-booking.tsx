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
import { useAppSettings } from '../../context/AppSettingsContext';
import { authService } from '../../services/authService';

// Каталог послуг салону "Svoya Nail Studio"
const AVAILABLE_SERVICES_PL = [
  { id: 's-1', name: 'Kompleksowy manicure + hybryda', price: 700, duration: '1 godz 30 min' },
  { id: 's-2', name: 'Przedłużanie paznokci (żel)', price: 1100, duration: '2 godz 00 min' },
  { id: 's-3', name: 'Pedicure frezarkowy', price: 850, duration: '1 godz 30 min' },
  { id: 's-4', name: 'Zdjęcie + manicure klasyczny', price: 450, duration: '1 godz 00 min' },
  { id: 's-5', name: 'Zdobienie paznokci (french / wzorki)', price: 250, duration: '30 min' },
];

const AVAILABLE_SERVICES_UA = [
  { id: 's-1', name: 'Комплексний манікюр + покриття', price: 700, duration: '1 год 30 хв' },
  { id: 's-2', name: 'Нарощування нігтів (гелеве)', price: 1100, duration: '2 год 00 хв' },
  { id: 's-3', name: 'Апаратний педикюр', price: 850, duration: '1 год 30 хв' },
  { id: 's-4', name: 'Зняття + гігієнічний манікюр', price: 450, duration: '1 год 00 хв' },
  { id: 's-5', name: 'Дизайн нігтів (складний розпис)', price: 250, duration: '30 хв' },
];

const ORDER_SOURCES_PL = ['Przez telefon', 'Instagram', 'Rezerwacja online', 'Viber', 'Na miejscu'];
const ORDER_SOURCES_UA = ['По телефону', 'Instagram', 'Онлайн-запис', 'Viber', 'На місці'];

// Динамічне визначення поточної дати за системним календарем (сьогоднішній день)
const getTodayIsoDate = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (dateStr: string, lang: 'pl' | 'ua'): string => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (lang === 'pl') {
      const plDays = ['Nd', 'Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
      const plMonths = [
        'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
        'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
      ];
      return `${plDays[dateObj.getDay()]}, ${dateObj.getDate()} ${plMonths[dateObj.getMonth()]} ${y} r.`;
    }
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

const PL_MONTHS_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const UKR_MONTHS_NAMES = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

const PL_WEEKDAY_NAMES = ['Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const WEEKDAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

/**
 * Екран: Нове бронювання
 * Зона відповідальності: Розробник 2 (Артем Гіжовський)
 * Підключено збереження до REST API (POST /api/bookings, POST /api/clients)
 */
export default function NewBookingScreen() {
  const router = useRouter();
  const { colors, t, language } = useAppSettings();
  const currentUser = authService.getCurrentUser();
  const currentUserName = currentUser
    ? (currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`.trim())
    : '';
  const params = useLocalSearchParams<{ clientId?: string; masterId?: string }>();

  const availableServices = language === 'pl' ? AVAILABLE_SERVICES_PL : AVAILABLE_SERVICES_UA;
  const orderSourcesList = language === 'pl' ? ORDER_SOURCES_PL : ORDER_SOURCES_UA;

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
  const [selectedServices, setSelectedServices] = useState<typeof AVAILABLE_SERVICES_UA>([]);
  const [clientsList, setClientsList] = useState<ClientItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [comment, setComment] = useState('');
  const [orderSource, setOrderSource] = useState(orderSourcesList[0]);

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
      const currentMasters = masters && masters.length > 0 ? masters : MOCK_MASTERS;
      setMastersList(currentMasters);
      setClientsList(clients);
      if (appointments) setAppointmentsList(appointments);

      // Якщо передано clientId (наприклад, з екрану Клієнти), обираємо його автоматично
      if (params.clientId) {
        const found = clients.find((c) => c.id === params.clientId);
        if (found) {
          setSelectedClient(found);
        }
      }

      // Якщо передано masterId, або поточний користувач є MASTER - авто-вибираємо його
      if (params.masterId) {
        const found = currentMasters.find((m) => m.id === params.masterId);
        if (found) setSelectedMaster(found);
      } else if (currentUser?.role === 'MASTER' && !selectedMaster && currentUserName) {
        const found = currentMasters.find(
          (m) =>
            m.name.toLowerCase().includes(currentUserName.toLowerCase()) ||
            currentUserName.toLowerCase().includes(m.name.toLowerCase())
        );
        if (found) setSelectedMaster(found);
      }
    } catch {}
  }, [params.clientId, params.masterId, currentUserName, currentUser?.role, selectedMaster]);

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

  const handleToggleService = (service: (typeof availableServices)[0]) => {
    if (selectedServices.some((s) => s.id === service.id)) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleCreateNewClient = async () => {
    if (!newClientName.trim()) {
      Alert.alert(
        language === 'pl' ? 'Błąd' : 'Помилка',
        language === 'pl' ? 'Wpisz imię klienta' : "Введіть ім'я клієнта"
      );
      return;
    }

    try {
      const created = await apiClient.createClient({
        name: newClientName.trim(),
        phone: newClientPhone.trim() || (language === 'pl' ? '+48 500 000 000' : '+380 67 000 0000'),
        category: 'NEW',
        tags: [language === 'pl' ? 'Nowy klient' : 'Новий клієнт'],
      });

      setClientsList((prev) => [created, ...prev]);
      setSelectedClient(created);
      setIsCreateClientOpen(false);
      setNewClientName('');
      setNewClientPhone('');
    } catch {
      Alert.alert(
        language === 'pl' ? 'Błąd' : 'Помилка',
        language === 'pl' ? 'Nie udało się zapisać klienta' : 'Не вдалося зберегти клієнта'
      );
    }
  };

  // Збереження бронювання через REST API (POST /api/bookings)
  const handleSave = async () => {
    if (!selectedMaster) {
      Alert.alert(
        t.booking.selectMaster,
        language === 'pl'
          ? 'Proszę wybrać pracownika przed zapisaniem rezerwacji'
          : 'Будь ласка, оберіть майстра перед збереженням запису'
      );
      return;
    }

    const conflict = getSlotConflict(bookingTime, selectedMaster.id, bookingDate);
    if (conflict) {
      Alert.alert(
        t.booking.slotConflict,
        language === 'pl'
          ? `U pracownika ${selectedMaster.name} o ${bookingTime} jest już zaplanowana wizyta:\n"${conflict.serviceName}" (${conflict.clientName}).\n\nProszę wybrać inną wolną godzinę.`
          : `У майстра ${selectedMaster.name} о ${bookingTime} вже призначено запис:\n"${conflict.serviceName}" (${conflict.clientName}).\n\nБудь ласка, оберіть іншу вільну годину.`
      );
      return;
    }

    setIsSaving(true);
    try {
      const defaultService =
        language === 'pl'
          ? 'Kompleksowy manicure + hybryda'
          : 'Комплексний манікюр + покриття';
      const serviceTitle =
        selectedServices.length > 0
          ? selectedServices.map((s) => s.name).join(', ')
          : defaultService;
      const price = totalPrice > 0 ? totalPrice : 700;

      // Обчислення кінцевого часу (додаємо 1.5 години)
      const [h, m] = bookingTime.split(':').map(Number);
      const endH = Math.min(21, h + 1);
      const endM = (m + 30) % 60;
      const formattedEndTime = `${String(endH + (m + 30 >= 60 ? 1 : 0)).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      await apiClient.createBooking({
        masterId: selectedMaster.id,
        clientName: selectedClient ? selectedClient.name : t.booking.anonymousClient,
        clientPhone: selectedClient ? selectedClient.phone : '+380 67 000 0000',
        serviceName: serviceTitle,
        date: bookingDate,
        startTime: bookingTime,
        endTime: formattedEndTime,
        price: price,
        notes: comment,
        colorType: 'green',
        source: orderSource,
      });

      setSnackbarVisible(true);
      setTimeout(() => {
        router.push('/(tabs)/calendar');
      }, 1000);
    } catch {
      Alert.alert(
        language === 'pl' ? 'Błąd' : 'Помилка',
        language === 'pl' ? 'Nie udało się zapisać rezerwacji' : 'Не вдалося зберегти запис'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Заголовок "Нове бронювання" */}
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t.booking.newBooking}</Text>

        {/* 3. Картка дати та часу */}
        <View style={[styles.dateTimeCardWrapper, { backgroundColor: colors.surface }]}>
          <View style={[styles.floatingBadge, { backgroundColor: colors.surfaceLight }]}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.text} />
          </View>

          <TouchableOpacity
            style={styles.dateTimeContent}
            activeOpacity={0.8}
            onPress={handleOpenTimeModal}
          >
            <View style={styles.dateTimeRow}>
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {formatDisplayDate(bookingDate, language)} • {bookingTime}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 3.1. Картка "Майстер" - Відкидний список */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t.booking.master}</Text>
          <TouchableOpacity
            style={[
              styles.dropdownSelectorBox,
              { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder },
            ]}
            activeOpacity={0.75}
            onPress={() => setIsMasterModalOpen(true)}
          >
            <View style={styles.dropdownSelectorLeft}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dropdownSelectorMainText, { color: colors.text }]}>
                  {selectedMaster ? selectedMaster.name : (language === 'pl' ? 'Nie wybrano' : 'Не обрано')}
                </Text>
                <Text style={[styles.dropdownSelectorSubText, { color: colors.textSecondary }]}>
                  {selectedMaster
                    ? selectedMaster.specialty
                    : (language === 'pl' ? 'Kliknij, aby wybrać pracownika' : 'Натисніть, щоб обрати майстра')}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="menu-down" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 4. Картка "Послуги" */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t.booking.services}</Text>

          {/* Вибрані послуги, якщо є */}
          {selectedServices.map((service) => (
            <View
              key={service.id}
              style={[styles.selectedServiceItem, { backgroundColor: colors.surfaceLight }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectedServiceName, { color: colors.text }]}>{service.name}</Text>
                <Text style={[styles.selectedServiceMeta, { color: colors.textSecondary }]}>
                  {service.duration} • {service.price} ₴
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleToggleService(service)}
                style={styles.removeServiceBtn}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Пунктирна кнопка "+ Додати послугу" */}
          <TouchableOpacity
            style={[styles.dashedAddBox, { borderColor: colors.cardBorder }]}
            activeOpacity={0.7}
            onPress={() => setIsServiceModalOpen(true)}
          >
            <MaterialCommunityIcons name="plus" size={18} color={colors.text} />
            <Text style={[styles.dashedAddText, { color: colors.text }]}>{t.booking.addService}</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Картка "Клієнт" */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.clientHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t.booking.client}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.clientSelectorBox,
              { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder },
            ]}
            activeOpacity={0.75}
            onPress={() => {
              loadData();
              setIsClientModalOpen(true);
            }}
          >
            <View style={styles.clientSelectorLeft}>
              <View style={[styles.incognitoCircle, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons
                  name={selectedClient ? 'account' : 'incognito'}
                  size={18}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={[styles.clientSelectorText, { color: colors.textSecondary }]}>
                {selectedClient
                  ? `${selectedClient.name} (${selectedClient.cnCode || (language === 'pl' ? 'Klient' : 'Клієнт')})`
                  : (language === 'pl' ? 'Nie wybrano (Anonimowy)' : 'Не обрано (Анонімний)')}
              </Text>
            </View>
            <MaterialCommunityIcons name="menu-down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 7. Картка "Підсумок" */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            {language === 'pl' ? 'Podsumowanie' : 'Підсумок'}
          </Text>

          <View style={styles.summaryHeaderRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              {language === 'pl' ? 'Wartość usług' : 'Проміжний підсумок'}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              {language === 'pl' ? 'Razem za rezerwację' : 'Усього за бронювання'}
            </Text>
          </View>

          <Text style={[styles.summaryAmount, { color: colors.text }]}>{formatMoney(totalPrice)}</Text>
        </View>

        {/* 8. Секція "Коментар" та "Джерело замовлення" */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Коментар */}
          <TextInput
            placeholder={t.booking.comment}
            placeholderTextColor={colors.textSecondary}
            value={comment}
            onChangeText={setComment}
            style={[
              styles.commentInput,
              {
                backgroundColor: colors.surfaceLight,
                borderColor: colors.cardBorder,
                color: colors.text,
              },
            ]}
            multiline
            numberOfLines={3}
          />

          <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />

          {/* Джерело замовлення */}
          <TouchableOpacity
            style={[
              styles.sourceBox,
              { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder },
            ]}
            activeOpacity={0.75}
            onPress={() => setIsSourceModalOpen(true)}
          >
            <View>
              <Text style={[styles.sourceLabel, { color: colors.textSecondary }]}>
                {t.booking.orderSource}
              </Text>
              <Text style={[styles.sourceValue, { color: colors.text }]}>{orderSource}</Text>
            </View>
            <MaterialCommunityIcons name="menu-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 9. Фіксована нижня панель: "Зберегти" */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
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
              <Text style={styles.saveButtonText}>{t.booking.saveBooking}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Модальне вікно вибору послуг */}
      <Modal visible={isServiceModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {language === 'pl' ? 'Wybierz usługę' : 'Оберіть послугу'}
              </Text>
              <TouchableOpacity onPress={() => setIsServiceModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {availableServices.map((s) => {
                const isChecked = selectedServices.some((item) => item.id === s.id);
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.serviceModalItem, { borderBottomColor: colors.divider }]}
                    onPress={() => handleToggleService(s)}
                  >
                    <MaterialCommunityIcons
                      name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={isChecked ? '#4CAF50' : colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.serviceModalName, { color: colors.text }]}>{s.name}</Text>
                      <Text style={[styles.serviceModalMeta, { color: colors.textSecondary }]}>{s.duration}</Text>
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
              <Text style={styles.modalDoneBtnText}>{t.common.done}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно вибору клієнта */}
      <Modal visible={isClientModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.booking.selectClient}</Text>
              <TouchableOpacity onPress={() => setIsClientModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Рядок пошуку клієнта */}
            <View
              style={[
                styles.clientModalSearchBox,
                { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder },
              ]}
            >
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
              <TextInput
                placeholder={
                  language === 'pl'
                    ? 'Szukaj po nazwisku, tagu lub telefonie...'
                    : "Пошук за ім'ям, тегом або номером..."
                }
                placeholderTextColor={colors.textSecondary}
                value={clientSearchQuery}
                onChangeText={setClientSearchQuery}
                style={[styles.clientModalSearchInput, { color: colors.text }]}
                autoCapitalize="none"
              />
              {clientSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setClientSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{ maxHeight: 350 }} keyboardShouldPersistTaps="handled">
              {!clientSearchQuery.trim() && (
                <TouchableOpacity
                  style={[styles.clientModalItem, { borderBottomColor: colors.divider }]}
                  onPress={() => {
                    setSelectedClient(null);
                    setIsClientModalOpen(false);
                  }}
                >
                  <MaterialCommunityIcons name="incognito" size={22} color={colors.textSecondary} />
                  <Text style={[styles.clientModalName, { color: colors.text }]}>
                    {language === 'pl' ? 'Nie wybrano (Anonimowy)' : 'Не обрано (Анонімний)'}
                  </Text>
                </TouchableOpacity>
              )}

              {filteredClientsForModal.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 13, lineHeight: 18 }}>
                    {clientSearchQuery.trim()
                      ? (language === 'pl'
                          ? `Brak klientów dla zapytania "${clientSearchQuery}"`
                          : `Клієнтів не знайдено за запитом "${clientSearchQuery}"`)
                      : (language === 'pl' ? 'Baza klientów jest pusta.' : 'База клієнтів порожня.')}
                  </Text>
                </View>
              ) : (
                filteredClientsForModal.map((c: ClientItem) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.clientModalItem, { borderBottomColor: colors.divider }]}
                    onPress={() => {
                      setSelectedClient(c);
                      setIsClientModalOpen(false);
                    }}
                  >
                    <View style={[styles.modalClientAvatar, { backgroundColor: c.avatarColor }]}>
                      <Text style={styles.modalClientLetter}>{c.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.clientModalName, { color: colors.text }]}>{c.name}</Text>
                      <Text style={[styles.clientModalPhone, { color: colors.textSecondary }]}>
                        {c.cnCode} • {c.phone}
                      </Text>
                      {c.tags && c.tags.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {c.tags.map((tTag: string) => (
                            <View
                              key={tTag}
                              style={[styles.clientTagBadge, { backgroundColor: colors.surfaceLight }]}
                            >
                              <Text style={[styles.clientTagText, { color: colors.textSecondary }]}>{tTag}</Text>
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
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {language === 'pl' ? 'Dodaj nowego klienta' : 'Створити нового клієнта'}
              </Text>
              <TouchableOpacity onPress={() => setIsCreateClientOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder={language === 'pl' ? 'Imię i nazwisko' : "Ім'я та прізвище"}
              placeholderTextColor={colors.textSecondary}
              value={newClientName}
              onChangeText={setNewClientName}
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
            />

            <TextInput
              placeholder={language === 'pl' ? 'Numer telefonu (+48...)' : 'Номер телефону (+380...)'}
              placeholderTextColor={colors.textSecondary}
              value={newClientPhone}
              onChangeText={setNewClientPhone}
              keyboardType="phone-pad"
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
            />

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={handleCreateNewClient}
            >
              <Text style={styles.modalDoneBtnText}>{t.clients.saveClient}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно вибору джерела */}
      <Modal visible={isSourceModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.booking.orderSource}</Text>
              <TouchableOpacity onPress={() => setIsSourceModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {orderSourcesList.map((src) => (
              <TouchableOpacity
                key={src}
                style={[styles.sourceOptionItem, { borderBottomColor: colors.divider }]}
                onPress={() => {
                  setOrderSource(src);
                  setIsSourceModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.sourceOptionText,
                    { color: colors.text },
                    orderSource === src && { color: '#4CAF50', fontWeight: '700' },
                  ]}
                >
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
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.booking.selectMaster}</Text>
              <TouchableOpacity onPress={() => setIsMasterModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              <TouchableOpacity
                style={[
                  styles.masterModalItem,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder },
                  selectedMaster === null && styles.masterModalItemActive,
                ]}
                onPress={() => {
                  setSelectedMaster(null);
                  setIsMasterModalOpen(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.masterModalName,
                      { color: colors.text },
                      selectedMaster === null && { color: '#34D399' },
                    ]}
                  >
                    {language === 'pl' ? 'Nie wybrano' : 'Не обрано'}
                  </Text>
                  <Text style={[styles.masterModalRole, { color: colors.textSecondary }]}>
                    {language === 'pl' ? 'Pracownik nie został wybrany' : 'Майстра не вибрано'}
                  </Text>
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
                      { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder },
                      isSelected && styles.masterModalItemActive,
                    ]}
                    onPress={() => {
                      setSelectedMaster(m);
                      setIsMasterModalOpen(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.masterModalName,
                          { color: colors.text },
                          isSelected && { color: '#34D399' },
                        ]}
                      >
                        {m.name}
                      </Text>
                      <Text style={[styles.masterModalRole, { color: colors.textSecondary }]}>
                        {m.specialty}
                      </Text>
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
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Ручка шторки */}
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {language === 'pl' ? 'Wybierz datę i godzinę' : 'Оберіть дату та час'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {selectedMaster ? `${selectedMaster.name} • ` : ''}
                  {formatDisplayDate(bookingDate, language)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsTimeModalOpen(false)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Інтерактивний календар місяця */}
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeaderRow}>
                  <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.calendarMonthText, { color: colors.text }]}>
                    {language === 'pl' ? PL_MONTHS_NAMES[calendarMonth] : UKR_MONTHS_NAMES[calendarMonth]}{' '}
                    {calendarYear} {language === 'pl' ? 'r.' : 'р.'}
                  </Text>
                  <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn}>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarWeekdaysRow}>
                  {(language === 'pl' ? PL_WEEKDAY_NAMES : WEEKDAY_NAMES).map((d) => (
                    <Text key={d} style={[styles.calendarWeekdayText, { color: colors.textSecondary }]}>
                      {d}
                    </Text>
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
                            { color: colors.text },
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
                <Text style={[styles.timeSectionTitle, { color: colors.text }]}>
                  {language === 'pl' ? 'Dostępne godziny na wybrany dzień:' : 'Вільні години на обраний день:'}
                </Text>
              </View>

              {/* Сітка годин у 3 колонки */}
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
                        { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder },
                        isSelected && !isOccupied && styles.timeSlotPillSelected,
                        isOccupied && styles.timeSlotPillOccupied,
                      ]}
                      activeOpacity={isOccupied ? 0.9 : 0.75}
                      onPress={() => {
                        if (isOccupied) {
                          Alert.alert(
                            t.booking.slotConflict,
                            language === 'pl'
                              ? `U pracownika ${selectedMaster?.name} o ${slot} (${formatDisplayDate(bookingDate, language)}) jest już wizyta: "${conflict?.serviceName}" (${conflict?.clientName}).\n\nProszę wybrać inną godzinę.`
                              : `У майстра ${selectedMaster?.name} о ${slot} (${formatDisplayDate(bookingDate, language)}) вже є запис: "${conflict?.serviceName}" (${conflict?.clientName}).\n\nБудь ласка, оберіть іншу годину.`
                          );
                          return;
                        }
                        setBookingTime(slot);
                      }}
                    >
                      <Text
                        style={[
                          styles.timeSlotPillText,
                          { color: colors.text },
                          isSelected && !isOccupied && styles.timeSlotPillTextSelected,
                          isOccupied && styles.timeSlotPillTextOccupied,
                        ]}
                      >
                        {slot}
                      </Text>

                      {isOccupied ? (
                        <Text style={styles.timeSlotOccupiedBadge}>
                          {language === 'pl' ? 'Zajęte' : 'Зайнято'}
                        </Text>
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
                {language === 'pl'
                  ? `Potwierdź godzinę: ${bookingTime}`
                  : `Підтвердити час: ${bookingTime}`}
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
          {language === 'pl'
            ? '✓ Rezerwacja została pomyślnie dodana!'
            : '✓ Запис успішно збережено в розклад!'}
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
