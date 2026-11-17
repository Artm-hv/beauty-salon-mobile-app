import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';

export interface DayStat {
  day: string;
  total: number;
  completed: number;
}

// Початкові показники за днями місяця згідно з фотографією (Скріншот №1)
export const DEFAULT_OCTOBER_DAYS_STATS: DayStat[] = [
  { day: '01', total: 9, completed: 9 },
  { day: '02', total: 28, completed: 23 },
  { day: '03', total: 21, completed: 20 },
  { day: '04', total: 12, completed: 11 },
  { day: '05', total: 22, completed: 21 },
  { day: '06', total: 16, completed: 16 },
  { day: '07', total: 11, completed: 11 },
  { day: '08', total: 17, completed: 15 },
  { day: '09', total: 15, completed: 14 },
  { day: '10', total: 19, completed: 18 },
  { day: '11', total: 10, completed: 10 },
  { day: '12', total: 12, completed: 12 },
  { day: '13', total: 15, completed: 15 },
  { day: '14', total: 14, completed: 0 },
  { day: '15', total: 16, completed: 0 },
  { day: '16', total: 11, completed: 0 },
  { day: '17', total: 7, completed: 0 },
  { day: '18', total: 6, completed: 0 },
  { day: '19', total: 6, completed: 0 },
  { day: '20', total: 10, completed: 0 },
  { day: '21', total: 4, completed: 0 },
  { day: '22', total: 2, completed: 0 },
  { day: '23', total: 5, completed: 0 },
  { day: '24', total: 4, completed: 0 },
  { day: '25', total: 4, completed: 0 },
  { day: '26', total: 6, completed: 0 },
  { day: '27', total: 2, completed: 0 },
  { day: '28', total: 0, completed: 0 },
  { day: '29', total: 6, completed: 0 },
  { day: '30', total: 0, completed: 0 },
  { day: '31', total: 5, completed: 0 },
];

const CHART_HEIGHT = 160;

interface MonthlyBarChartProps {
  data?: DayStat[];
  textColor?: string;
  gridLineColor?: string;
}

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({
  data = DEFAULT_OCTOBER_DAYS_STATS,
  textColor = '#8E8E93',
  gridLineColor = '#1C1C1E',
}) => {
  const peak = Math.max(1, ...data.map(day => Math.max(day.total, day.completed)));
  const step = Math.ceil(peak / 5);
  const maximum = step * 5;
  const ticks = [5, 4, 3, 2, 1, 0].map(i => i * step);
  return (
    <View style={styles.chartWrapper}>
      {/* Головна область графіка з фіксованою висотою */}
      <View style={styles.chartMain}>
        {/* Вісь Y зі значеннями */}
        <View style={styles.yAxis}>
          {ticks.map((tick, index) => (
            <View key={index} style={[styles.yTickRow, { top: CHART_HEIGHT * (1 - tick / maximum) - 10 }]}>
              <Text style={[styles.yTickText, { color: textColor }]}>
                {tick}
              </Text>
            </View>
          ))}
        </View>

        {/* Область стовпчиків з горизонтальним скролом */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollStyle}
          contentContainerStyle={styles.barsContainer}
        >
          {data.map((item, idx) => {
            const totalHeight = (item.total / maximum) * CHART_HEIGHT;
            const completedHeight = (item.completed / maximum) * CHART_HEIGHT;

            const isLabelVisible = parseInt(item.day, 10) % 2 === 1;

            return (
              <View key={idx} style={styles.barGroup}>
                {/* Контейнер стовпчиків даного дня */}
                <View style={styles.barsColumn}>
                  {/* Блакитний стовпчик (Усього записів) */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: totalHeight,
                        backgroundColor: '#00B2FE',
                      },
                    ]}
                  />
                  {/* Салатовий стовпчик (Виконаних) */}
                  {completedHeight > 0 && (
                    <View
                      style={[
                        styles.bar,
                        {
                          height: completedHeight,
                          backgroundColor: '#9CD323',
                        },
                      ]}
                    />
                  )}
                </View>

                {/* Підпис дня (01, 03, 05...) */}
                <View style={styles.xLabelContainer}>
                  {isLabelVisible ? (
                    <Text style={[styles.xLabelText, { color: textColor }]}>
                      {item.day}
                    </Text>
                  ) : (
                    <View style={{ height: 16 }} />
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Нижня лінія осі */}
      <View style={[styles.bottomBaseline, { backgroundColor: gridLineColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  chartWrapper: {
    marginVertical: 14,
    paddingVertical: 8,
  },
  chartMain: {
    flexDirection: 'row',
    height: CHART_HEIGHT + 24,
    alignItems: 'flex-start',
  },
  yAxis: {
    width: 36,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  yTickRow: {
    position: 'absolute',
    right: 6,
    height: 20,
    justifyContent: 'center',
  },
  yTickText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollStyle: {
    flex: 1,
    height: CHART_HEIGHT + 24,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: CHART_HEIGHT + 24,
    paddingRight: 24,
  },
  barGroup: {
    width: 14,
    height: CHART_HEIGHT + 24,
    alignItems: 'center',
    marginHorizontal: 1,
    justifyContent: 'flex-start',
  },
  barsColumn: {
    width: 14,
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 1.5,
  },
  bar: {
    width: 4.5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  xLabelContainer: {
    height: 20,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xLabelText: {
    fontSize: 9,
    fontWeight: '700',
    transform: [{ rotate: '-45deg' }],
  },
  bottomBaseline: {
    height: 1,
    marginLeft: 36,
    marginTop: 2,
  },
});
