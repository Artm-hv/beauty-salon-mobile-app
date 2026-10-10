import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

interface UseAccelerometerProps {
  onShakeRight?: () => void; // Рух праворуч -> +1 день
  onShakeLeft?: () => void;  // Рух ліворуч -> -1 день
  threshold?: number;        // Поріг чутливості (за замовчуванням 1.75g)
  cooldownMs?: number;       // Захисний інтервал між спрацьовуваннями (1000мс)
  enabled?: boolean;
}

/**
 * Хук для роботи з сенсором Акселерометра (expo-sensors)
 * Сенсор 2: Відстеження різкого струсу телефону для зміни дати
 * Зона відповідальності: Розробник 1 (Ігор)
 */
export function useAccelerometer({
  onShakeRight,
  onShakeLeft,
  threshold = 1.75,
  cooldownMs = 1000,
  enabled = true,
}: UseAccelerometerProps) {
  const lastTriggerTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Встановлюємо частоту опитування сенсора (100мс)
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(({ x }) => {
      const now = Date.now();
      // Перевірка cooldown, щоб уникнути багаторазового перемикання від одного струсу
      if (now - lastTriggerTime.current < cooldownMs) {
        return;
      }

      // Струс праворуч (різке прискорення по осі X > порогу)
      if (x > threshold && onShakeRight) {
        lastTriggerTime.current = now;
        onShakeRight();
      }
      // Струс ліворуч (різке прискорення по осі X < -порогу)
      else if (x < -threshold && onShakeLeft) {
        lastTriggerTime.current = now;
        onShakeLeft();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, threshold, cooldownMs, onShakeRight, onShakeLeft]);
}
