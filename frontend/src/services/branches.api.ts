import { api } from './api';
import type { Branch } from '@/types/stock';

export const fetchBranches = async (): Promise<Branch[]> => {
  const { data } = await api.get('/branches');
  return data;
};

export const fetchBranchById = async (id: string): Promise<Branch> => {
  const { data } = await api.get(`/branches/${id}`);
  return data;
};

export const createBranch = async (payload: {
  name: string;
  type: 'physical' | 'virtual';
  address?: string;
  hours?: string;
}): Promise<Branch> => {
  const { data } = await api.post('/branches', payload);
  return data;
};

export const updateBranch = async (
  id: string,
  payload: { name?: string; type?: 'physical' | 'virtual'; address?: string; hours?: string }
): Promise<Branch> => {
  const { data } = await api.put(`/branches/${id}`, payload);
  return data;
};

export const deleteBranch = async (id: string): Promise<void> => {
  await api.delete(`/branches/${id}`);
};
