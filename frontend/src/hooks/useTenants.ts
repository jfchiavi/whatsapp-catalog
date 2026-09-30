import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTenants,
  fetchTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  fetchPlatformStats,
} from '../services/platform.api';

export const useTenants = () => {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: fetchTenants,
    staleTime: 60000,
  });
};

export const useTenant = (id: string) => {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: () => fetchTenantById(id),
    enabled: !!id,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTenant>[1] }) =>
      updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
};

export const usePlatformStats = () => {
  return useQuery({
    queryKey: ['platformStats'],
    queryFn: fetchPlatformStats,
    staleTime: 60000,
  });
};
