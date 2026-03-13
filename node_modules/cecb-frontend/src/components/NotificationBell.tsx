import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, CheckCheck, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/api';

interface Notification {
  id: string;
  type: string;
  title?: string;
  message: string;
  read: boolean;
  metadata?: Record<string, string>;
  createdAt: string;
}

function typeIcon(type: string) {
  switch (type) {
    case 'EDS':        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case 'FINALIZED':  return <CheckCircle className="w-4 h-4 text-green-500" />;
    default:           return <Info className="w-4 h-4 text-blue-500" />;
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data } = useQuery<{ data: Notification[]; meta: { unreadCount: number } }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30_000, // poll every 30s
  });

  const notifications = data?.data ?? [];
  const unread = data?.meta?.unreadCount ?? 0;

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="ml-2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                <Bell className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.read) markOneMutation.mutate(n.id); }}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !n.read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    {n.title && (
                      <div className="text-xs font-semibold text-gray-900 truncate">{n.title}</div>
                    )}
                    <div className="text-xs text-gray-600 leading-snug">{n.message}</div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
