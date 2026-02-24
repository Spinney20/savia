import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Bell } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkAsRead } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

export function NotificationPopover() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unreadData } = useUnreadCount();
  const unread = typeof unreadData === 'number' ? unreadData : unreadData?.count ?? 0;
  const { data: notificationsData } = useNotifications({ limit: 5 });
  const markAsRead = useMarkAsRead();
  const notifications = notificationsData?.data ?? [];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notificări</h3>
            <button
              onClick={() => { navigate('/notifications'); setOpen(false); }}
              className="text-xs text-primary hover:text-primary-800 font-medium"
            >
              Vezi toate
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nicio notificare</p>
            ) : (
              notifications.map((n: any) => (
                <button
                  key={n.uuid}
                  onClick={() => {
                    if (!n.readAt) markAsRead.mutate(n.uuid);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors',
                    !n.readAt && 'bg-primary-50/30',
                  )}
                >
                  <p className="text-sm text-gray-900 line-clamp-2">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(n.createdAt), 'dd MMM, HH:mm', { locale: ro })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
