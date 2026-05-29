'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Clock3, ExternalLink, Inbox } from 'lucide-react';
import { notificationsAPI } from '@/services/api';
import LoadingButton from '@/components/ui/LoadingButton';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  related_id?: string | null;
  resource_type?: string | null;
  is_read?: boolean;
  created_at?: string;
  type?: string;
};

export default function SupplierNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await notificationsAPI.getAll();
      const data = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [];
      setItems(data);
    } catch {
      setError('Unable to load notifications right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = items.filter((item) => !item.is_read).length;

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await notificationsAPI.markAllRead();
      await fetchNotifications();
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Supplier Inbox</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="mt-1 text-sm text-slate-500">Review approval updates, bidding prompts, and account messages in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              {unreadCount} unread
            </div>
            <LoadingButton
              type="button"
              isLoading={isMarkingAll}
              onClick={handleMarkAllRead}
              loadingText="Marking..."
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </LoadingButton>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-sm text-slate-500 shadow-sm">Loading notifications...</div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Inbox className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No notifications yet</h2>
          <p className="mt-2 text-sm text-slate-500">You will see head approval updates, bid notices, and document reminders here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className={`rounded-2xl border bg-white p-5 shadow-sm transition-colors ${item.is_read ? 'border-slate-100' : 'border-emerald-200 bg-emerald-50/40'}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.is_read ? 'bg-slate-100 text-slate-500' : 'bg-emerald-500 text-white'}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                      {!item.is_read ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">New</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Read</span>
                      )}
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{item.message}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {item.type ? <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{item.type}</span> : null}
                      {item.created_at ? (
                        <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{new Date(item.created_at).toLocaleString()}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {item.link ? (
                  <Link href={item.link} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    Open
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}