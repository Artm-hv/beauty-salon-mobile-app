import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  MOCK_MASTERS,
  AppointmentItem,
  OrderItem,
  ClientItem,
  Master,
} from './mockData';

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

// Функція запиту з перебором робочих серверів та таймаутом
async function fetchWithFallback(endpoint: string, options: RequestInit = {}): Promise<Response | null> {
  const urls = getApiCandidates().map((base) => `${base}${endpoint}`);

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5с таймаут

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }
    } catch {
      // Пробуємо наступного кандидата
    }
  }
  return null;
}

// Персистентний стан у пам'яті / LocalStorage браузера
let memoryClients: ClientItem[] = [];
let memoryAppointments: AppointmentItem[] = [];
let memoryOrders: OrderItem[] = [];

// Спроба прочитати з localStorage (у браузері)
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedClients = window.localStorage.getItem('svoya_clients');
    if (savedClients) memoryClients = JSON.parse(savedClients);

    const savedAppts = window.localStorage.getItem('svoya_appointments');
    if (savedAppts) memoryAppointments = JSON.parse(savedAppts);

    const savedOrders = window.localStorage.getItem('svoya_orders');
    if (savedOrders) memoryOrders = JSON.parse(savedOrders);
  }
} catch {}

const persistState = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('svoya_clients', JSON.stringify(memoryClients));
      window.localStorage.setItem('svoya_appointments', JSON.stringify(memoryAppointments));
      window.localStorage.setItem('svoya_orders', JSON.stringify(memoryOrders));
    }
  } catch {}
};

/**
 * Шар абстракції REST API клієнта
 * Вимога предмету університету: 3 методи API (GET, POST, PUT)
 * Зона відповідальності: Розробник 2 (Артем Гіжовський)
 */
