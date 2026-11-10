import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar,
  AlertCircle,
  Award,
  Bell,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Languages,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const ParentPortalPage: React.FC = () => {
  const { user, activeChildId } = useAuth();

  const [childData, setChildData] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Leave Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Language toggle for alert preview
  const [notifLang, setNotifLang] = useState<'en' | 'ta'>('en');

  // Month navigation
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchChildOverview = async () => {
    if (!activeChildId) return;
    try {
      setLoading(true);
      const [childRes, calRes, leaveRes, notifRes] = await Promise.all([
        api.get(`/students/${activeChildId}`),
        api.get(
          `/attendance/calendar?studentId=${activeChildId}&month=${selectedMonth}&year=${selectedYear}`
        ),
        api.get('/leave'),
        api.get('/announcements'),
      ]);

      if (childRes.data.success) setChildData(childRes.data.data.student);
      if (calRes.data.success) setCalendarData(calRes.data.data);
      if (leaveRes.data.success) setLeaveRequests(leaveRes.data.data);
      if (notifRes.data.success) setAnnouncements(notifRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildOverview();
  }, [activeChildId, selectedMonth, selectedYear]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChildId) return;
    setSubmittingLeave(true);

    try {
      const res = await api.post('/leave', {
        studentId: activeChildId,
        startDate,
        endDate,
        reason,
      });

      if (res.data.success) {
        setIsLeaveModalOpen(false);
        setStartDate('');
        setEndDate('');
        setReason('');
        fetchChildOverview();
        alert('Leave request submitted to school administration.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const getStatusPillColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-emerald-500 text-white';
      case 'ABSENT':
        return 'bg-rose-500 text-white';
      case 'LATE':
        return 'bg-amber-500 text-white';
      case 'HALF_DAY':
        return 'bg-orange-500 text-white';
      case 'APPROVED_LEAVE':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Student Profile Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-navy-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {childData?.firstName?.[0] || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-navy-900">
                {childData?.firstName} {childData?.lastName}
              </h1>
              <Badge variant="success">Enrolled</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Class: {childData?.classId?.name} - Section {childData?.sectionId?.name} • Roll #{childData?.rollNumber || '-'} • Adm #{childData?.admissionNumber}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsLeaveModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Attendance Rate
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {calendarData?.statistics?.attendancePercentage || 0}%
          </span>
          <span className="text-[10px] text-slate-500">
            {calendarData?.statistics?.presentDays || 0} of {calendarData?.statistics?.totalWorkingDays || 0} working days
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Absences
          </span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">
            {calendarData?.statistics?.absentDays || 0}
          </span>
          <span className="text-[10px] text-slate-500">Unexcused absences</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Late Arrivals
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {calendarData?.statistics?.lateDays || 0}
          </span>
          <span className="text-[10px] text-slate-500">Recorded after cutoff</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Approved Leaves
          </span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {calendarData?.statistics?.leaveDays || 0}
          </span>
          <span className="text-[10px] text-slate-500">Formal leave approved</span>
        </div>
      </div>

      {/* Monthly Attendance Calendar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Monthly Attendance Calendar
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-medium text-slate-600 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late Arrival
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Approved Leave
          </div>
        </div>

        {/* Date Record List */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
          {calendarData?.records && calendarData.records.length > 0 ? (
            calendarData.records.map((r: any) => (
              <div
                key={r.date}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {r.date.split('-')[2]}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getStatusPillColor(
                      r.status
                    )}`}
                  >
                    {r.status[0]}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 capitalize mt-2 truncate">
                  {r.status.replace('_', ' ').toLowerCase()}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-7 py-8 text-center text-xs text-slate-400">
              No attendance recorded for this month.
            </div>
          )}
        </div>
      </div>

      {/* Parent Alerts Preview (Tamil / English) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
              Sample Parent SMS & WhatsApp Alert Format
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setNotifLang('en')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                notifLang === 'en' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setNotifLang('ta')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                notifLang === 'ta' ? 'bg-white shadow-xs text-emerald-700' : 'text-slate-500'
              }`}
            >
              தமிழ் (Tamil)
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
          {notifLang === 'en' ? (
            <p>
              "Dear Parent, your child <strong>{childData?.firstName} {childData?.lastName}</strong> of Class <strong>{childData?.classId?.name}-{childData?.sectionId?.name}</strong> has been marked absent today. Please contact the school if this is unexpected."
            </p>
          ) : (
            <p className="leading-relaxed">
              "அன்பார்ந்த பெற்றோரே, உங்கள் குழந்தை <strong>{childData?.firstName} {childData?.lastName}</strong> (வகுப்பு <strong>{childData?.classId?.name}-{childData?.sectionId?.name}</strong>) இன்று பள்ளிக்கு வரவில்லை என பதிவு செய்யப்பட்டுள்ளது. மேலும் விவரங்களுக்கு பள்ளியை தொடர்பு கொள்ளவும்."
            </p>
          )}
        </div>
      </div>

      {/* Leave Application History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-4">
          Submitted Leave Requests
        </h2>

        <div className="divide-y divide-slate-100">
          {leaveRequests.length > 0 ? (
            leaveRequests.map((req) => (
              <div key={req._id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">
                      {req.startDate} to {req.endDate}
                    </span>
                    <Badge
                      variant={
                        req.status === 'APPROVED'
                          ? 'success'
                          : req.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{req.reason}</p>
                  {req.reviewRemarks && (
                    <p className="text-[11px] text-slate-400 italic mt-0.5">
                      Teacher remark: "{req.reviewRemarks}"
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              No leave requests submitted yet.
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Submit Leave Request"
        subtitle={`Request authorized leave for ${childData?.firstName} ${childData?.lastName}`}
      >
        <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">From Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">To Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Leave *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. High fever, family medical emergency, religious festival..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingLeave}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {submittingLeave ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

