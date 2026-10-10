import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import {
  Text,
  Surface,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { AppointmentCard } from '../../components/AppointmentCard';
import {
  MOCK_APPOINTMENTS,
  MOCK_MASTERS,
  AppointmentItem,
  Master,
} from '../../services/mockData';
import { useAccelerometer } from '../../hooks/useAccelerometer';

// Години сітки (від 10:00 до 21:00 як на скріншоті EasyWeek)
const START_HOUR = 10;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => `${START_HOUR + i}:00`);

const HOUR_HEIGHT = 85;       // Висота однієї години в пікселях
const COLUMN_WIDTH = 155;     // Ширина колонки майстра
const TIME_COLUMN_WIDTH = 52; // Ширина шкали годин

// Список днів для нижньої смуги вибору дати
const DAYS_LIST = [
  { dayNum: 10, dayName: 'Сб', month: 'Жовт', fullDate: '2026-10-10' },
  { dayNum: 11, dayName: 'Нд', month: 'Жовт', fullDate: '2026-10-11' },
  { dayNum: 12, dayName: 'Пн', month: 'Жовт', fullDate: '2026-10-12' },
  { dayNum: 13, dayName: 'Вт', month: 'Жовт', fullDate: '2026-10-13' },
  { dayNum: 14, dayName: 'Ср', month: 'Жовт', fullDate: '2026-10-14' },
];

/**
 * Екран 3: Календар і розклад майстрів (EasyWeek Dark Edition)
 * Зона відповідальності: Розробник 1 (Ігор)
 */
