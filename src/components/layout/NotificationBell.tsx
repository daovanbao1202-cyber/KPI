'use client';

import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useKPI } from '@/context/KPIContext';

interface Notification {
  id: string;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { loggedInUserId } = useKPI();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loggedInUserId) return;

    // The API scopes results to the session cookie, so the browser no longer
    // decides whose notifications it receives.
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const data = await res.json();
        data.sort(
          (a: Notification, b: Notification) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      } catch (error) {
        console.warn('Failed to fetch notifications', error);
      }
    };

    fetchNotifications();

    // Polling replaces the Supabase realtime channel, which needed a database
    // key in the browser. Notifications are not time-critical.
    const timer = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(timer);
  }, [loggedInUserId]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) return;
    } catch (error) {
      console.warn('Failed to save read status', error);
      return;
    }

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(count => Math.max(0, count - 1));
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.warn('Failed to save read status', error);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-12 right-0 w-80 bg-white border border-gray-100 shadow-2xl rounded-2xl py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-5 pb-3 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Notifications</h3>
              <button 
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-[#555cf8] hover:underline"
              >
                Mark all as read
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto no-scrollbar">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 relative group ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[13px] font-bold text-gray-800">{n.title}</span>
                      {!n.is_read && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="p-1 text-blue-500 hover:bg-blue-100 rounded-full transition-all"
                          title="Mark as read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-500 leading-relaxed mb-2">{n.message}</p>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(n.created_at).toLocaleDateString('vi-VN', { 
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-5 py-10 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
