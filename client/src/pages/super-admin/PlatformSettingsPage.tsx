import React, { useState, useEffect } from 'react';
import { Building2, MessageSquare, PhoneCall, HardDrive, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const PlatformSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [settingsRes, logsRes] = await Promise.all([
          api.get('/platform/settings'),
          api.get('/platform/audit-logs?limit=20'),
        ]);

        if (settingsRes.data.success) setSettings(settingsRes.data.data);
        if (logsRes.data.success) setAuditLogs(logsRes.data.data.logs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-navy-900 tracking-tight">
          Platform Settings & Infrastructure
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Global architecture configuration, integration adapters, and commercial services.
        </p>
      </div>

      {/* Grid of Service Providers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* SMS Gateway Adapter */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMS Gateway</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold text-slate-900 block">
              Provider: {settings?.providers?.sms?.provider || 'MSG91'}
            </span>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={settings?.providers?.sms?.isConfigured ? 'success' : 'warning'}>
                {settings?.providers?.sms?.mode || 'SIMULATED'}
              </Badge>
              <span className="text-[11px] text-slate-400">
                {settings?.providers?.sms?.isConfigured
                  ? 'Live Gateway Connected'
                  : 'Zero-Cost Local Simulation'}
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp Business API */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Cloud API</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold text-slate-900 block">Meta Business Cloud API</span>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={settings?.providers?.whatsapp?.isConfigured ? 'success' : 'warning'}>
                {settings?.providers?.whatsapp?.mode || 'SIMULATED'}
              </Badge>
              <span className="text-[11px] text-slate-400">
                {settings?.providers?.whatsapp?.isConfigured
                  ? 'Meta Cloud Active'
                  : 'Zero-Cost Local Simulation'}
              </span>
            </div>
          </div>
        </div>

        {/* Object Storage */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Object Storage</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold text-slate-900 block">
              Driver: {settings?.providers?.storage?.driver?.toUpperCase() || 'LOCAL'}
            </span>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="success">READY</Badge>
              <span className="text-[11px] text-slate-400">Tenant-Scoped Local Storage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Audit Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          Master Security & Operations Audit Trail
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Tenant Scope</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">User Identity</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No audit records logged.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {log.tenantId}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.userEmail || 'System'} ({log.userRole || '-'})
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {log.entity}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          log.status === 'SUCCESS'
                            ? 'success'
                            : log.status === 'DENIED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {log.status}
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

