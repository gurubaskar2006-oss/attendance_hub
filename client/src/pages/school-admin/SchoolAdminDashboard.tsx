import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  GraduationCap,
  Users,
  Award,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  Bell,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';

export const SchoolAdminDashboard: React.FC = () => {
  const { tenant } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/attendance/analytics');
        if (res.data.success) {
          setAnalytics(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const { summary, classBreakdown, consecutiveAbsenceAlerts } = analytics || {};

  return (
    <div className="space-y-6">
      {/* School Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              Active Academic Session
            </span>
            <span className="text-xs font-semibold text-slate-400">•</span>
            <span className="text-xs font-bold text-slate-600">Cutoff: {tenant?.settings?.attendanceCutoffTime || '09:30 AM'}</span>
          </div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
            {tenant?.name || 'School Operations Hub'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Affiliated to {tenant?.affiliation} • Permanent Licensed Institution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/teacher/attendance"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            Mark Attendance
          </Link>
          <Link
            to="/students?action=new"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            + Add Student
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Attendance"
          value={`${summary?.overallPercentage || 0}%`}
          subtitle={`${summary?.present || 0} Present / ${summary?.totalMarkedToday || 0} Recorded`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Total Students"
          value={summary?.totalEnrolledStudents || 0}
          subtitle="Enrolled in active year"
          icon={GraduationCap}
          color="blue"
        />
        <StatCard
          title="Absent Today"
          value={summary?.absent || 0}
          subtitle={`${summary?.late || 0} marked late arrival`}
          icon={AlertTriangle}
          color={summary?.absent > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Approved Leave"
          value={summary?.approvedLeave || 0}
          subtitle="Parent requests verified"
          icon={Clock}
          color="indigo"
        />
      </div>

      {/* Consecutive Absence Alerts */}
      {consecutiveAbsenceAlerts && consecutiveAbsenceAlerts.length > 0 && (
        <div className="bg-rose-50/80 rounded-2xl border border-rose-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wider">
              High Priority: Consecutive Absenteeism Alerts (3+ Days)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {consecutiveAbsenceAlerts.map((alert: any) => (
              <div
                key={alert.studentId}
                className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs flex items-start justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    {alert.studentName}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {alert.className} - {alert.sectionName} • Adm #{alert.admissionNumber}
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 block mt-1">
                    Absent for {alert.consecutiveDays} consecutive working days
                  </span>
                </div>
                <Badge variant="danger">Action Required</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Class-wise Attendance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              Class-wise Attendance Rates Today
            </h2>
            <Link
              to="/attendance"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Full Register <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {classBreakdown && classBreakdown.length > 0 ? (
              classBreakdown.map((cls: any) => (
                <div key={cls.classId} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{cls.className}</span>
                    <span className="font-semibold text-slate-600">
                      {cls.presentCount} / {cls.enrolledStudents} Present ({cls.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cls.percentage >= 85
                          ? 'bg-emerald-500'
                          : cls.percentage >= 70
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${cls.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No classes recorded for today yet.
              </div>
            )}
          </div>
        </div>

        {/* Quick Operations Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
            Operational Shortcuts
          </h2>

          <div className="space-y-2.5">
            <Link
              to="/teacher/attendance"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <span>Mark Routine Attendance</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/students"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Students Directory & CSV Import</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/examinations"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Exams & Marks Entry</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/reports"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Generate Official PDF Reports</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

