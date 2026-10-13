import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  PanResponder,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {
  Text,
  Surface,
  Portal,
  Dialog,
  Button,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { AppointmentCard } from '../../components/AppointmentCard';
import {
  MOCK_APPOINTMENTS,
  MOCK_MASTERS,
  AppointmentItem,
  Master,
} from '../../services/mockData';
import { apiClient } from '../../services/api';
import { useAccelerometer } from '../../hooks/useAccelerometer';
import { useAppSettings } from '../../context/AppSettingsContext';
import { authService } from '../../services/authService';

// Години сітки (від 10:00 до 21:00 як на скріншоті EasyWeek)
const START_HOUR = 10;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => `${START_HOUR + i}:00`);

const HOUR_HEIGHT = 85;       // Висота однієї години в пікселях
const DEFAULT_COLUMN_WIDTH = 155;     // Ширина колонки майстра за замовчуванням
const TIME_COLUMN_WIDTH = 52; // Ширина шкали годин

// Назви днів тижня та місяців для нижньої панелі
const UKR_DAY_NAMES_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const UKR_MONTH_NAMES_SHORT = ['Січ', 'Лют', 'Бер', 'Квіт', 'Трав', 'Черв', 'Лип', 'Серп', 'Вер', 'Жовт', 'Лист', 'Груд'];
const UKR_MONTH_NAMES_FULL = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

const PL_DAY_NAMES_SHORT = ['Ndz', 'Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
const PL_MONTH_NAMES_SHORT = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
const PL_MONTH_NAMES_FULL = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

// Допоміжна функція для ISO формату дати
const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Генерація динамічного списку днів навколо вибраної дати (±3 дні)
const generateDaysList = (centerDate: string) => {
  const center = new Date(centerDate + 'T12:00:00');
  const days = [];
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(center);
    d.setDate(d.getDate() + offset);
    days.push({
      dayNum: d.getDate(),
      dayName: UKR_DAY_NAMES_SHORT[d.getDay()],
      month: UKR_MONTH_NAMES_SHORT[d.getMonth()],
      fullDate: toIsoDate(d),
    });
  }
  return days;
};

/**
 * Екран: Календар і розклад майстрів (EasyWeek Dark Edition)
 * Зона відповідальності: Розробник 1 (Ігор Намачинський)
 * Підключено завантаження та оновлення через REST API (GET, PUT /api/bookings)
 */
