export interface Master {
  id: string;
  name: string;
  shortName: string;
  specialty: string;
  avatarUrl: string;
  appointmentCount: number;
}

export interface AppointmentItem {
  id: string;
  masterId: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  notes?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  price: number;
  colorType: 'mustard' | 'green' | 'red' | 'blue';
  hasPayment?: boolean;
  hasComment?: boolean;
  isConfirmed?: boolean;
}

// Реальні майстри з інтерфейсу EasyWeek "Svoya Nail Studio"
export const MOCK_MASTERS: Master[] = [
  {
    id: 'master-1',
    name: 'Гіжовська Вероніка',
    shortName: 'Гіжовська ...',
    specialty: 'Топ-майстер',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
    appointmentCount: 0,
  },
  {
    id: 'master-2',
    name: 'Юлія Півень',
    shortName: 'Юлія Пі...',
    specialty: 'Майсте...',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    appointmentCount: 7,
  },
  {
    id: 'master-3',
    name: 'Таня Майстер',
    shortName: 'Таня',
    specialty: 'Майсте...',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces',
    appointmentCount: 6,
  },
];

// Точні записи зі скріншоту салону
export const MOCK_APPOINTMENTS: AppointmentItem[] = [
  // Записи для майстра 2 (Юлія Півень) - Гірчичні картки
  {
    id: 'b-1',
    masterId: 'master-2',
    clientName: 'Ірина',
    clientPhone: '+380985962491',
    serviceName: 'Манікюр (чистка)',
    notes: 'зняття',
    date: '2026-10-10',
    startTime: '10:00',
    endTime: '11:00',
    price: 650,
    colorType: 'mustard',
    hasPayment: true,
    hasComment: true,
    isConfirmed: true,
  },
  {
    id: 'b-2',
    masterId: 'master-2',
    clientName: "Мар'яна",
    clientPhone: '+380978832100',
    serviceName: 'Манікюр (чистка)',
    date: '2026-10-10',
    startTime: '11:00',
    endTime: '11:30',
    price: 350,
    colorType: 'mustard',
    hasPayment: true,
    hasComment: false,
    isConfirmed: true,
  },
  {
    id: 'b-3',
    masterId: 'master-2',
    clientName: 'Вероніка 7049 Гіжовська',
    clientPhone: '+380689317049',
    serviceName: 'Комплекс гелева-корекція',
    date: '2026-10-10',
    startTime: '11:30',
    endTime: '13:30',
    price: 1100,
    colorType: 'mustard',
    hasPayment: true,
    hasComment: false,
    isConfirmed: true,
  },
  {
    id: 'b-4',
    masterId: 'master-2',
    clientName: 'ірина. проблеми з записом. уважніше',
    clientPhone: '+380989484470',
    serviceName: 'Комплекс гель лак',
    date: '2026-10-10',
    startTime: '13:30',
    endTime: '15:00',
    price: 750,
    colorType: 'mustard',
    hasPayment: true,
    hasComment: false,
    isConfirmed: true,
  },
  {
    id: 'b-5',
    masterId: 'master-2',
    clientName: 'Юлія',
    clientPhone: '+380976478152',
    serviceName: 'повна чистка\n+зняття',
    date: '2026-10-10',
    startTime: '15:00',
    endTime: '16:15',
    price: 700,
    colorType: 'red', // Червоний бейдж уваги
    hasPayment: true,
    hasComment: true,
    isConfirmed: true,
  },

  // Записи для майстра 3 (Таня) - Зелені картки
  {
    id: 'b-6',
    masterId: 'master-3',
    clientName: 'Анастасія',
    clientPhone: '+380971084044',
    serviceName: 'Експрес манікюр',
    date: '2026-10-10',
    startTime: '10:00',
    endTime: '11:20',
    price: 600,
    colorType: 'green',
    hasPayment: true,
    hasComment: false,
    isConfirmed: true,
  },
  {
    id: 'b-7',
    masterId: 'master-3',
    clientName: 'Лариса 0278',
    clientPhone: '+380500700278',
    serviceName: 'Комплекс гель лак',
    date: '2026-10-10',
    startTime: '11:30',
    endTime: '13:15',
    price: 850,
    colorType: 'green',
    hasPayment: true,
    hasComment: false,
    isConfirmed: true,
  },
  {
    id: 'b-8',
    masterId: 'master-3',
    clientName: 'Вероніка 7049 Гіжов...',
    clientPhone: '+380689317049',
    serviceName: 'чистка пальчики\n+зняття',
    date: '2026-10-10',
    startTime: '13:30',
    endTime: '14:15',
    price: 500,
    colorType: 'red',
    hasPayment: true,
    hasComment: true,
    isConfirmed: true,
  },
  {
    id: 'b-9',
    masterId: 'master-3',
    clientName: 'Лєна 1999 Свистун',
    clientPhone: '+380931234567',
    serviceName: 'манікюр',
    date: '2026-10-10',
    startTime: '15:15',
    endTime: '16:00',
    price: 450,
    colorType: 'green',
    hasPayment: true,
    hasComment: false,
    isConfirmed: true,
  },
  {
    id: 'b-10',
    masterId: 'master-3',
    clientName: 'Оля +380991307659',
    clientPhone: '+380991307659',
    serviceName: 'комплекс корекція',
    date: '2026-10-10',
    startTime: '16:00',
    endTime: '18:30',
    price: 900,
    colorType: 'green',
    hasPayment: true,
    hasComment: false,
    isConfirmed: true,
  },
];

