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

// Майстри салону - розробники проекту (Студенти)
export const MOCK_MASTERS: Master[] = [
  {
    id: 'master-1',
    name: 'Артем Гіжовський',
    shortName: 'Артем Г.',
    specialty: 'Топ-майстер / Адмін',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
    appointmentCount: 0,
  },
  {
    id: 'master-2',
    name: 'Ігор Намачинський',
    shortName: 'Ігор Н.',
    specialty: 'Майстер',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces',
    appointmentCount: 0,
  },
  {
    id: 'master-3',
    name: 'Артем Лабунський',
    shortName: 'Артем Л.',
    specialty: 'Майстер',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    appointmentCount: 0,
  },
];

// Початковий чистий список записів у розкладі
export const MOCK_APPOINTMENTS: AppointmentItem[] = [];

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

// Початковий чистий список замовлень у касі
export const MOCK_ORDERS: OrderItem[] = [];

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

// Початковий чистий список клієнтів (0 клієнтів на старті)
export const MOCK_CLIENTS: ClientItem[] = [];
