/**
 * Точна палітра темної теми салону EasyWeek / Svoya Nail Studio (за оригінальним макетом)
 */
export const Colors = {
  // Основні фони
  background: '#000000',      // Глибокий чорний фон екрану
  surface: '#121212',         // Фон елементів та панелей
  surfaceLight: '#1C1C1E',    // Плашки та кнопки
  gridBackground: '#0B0B0B',  // Фон сітки розкладу
  gridLine: '#1E1E1E',        // Сірі лінії часу та колонок
  gridHatch: '#161616',       // Фон для порожніх/неробочих слотів
  cardBorder: '#2C2C2E',      // Рамки полів
  divider: '#1A1A1A',         // Розділювачі

  // Тексти
  text: '#FFFFFF',            // Білий основний текст
  textSecondary: '#8E8E93',   // Світло-сірий для часу та підписів
  textMuted: '#636366',       // Приглушений сірий

  // Кольори карток візитів (в точності як на скріншоті EasyWeek)
  cardMustard: '#C68A2C',     // Гірчично-жовтий (майстер Вероніка)
  cardGreen: '#1E6B34',       // Темно-зелений (майстер Юлія)
  cardRed: '#C92A2A',         // Червоний (проблемні або скасовані записи)
  cardBlue: '#1971C2',        // Синій

  // Індикатори та статуси
  currentTimeLine: '#FF3B30', // Яскраво-червона лінія поточного часу
  primary: '#FFFFFF',         // Білий акцентний
  primaryDark: '#C68A2C',     // Золотий фірмовий
  primaryLight: '#E5A93C',    // Світлий золотий
  statusCompleted: '#30D158', // Зелений
  statusConfirmed: '#FFD60A', // Жовтий
  statusCancelled: '#FF453A', // Червоний
  statusPending: '#BF5AF2',   // Фіолетовий
  accentPlus: '#FFFFFF',      // Біла центральна кнопка "+"
  badgeGray: '#3A3A3C',       // Сірий бейдж кількості записів
};

/**
 * Світла тема салону (EasyWeek Light Edition)
 */
export const LightColors = {
  // Основні фони
  background: '#F8F9FA',      // Світло-сірий фон
  surface: '#FFFFFF',         // Білі картки
  surfaceLight: '#F2F2F7',    // Плашки кнопок та полів
  gridBackground: '#FFFFFF',  // Білий фон розкладу
  gridLine: '#E5E5EA',        // Світло-сірі лінії
  gridHatch: '#F2F2F7',       // Фон для неробочих слотів
  cardBorder: '#E5E5EA',      // Рамки полів
  divider: '#E5E5EA',         // Розділювачі

  // Тексти
  text: '#000000',            // Чорний текст
  textSecondary: '#6C6C70',   // Темно-сірий текст
  textMuted: '#8E8E93',       // Приглушений сірий

  // Кольори карток
  cardMustard: '#D97706',     // Теплий бурштиновий
  cardGreen: '#16A34A',       // Смарагдовий зелений
  cardRed: '#DC2626',         // Червоний
  cardBlue: '#2563EB',        // Синій

  // Індикатори та статуси
  currentTimeLine: '#FF3B30', // Червона лінія
  primary: '#000000',         // Чорний акцент
  primaryDark: '#B45309',     // Бурштиновий
  primaryLight: '#FBBF24',    // Світлий
  statusCompleted: '#16A34A', // Зелений
  statusConfirmed: '#CA8A04', // Жовтий
  statusCancelled: '#DC2626', // Червоний
  statusPending: '#9333EA',   // Фіолетовий
  accentPlus: '#000000',      // Чорна центральна кнопка
  badgeGray: '#E5E5EA',       // Сірий бейдж
};

export type ThemeColors = typeof Colors;

export function getThemeColors(isDark: boolean): ThemeColors {
  return isDark ? Colors : LightColors;
}

