export interface Master {
  userId?: string;
  active?: boolean;
  id: string;
  name: string;
  shortName: string;
  specialty: string;
  avatarUrl: string;
  appointmentCount: number;
}

export interface AppointmentItem {
  status?: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  id: string;
  clientId?: string;
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
  source?: string;
  photoUri?: string;
}

export interface OrderItem {
  bookingId?: string;
  clientId?: string;
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

export interface ClientItem {
  hasBooking?: boolean;
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
