import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCheck,
  Search,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { AttendanceStatus } from '../../types';

export const TeacherAttendancePage: React.FC = () => {
  const { user } = useAuth();

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [session, setSession] = useState<'FULL_DAY' | 'MORNING' | 'AFTERNOON'>('FULL_DAY');

  const [students, setStudents] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isRecorded, setIsRecorded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fetch classes and sections
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/academic/classes');
        if (res.data.success && res.data.data.length > 0) {
          setClasses(res.data.data);
          const firstClass = res.data.data[0];
          setSelectedClassId(firstClass._id);
          if (firstClass.sections && firstClass.sections.length > 0) {
            setSelectedSectionId(firstClass.sections[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch attendance sheet when class/section/date/session changes
  const fetchAttendanceSheet = async () => {
    if (!selectedClassId || !selectedSectionId || !selectedDate) return;
    setLoading(true);
    setNotificationMsg(null);

    try {
      const res = await api.get(
        `/attendance/sheet?classId=${selectedClassId}&sectionId=${selectedSectionId}&date=${selectedDate}&session=${session}`
      );
      if (res.data.success) {
        setStudents(res.data.data.students);
        setIsLocked(res.data.data.isLocked);
        setIsRecorded(res.data.data.isRecorded);
      }
    } catch (err: any) {
      setNotificationMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load attendance sheet.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceSheet();
  }, [selectedClassId, selectedSectionId, selectedDate, session]);

  // Handle individual status toggle
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isLocked && user?.role === 'TEACHER') {
      alert('Attendance for this session is locked. Please contact School Admin to reopen.');
      return;
    }
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  // 1-Click "Mark All Present" Action
  const handleMarkAllPresent = () => {
    if (isLocked && user?.role === 'TEACHER') {
      alert('Attendance is locked.');
      return;
    }
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' as const })));
  };

  // Submit attendance to backend
  const handleSubmit = async () => {
    if (students.length === 0) return;
    setSubmitting(true);
    setNotificationMsg(null);

    try {
      const payload = {
        classId: selectedClassId,
        sectionId: selectedSectionId,
        date: selectedDate,
        session,
        records: students.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          remarks: s.remarks,
        })),
        lockAfterSubmit: true,
      };

      const res = await api.post('/attendance/mark', payload);
      if (res.data.success) {
        setNotificationMsg({
          type: 'success',
          text: `Attendance saved successfully! (${res.data.data.absentNotifiedCount} parent absence alerts triggered)`,
        });
        setIsRecorded(true);
        setIsLocked(true);
      }
    } catch (err: any) {
      setNotificationMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save attendance.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Stats counters
  const total = students.length;
  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const absentCount = students.filter((s) => s.status === 'ABSENT').length;
  const lateCount = students.filter((s) => s.status === 'LATE').length;
  const halfDayCount = students.filter((s) => s.status === 'HALF_DAY').length;
  const leaveCount = students.filter((s) => s.status === 'APPROVED_LEAVE').length;

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNumber && s.rollNumber.includes(search))
  );

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Teacher Fast Interface
            </span>
            <span className="text-xs font-semibold text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">
              Daily Attendance Register
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-navy-900 tracking-tight mt-0.5">
            Mark Class Attendance
          </h1>
        </div>

        {/* Lock indicator */}
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Badge variant="warning">
              <Lock className="w-3 h-3 mr-1 inline" />
              LOCKED (SUBMITTED)
            </Badge>
          ) : (
            <Badge variant="neutral">
              <Unlock className="w-3 h-3 mr-1 inline" />
              EDITING IN PROGRESS
            </Badge>
          )}
        </div>
      </div>

      {/* Control Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Class Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              const cls = classes.find((c) => c._id === e.target.value);
              if (cls?.sections?.[0]) setSelectedSectionId(cls.sections[0]._id);
            }}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none cursor-pointer"
          >
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Section Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Section
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none cursor-pointer"
          >
            {selectedClass?.sections?.map((sec: any) => (
              <option key={sec._id} value={sec._id}>
                Section {sec.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
          />
        </div>

        {/* Session Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Session
          </label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value as any)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="FULL_DAY">Full Day</option>
            <option value="MORNING">Morning Session</option>
            <option value="AFTERNOON">Afternoon Session</option>
          </select>
        </div>
      </div>

      {/* Action Bar & Real-time Counters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Real-time Counts */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            Total: {total}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            Present: {presentCount}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
            Absent: {absentCount}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
            Late: {lateCount}
          </div>
          {leaveCount > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-800">
              Leave: {leaveCount}
            </div>
          )}
        </div>

        {/* One-click mark present & submit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            disabled={isLocked && user?.role === 'TEACHER'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Present
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (isLocked && user?.role === 'TEACHER')}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-navy-900 hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Review & Submit'}
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notificationMsg.text}
        </div>
      )}

      {/* Student List & Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search within class */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none bg-white"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading student sheet...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No students enrolled in this section.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const currentStatus = student.status;

              return (
                <div
                  key={student.studentId}
                  className="p-3.5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                      {student.rollNumber || '#'}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block leading-tight">
                        {student.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Adm #{student.admissionNumber}
                      </span>
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        currentStatus === 'PRESENT'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      P • Present
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        currentStatus === 'ABSENT'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      A • Absent
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.studentId, 'LATE')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        currentStatus === 'LATE'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      L • Late
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.studentId, 'HALF_DAY')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        currentStatus === 'HALF_DAY'
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Half
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.studentId, 'APPROVED_LEAVE')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        currentStatus === 'APPROVED_LEAVE'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Leave
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

