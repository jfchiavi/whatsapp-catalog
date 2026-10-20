import { api } from './api';

export type NotificationType = 'LOW_STOCK' | 'ORDER_CREATED' | 'ORDER_UPDATED' | 'SYSTEM';

export interface NotificationData {
  id: string;
  tenantId: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const fetchNotifications = async (options: {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
} = {}): Promise<NotificationData[]> => {
  const params = new URLSearchParams();
  if (options.unreadOnly) params.append('unreadOnly', 'true');
  if (options.page) params.append('page', String(options.page));
  if (options.pageSize) params.append('pageSize', String(options.pageSize));

  const { data } = await api.get(`/notifications?${params.toString()}`);
  return data;
};

export const markNotificationAsRead = async (id: string): Promise<NotificationData> => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsAsRead = async (): Promise<{ updated: number }> => {
  const { data } = await api.patch('/notifications/read-all');
  return data;
};
