import { api } from './api';
import { downloadCsv } from './import-export.api';

export interface ReconciliationRecordView {
  transactionId: string;
  identifier: string | null;
  paidAt: string | null;
  amountPaid: number;
  paymentMethod: string;
}

export interface ReconciliationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ReconciliationPage {
  records: ReconciliationRecordView[];
  meta: ReconciliationMeta;
}

export interface SyncPaymentResultView {
  orderId: string;
  paid: boolean;
  changed: boolean;
  gatewayStatus: string | null;
  paidAt: string | null;
}

export const fetchReconciliation = async (
  params: { from: string; to: string; page: number; pageSize?: number }
): Promise<ReconciliationPage> => {
  const response = await api.get('/payments/reconciliation', {
    params: {
      from: params.from,
      to: params.to,
      page: params.page,
      pageSize: params.pageSize ?? 20,
    },
  });

  const withMeta = response as unknown as {
    data: ReconciliationRecordView[];
    meta?: ReconciliationMeta;
  };

  return {
    records: withMeta.data ?? [],
    meta: withMeta.meta ?? { page: params.page, pageSize: params.pageSize ?? 20, total: 0 },
  };
};

export const exportReconciliationCsv = async (from: string, to: string): Promise<void> => {
  const { data } = await api.get('/payments/reconciliation/export', {
    params: { from, to },
    responseType: 'text',
  });
  downloadCsv(data, 'reconciliacion-pagos.csv');
};

export const syncOrderPayment = async (orderId: string): Promise<SyncPaymentResultView> => {
  const { data } = await api.post(`/orders/${orderId}/sync-payment`);
  return data;
};
