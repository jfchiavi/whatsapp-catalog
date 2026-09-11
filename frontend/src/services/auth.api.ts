import { api } from './api';
import type { UserRole } from '@/types/auth';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userResponse: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    branchId: string | null;
    tenantId: string | null;
  };
}

export const loginRequest = async (payload: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  const { data } = await api.post('/auth/login', payload);
  const result = data?.data ?? data;
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    userResponse: result.user ?? result.userResponse,
  };
};
