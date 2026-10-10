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
    id: 'ord-8142',
    orderNumber: '№8142',
    status: 'COMPLETED',
    date: '10 жовт 2026 р. 19:35',
    clientName: 'ольга',
    clientPhone: '+380 67 278 8818',
    cashierName: 'Настя Кобзар',
    itemsCount: 1,
    services: ['Комплексний манікюр + покриття'],
    totalAmount: 700.0,
    paymentMethod: 'CARD',
  },
  {
    id: 'ord-8141',
    orderNumber: '№8141',
    status: 'COMPLETED',
    date: '10 жовт 2026 р. 18:20',
    clientName: 'Оля',
    clientPhone: '+380 99 130 7659',
    cashierName: 'Настя Кобзар',
    itemsCount: 1,
    services: ['Комплекс корекція'],
    totalAmount: 900.0,
    paymentMethod: 'CARD',
  },
  {
    id: 'ord-8140',
    orderNumber: '№8140',
    status: 'UNPAID',
    date: '10 жовт 2026 р. 17:15',
    clientName: 'Вероніка 7049 Гіжовська',
    clientPhone: '+380 68 931 7049',
    cashierName: 'Настя Кобзар',
    itemsCount: 2,
    services: ['Комплекс гелева-корекція', 'Дизайн пальчики'],
    totalAmount: 1100.0,
    paymentMethod: 'CARD',
  },
  {
    id: 'ord-8139',
    orderNumber: '№8139',
    status: 'CANCELLED',
    date: '10 жовт 2026 р. 16:00',
    clientName: 'Юлія Мороз',
    clientPhone: '+380 97 647 8152',
    cashierName: 'Настя Кобзар',
    itemsCount: 1,
    services: ['Повна чистка + зняття'],
    totalAmount: 700.0,
    paymentMethod: 'CASH',
  },
  {
    id: 'ord-8138',
    orderNumber: '№8138',
    status: 'COMPLETED',
    date: '10 жовт 2026 р. 14:30',
    clientName: 'Ірина Мельник',
    clientPhone: '+380 98 596 2491',
    cashierName: 'Настя Кобзар',
    itemsCount: 1,
    services: ['Манікюр (чистка)'],
    totalAmount: 650.0,
    paymentMethod: 'CARD',
  },
];

export interface ClientItem {
  id: string;
  cnCode: string;
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
    id: 'c-1013',
    cnCode: 'CN-1013',
    name: 'ольга',
    phone: '+380 67 278 8818',
    category: 'ALL',
    tags: [],
    visitCount: 32,
    averageCheck: 726.88,
    totalSpent: 23260.0,
    lastVisitDate: '10 жовт 2026',
    avatarColor: '#8B5CF6',
  },
  {
    id: 'c-2100',
    cnCode: 'CN-2100',
    name: 'Оля',
    phone: '+380 99 130 7659',
    category: 'ALL',
    tags: ['Корекція'],
    visitCount: 15,
    averageCheck: 850.0,
    totalSpent: 12750.0,
    lastVisitDate: '10 жовт 2026',
    avatarColor: '#8B5CF6',
  },
  {
    id: 'c-7049',
    cnCode: 'CN-7049',
    name: 'Вероніка Гіжовська',
    phone: '+380 68 931 7049',
    category: 'VIP',
    tags: ['VIP', 'Складний дизайн'],
    visitCount: 18,
    averageCheck: 1050.0,
    totalSpent: 18900.0,
    lastVisitDate: '10 жовт 2026',
    avatarColor: '#EC4899',
  },
  {
    id: 'c-1002',
    cnCode: 'CN-1002',
    name: 'Ірина Мельник',
    phone: '+380 98 596 2491',
    category: 'VIP',
    tags: ['VIP', 'Постійна'],
    visitCount: 12,
    averageCheck: 720.0,
    totalSpent: 8640.0,
    lastVisitDate: '10 жовт 2026',
    avatarColor: '#F59E0B',
  },
  {
    id: 'c-2044',
    cnCode: 'CN-2044',
    name: 'Анастасія Бойко',
    phone: '+380 97 108 4044',
    category: 'NEW',
    tags: ['Експрес манікюр'],
    visitCount: 1,
    averageCheck: 600.0,
    totalSpent: 600.0,
    lastVisitDate: '10 жовт 2026',
    avatarColor: '#10B981',
  },
  {
    id: 'c-3001',
    cnCode: 'CN-3001',
    name: 'Олена Свистун',
    phone: '+380 50 789 0123',
    category: 'INACTIVE',
    tags: ['Неактивна'],
    visitCount: 3,
    averageCheck: 500.0,
    totalSpent: 1500.0,
    lastVisitDate: '15 лип 2026',
    avatarColor: '#6B7280',
  },
];
