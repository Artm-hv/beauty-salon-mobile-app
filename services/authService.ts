import { User, UserRole } from '../constants/types';

// Тестові облікові записи розробників для демонстрації викладачу
export const DEMO_ACCOUNTS: Record<string, User & { password: string }> = {
  master: {
    id: 'user-master-1',
    email: 'artem@svoya.ua',
    password: 'artem123',
    firstName: 'Артем',
    lastName: 'Гіжовський',
    name: 'Артем Гіжовський',
    phone: '+380689317049',
    role: 'MASTER',
  },
  admin: {
    id: 'user-admin-1',
    email: 'admin@svoya.ua',
    password: 'admin123',
    firstName: 'Артем',
    lastName: 'Гіжовський (Адмін)',
    name: 'Артем Гіжовський (Адміністратор)',
    phone: '+380681112233',
    role: 'ADMIN',
  },
  ihor: {
    id: 'user-ihor-1',
    email: 'ihor@svoya.ua',
    password: 'ihor123',
    firstName: 'Ігор',
    lastName: 'Намачинський',
    name: 'Ігор Намачинський',
    phone: '+380671234567',
    role: 'MASTER',
  },
  labunskyi: {
    id: 'user-labunskyi-1',
    email: 'labunskyi@svoya.ua',
    password: 'labunskyi123',
    firstName: 'Артем',
    lastName: 'Лабунський',
    name: 'Артем Лабунський',
    phone: '+380679876543',
    role: 'MASTER',
  },
  pending: {
    id: 'user-pending-1',
    email: 'pending@svoya.ua',
    password: 'pending123',
    firstName: 'Новий',
    lastName: 'Працівник',
    name: 'Новий Працівник',
    phone: '+380679998877',
    role: 'PENDING',
  },
};

// Збереження поточної сесії в пам'яті клієнта
let currentUserSession: User | null = DEMO_ACCOUNTS.master;

export const authService = {
  getCurrentUser: (): (User & { name: string }) | null => {
    if (!currentUserSession) return null;
    return {
      ...currentUserSession,
      name:
        currentUserSession.name ||
        `${currentUserSession.firstName} ${currentUserSession.lastName}`.trim(),
    };
  },

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

    try {
      // Відправляємо на сервер для збереження в спільній базі
      const candidates = ['http://127.0.0.1:8000/api', 'http://127.0.0.1:8081/api'];
      for (const base of candidates) {
        try {
          const res = await fetch(`${base}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser),
          });
          if (res.ok) break;
        } catch {}
      }
    } catch {}

    currentUserSession = newUser;
    return { success: true, user: newUser };
  },

  logout: () => {
    currentUserSession = null;
  },
};
