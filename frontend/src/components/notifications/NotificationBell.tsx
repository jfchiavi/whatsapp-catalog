import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications';

const typeLabel: Record<string, string> = {
  LOW_STOCK: 'Stock',
  ORDER_CREATED: 'Pedido',
  ORDER_UPDATED: 'Pedido',
  SYSTEM: 'Sistema',
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { data: notifications } = useNotifications({ pageSize: 20 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unread = (notifications ?? []).filter((item) => !item.read);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-sm font-semibold">Notificaciones</span>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <CheckCheck size={14} /> Marcar todas
            </button>
          </div>

          {(notifications ?? []).length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Sin notificaciones</div>
          ) : (
            (notifications ?? []).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => !item.read && markRead.mutate(item.id)}
                className={`block w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${
                  item.read ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-[10px] uppercase text-gray-400">{typeLabel[item.type]}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>
              </button>
            ))
          )}

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-xs text-blue-600 hover:underline"
          >
            Ver todas las notificaciones
          </Link>
        </div>
      )}
    </div>
  );
};
