import { api } from './api';
import type { UserRole } from '@/types/auth';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: string | null;
  tenantId?: string | null;
  active: boolean;
  createdAt: string;
  branch?: { id: string; name: string } | null;
}

export const fetchUsers = async (branchId?: string): Promise<UserData[]> => {
  const params = new URLSearchParams();
  if (branchId) params.append('branchId', branchId);
  const { data } = await api.get(`/users?${params.toString()}`);
  return data;
};

export const fetchUserById = async (id: string): Promise<UserData> => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

export const createUser = async (payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  branchId?: string;
}): Promise<UserData> => {
  const { data } = await api.post('/users', payload);
  return data;
};

export const updateUser = async (
  id: string,
  payload: Partial<{
    name: string;
    email: string;
    role: UserRole;
    branchId: string | null;
    active: boolean;
  }>
): Promise<UserData> => {
  const { data } = await api.put(`/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id: string): Promise<UserData> => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};
