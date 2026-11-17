import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  AppointmentItem,
  OrderItem,
  ClientItem,
  Master,
} from '../constants/salonTypes';
import { User, UserRole } from '../constants/types';

/**
 * Автоматичне визначення базової адреси REST API
 * Працює для:
 * 1. Web браузера (window.location.origin)
 * 2. Мобільних телефонів через Expo Tunnel / LAN (Constants.expoConfig?.hostUri)
 * 3. Локального сервера Python (порт 8000 / 8081)
 */
function getApiCandidates(): string[] {
  const candidates: string[] = [];

  // 1. Якщо Web у браузері
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    candidates.push(`${window.location.origin}/api`);
    candidates.push('http://127.0.0.1:8000/api');
    candidates.push('http://127.0.0.1:8081/api');
    return candidates;
  }

  // 2. Якщо мобільний телефон (Expo Go через Wi-Fi або Tunnel)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const isTunnel = hostUri.includes('exp.direct') || hostUri.includes('ngrok');
    const protocol = isTunnel ? 'https' : 'http';
    candidates.push(`${protocol}://${hostUri}/api`);

    // Також пробуємо порт 8000 для Python-сервера в локальній мережі
    const ipOnly = hostUri.split(':')[0];
    if (!isTunnel && ipOnly) {
      candidates.push(`http://${ipOnly}:8000/api`);
      candidates.push(`http://${ipOnly}:8081/api`);
    }
  }

  // 3. Fallbacks
  candidates.push('http://127.0.0.1:8000/api');
  candidates.push('http://127.0.0.1:8081/api');
  candidates.push('http://10.0.2.2:8000/api'); // Android Emulator

  return candidates;
}

// Remove private data cached by releases that predate server-backed sessions.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    for (const key of ['svoya_clients', 'svoya_appointments', 'svoya_orders']) window.localStorage.removeItem(key);
  } catch {
    // Browsers with storage disabled have no readable cache.
  }
}

let baseUrl: string | undefined;
let token: string | undefined;
let onUnauthorized = () => {};

export function configureSession(value?: string, expired = () => {}) {
  token = value;
  onUnauthorized = expired;
}

