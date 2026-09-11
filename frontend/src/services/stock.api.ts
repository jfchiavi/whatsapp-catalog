import { api } from './api';
import type { StockByBranch, StockMovement } from '@/types/stock';

export const fetchStockByBranch = async (branchId: string): Promise<StockByBranch[]> => {
  const { data } = await api.get(`/stock/branch/${branchId}`);
  return data;
};

export const fetchStockByProduct = async (productId: string): Promise<StockByBranch[]> => {
  const { data } = await api.get(`/stock/product/${productId}`);
  return data;
};

export const adjustStock = async (payload: {
  variantId: string;
  branchId: string;
  quantity: number;
}) => {
  const { data } = await api.post('/stock/adjust', payload);
  return data;
};

export const createTransfer = async (payload: {
  variantId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
}) => {
  const { data } = await api.post('/stock/transfer', payload);
  return data;
};

export const receiveTransfer = async (
  movementId: string,
  receivedQuantity: number
): Promise<StockMovement> => {
  const { data } = await api.patch(`/stock/transfer/${movementId}/receive`, {
    receivedQuantity,
  });
  return data;
};

export const cancelTransfer = async (movementId: string): Promise<StockMovement> => {
  const { data } = await api.patch(`/stock/transfer/${movementId}/cancel`);
  return data;
};

export const fetchPendingTransfers = async (branchId?: string): Promise<StockMovement[]> => {
  const params = branchId ? `?branchId=${branchId}` : '';
  const { data } = await api.get(`/stock/transfers/pending${params}`);
  return data;
};

export const fetchStockHistory = async (
  variantId: string,
  branchId?: string
): Promise<StockMovement[]> => {
  const params = branchId ? `?branchId=${branchId}` : '';
  const { data } = await api.get(`/stock/history/${variantId}${params}`);
  return data;
};
