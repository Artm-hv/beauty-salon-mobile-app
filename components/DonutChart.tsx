import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface DonutSegment {
  name: string;
  percent: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  innerBgColor?: string;
}

/**
 * Кільцева діаграма (Donut Chart) для джерел бронювань
 * Точне відтворення макету EasyWeek (Скріншот №2)
 */
export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 260,
  strokeWidth = 46,
  innerBgColor = '#000000',
}) => {
  const innerSize = size - strokeWidth * 2;
  const totalPercent = segments.reduce((sum, s) => sum + (s.percent || 0), 0);

  if (totalPercent === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View
          style={[
            styles.outerRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: '#2C2C2E',
              borderWidth: strokeWidth,
            },
          ]}
        />
        <View
          style={[
            styles.hole,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: innerBgColor,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <Text style={{ color: '#8E8E93', fontSize: 13, fontWeight: '600' }}>0%</Text>
        </View>
      </View>
    );
  }

  // Знаходимо сегменти
  const seg1 = segments[0]; // Instagram
  const seg2 = segments[1]; // Phone
  const seg3 = segments[2]; // On-site
  const seg4 = segments[3]; // Online
  const seg5 = segments[4]; // Viber

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Зовнішній базовий круг */}
      <View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: seg1?.color || '#5B51D8',
            borderWidth: strokeWidth,
          },
        ]}
      />

      {/* Сектор 2 */}
      {seg2 && seg2.percent > 0 && (
        <View
          style={[
            styles.arcSector,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderBottomColor: seg2.color,
              borderLeftColor: seg2.color,
              transform: [{ rotate: '-15deg' }],
            },
          ]}
        />
      )}

      {/* Сектор 3 */}
      {seg3 && seg3.percent > 0 && (
        <View
          style={[
            styles.arcSector,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderTopColor: seg3.color,
              borderLeftColor: seg3.color,
              transform: [{ rotate: '40deg' }],
            },
          ]}
        />
      )}

      {/* Сектор 4 або 5 */}
      {seg5 && seg5.percent > 0 && (
        <View
          style={[
            styles.arcSector,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderTopColor: seg5.color,
              transform: [{ rotate: '78deg' }],
            },
          ]}
        />
      )}

      {/* Внутрішній отвір бублика */}
      <View
        style={[
          styles.hole,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: innerBgColor,
          },
        ]}
      />

      {/* Підписи відсотків */}
      {seg1 && seg1.percent > 0 && (
        <View style={[styles.labelBadge, { right: 28, top: '48%' }]}>
          <Text style={styles.percentText}>{seg1.percent}%</Text>
        </View>
      )}

      {seg2 && seg2.percent > 0 && (
        <View style={[styles.labelBadge, { left: 48, bottom: 42 }]}>
          <Text style={styles.percentText}>{seg2.percent}%</Text>
        </View>
      )}

      {seg3 && seg3.percent > 0 && (
        <View style={[styles.labelBadge, { left: 52, top: 46 }]}>
          <Text style={styles.percentText}>{seg3.percent}%</Text>
        </View>
      )}

      {seg5 && seg5.percent > 0 && (
        <View style={[styles.labelBadge, { left: '42%', top: 12 }]}>
          <Text style={[styles.percentText, { fontSize: 11 }]}>{seg5.percent}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 18,
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
  },
  arcSector: {
    position: 'absolute',
  },
  hole: {
    position: 'absolute',
  },
  labelBadge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  percentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
