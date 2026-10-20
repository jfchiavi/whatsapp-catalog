import { useState } from 'react';
import { CheckCheck } from 'lucide-react';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications';
import type { NotificationType } from '@/services/notifications.api';

const TYPE_FILTERS: { label: string; value: NotificationType | 'ALL' }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Stock', value: 'LOW_STOCK' },
  { label: 'Pedidos', value: 'ORDER_CREATED' },
  { label: 'Sistema', value: 'SYSTEM' },
];

export default function NotificationsPage() {
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'ALL'>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data: notifications, isLoading } = useNotifications({ unreadOnly, pageSize: 100 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = (notifications ?? []).filter(
    (item) => typeFilter === 'ALL' || item.type === typeFilter
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Notificaciones</h1>
        <button
          onClick={() => markAllRead.mutate()}
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <CheckCheck size={16} /> Marcar todas como leídas
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setTypeFilter(filter.value)}
            className={`px-3 py-1 rounded-full text-sm border ${
              typeFilter === filter.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
        <label className="flex items-center gap-2 text-sm text-gray-600 ml-4">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => setUnreadOnly(event.target.checked)}
          />
          Solo no leídas
        </label>
      </div>

      {isLoading ? (
        <div>Cargando notificaciones...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No hay notificaciones</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-sm p-4 flex items-start justify-between gap-4 ${
                item.read ? 'opacity-60' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.title}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                    {item.type}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{item.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              {!item.read && (
                <button
                  onClick={() => markRead.mutate(item.id)}
                  className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                >
                  Marcar leída
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
