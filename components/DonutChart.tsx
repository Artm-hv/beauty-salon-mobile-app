import React from 'react';
import { View, Text } from 'react-native';

import Svg, { Circle } from 'react-native-svg';

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
  const slices = segments.filter(segment => segment.percent > 0);
  const total = slices.reduce((sum, segment) => sum + segment.percent, 0);
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <View style={{ width: size, height: size, marginVertical: 18, alignSelf: 'center',
      alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={center} cy={center} r={radius} strokeWidth={strokeWidth}
          fill={innerBgColor} stroke={slices[0]?.color ?? '#2C2C2E'} />
        {slices.map(segment => {
          const length = circumference * segment.percent / total;
          const startAngle = -90 + offset * 360 / total;
          offset += segment.percent;
          if (segment === slices[0]) return null;
          return <Circle key={segment.name} cx={center} cy={center} r={radius} fill="none"
            stroke={segment.color} strokeWidth={strokeWidth}
            strokeDasharray={[length, circumference - length]}
            transform={`rotate(${startAngle} ${center} ${center})`} />;
        })}
      </Svg>
      {total === 0 && <Text style={{ color: '#8E8E93' }}>0%</Text>}
    </View>
  );
};