async function discover() {
  for (const base of new Set(getApiCandidates())) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
      const response = await fetch(base + '/health', { signal: controller.signal });
      if (response.ok && (await response.json()).app === 'Svoya Nail Studio') return base;
    } catch {
      // Try the next transport only during read-only discovery.
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('Сервер недоступний. Перевірте з’єднання.');
}

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export async function request<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  baseUrl ??= await discover();
  const session = token;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(baseUrl + path, {
      method, signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: 'Bearer ' + session } : {}) },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const result = await response.json();
    if (session !== token) throw new Error('Сеанс змінився');
    if (!response.ok) {
      if (response.status === 401 && session) onUnauthorized();
      throw new ApiError(response.status, result.error || 'Помилка сервера');
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  getMasters: () => request<Master[]>('/masters'),
  getClients: () => request<ClientItem[]>('/clients'),
  getBookings: () => request<AppointmentItem[]>('/bookings'),
  getAppointments: () => request<AppointmentItem[]>('/bookings'),
  getAppointment: (id: string) => request<AppointmentItem>('/bookings/' + encodeURIComponent(id)),
  getOrders: () => request<OrderItem[]>('/orders'),
  getUsers: () => request<User[]>('/users'),
  createBooking: (booking: Omit<AppointmentItem, 'id'> & { services: string[] }) =>
    request<AppointmentItem>('/bookings', 'POST', booking),
  updateAppointment: (id: string, changes: Partial<Pick<AppointmentItem, 'status' | 'photoUri' | 'masterId' | 'notes' | 'date' | 'startTime'>>) =>
    request<AppointmentItem>('/bookings/' + encodeURIComponent(id), 'PUT', changes),
  updateOrderStatus: (id: string, status: OrderItem['status']) =>
    request('/orders/' + encodeURIComponent(id), 'PUT', { status }),
  updateUserRole: (id: string, role: UserRole) => request('/users/' + encodeURIComponent(id), 'PUT', { role }),
  deleteUser: (id: string) => request('/users/' + encodeURIComponent(id), 'DELETE'),
  clearAllData: () => request('/reset', 'POST'),
  createClient: async (clientData: {
    name: string;
    phone: string;
    category?: 'ALL' | 'NEW' | 'VIP' | 'INACTIVE';
    tags?: string[];
  }): Promise<ClientItem> => {
    const newClient: ClientItem = {
      id: `c-${Date.now()}`,
      cnCode: `CN-${Math.floor(1000 + Math.random() * 9000)}`,
      name: clientData.name.trim(),
      phone: clientData.phone.trim() || '+380 00 000 0000',
      category: clientData.category || 'NEW',
      tags: clientData.tags || ['Новий клієнт'],
      visitCount: 0,
      averageCheck: 0,
      totalSpent: 0,
      lastVisitDate: '',
      avatarColor: ['#8B5CF6', '#10B981', '#38BDF8', '#EC4899', '#F59E0B'][
        Math.floor(Math.random() * 5)
      ],
    };

    return request<ClientItem>('/clients', 'POST', newClient);
  },
  importClientsDatabase: async (): Promise<ClientItem[]> => {
    const defaultClients: ClientItem[] = [
      {
        id: `c-${Date.now()}-1`,
        cnCode: 'CN-1024',
        name: 'Олена Коваленко',
        phone: '+380 67 111 2233',
        category: 'VIP',
        tags: ['VIP', 'Постійний'],
        visitCount: 12,
        averageCheck: 850,
        totalSpent: 10200,
        lastVisitDate: 'Вчора',
        avatarColor: '#EC4899',
      },
      {
        id: `c-${Date.now()}-2`,
        cnCode: 'CN-2048',
        name: 'Анастасія Шевченко',
        phone: '+380 50 222 3344',
        category: 'NEW',
        tags: ['Новий клієнт'],
        visitCount: 1,
        averageCheck: 700,
        totalSpent: 700,
        lastVisitDate: '3 дні тому',
        avatarColor: '#8B5CF6',
      },
      {
        id: `c-${Date.now()}-3`,
        cnCode: 'CN-3072',
        name: 'Марія Бондаренко',
        phone: '+380 63 333 4455',
        category: 'ALL',
        tags: ['Манікюр', 'Регулярний'],
        visitCount: 6,
        averageCheck: 750,
        totalSpent: 4500,
        lastVisitDate: '1 тиж тому',
        avatarColor: '#10B981',
      },
      {
        id: `c-${Date.now()}-4`,
        cnCode: 'CN-4096',
        name: 'Юлія Мельник',
        phone: '+380 97 444 5566',
        category: 'VIP',
        tags: ['VIP', 'Педикюр'],
        visitCount: 9,
        averageCheck: 1100,
        totalSpent: 9900,
        lastVisitDate: '2 тиж тому',
        avatarColor: '#F59E0B',
      },
      {
        id: `c-${Date.now()}-5`,
        cnCode: 'CN-5120',
        name: 'Тетяна Кравченко',
        phone: '+380 66 555 6677',
        category: 'NEW',
        tags: ['Новий клієнт'],
        visitCount: 0,
        averageCheck: 0,
        totalSpent: 0,
        lastVisitDate: 'Без візитів',
        avatarColor: '#38BDF8',
      },
      {
        id: `c-${Date.now()}-6`,
        cnCode: 'CN-6144',
        name: 'Софія Лисенко',
        phone: '+380 68 777 8899',
        category: 'INACTIVE',
        tags: ['Неактивний'],
        visitCount: 3,
        averageCheck: 600,
        totalSpent: 1800,
        lastVisitDate: '2 міс тому',
        avatarColor: '#6B7280',
      },
      {
        id: `c-${Date.now()}-7`,
        cnCode: 'CN-7168',
        name: 'Катерина Ткач',
        phone: '+380 99 888 9900',
        category: 'VIP',
        tags: ['VIP', 'Дизайн нігтів'],
        visitCount: 15,
        averageCheck: 950,
        totalSpent: 14250,
        lastVisitDate: '5 днів тому',
        avatarColor: '#EC4899',
      },
      {
        id: `c-${Date.now()}-8`,
        cnCode: 'CN-8192',
        name: 'Дар\'я Гончар',
        phone: '+380 73 999 1122',
        category: 'ALL',
        tags: ['SPA-догляд'],
        visitCount: 4,
        averageCheck: 800,
        totalSpent: 3200,
        lastVisitDate: '2 тиж тому',
        avatarColor: '#14B8A6',
      },
    ];

    const phones = new Set((await apiClient.getClients()).map(c => c.phone));
    for (const client of defaultClients) {
      if (!phones.has(client.phone)) await request('/clients', 'POST', client);
    }
    return apiClient.getClients();
  },
};