export const apiClient = {
  /**
   * 1. Метод GET: Отримання списку майстрів (GET /api/masters)
   * Майстри: Артем Гіжовський, Ігор Намачинський, Артем Лабунський
   */
  getMasters: async (): Promise<Master[]> => {
    try {
      const response = await fetchWithFallback('/masters', { method: 'GET' });
      if (response) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {}
    return MOCK_MASTERS;
  },

  /**
   * 1. Метод GET: Отримання CRM-бази клієнтів (GET /api/clients)
   */
  getClients: async (): Promise<ClientItem[]> => {
    try {
      const response = await fetchWithFallback('/clients', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response) {
        const data = await response.json();
        if (Array.isArray(data)) {
          memoryClients = data;
          persistState();
          return data;
        }
      }
    } catch {}
    return [...memoryClients];
  },

  /**
   * 2. Метод POST: Створення нового клієнта (POST /api/clients)
   */
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
      lastVisitDate: new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' }),
      avatarColor: ['#8B5CF6', '#10B981', '#38BDF8', '#EC4899', '#F59E0B'][
        Math.floor(Math.random() * 5)
      ],
    };

    try {
      const response = await fetchWithFallback('/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });
      if (response) {
        const serverData = await response.json();
        memoryClients = [serverData, ...memoryClients.filter((c) => c.id !== serverData.id)];
        persistState();
        return serverData;
      }
    } catch {}

    memoryClients = [newClient, ...memoryClients];
    persistState();
    return newClient;
  },

  /**
   * 3. Метод POST: Імпорт готової бази клієнтів (Імпорт бази)
   */
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

    try {
      for (const client of defaultClients) {
        await fetchWithFallback('/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(client),
        });
      }
    } catch {}

    const existingPhones = new Set(memoryClients.map((c) => c.phone));
    const toAdd = defaultClients.filter((c) => !existingPhones.has(c.phone));
    memoryClients = [...toAdd, ...memoryClients];
    persistState();
    return memoryClients;
  },

  /**
   * 1. Метод GET: Отримання розкладу візитів (GET /api/bookings)
   */
  getAppointments: async (): Promise<AppointmentItem[]> => {
    try {
      const response = await fetchWithFallback('/bookings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response) {
        const data = await response.json();
        if (Array.isArray(data)) {
          memoryAppointments = data;
          persistState();
          return data;
        }
      }
    } catch {}
    return [...memoryAppointments];
  },

  /**
   * 2. Метод POST: Створення нового бронювання / візиту (POST /api/bookings)
   */
  createBooking: async (bookingData: {
    masterId: string;
    clientName: string;
    clientPhone: string;
    serviceName: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
    notes?: string;
    colorType?: 'mustard' | 'green' | 'red' | 'blue';
  }): Promise<{ success: boolean; data: AppointmentItem }> => {
    const appointmentId = `b-${Date.now()}`;
    const newAppointment: AppointmentItem = {
      id: appointmentId,
      masterId: bookingData.masterId,
      clientName: bookingData.clientName,
      clientPhone: bookingData.clientPhone,
      serviceName: bookingData.serviceName,
      notes: bookingData.notes || '',
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      price: bookingData.price,
      colorType: bookingData.colorType || 'mustard',
      hasPayment: false,
      hasComment: !!bookingData.notes,
      isConfirmed: true,
    };

    // Автоматичне створення чека в касі для відповідності операції
    // Зв'язок: order.id = "ord-{appointmentId}" для синхронізації оплати
    const newOrder: OrderItem = {
      id: `ord-${appointmentId}`,
      orderNumber: `№${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'UNPAID',
      date: `${bookingData.date} ${bookingData.startTime}`,
      clientName: bookingData.clientName,
      clientPhone: bookingData.clientPhone,
      cashierName: 'Артем Гіжовський (Адміністратор)',
      itemsCount: 1,
      services: [bookingData.serviceName],
      totalAmount: bookingData.price,
      paymentMethod: 'CARD',
    };

    try {
      const response = await fetchWithFallback('/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment),
      });
      if (response) {
        const serverAppt = await response.json();
        memoryAppointments = [serverAppt, ...memoryAppointments.filter((b) => b.id !== serverAppt.id)];
        memoryOrders = [newOrder, ...memoryOrders];
        persistState();
        return { success: true, data: serverAppt };
      }
    } catch {}

    memoryAppointments = [newAppointment, ...memoryAppointments];
    memoryOrders = [newOrder, ...memoryOrders];
    persistState();
    return { success: true, data: newAppointment };
  },

  /**
   * 1. Метод GET: Отримання списку замовлень каси (GET /api/orders)
   */
  getOrders: async (): Promise<OrderItem[]> => {
    try {
      const response = await fetchWithFallback('/orders', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response) {
        const data = await response.json();
        if (Array.isArray(data)) {
          memoryOrders = data;
          persistState();
          return data;
        }
      }
    } catch {}
    return [...memoryOrders];
  },

  /**
   * 2. Метод POST: Створення швидкого чека в касі (POST /api/orders)
   */
  createOrder: async (orderData: Partial<OrderItem>): Promise<OrderItem> => {
    const newOrd: OrderItem = {
      id: `ord-${Date.now()}`,
      orderNumber: `№${Math.floor(1000 + Math.random() * 9000)}`,
      status: orderData.status || 'UNPAID',
      date: orderData.date || new Date().toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      clientName: orderData.clientName || 'Клієнт',
      clientPhone: orderData.clientPhone || '+380 00 000 0000',
      cashierName: orderData.cashierName || 'Артем Гіжовський (Адміністратор)',
      itemsCount: orderData.itemsCount || 1,
      services: orderData.services || ['Комплексний манікюр'],
      totalAmount: orderData.totalAmount || 700,
      paymentMethod: orderData.paymentMethod || 'CARD',
    };

    try {
      const response = await fetchWithFallback('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrd),
      });
      if (response) {
        const serverOrd = await response.json();
        memoryOrders = [serverOrd, ...memoryOrders];
        persistState();
        return serverOrd;
      }
    } catch {}

    memoryOrders = [newOrd, ...memoryOrders];
    persistState();
    return newOrd;
  },

  /**
   * 3. Метод PUT: Оновлення статусу візиту (PUT /api/bookings/{id})
   */
  completeAppointment: async (
    bookingId: string,
    payload: {
      status: 'COMPLETED' | 'CANCELLED';
      notes?: string;
    }
  ): Promise<{ success: boolean; updatedBooking?: any }> => {
    try {
      await fetchWithFallback(`/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {}

    // Оновлення в локальному стані
    memoryAppointments = memoryAppointments.map((item) => {
      if (item.id === bookingId) {
        return {
          ...item,
          hasPayment: payload.status === 'COMPLETED' ? true : item.hasPayment,
          notes: payload.notes || item.notes,
        };
      }
      return item;
    });
    persistState();

    return { success: true, updatedBooking: { id: bookingId, ...payload } };
  },

  /**
   * 3. Метод PUT: Оновлення статусу замовлення в касі (PUT /api/orders/{id})
   */
  updateOrderStatus: async (
    orderId: string,
    status: 'COMPLETED' | 'UNPAID' | 'CANCELLED'
  ): Promise<{ success: boolean }> => {
    try {
      await fetchWithFallback(`/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {}

    memoryOrders = memoryOrders.map((ord) => (ord.id === orderId ? { ...ord, status } : ord));

    // Якщо замовлення оплачено — синхронізувати статус у відповідному бронюванні (календарі)
    if (status === 'COMPLETED') {
      // Зв'язок: order.id = "ord-{bookingId}"
      const bookingId = orderId.startsWith('ord-') ? orderId.substring(4) : null;
      if (bookingId) {
        try {
          await fetchWithFallback(`/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'COMPLETED' }),
          });
        } catch {}

        memoryAppointments = memoryAppointments.map((item) => {
          if (item.id === bookingId || item.id === `b-${bookingId}`) {
            return { ...item, hasPayment: true, colorType: 'green' };
          }
          return item;
        });
      }
    }

    persistState();
    return { success: true };
  },

  /**
   * Очистити створені дані (скидання до чистого стану)
   */
  clearAllData: async () => {
    try {
      await fetchWithFallback('/reset', { method: 'POST' });
    } catch {}
    memoryClients = [];
    memoryAppointments = [];
    memoryOrders = [];
    persistState();
  },
};
