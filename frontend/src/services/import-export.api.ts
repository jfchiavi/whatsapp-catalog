import { api } from './api';

export interface ImportSummary {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

export const importProductsCsv = async (csv: string): Promise<ImportSummary> => {
  const { data } = await api.post('/import/products', { csv });
  return data;
};

export const importStockCsv = async (csv: string): Promise<ImportSummary> => {
  const { data } = await api.post('/import/stock', { csv });
  return data;
};

export const downloadCsv = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportProductsCsv = async (): Promise<void> => {
  const { data } = await api.get('/export/products', { responseType: 'text' });
  downloadCsv(data, 'products.csv');
};

export const exportSalesCsv = async (from?: string, to?: string): Promise<void> => {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const { data } = await api.get(`/export/sales?${params.toString()}`, { responseType: 'text' });
  downloadCsv(data, 'sales.csv');
};
