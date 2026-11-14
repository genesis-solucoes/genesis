import { http, setAuthToken } from '../lib/http';
import type { AdminUser, ApiSuccess, AuthResponse } from '../types/api';

export const authService = {
  async login(email: string, password: string): Promise<AdminUser> {
    const { data } = await http.post<ApiSuccess<AuthResponse>>('/admin/auth/login', { email, password });
    setAuthToken(data.data.token ?? null);
    return data.data.user;
  },
  async me(): Promise<AdminUser> {
    const { data } = await http.get<ApiSuccess<AuthResponse>>('/admin/auth/me');
    return data.data.user;
  },
  async logout(): Promise<void> {
    try {
      await http.post('/admin/auth/logout');
    } finally {
      setAuthToken(null);
    }
  },
};
