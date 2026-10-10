import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppointmentItem } from '../services/mockData';
import { Colors } from '../constants/colors';

interface AppointmentCardProps {
  appointment: AppointmentItem;
  top: number;
  height: number;
  onPress?: () => void;
}

/**
 * Картка візиту в точній відповідності до дизайну EasyWeek
 */
export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  top,
  height,
  onPress,
}) => {
  // Визначення кольору фону картки за типом
  const getBackgroundColor = () => {
    switch (appointment.colorType) {
      case 'mustard':
        return Colors.cardMustard;
      case 'green':
        return Colors.cardGreen;
      case 'red':
        return Colors.cardRed;
      default:
        return Colors.cardBlue;
    }
  };

  const backgroundColor = getBackgroundColor();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.cardContainer,
        {
          top,
          height: Math.max(height - 2, 38), // Запобігаємо занадто маленькій висоті
          backgroundColor,
        },
      ]}
    >
      {/* 1. Верхній рядок: Час + Круглі бейджі ($ 💬 ✔) */}
      <View style={styles.topRow}>
        <Text style={styles.timeText}>
          {appointment.startTime}-{appointment.endTime}
        </Text>

        <View style={styles.badgesRow}>
          {appointment.hasPayment && (
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="currency-usd" size={11} color={backgroundColor} />
            </View>
          )}
          {appointment.hasComment && (
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="message-text" size={10} color={backgroundColor} />
            </View>
          )}
          {appointment.isConfirmed && (
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="check" size={11} color={backgroundColor} />
            </View>
          )}
        </View>
      </View>

      {/* 2. Ім'я клієнта та телефон */}
      <Text numberOfLines={2} style={styles.clientName}>
        {appointment.clientName}
      </Text>

      {/* 3. Назва послуги */}
      <Text numberOfLines={2} style={styles.serviceName}>
        {appointment.serviceName}
      </Text>

      {/* Примітки (якщо є) */}
      {appointment.notes && (
        <Text numberOfLines={1} style={styles.notesText}>
          {appointment.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 5,
    padding: 5,
    overflow: 'hidden',
    zIndex: 5,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  iconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientName: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 14,
    marginTop: 1,
  },
  serviceName: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10.5,
    fontStyle: 'italic',
    lineHeight: 13,
    marginTop: 2,
  },
  notesText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9.5,
    lineHeight: 12,
  },
});
