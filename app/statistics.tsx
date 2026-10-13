import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSettings } from '../context/AppSettingsContext';
import { MonthlyBarChart, DayStat } from '../components/MonthlyBarChart';
import { DonutChart } from '../components/DonutChart';
import { apiClient } from '../services/api';
import { authService } from '../services/authService';
import { AppointmentItem } from '../services/mockData';

// 5 реальних джерел бронювань, доступних у формі запису
const getBookingSourcesLegend = (lang: string) => [
  { id: 'instagram', name: 'Instagram', color: '#5B51D8' },
  { id: 'phone', name: lang === 'pl' ? 'Przez telefon' : 'По телефону', color: '#E3A857' },
  { id: 'onSite', name: lang === 'pl' ? 'Na miejscu' : 'На місці', color: '#E54D7A' },
  { id: 'onlineBooking', name: lang === 'pl' ? 'Rezerwacja online' : 'Онлайн-запис', color: '#2563EB' },
  { id: 'viber', name: 'Viber', color: '#45C4D9' },
];

const MONTHS_PL = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
];

const MONTHS_UA = [
  'січень', 'лютий', 'березень', 'квітень', 'травень', 'червень',
  'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень',
];

/**
 * Екран: Статистика та аналітика салону (EasyWeek)
 * Працює виключно на реальних даних із бази за обраний місяць
 * Доступно тільки для адміністратора
 */
