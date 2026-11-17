import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

interface UseAccelerometerProps {
  onShakeRight?: () => void; // Рух / нахил праворуч -> наступний день
  onShakeLeft?: () => void;  // Рух / нахил ліворуч -> попередній день
  threshold?: number;        // Поріг чутливості (0.85g для плавного жесту без конфлікту з Dev Menu)
  cooldownMs?: number;       // Захисний інтервал між спрацьовуваннями (700мс)
  enabled?: boolean;
}

/**
 * Хук для роботи з сенсором Акселерометра (expo-sensors)
 * Сенсор 2: Відстеження горизонтального нахилу/фліку телефону вліво-вправо для зміни дати
 * Зона відповідальності: Розробник 1 (Ігор)
 */
export function useAccelerometer({
  onShakeRight,
  onShakeLeft,
  threshold = 0.85,
  cooldownMs = 700,
  enabled = true,
}: UseAccelerometerProps) {
  const lastTriggerTime = useRef<number>(0);
  const prevX = useRef<number>(0);

  useEffect(() => {
    // На веб-платформі (браузер) акселерометр відсутній
    if (!enabled || Platform.OS === 'web') return;

    try {
      // Встановлюємо частоту опитування сенсора (100мс)
      Accelerometer.setUpdateInterval(100);

      const subscription = Accelerometer.addListener(({ x }) => {
      const now = Date.now();
      if (now - lastTriggerTime.current < cooldownMs) {
        prevX.current = x;
        return;
      }

      const deltaX = x - prevX.current;
      prevX.current = x;

      // Рух або плавний нахил праворуч (x > threshold або сплеск deltaX > 0.7)
      if ((x > threshold || deltaX > 0.7) && onShakeRight) {
        lastTriggerTime.current = now;
        onShakeRight();
      }
        // Рух або плавний нахил ліворуч (x < -threshold або сплеск deltaX < -0.7)
        else if ((x < -threshold || deltaX < -0.7) && onShakeLeft) {
          lastTriggerTime.current = now;
          onShakeLeft();
        }
      });

      return () => {
        subscription.remove();
      };
    } catch {
      return undefined;
    }
  }, [enabled, threshold, cooldownMs, onShakeRight, onShakeLeft]);
}
