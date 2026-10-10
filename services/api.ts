import { MOCK_APPOINTMENTS, MOCK_ORDERS, MOCK_CLIENTS, AppointmentItem, OrderItem, ClientItem } from './mockData';

// Базова URL-адреса локального або віддаленого FastAPI бекенду
const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Шар абстракції API клієнта з гібридним режимом (Real HTTP + Offline Mock Fallback)
 * Вимога предмету: 3 методи API (GET, POST, PUT)
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export const apiClient = {
  /**
   * 1. Метод GET: Отримання списку замовлень / чеків каси
   */
  getOrders: async (): Promise<OrderItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        return await response.json();
      }
      return MOCK_ORDERS;
    } catch {
      // Автономний Mock-режим на випадок показу без сервера
      return MOCK_ORDERS;
    }
  },

  /**
   * 1. Метод GET: Отримання CRM-бази клієнтів
   */
  getClients: async (): Promise<ClientItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        return await response.json();
      }
      return MOCK_CLIENTS;
    } catch {
      return MOCK_CLIENTS;
    }
  },

  /**
   * 2. Метод POST: Створення нового бронювання / запису
   * Відповідає POST /api/bookings у бекенді FastAPI
   */
  createBooking: async (bookingData: {
    clientId: string;
    masterId: string;
    serviceId: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      }
      // Якщо сервер повернув помилку або офлайн - симулюємо успішне створення
      return { success: true, data: { id: `b-${Date.now()}`, ...bookingData } };
    } catch {
      // Офлайн режим: успішно зберігаємо в локальному списку
      return { success: true, data: { id: `b-${Date.now()}`, ...bookingData } };
    }
  },

  /**
   * 3. Метод PUT: Оновлення статусу візиту та прикріплення фотофіксації
   * Відповідає PUT /api/bookings/{id} у бекенді FastAPI
   */
  completeAppointment: async (
    bookingId: string,
    payload: {
      status: 'COMPLETED' | 'CANCELLED';
      photoUrl?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; updatedBooking?: any; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updated = await response.json();
        return { success: true, updatedBooking: updated };
      }
      return { success: true, updatedBooking: { id: bookingId, ...payload } };
    } catch {
      // Офлайн режим: успішно оновлюємо візит
      return { success: true, updatedBooking: { id: bookingId, ...payload } };
    }
  },
};
