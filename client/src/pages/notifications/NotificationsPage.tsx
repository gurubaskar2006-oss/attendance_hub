import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, PhoneCall, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [providers, setProviders] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notifsRes, provRes] = await Promise.all([
        api.get('/notifications?limit=50'),
        api.get('/notifications/providers/status'),
      ]);
      if (notifsRes.data.success) setNotifications(notifsRes.data.data.notifications);
      if (provRes.data.success) setProviders(provRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-navy-900 tracking-tight">
          Parent & Institutional Notification Dispatch Logs
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time log of in-app, SMS, and WhatsApp alerts with English and Tamil template delivery tracking.
        </p>
      </div>

      {/* Gateway Providers Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              SMS Gateway Provider
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base font-bold text-slate-900">
              {providers?.sms?.provider?.toUpperCase() || 'MSG91'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={providers?.sms?.isConfigured ? 'success' : 'warning'}>
                {providers?.sms?.mode || 'SIMULATED'}
              </Badge>
              <span className="text-[11px] text-slate-400">
                {providers?.sms?.isConfigured ? 'Live Credentials Set' : 'Simulated for Local Dev'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              WhatsApp Business Cloud API
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base font-bold text-slate-900">Meta Cloud Platform</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={providers?.whatsapp?.isConfigured ? 'success' : 'warning'}>
                {providers?.whatsapp?.mode || 'SIMULATED'}
              </Badge>
              <span className="text-[11px] text-slate-400">
                {providers?.whatsapp?.isConfigured
                  ? 'Cloud API Active'
                  : 'Simulated for Local Dev'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Recipient & Contact</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Message Content</th>
                <th className="px-4 py-3">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Loading notification logs...
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No notifications dispatched yet.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr key={n._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {n.recipientName}
                      {n.recipientPhone && (
                        <span className="text-slate-400 text-[10px] block font-mono">
                          {n.recipientPhone}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          n.channel === 'SMS'
                            ? 'warning'
                            : n.channel === 'WHATSAPP'
                            ? 'info'
                            : 'neutral'
                        }
                      >
                        {n.channel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {n.event.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <p className="text-slate-800 font-medium truncate">{n.messageEn}</p>
                      {n.messageTa && (
                        <p className="text-slate-400 text-[10px] truncate mt-0.5 font-sans">
                          {n.messageTa}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          n.status === 'SENT'
                            ? 'success'
                            : n.status === 'SIMULATED'
                            ? 'info'
                            : 'danger'
                        }
                      >
                        {n.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

