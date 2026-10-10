import { User, UserRole } from '../constants/types';

// Тестові облікові записи для миттєвої демонстрації на парах
export const DEMO_ACCOUNTS: Record<string, User & { password: string }> = {
  master: {
    id: 'user-master-1',
    email: 'master@svoya.ua',
    password: 'master123',
    firstName: 'Вероніка',
    lastName: 'Гіжовська',
    phone: '+380689317049',
    role: 'MASTER',
  },
  admin: {
    id: 'user-admin-1',
    email: 'admin@svoya.ua',
    password: 'admin123',
    firstName: 'Анастасія',
    lastName: 'Адміністратор',
    phone: '+380681112233',
    role: 'ADMIN',
  },
  pending: {
    id: 'user-pending-1',
    email: 'pending@svoya.ua',
    password: 'pending123',
    firstName: 'Оксана',
    lastName: 'Новачок',
    phone: '+380679998877',
    role: 'PENDING',
  },
};

// Збереження поточної сесії в пам'яті клієнта
let currentUserSession: User | null = DEMO_ACCOUNTS.master;

export const authService = {
  getCurrentUser: (): User | null => currentUserSession,

  setCurrentUser: (user: User | null) => {
    currentUserSession = user;
  },

  /**
   * Авторизація за email та паролем (Гібридний режим: реальний бекенд або Mock)
   */
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Спроба авторизації через локальні демо-дані
    const matchedKey = Object.keys(DEMO_ACCOUNTS).find(
      (k) => DEMO_ACCOUNTS[k].email.toLowerCase() === trimmedEmail
    );

    if (matchedKey) {
      const demoUser = DEMO_ACCOUNTS[matchedKey];
      if (demoUser.password === password) {
        const { password: _, ...userWithoutPass } = demoUser;
        currentUserSession = userWithoutPass;
        return { success: true, user: userWithoutPass };
      } else {
        return { success: false, error: 'Невірний пароль для демо-користувача' };
      }
    }

    // 2. Якщо введено довільний email - симулюємо успішний вхід як новий працівник
    const genericUser: User = {
      id: `user-${Date.now()}`,
      email: trimmedEmail,
      firstName: 'Співробітник',
      lastName: 'Салону',
      role: 'PENDING',
    };
    currentUserSession = genericUser;
    return { success: true, user: genericUser };
  },

  /**
   * Реєстрація нового користувача
   */
  register: async (userData: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: userData.email.trim().toLowerCase(),
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      phone: userData.phone.trim(),
      role: 'PENDING', // Новий зареєстрований співробітник завжди PENDING
    };

    currentUserSession = newUser;
    return { success: true, user: newUser };
  },

  logout: () => {
    currentUserSession = null;
  },
};
