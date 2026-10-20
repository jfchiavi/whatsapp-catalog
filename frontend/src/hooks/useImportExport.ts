import { useMutation } from '@tanstack/react-query';
import {
  exportProductsCsv,
  exportSalesCsv,
  importProductsCsv,
  importStockCsv,
} from '@/services/import-export.api';

export const useImportProducts = () => useMutation({ mutationFn: importProductsCsv });

export const useImportStock = () => useMutation({ mutationFn: importStockCsv });

export const useExportProducts = () => useMutation({ mutationFn: exportProductsCsv });

export const useExportSales = () =>
  useMutation({
    mutationFn: ({ from, to }: { from?: string; to?: string }) => exportSalesCsv(from, to),
  });