export interface OrderItem {
  id: string;
  orderNumber: string;
  status: 'COMPLETED' | 'UNPAID' | 'CANCELLED';
  date: string;
  clientName: string;
  clientPhone: string;
  cashierName: string;
  itemsCount: number;
  services: string[];
  totalAmount: number;
  paymentMethod: 'CARD' | 'CASH';
}

export const MOCK_ORDERS: OrderItem[] = [
  {
    id: 'ord-8130',
    orderNumber: '№8130',
    status: 'COMPLETED',
    date: '10 жовт 2026, 11:35',
    clientName: 'Ірина Мельник',
    clientPhone: '+380985962491',
    cashierName: 'Анастасія (Адмін)',
    itemsCount: 2,
    services: ['Комплексний манікюр', 'Зняття покриття'],
    totalAmount: 700.0,
    paymentMethod: 'CARD',
  },
  {
    id: 'ord-8131',
    orderNumber: '№8131',
    status: 'COMPLETED',
    date: '10 жовт 2026, 12:40',
    clientName: 'Мар\'яна Козак',
    clientPhone: '+380978832100',
    cashierName: 'Анастасія (Адмін)',
    itemsCount: 1,
    services: ['Гігієнічний манікюр'],
    totalAmount: 350.0,
    paymentMethod: 'CASH',
  },
  {
    id: 'ord-8132',
    orderNumber: '№8132',
    status: 'UNPAID',
    date: '10 жовт 2026, 14:10',
    clientName: 'Вероніка Гіжовська',
    clientPhone: '+380689317049',
    cashierName: 'Анастасія (Адмін)',
    itemsCount: 3,
    services: ['Комплекс гелева-корекція', 'Дизайн 2 пальчики', 'Олійка для кутикули'],
    totalAmount: 1250.0,
    paymentMethod: 'CARD',
  },
  {
    id: 'ord-8133',
    orderNumber: '№8133',
    status: 'COMPLETED',
    date: '10 жовт 2026, 15:30',
    clientName: 'Анастасія Бойко',
    clientPhone: '+380971084044',
    cashierName: 'Анастасія (Адмін)',
    itemsCount: 1,
    services: ['Експрес манікюр'],
    totalAmount: 600.0,
    paymentMethod: 'CARD',
  },
  {
    id: 'ord-8134',
    orderNumber: '№8134',
    status: 'CANCELLED',
    date: '10 жовт 2026, 16:15',
    clientName: 'Юлія Мороз',
    clientPhone: '+380976478152',
    cashierName: 'Анастасія (Адмін)',
    itemsCount: 2,
    services: ['Повна чистка', 'Зняття'],
    totalAmount: 700.0,
    paymentMethod: 'CASH',
  },
  {
    id: 'ord-8135',
    orderNumber: '№8135',
    status: 'UNPAID',
    date: '10 жовт 2026, 17:00',
    clientName: 'Лариса Бондар',
    clientPhone: '+380500700278',
    cashierName: 'Анастасія (Адмін)',
    itemsCount: 1,
    services: ['Комплекс гель-лак'],
    totalAmount: 850.0,
    paymentMethod: 'CARD',
  },
];

export interface ClientItem {
  id: string;
  name: string;
  phone: string;
  category: 'ALL' | 'NEW' | 'VIP' | 'INACTIVE';
  tags: string[];
  visitCount: number;
  averageCheck: number;
  totalSpent: number;
  lastVisitDate: string;
  avatarColor: string;
}

export const MOCK_CLIENTS: ClientItem[] = [
  {
    id: 'c-1',
    name: 'Ірина Мельник',
    phone: '+380985962491',
    category: 'VIP',
    tags: ['VIP', 'Любить каву', 'Постійна'],
    visitCount: 12,
    averageCheck: 720,
    totalSpent: 8640,
    lastVisitDate: '10 жовт 2026',
    avatarColor: '#C68A2C',
  },
  {
    id: 'c-2',
    name: 'Мар\'яна Козак',
    phone: '+380978832100',
    category: 'NEW',
    tags: ['Нова', 'Тільки чистка'],
    visitCount: 2,
    averageCheck: 400,
    totalSpent: 800,
    lastVisitDate: '08 жовт 2026',
    avatarColor: '#10B981',
  },
  {
    id: 'c-3',
    name: 'Вероніка Гіжовська',
    phone: '+380689317049',
    category: 'VIP',
    tags: ['VIP', 'Складний дизайн', 'Завжди вчасно'],
    visitCount: 18,
    averageCheck: 1050,
    totalSpent: 18900,
    lastVisitDate: '10 жовт 2026',
    avatarColor: '#8B5CF6',
  },
  {
    id: 'c-4',
    name: 'Анастасія Бойко',
    phone: '+380971084044',
    category: 'ALL',
    tags: ['Експрес манікюр', 'Обідня перерва'],
    visitCount: 6,
    averageCheck: 600,
    totalSpent: 3600,
    lastVisitDate: '05 жовт 2026',
    avatarColor: '#EC4899',
  },
  {
    id: 'c-5',
    name: 'Лариса Бондар',
    phone: '+380500700278',
    category: 'ALL',
    tags: ['Гель-лак', 'Французький'],
    visitCount: 8,
    averageCheck: 850,
    totalSpent: 6800,
    lastVisitDate: '02 жовт 2026',
    avatarColor: '#3B82F6',
  },
  {
    id: 'c-6',
    name: 'Ольга Павленко',
    phone: '+380507890123',
    category: 'INACTIVE',
    tags: ['Неактивна', 'Спізнюється'],
    visitCount: 3,
    averageCheck: 500,
    totalSpent: 1500,
    lastVisitDate: '15 лип 2026',
    avatarColor: '#6B7280',
  },
];
