import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Award,
  CalendarCheck,
  Users,
  GraduationCap,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';

export const PrincipalDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [attRes, examRes] = await Promise.all([
          api.get('/attendance/analytics'),
          api.get('/examinations'),
        ]);

        if (attRes.data.success) setAnalytics(attRes.data.data);
        if (examRes.data.success) setExams(examRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { summary, classBreakdown, consecutiveAbsenceAlerts } = analytics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Badge variant="purple">Principal Executive Suite</Badge>
          <span className="text-xs font-semibold text-slate-400">•</span>
          <span className="text-xs font-semibold text-slate-500">Decision-Making & Institutional Trends</span>
        </div>
        <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
          Executive Academic Overview
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Holistic view of student attendance trends, chronic absenteeism warnings, and examination performance metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Campus Attendance Rate"
          value={`${summary?.overallPercentage || 0}%`}
          subtitle="Real-time today calculation"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Student Absenteeism"
          value={summary?.absent || 0}
          subtitle="Students absent today"
          icon={AlertTriangle}
          color={summary?.absent > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Approved Leaves"
          value={summary?.approvedLeave || 0}
          subtitle="Formal parent requests"
          icon={CalendarCheck}
          color="blue"
        />
        <StatCard
          title="Scheduled Exams"
          value={exams.length}
          subtitle="Quarterly & Unit Assessments"
          icon={Award}
          color="purple"
        />
      </div>

      {/* Consecutive Absence Alerts */}
      {consecutiveAbsenceAlerts && consecutiveAbsenceAlerts.length > 0 && (
        <div className="bg-rose-50 rounded-2xl border border-rose-200 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Chronic Absenteeism Intervention List (3+ Consecutive Absences)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {consecutiveAbsenceAlerts.map((alert: any) => (
              <div key={alert.studentId} className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
                <span className="font-bold text-xs text-slate-900 block">{alert.studentName}</span>
                <span className="text-[11px] text-slate-500 block">
                  Class: {alert.className}-{alert.sectionName} • Adm #{alert.admissionNumber}
                </span>
                <span className="text-[11px] font-bold text-rose-600 block mt-1">
                  Absent for {alert.consecutiveDays} days in a row
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Class-wise Comparative Ranking */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            Class Attendance Compliance Table
          </h2>
          <Link
            to="/reports"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Export Reports <FileText className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
              <tr>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Total Enrolled</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3">Attendance %</th>
                <th className="px-4 py-3">Status Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classBreakdown && classBreakdown.length > 0 ? (
                classBreakdown.map((cls: any) => (
                  <tr key={cls.classId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{cls.className}</td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">{cls.enrolledStudents}</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold">{cls.presentCount}</td>
                    <td className="px-4 py-3 text-rose-700 font-bold">{cls.absentCount}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{cls.percentage}%</td>
                    <td className="px-4 py-3">
                      <Badge variant={cls.percentage >= 85 ? 'success' : cls.percentage >= 70 ? 'warning' : 'danger'}>
                        {cls.percentage >= 85 ? 'Optimal' : cls.percentage >= 70 ? 'Moderate' : 'Low Attendance'}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No attendance records for today yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