export default function CalendarScreen() {
  // Вибраний день (за замовчуванням 10 жовтня 2026)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);

  // Діалог деталей візиту
  const [activeAppointment, setActiveAppointment] = useState<AppointmentItem | null>(null);

  // Поточний час для динамічної червоної лінії
  const [currentMinutesFromStart, setCurrentMinutesFromStart] = useState<number>(() => {
    // Якщо зараз реальний час між 10:00 і 21:00 - беремо реальний, інакше демо-час 20:01 як на скріншоті
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

  // Сенсор 2: Акселерометр - перемикання дня струшуванням
  useAccelerometer({
    onShakeRight: () => {
      setSelectedDayIndex((prev) => Math.min(prev + 1, DAYS_LIST.length - 1));
    },
    onShakeLeft: () => {
      setSelectedDayIndex((prev) => Math.max(prev - 1, 0));
    },
  });

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

  const currentSelectedDay = DAYS_LIST[selectedDayIndex];

  // Фільтрація майстрів для відображення
  const displayedMasters = useMemo(() => {
    if (selectedMasterId) {
      return MOCK_MASTERS.filter((m) => m.id === selectedMasterId);
    }
    return MOCK_MASTERS;
  }, [selectedMasterId]);

  return (
    <View style={styles.rootContainer}>
      {/* 1. ВЕРХНЯ ШАПКА: Заголовок дати + Перемикачі режимів */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.dateDropdownButton} activeOpacity={0.8}>
          <Text style={styles.dateDropdownText}>
            {currentSelectedDay.dayNum} жовтня
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Кнопки режимів (Сітка, Список, Фільтр) */}
        <View style={styles.modeButtonGroup}>
          <TouchableOpacity
            style={[styles.modeButton, viewMode === 'grid' && styles.modeButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <MaterialCommunityIcons
              name="view-grid-outline"
              size={18}
              color={viewMode === 'grid' ? '#FFFFFF' : '#8E8E93'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, viewMode === 'list' && styles.modeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={18}
              color={viewMode === 'list' ? '#FFFFFF' : '#8E8E93'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeButton}>
            <MaterialCommunityIcons name="tune-vertical" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. ПАНЕЛЬ МАЙСТРІВ З АВАТАРАМИ ТА БЕЙДЖАМИ КІЛЬКОСТІ */}
      <View style={styles.mastersHeaderBar}>
        {/* Кнопка "Усі майстри / Група" */}
        <TouchableOpacity
          style={styles.groupIconContainer}
          onPress={() => setSelectedMasterId(null)}
        >
          <View style={styles.groupCircle}>
            <MaterialCommunityIcons name="account-group" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mastersScroll}>
          {MOCK_MASTERS.map((master) => {
            const isSelected = selectedMasterId === master.id;
            return (
              <TouchableOpacity
                key={master.id}
                style={[styles.masterHeaderItem, isSelected && styles.masterHeaderItemActive]}
                onPress={() => setSelectedMasterId(isSelected ? null : master.id)}
              >
                <Image source={{ uri: master.avatarUrl }} style={styles.masterAvatar} />
                <View style={styles.masterTextInfo}>
                  <Text numberOfLines={1} style={styles.masterNameText}>
                    {master.shortName}
                  </Text>
                  <Text numberOfLines={1} style={styles.masterSpecialtyText}>
                    {master.specialty}
                  </Text>
                </View>
                {master.appointmentCount > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{master.appointmentCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. ОСНОВНА СІТКА РОЗКЛАДУ */}
      <ScrollView style={styles.verticalScroll} contentContainerStyle={styles.verticalScrollContent}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {/* Ліва шкала годин (10:00 - 21:00) */}
          <View style={styles.timeScaleColumn}>
            {HOURS.map((hour) => (
              <View key={hour} style={[styles.hourCell, { height: HOUR_HEIGHT }]}>
                <Text style={styles.hourText}>{hour}</Text>
              </View>
            ))}
          </View>

          {/* Колонки майстрів */}
          {displayedMasters.map((master) => {
            const appointments = MOCK_APPOINTMENTS.filter((a) => a.masterId === master.id);

            return (
              <View key={master.id} style={styles.masterColumn}>
                {/* Горизонтальні розділювальні лінії сітки годин */}
                {HOURS.map((hour) => (
                  <View key={hour} style={[styles.gridRowLine, { height: HOUR_HEIGHT }]} />
                ))}

                {/* Якщо у майстра немає записів на 10:00 (як у Вероніки на скріншоті) */}
                {master.id === 'master-1' && (
                  <View style={[styles.emptySlotHatched, { top: 0, height: HOUR_HEIGHT }]}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#8E8E93" />
                    <Text style={styles.addScheduleText}>Додати розклад</Text>
                  </View>
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

      {/* 4. НИЖНЯ ПЛАВАЮЧА ПАНЕЛЬ ВИБОРУ ДНЯ (Жовт Сб, 10 | Нд, 11...) */}
      <View style={styles.bottomDateDock}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomDateScroll}>
          {DAYS_LIST.map((item, index) => {
            const isActive = selectedDayIndex === index;
            return (
              <TouchableOpacity
                key={item.dayNum}
                style={[styles.datePill, isActive && styles.datePillActive]}
                onPress={() => setSelectedDayIndex(index)}
              >
                <Text style={[styles.datePillMonth, isActive && styles.datePillMonthActive]}>
                  {item.month}
                </Text>
                <Text style={[styles.datePillDay, isActive && styles.datePillDayActive]}>
                  {item.dayName}, {item.dayNum}
                </Text>
                {isActive && <View style={styles.activeDotIndicator} />}
              </TouchableOpacity>
            );
          })}

          {/* Іконка фільтра справа */}
          <TouchableOpacity style={styles.bottomFilterButton}>
            <MaterialCommunityIcons name="tune-variant" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Діалог деталей запису при кліку на картку */}
      <Portal>
        <Dialog
          visible={!!activeAppointment}
          onDismiss={() => setActiveAppointment(null)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            Деталі запису: {activeAppointment?.startTime} - {activeAppointment?.endTime}
          </Dialog.Title>
          <Dialog.Content>
            {activeAppointment && (
              <View style={styles.dialogContent}>
                <Text style={styles.dialogText}>
                  👤 <Text style={styles.dialogBold}>Клієнт:</Text> {activeAppointment.clientName}
                </Text>
                <Text style={styles.dialogText}>
                  📞 <Text style={styles.dialogBold}>Телефон:</Text> {activeAppointment.clientPhone}
                </Text>
                <Text style={styles.dialogText}>
                  💅 <Text style={styles.dialogBold}>Послуга:</Text> {activeAppointment.serviceName}
                </Text>
                <Text style={styles.dialogText}>
                  💰 <Text style={styles.dialogBold}>Ціна:</Text> {activeAppointment.price} ₴
                </Text>
                {activeAppointment.notes && (
                  <Text style={styles.dialogText}>
                    📝 <Text style={styles.dialogBold}>Примітки:</Text> {activeAppointment.notes}
                  </Text>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#C68A2C" onPress={() => setActiveAppointment(null)}>
              Закрити
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  modeButtonGroup: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 3,
  },
  modeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: '#2C2C2E',
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
    backgroundColor: '#121212',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#242426',
    width: 145,
  },
  masterHeaderItemActive: {
    borderColor: '#C68A2C',
  },
  masterAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 6,
  },
  masterTextInfo: {
    flex: 1,
  },
  masterNameText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  masterSpecialtyText: {
    color: '#8E8E93',
    fontSize: 9.5,
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
    width: COLUMN_WIDTH,
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
});
