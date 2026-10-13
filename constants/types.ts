export type UserRole = 'PENDING' | 'MASTER' | 'ADMIN' | 'OWNER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  masterId: string;
  masterName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  price: number;
  status: BookingStatus;
  notes?: string;
  photoUrl?: string;
}

export interface Master {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
}