export default function CalendarScreen() {
  const router = useRouter();
  const { colors, isDark, language } = useAppSettings();
  const currentUser = authService.getCurrentUser();
  const isMasterRole = currentUser?.role === 'MASTER';

  // Мовні назви для календаря
  const dayNamesShort = language === 'pl' ? PL_DAY_NAMES_SHORT : UKR_DAY_NAMES_SHORT;
  const monthNamesFull = language === 'pl' ? PL_MONTH_NAMES_FULL : UKR_MONTH_NAMES_FULL;
  const monthNamesShort = language === 'pl' ? PL_MONTH_NAMES_SHORT : UKR_MONTH_NAMES_SHORT;

  // Вибраний день — зберігається як ISO дата (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);

  // Стан модального вікна вибору дати та місяця
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth());

  // Синхронізація горизонтального скролу між панеллю майстрів та колонками сітки
  const headerScrollRef = useRef<ScrollView>(null);
  const gridScrollRef = useRef<ScrollView>(null);
  const isScrollingGrid = useRef(false);
  const isScrollingHeader = useRef(false);

  // Стан даних з REST API
  const [appointmentsList, setAppointmentsList] = useState<AppointmentItem[]>([]);
  const [mastersList, setMastersList] = useState<Master[]>(MOCK_MASTERS);

  // Визначення конкретного майстра для поточної сесії
  const myMaster = useMemo(() => {
    if (!currentUser) return null;
    return (
      mastersList.find(
        (m) =>
          m.id === currentUser.id ||
          m.name.toLowerCase().includes(currentUser.lastName.toLowerCase()) ||
          m.name.toLowerCase().includes(currentUser.firstName.toLowerCase())
      ) || null
    );
  }, [currentUser, mastersList]);

  // Режим відображення: для майстра за замовчуванням 'MY' (персональний розклад), для адміна 'ALL' (вся студія)
  const [viewScope, setViewScope] = useState<'MY' | 'ALL'>(isMasterRole ? 'MY' : 'ALL');

  const handleGridScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isScrollingHeader.current) return;
    isScrollingGrid.current = true;
    const x = e.nativeEvent.contentOffset.x;
    headerScrollRef.current?.scrollTo({ x, animated: false });
    setTimeout(() => {
      isScrollingGrid.current = false;
    }, 40);
  };

  const handleHeaderScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isScrollingGrid.current) return;
    isScrollingHeader.current = true;
    const x = e.nativeEvent.contentOffset.x;
    gridScrollRef.current?.scrollTo({ x, animated: false });
    setTimeout(() => {
      isScrollingHeader.current = false;
    }, 40);
  };

  const openDatePicker = () => {
    try {
      const d = new Date(selectedDate + 'T12:00:00');
      setPickerYear(d.getFullYear());
      setPickerMonth(d.getMonth());
    } catch {}
    setIsDatePickerOpen(true);
  };

  // Генерація сітки днів місяця для модального календаря
  const monthCalendarDays = useMemo(() => {
    const firstDay = new Date(pickerYear, pickerMonth, 1);
    const lastDay = new Date(pickerYear, pickerMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Понеділок = 0 ... Неділя = 6
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Дні попереднього місяця
    const prevMonthLastDay = new Date(pickerYear, pickerMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(pickerYear, pickerMonth - 1, d);
      days.push({ day: d, dateStr: toIsoDate(prevDate), isCurrentMonth: false });
    }

    // Дні поточного місяця
    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(pickerYear, pickerMonth, d);
      days.push({ day: d, dateStr: toIsoDate(currDate), isCurrentMonth: true });
    }

    // Дні наступного місяця
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(pickerYear, pickerMonth + 1, d);
      days.push({ day: d, dateStr: toIsoDate(nextDate), isCurrentMonth: false });
    }

    return days;
  }, [pickerYear, pickerMonth]);

  // Динамічний список днів навколо вибраної дати
  const daysList = useMemo(() => {
    const center = new Date(selectedDate + 'T12:00:00');
    const days = [];
    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(center);
      d.setDate(d.getDate() + offset);
      days.push({
        dayNum: d.getDate(),
        dayName: dayNamesShort[d.getDay()],
        month: monthNamesShort[d.getMonth()],
        fullDate: toIsoDate(d),
      });
    }
    return days;
  }, [selectedDate, dayNamesShort, monthNamesShort]);

  // Завантаження розкладу з сервера
  const fetchCalendarData = useCallback(async () => {
    try {
      const appts = await apiClient.getAppointments();
      setAppointmentsList(appts);
      const masters = await apiClient.getMasters();
      setMastersList(masters);
    } catch {}
  }, []);

  // Оновлення при кожному відкритті вкладки
  useFocusEffect(
    useCallback(() => {
      fetchCalendarData();
    }, [fetchCalendarData])
  );

  // Діалог деталей візиту
  const [activeAppointment, setActiveAppointment] = useState<AppointmentItem | null>(null);

  // Сповіщення про жест/акселерометр
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);

  // Поточний час для динамічної червоної лінії
  const [currentMinutesFromStart, setCurrentMinutesFromStart] = useState<number>(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    if (h >= START_HOUR && h <= END_HOUR) {
      return (h - START_HOUR) * 60 + m;
    }
    return (20 - START_HOUR) * 60 + 1; // 20:01 як на скріншоті
  });

  // Оновлення поточної червоної лінії щохвилини
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      if (h >= START_HOUR && h <= END_HOUR) {
        setCurrentMinutesFromStart((h - START_HOUR) * 60 + m);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Функції перемикання дати (тепер без обмежень)
  const goToNextDay = (source: string = 'Жест') => {
    setSelectedDate((prev) => {
      const d = new Date(prev + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      const next = toIsoDate(d);
      const nextDate = new Date(next + 'T12:00:00');
      setGestureFeedback(`📅 ${dayNamesShort[nextDate.getDay()]}, ${nextDate.getDate()} ${monthNamesFull[nextDate.getMonth()]} (${source})`);
      return next;
    });
  };

  const goToPrevDay = (source: string = 'Жест') => {
    setSelectedDate((prev) => {
      const d = new Date(prev + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      const next = toIsoDate(d);
      const nextDate = new Date(next + 'T12:00:00');
      setGestureFeedback(`📅 ${dayNamesShort[nextDate.getDay()]}, ${nextDate.getDate()} ${monthNamesFull[nextDate.getMonth()]} (${source})`);
      return next;
    });
  };

  // Сенсор 2: Акселерометр - плавний нахил/рух телефону вліво-вправо
  useAccelerometer({
    onShakeRight: () => goToNextDay('Акселерометр →'),
    onShakeLeft: () => goToPrevDay('← Акселерометр'),
  });

  // Свайп-жести по екрану (PanResponder)
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Реагуємо на горизонтальний свайп сильніший за вертикальний
          return Math.abs(gestureState.dx) > 35 && Math.abs(gestureState.dy) < 30;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 45) {
            goToPrevDay('Свайп праворуч');
          } else if (gestureState.dx < -45) {
            goToNextDay('Свайп ліворуч');
          }
        },
      }),
    []
  );

  // Переведення часу HH:mm у пікселі для точного розміщення картки
  const calculateCardPosition = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;

    const baseMinutes = START_HOUR * 60;
    const top = ((startTotalMinutes - baseMinutes) / 60) * HOUR_HEIGHT;
    const height = ((endTotalMinutes - startTotalMinutes) / 60) * HOUR_HEIGHT;

    return { top, height };
  };

  // Розбір вибраної дати для заголовка з урахуванням локалізації
  const selectedDateObj = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    return {
      dayNum: d.getDate(),
      monthName: monthNamesFull[d.getMonth()],
      year: d.getFullYear(),
    };
  }, [selectedDate, monthNamesFull]);

  // Фільтрація записів за вибраною датою (прив'язка сітки до дати)
  const filteredAppointments = useMemo(() => {
    return appointmentsList.filter((a) => a.date === selectedDate);
  }, [appointmentsList, selectedDate]);

  // Фільтрація майстрів для відображення:
  // Для Майстра — показуємо ВИКЛЮЧНО його персональний календар без доступу до розкладу колег!
  const displayedMasters = useMemo(() => {
    if (isMasterRole) {
      return myMaster ? [myMaster] : (mastersList.length > 0 ? [mastersList[0]] : []);
    }
    if (selectedMasterId) {
      return mastersList.filter((m) => m.id === selectedMasterId);
    }
    return mastersList;
  }, [mastersList, selectedMasterId, isMasterRole, myMaster]);

  const isSingleMasterView = displayedMasters.length === 1;
  const screenWidth = Dimensions.get('window').width;
  const activeColumnWidth = isSingleMasterView
    ? Math.max(DEFAULT_COLUMN_WIDTH, screenWidth - TIME_COLUMN_WIDTH)
    : DEFAULT_COLUMN_WIDTH;

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      {/* 1. ВЕРХНЯ ШАПКА: Заголовок дати + Стрілочки навігації + Кнопка оновлення */}
      <View
        style={[
          styles.headerRow,
          { backgroundColor: colors.surface, borderBottomColor: colors.divider },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.dateNavGroup}>
          <TouchableOpacity
            style={styles.dateNavArrow}
            onPress={() => goToPrevDay('Стрілка')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateDropdownButton}
            activeOpacity={0.8}
            onPress={openDatePicker}
          >
            <Text style={[styles.dateDropdownText, { color: colors.text }]}>
              {selectedDateObj.dayNum} {selectedDateObj.monthName}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateNavArrow}
            onPress={() => goToNextDay('Стрілка')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.topActionsGroup}>
          {/* Кнопка оновлення даних з сервера */}
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.surfaceLight }]}
            onPress={() => {
              fetchCalendarData();
              setGestureFeedback(
                language === 'pl'
                  ? '🔄 Zsynchronizowano grafik z serwerem'
                  : '🔄 Розклад синхронізовано з сервером'
              );
            }}
          >
            <MaterialCommunityIcons name="refresh" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. ПАНЕЛЬ МАЙСТРІВ З АВАТАРАМИ ТА БЕЙДЖАМИ КІЛЬКОСТІ (Синхронізована з сіткою) */}
      <View
        style={[
          styles.mastersHeaderBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.divider },
        ]}
      >
        {/* Кнопка "Усі майстри / Група" (тільки для адміністратора) */}
        {!isMasterRole && (
          <TouchableOpacity
            style={styles.groupIconContainer}
            onPress={() => {
              setSelectedMasterId(null);
              headerScrollRef.current?.scrollTo({ x: 0, animated: true });
              gridScrollRef.current?.scrollTo({ x: 0, animated: true });
            }}
          >
            <View style={[styles.groupCircle, { backgroundColor: colors.surfaceLight }]}>
              <MaterialCommunityIcons name="account-group" size={16} color={colors.text} />
            </View>
          </TouchableOpacity>
        )}

        <ScrollView
          ref={headerScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleHeaderScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.mastersScroll}
        >
          {displayedMasters.map((master, index) => {
            const isSelected = selectedMasterId === master.id;
            const apptCount = filteredAppointments.filter((a) => a.masterId === master.id).length;
            return (
              <TouchableOpacity
                key={master.id}
                disabled={isMasterRole}
                style={[
                  styles.masterHeaderItem,
                  { width: activeColumnWidth },
                  isSelected && styles.masterHeaderItemActive,
                ]}
                onPress={() => {
                  if (isMasterRole) return;
                  const newId = isSelected ? null : master.id;
                  setSelectedMasterId(newId);
                  headerScrollRef.current?.scrollTo({ x: index * activeColumnWidth, animated: true });
                  gridScrollRef.current?.scrollTo({ x: index * activeColumnWidth, animated: true });
                }}
              >
                <View style={styles.masterTextInfo}>
                  <Text numberOfLines={1} style={[styles.masterNameText, { color: colors.text }]}>
                    {master.name}
                  </Text>
                </View>
                {apptCount > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{apptCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. ОСНОВНА СІТКА РОЗКЛАДУ (Синхронізована з панеллю майстрів) */}
      <ScrollView
        style={[styles.verticalScroll, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.verticalScrollContent}
      >
        <ScrollView
          ref={gridScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleGridScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.horizontalScroll}
        >
          {/* Ліва шкала годин (10:00 - 21:00) */}
          <View
            style={[
              styles.timeScaleColumn,
              { backgroundColor: colors.surface, borderRightColor: colors.gridLine },
            ]}
          >
            {HOURS.map((hour) => (
              <View key={hour} style={[styles.hourCell, { height: HOUR_HEIGHT }]}>
                <Text style={[styles.hourText, { color: colors.textSecondary }]}>{hour}</Text>
              </View>
            ))}
          </View>

          {/* Колонки майстрів */}
          {displayedMasters.map((master) => {
            const appointments = filteredAppointments.filter((a) => a.masterId === master.id);

            return (
              <View
                key={master.id}
                style={[
                  styles.masterColumn,
                  {
                    width: activeColumnWidth,
                    backgroundColor: colors.background,
                    borderRightColor: colors.gridLine,
                  },
                ]}
              >
                {/* Горизонтальні розділювальні лінії сітки годин */}
                {HOURS.map((hour) => (
                  <View
                    key={hour}
                    style={[styles.gridRowLine, { height: HOUR_HEIGHT, borderBottomColor: colors.gridLine }]}
                  />
                ))}

                {/* Порожній слот розкладу — для адміна створення запису, для майстра тільки інформаційний */}
                {appointments.length === 0 && (
                  !isMasterRole ? (
                    <TouchableOpacity
                      style={[
                        styles.emptySlotHatched,
                        {
                          top: 0,
                          height: HOUR_HEIGHT,
                          backgroundColor: colors.gridHatch,
                        },
                      ]}
                      onPress={() => {
                        router.push({
                          pathname: '/(tabs)/new-booking',
                          params: { masterId: master.id },
                        });
                      }}
                    >
                      <MaterialCommunityIcons name="plus-circle-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.addScheduleText, { color: colors.textSecondary }]}>
                        {language === 'pl' ? 'Wolny dzień (+)' : 'Вільний день (+)'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={[
                        styles.emptySlotHatched,
                        {
                          top: 0,
                          height: HOUR_HEIGHT,
                          backgroundColor: colors.gridHatch,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name="calendar-blank-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.addScheduleText, { color: colors.textSecondary }]}>
                        {language === 'pl' ? 'Brak rezerwacji' : 'Немає записів'}
                      </Text>
                    </View>
                  )
                )}

                {/* Картки візитів, абсолютно позиціоновані за точним часом */}
                {appointments.map((item) => {
                  const { top, height } = calculateCardPosition(item.startTime, item.endTime);
                  return (
                    <AppointmentCard
                      key={item.id}
                      appointment={item}
                      top={top}
                      height={height}
                      onPress={() => setActiveAppointment(item)}
                    />
                  );
                })}
              </View>
            );
          })}

          {/* Червона динамічна лінія поточного часу */}
          <View
            style={[
              styles.currentTimeIndicator,
              { top: (currentMinutesFromStart / 60) * HOUR_HEIGHT },
            ]}
          >
            <View style={styles.redDot} />
            <View style={styles.redLine} />
          </View>
        </ScrollView>
      </ScrollView>

      {/* 4. НИЖНЯ ПЛАВАЮЧА ПАНЕЛЬ ВИБОРУ ДНЯ (динамічна навколо вибраної дати) */}
      <View
        style={[
          styles.bottomDateDock,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: 1 },
        ]}
        {...panResponder.panHandlers}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomDateScroll}>
          {daysList.map((item) => {
            const isActive = selectedDate === item.fullDate;
            return (
              <TouchableOpacity
                key={item.fullDate}
                style={[
                  styles.datePill,
                  isActive && [styles.datePillActive, { backgroundColor: colors.surfaceLight }],
                ]}
                onPress={() => setSelectedDate(item.fullDate)}
              >
                <Text
                  style={[
                    styles.datePillMonth,
                    { color: isActive ? colors.text : colors.textSecondary },
                    isActive && styles.datePillMonthActive,
                  ]}
                >
                  {item.month}
                </Text>
                <Text
                  style={[
                    styles.datePillDay,
                    { color: isActive ? colors.text : colors.textSecondary },
                    isActive && styles.datePillDayActive,
                  ]}
                >
                  {item.dayName}, {item.dayNum}
                </Text>
                {isActive && <View style={[styles.activeDotIndicator, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}

          {/* Іконка календаря справа — відкриває вибір будь-якої дати та місяця */}
          <TouchableOpacity
            style={[styles.bottomFilterButton, { backgroundColor: colors.surfaceLight }]}
            onPress={openDatePicker}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Діалог деталей запису при кліку на картку */}
      <Portal>
        <Dialog
          visible={!!activeAppointment}
          onDismiss={() => setActiveAppointment(null)}
          style={[
            styles.dialog,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: 1 },
          ]}
        >
          <Dialog.Title style={[styles.dialogTitle, { color: colors.text }]}>
            {language === 'pl' ? 'Szczegóły wizyty:' : 'Деталі запису:'} {activeAppointment?.startTime} - {activeAppointment?.endTime}
          </Dialog.Title>
          <Dialog.Content>
            {activeAppointment && (
              <View style={styles.dialogContent}>
                <Text style={[styles.dialogText, { color: colors.text }]}>
                  👤 <Text style={[styles.dialogBold, { color: colors.text }]}>{language === 'pl' ? 'Klient:' : 'Клієнт:'}</Text> {activeAppointment.clientName}
                </Text>
                <Text style={[styles.dialogText, { color: colors.text }]}>
                  📞 <Text style={[styles.dialogBold, { color: colors.text }]}>{language === 'pl' ? 'Telefon:' : 'Телефон:'}</Text> {activeAppointment.clientPhone}
                </Text>
                <Text style={[styles.dialogText, { color: colors.text }]}>
                  💅 <Text style={[styles.dialogBold, { color: colors.text }]}>{language === 'pl' ? 'Usługa:' : 'Послуга:'}</Text> {activeAppointment.serviceName}
                </Text>
                <Text style={[styles.dialogText, { color: colors.text }]}>
                  💰 <Text style={[styles.dialogBold, { color: colors.text }]}>{language === 'pl' ? 'Cena:' : 'Ціна:'}</Text> {activeAppointment.price} ₴
                </Text>
                <Text style={[styles.dialogText, { color: colors.text }]}>
                  💳 <Text style={[styles.dialogBold, { color: colors.text }]}>{language === 'pl' ? 'Status płatności:' : 'Статус оплати:'}</Text>{' '}
                  {activeAppointment.hasPayment ? (
                    <Text style={{ color: '#4CAF50', fontWeight: '700' }}>
                      {language === 'pl' ? '✓ Opłacono w kasie' : '✓ Сплачено в касі'}
                    </Text>
                  ) : (
                    <Text style={{ color: '#F59E0B', fontWeight: '700' }}>
                      {language === 'pl' ? '⏳ Oczekuje na płatność' : '⏳ Очікує оплати'}
                    </Text>
                  )}
                </Text>
                {activeAppointment.notes && (
                  <Text style={[styles.dialogText, { color: colors.text }]}>
                    📝 <Text style={[styles.dialogBold, { color: colors.text }]}>{language === 'pl' ? 'Uwagi:' : 'Примітки:'}</Text> {activeAppointment.notes}
                  </Text>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor="#4CAF50"
              onPress={async () => {
                if (activeAppointment) {
                  await apiClient.completeAppointment(activeAppointment.id, { status: 'COMPLETED' });
                  setGestureFeedback(
                    language === 'pl'
                      ? '✓ Status zaktualizowano przez PUT: Zakończono wizytę'
                      : '✓ Статус оновлено через PUT: Візит завершено'
                  );
                  setActiveAppointment(null);
                  fetchCalendarData();
                }
              }}
            >
              {language === 'pl' ? 'Zakończ wizytę (PUT)' : 'Завершити візит (PUT)'}
            </Button>
            <Button textColor={colors.textSecondary} onPress={() => setActiveAppointment(null)}>
              {language === 'pl' ? 'Zamknij' : 'Закрити'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Модальне вікно вибору дати та місяця */}
      <Modal visible={isDatePickerOpen} transparent animationType="fade">
        <View style={styles.datePickerOverlay}>
          <View
            style={[
              styles.datePickerCard,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: 1 },
            ]}
          >
            {/* Шапка календаря з перемикачем місяців */}
            <View style={styles.datePickerHeader}>
              <TouchableOpacity
                style={[styles.monthNavBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={() => {
                  setPickerMonth((prev) => {
                    if (prev === 0) {
                      setPickerYear((y) => y - 1);
                      return 11;
                    }
                    return prev - 1;
                  });
                }}
              >
                <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.datePickerTitle, { color: colors.text }]}>
                {monthNamesFull[pickerMonth]} {pickerYear}
              </Text>

              <TouchableOpacity
                style={[styles.monthNavBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={() => {
                  setPickerMonth((prev) => {
                    if (prev === 11) {
                      setPickerYear((y) => y + 1);
                      return 0;
                    }
                    return prev + 1;
                  });
                }}
              >
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Дні тижня */}
            <View style={styles.weekDaysRow}>
              {(language === 'pl'
                ? ['Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']
                : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
              ).map((day) => (
                <Text key={day} style={[styles.weekDayText, { color: colors.textSecondary }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Сітка днів місяця */}
            <View style={styles.monthGrid}>
              {monthCalendarDays.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDate;
                const isToday = cell.dateStr === toIsoDate(new Date());

                return (
                  <TouchableOpacity
                    key={`${cell.dateStr}-${idx}`}
                    style={[
                      styles.calendarDayCell,
                      isSelected && styles.calendarDayCellSelected,
                      isToday && !isSelected && styles.calendarDayCellToday,
                    ]}
                    onPress={() => {
                      setSelectedDate(cell.dateStr);
                      setIsDatePickerOpen(false);
                      const dObj = new Date(cell.dateStr + 'T12:00:00');
                      setGestureFeedback(
                        `📅 ${cell.day} ${monthNamesFull[dObj.getMonth()]} ${dObj.getFullYear()}`
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        { color: colors.text },
                        !cell.isCurrentMonth && [styles.calendarDayTextDimmed, { color: colors.textMuted }],
                        isSelected && styles.calendarDayTextSelected,
                        isToday && !isSelected && styles.calendarDayTextToday,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Швидкі кнопки */}
            <View style={[styles.datePickerActionsRow, { borderTopColor: colors.divider }]}>
              <TouchableOpacity
                style={[styles.quickDateBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={() => {
                  const todayStr = toIsoDate(new Date());
                  setSelectedDate(todayStr);
                  setIsDatePickerOpen(false);
                  setGestureFeedback(language === 'pl' ? '📅 Dzisiaj' : '📅 Сьогодні');
                }}
              >
                <Text style={[styles.quickDateBtnText, { color: colors.text }]}>
                  {language === 'pl' ? 'Dzisiaj' : 'Сьогодні'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.datePickerCloseBtn, { backgroundColor: colors.primary }]}
                onPress={() => setIsDatePickerOpen(false)}
              >
                <Text style={[styles.datePickerCloseBtnText, { color: '#000000' }]}>
                  {language === 'pl' ? 'Zamknij' : 'Закрити'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Сповіщення зворотного зв'язку жестів / акселерометра */}
      <Snackbar
        visible={!!gestureFeedback}
        onDismiss={() => setGestureFeedback(null)}
        duration={1500}
        style={styles.gestureSnackbar}
      >
        <Text style={styles.gestureSnackbarText}>{gestureFeedback}</Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 44, // Safe Area для статус-бару iPhone
  },
  // 1. Верхня шапка
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#000000',
  },
  dateNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dateNavArrow: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateDropdownText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scopeBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  scopeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // 2. Панель майстрів
  mastersHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    backgroundColor: '#000000',
  },
  groupIconContainer: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  groupCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#242426',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mastersScroll: {
    paddingRight: 16,
    gap: 10,
  },
  masterHeaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242426',
    width: 145,
  },
  masterHeaderItemActive: {
    borderColor: '#C68A2C',
    backgroundColor: '#222226',
  },
  masterTextInfo: {
    flex: 1,
  },
  masterNameText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // 3. Сітка розкладу
  verticalScroll: {
    flex: 1,
  },
  verticalScrollContent: {
    paddingBottom: 70, // Місце для плаваючої нижньої панелі
  },
  horizontalScroll: {
    position: 'relative',
  },
  timeScaleColumn: {
    width: TIME_COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#1A1A1A',
    backgroundColor: '#000000',
  },
  hourCell: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: 10,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  hourText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
    marginTop: -8, // Щоб текст 10:00 стояв рівно на лінії
  },
  masterColumn: {
    width: DEFAULT_COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#1A1A1A',
    position: 'relative',
    backgroundColor: '#000000',
  },
  gridRowLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  emptySlotHatched: {
    position: 'absolute',
    left: 2,
    right: 2,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addScheduleText: {
    color: '#8E8E93',
    fontSize: 10,
  },

  // Червона лінія поточного часу
  currentTimeIndicator: {
    position: 'absolute',
    left: TIME_COLUMN_WIDTH - 4,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
    pointerEvents: 'none',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  redLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#FF3B30',
  },

  // 4. Нижня плаваюча панель дати
  bottomDateDock: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 30,
  },
  bottomDateScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  datePillActive: {
    backgroundColor: '#2C2C2E',
  },
  datePillMonth: {
    fontSize: 10,
    color: '#8E8E93',
  },
  datePillMonthActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  datePillDay: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  datePillDayActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeDotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  bottomFilterButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },

  // Діалог
  dialog: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
  },
  dialogTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dialogContent: {
    gap: 8,
  },
  dialogText: {
    color: '#E5E5EA',
    fontSize: 14,
  },
  dialogBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gestureSnackbar: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 75,
  },
  gestureSnackbarText: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },

  // Модальне вікно вибору дати та місяця
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  datePickerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekDayText: {
    width: 38,
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarDayCellSelected: {
    backgroundColor: '#C68A2C',
  },
  calendarDayCellToday: {
    borderWidth: 1.5,
    borderColor: '#4CAF50',
  },
  calendarDayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarDayTextDimmed: {
    color: '#48484A',
  },
  calendarDayTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  datePickerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  quickDateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
  },
  quickDateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  datePickerCloseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#C68A2C',
  },
  datePickerCloseBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
});
