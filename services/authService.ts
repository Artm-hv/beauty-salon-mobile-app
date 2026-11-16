import { useSyncExternalStore } from 'react';
import { User } from '../constants/types';
import { ApiError, configureSession, request } from './api';

let current: User | null = null;
const listeners = new Set<() => void>();

function publish(user: User | null) {
  current = user && { ...user, name: [user.firstName, user.lastName].join(' ').trim() };
  listeners.forEach(listener => listener());
}

function clear() {
  configureSession();
  publish(null);
}

async function signIn(path: string, data: unknown) {
  try {
    const result = await request<{user: User; token: string}>(path, 'POST', data);
    configureSession(result.token, clear);
    publish(result.user);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, status: error instanceof ApiError ? error.status : undefined, error: error instanceof Error ? error.message : 'Сервер недоступний' };
  }
}

export const authService = {
  getCurrentUser: () => current,
  login: (email: string, password: string) => signIn('/auth/login', {email, password}),
  register: (data: Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'> & {password: string}) =>
    signIn('/auth/register', data),
  refresh: async () => {
    const user = await request<User>('/auth/me');
    if (current?.role !== user.role) publish(user);
    return user;
  },
  logout: () => {
    void request('/auth/logout', 'POST').catch(() => {});
    clear();
  },
};

export function useCurrentUser() {
  return useSyncExternalStore(listener => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, authService.getCurrentUser, authService.getCurrentUser);
}
