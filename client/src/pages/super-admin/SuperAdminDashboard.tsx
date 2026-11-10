import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  KeyRound,
  GraduationCap,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';

export const SuperAdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/platform/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-xs font-semibold text-slate-400">
        Loading platform intelligence...
      </div>
    );
  }

  const { summary, systemHealth, recentActivity } = data || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              Platform Headquarters
            </span>
            <span className="text-xs font-medium text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">6th Civilians Corporation</span>
          </div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
            Platform Operations Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global management of registered school tenants, permanent software licenses, and infrastructure health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/super-admin/schools?action=new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Onboard New School
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Schools"
          value={summary?.totalSchools || 0}
          subtitle={`${summary?.activeSchools || 0} active deployments`}
          icon={Building2}
          color="indigo"
        />
        <StatCard
          title="Permanent Licenses"
          value={summary?.totalLicenses || 0}
          subtitle={`${summary?.activeLicenses || 0} active, ${summary?.deactivatedLicenses || 0} suspended`}
          icon={KeyRound}
          color="emerald"
        />
        <StatCard
          title="Students Across Platform"
          value={summary?.totalStudents || 0}
          subtitle="Enrolled active students"
          icon={GraduationCap}
          color="blue"
        />
        <StatCard
          title="Total School Staff"
          value={summary?.totalStaff || 0}
          subtitle="Educators & Administrators"
          icon={Users}
          color="purple"
        />
      </div>

      {/* System Health & Infrastructure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            System Health & Node Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Database Status</span>
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                {systemHealth?.database || 'CONNECTED'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Platform Uptime</span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {Math.floor((systemHealth?.apiUptimeSeconds || 0) / 60)} minutes
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Node Heap Memory</span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {systemHealth?.memoryUsageMb || 0} MB
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Environment</span>
              <span className="text-xs font-mono font-bold text-emerald-700 uppercase">
                {systemHealth?.environment || 'development'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Audit & Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              Platform Security & Audit Trail
            </h2>
            <Link
              to="/super-admin/audit-logs"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              View Full Logs <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((log: any) => (
                <div key={log._id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{log.action}</span>
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
                      <span className="text-[10px] text-slate-400 font-mono">
                        Tenant: {log.tenantId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Initiated by: {log.userEmail || 'System'} ({log.userRole || 'Automated'})
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