export default function StatisticsScreen() {
  const router = useRouter();
  const { colors, t, language } = useAppSettings();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Маршрутний захист: статистика тільки для адміністратора
  useEffect(() => {
    if (!isAdmin) {
      router.replace('/(tabs)/settings');
    }
  }, [isAdmin]);

  // Динамічний вибір року та місяця
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(9); // 9 = Жовтень (0-indexed)

  const monthLabel = useMemo(() => {
    const list = language === 'pl' ? MONTHS_PL : MONTHS_UA;
    const name = list[selectedMonth];
    return `${name.charAt(0).toUpperCase() + name.slice(1)} ${selectedYear}`;
  }, [language, selectedMonth, selectedYear]);

  const sourcesLegend = useMemo(() => getBookingSourcesLegend(language), [language]);

  const [loading, setLoading] = useState(true);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [completedBookingsCount, setCompletedBookingsCount] = useState(0);
  const [chartDaysData, setChartDaysData] = useState<DayStat[]>([]);

  const [sourcesPercentages, setSourcesPercentages] = useState({
    instagram: 0,
    phone: 0,
    onSite: 0,
    onlineBooking: 0,
    viber: 0,
  });

  const [onlineSplit, setOnlineSplit] = useState(0);
  const [offlineSplit, setOfflineSplit] = useState(0);

  // Завантаження реальних даних з фільтрацією за обраний рік та місяць
  const loadRealAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const realBookings: AppointmentItem[] = await apiClient.getBookings();

      const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      const monthBookings = Array.isArray(realBookings)
        ? realBookings.filter((b) => b.date && b.date.startsWith(monthPrefix))
        : [];

      const total = monthBookings.length;
      const completed = monthBookings.filter((b) => b.hasPayment).length;

      setTotalBookingsCount(total);
      setCompletedBookingsCount(completed);

      // Генерація стовпчиків за всіма днями вибраного місяця
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const daysStats: DayStat[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const dayDate = `${monthPrefix}-${dayStr}`;
        const dayBookings = monthBookings.filter((b) => b.date === dayDate);
        daysStats.push({
          day: dayStr,
          total: dayBookings.length,
          completed: dayBookings.filter((b) => b.hasPayment).length,
        });
      }
      setChartDaysData(daysStats);

      // Підрахунок 5 реальних джерел бронювань
      let igCount = 0;
      let phoneCount = 0;
      let onSiteCount = 0;
      let onlineBookingCount = 0;
      let viberCount = 0;

      for (const b of monthBookings) {
        const src = (b.source || '').toLowerCase();
        if (src.includes('instagram')) igCount++;
        else if (src.includes('телефон') || src.includes('telefon') || src.includes('phone')) phoneCount++;
        else if (src.includes('онлайн') || src.includes('online') || src.includes('rezerwacja')) onlineBookingCount++;
        else if (src.includes('viber')) viberCount++;
        else if (src.includes('місц') || src.includes('miejsc')) onSiteCount++;
        else onSiteCount++;
      }

      if (total > 0) {
        const igPct = Number(((igCount / total) * 100).toFixed(1));
        const phPct = Number(((phoneCount / total) * 100).toFixed(1));
        const osPct = Number(((onSiteCount / total) * 100).toFixed(1));
        const obPct = Number(((onlineBookingCount / total) * 100).toFixed(1));
        const vbPct = Number((Math.max(0, 100 - igPct - phPct - osPct - obPct)).toFixed(1));

        setSourcesPercentages({
          instagram: igPct,
          phone: phPct,
          onSite: osPct,
          onlineBooking: obPct,
          viber: vbPct,
        });

        const onlineTotal = Number((igPct + obPct + vbPct).toFixed(1));
        const offlineTotal = Number((100 - onlineTotal).toFixed(1));
        setOnlineSplit(onlineTotal);
        setOfflineSplit(offlineTotal);
      } else {
        setSourcesPercentages({
          instagram: 0,
          phone: 0,
          onSite: 0,
          onlineBooking: 0,
          viber: 0,
        });
        setOnlineSplit(0);
        setOfflineSplit(0);
      }
    } catch {}
    setLoading(false);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadRealAnalytics();
  }, [loadRealAnalytics]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* 1. Верхній бар (Header) */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerSquareBtn, { backgroundColor: colors.surface }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text variant="titleMedium" style={[styles.headerTitle, { color: colors.text }]}>
          {t.analytics.title}
        </Text>

        <TouchableOpacity
          onPress={loadRealAnalytics}
          style={[styles.headerSquareBtn, { backgroundColor: colors.surface }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="refresh" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 2. Селектор періоду (без кнопки локації) */}
        <View style={styles.filterRow}>
          <View style={[styles.monthSelector, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrow} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: colors.text }]}>
              {monthLabel}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrow} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Горизонтальний скрол KPI карток */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiCardsRow}
        >
          {/* Картка 1: Всього записів */}
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
              {t.analytics.totalBookings}
            </Text>
            <View style={styles.kpiValueRow}>
              <Text style={[styles.kpiValue, { color: colors.text }]}>
                {totalBookingsCount}
              </Text>
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={colors.textSecondary}
                style={{ marginLeft: 6, marginTop: 4 }}
              />
            </View>
          </View>

          {/* Картка 2: Готово (Виконаних) */}
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
              {t.analytics.doneBadge}
            </Text>
            <View style={styles.kpiValueRow}>
              <Text style={[styles.kpiValue, { color: '#9CD323' }]}>
                {completedBookingsCount}
              </Text>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={18}
                color="#9CD323"
                style={{ marginLeft: 6, marginTop: 4 }}
              />
            </View>
          </View>
        </ScrollView>

        {/* 4. Стовпчастий графік динаміки записів по днях */}
        <View style={styles.chartSection}>
          <MonthlyBarChart
            data={chartDaysData}
            textColor={colors.textSecondary}
            gridLineColor={colors.divider}
          />

          {/* Легенда стовпчастого графіка */}
          <View style={styles.barChartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.colorSquare, { backgroundColor: '#00B2FE' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {t.analytics.totalBookings}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.colorSquare, { backgroundColor: '#9CD323' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {t.analytics.completedBookings}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Секція: Джерела записів */}
        <View style={styles.sourcesHeader}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
            {t.analytics.bookingSourcesTitle}
          </Text>
          <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {t.analytics.bookingSourcesSubtitle}
          </Text>
        </View>

        {/* Кільцева діаграма Donut Chart */}
        <DonutChart
          size={270}
          strokeWidth={48}
          innerBgColor={colors.background}
          segments={[
            { name: 'Instagram', percent: sourcesPercentages.instagram, color: '#5B51D8' },
            { name: language === 'pl' ? 'Przez telefon' : 'По телефону', percent: sourcesPercentages.phone, color: '#E3A857' },
            { name: language === 'pl' ? 'Na miejscu' : 'На місці', percent: sourcesPercentages.onSite, color: '#E54D7A' },
            { name: language === 'pl' ? 'Rezerwacja online' : 'Онлайн-запис', percent: sourcesPercentages.onlineBooking, color: '#2563EB' },
            { name: 'Viber', percent: sourcesPercentages.viber, color: '#45C4D9' },
          ]}
        />

        {/* Легенда 5 реальних джерел під діаграмою */}
        <View style={styles.sourcesGrid}>
          {sourcesLegend.map((source, index) => {
            const pct = sourcesPercentages[source.id as keyof typeof sourcesPercentages] || 0;
            return (
              <View key={index} style={styles.sourceGridItem}>
                <View style={[styles.colorSquareSmall, { backgroundColor: source.color }]} />
                <Text
                  style={[
                    styles.sourceGridName,
                    { color: colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {source.name} ({pct}%)
                </Text>
              </View>
            );
          })}
        </View>

        {/* 6. Секція: Онлайн / Офлайн записи */}
        <View style={[styles.sourcesHeader, { marginTop: 28 }]}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
            {t.analytics.onlineOfflineTitle}
          </Text>
          <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {t.analytics.onlineOfflineSubtitle}
          </Text>
        </View>

        {/* Прогрес-бар розподілу онлайн / офлайн */}
        <View style={[styles.splitBarWrapper, { backgroundColor: colors.surface }]}>
          <View style={[styles.splitBarOnline, { flex: Math.max(0.01, onlineSplit / 100) }]} />
          <View style={[styles.splitBarOffline, { flex: Math.max(0.01, offlineSplit / 100) }]} />
        </View>

        <View style={styles.splitLabelsRow}>
          <View style={styles.splitLabelCol}>
            <Text style={{ color: '#5B51D8', fontSize: 13, fontWeight: '700' }}>
              {onlineSplit}%
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              {t.analytics.onlineLabel}
            </Text>
          </View>
          <View style={[styles.splitLabelCol, { alignItems: 'flex-end' }]}>
            <Text style={{ color: '#E3A857', fontSize: 13, fontWeight: '700' }}>
              {offlineSplit}%
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              {t.analytics.offlineLabel}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerSquareBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 17,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flex: 1,
    justifyContent: 'space-between',
  },
  monthArrow: {
    padding: 4,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  kpiCardsRow: {
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    minWidth: 180,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  chartSection: {
    marginBottom: 24,
  },
  barChartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sourcesHeader: {
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  sourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 8,
  },
  sourceGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 6,
    gap: 6,
  },
  colorSquareSmall: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  sourceGridName: {
    fontSize: 12,
    fontWeight: '400',
  },
  splitBarWrapper: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 8,
  },
  splitBarOnline: {
    backgroundColor: '#5B51D8',
    height: '100%',
  },
  splitBarOffline: {
    backgroundColor: '#E3A857',
    height: '100%',
  },
  splitLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitLabelCol: {
    gap: 2,
  },
});
