import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const AttendanceHubPage: React.FC = () => {
  const { user } = useAuth();

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sheetData, setSheetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Correction Modal
  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('PRESENT');
  const [correctionReason, setCorrectionReason] = useState('');

  // Reopen Modal
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academic/classes');
      if (res.data.success && res.data.data.length > 0) {
        setClasses(res.data.data);
        const first = res.data.data[0];
        setSelectedClassId(first._id);
        if (first.sections?.[0]) setSelectedSectionId(first.sections[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedClassId || !selectedSectionId || !selectedDate) return;
    setLoading(true);
    try {
      const res = await api.get(
        `/attendance/sheet?classId=${selectedClassId}&sectionId=${selectedSectionId}&date=${selectedDate}`
      );
      if (res.data.success) {
        setSheetData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedClassId, selectedSectionId, selectedDate]);

  const handleApplyCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      const res = await api.post('/attendance/correct', {
        attendanceId: selectedRecord.recordId,
        newStatus,
        reason: correctionReason,
      });
      if (res.data.success) {
        setIsCorrectModalOpen(false);
        setCorrectionReason('');
        fetchAttendance();
        alert('Attendance corrected with full audit record.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Correction failed.');
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch('/attendance/reopen', {
        classId: selectedClassId,
        sectionId: selectedSectionId,
        date: selectedDate,
        reason: reopenReason,
      });
      if (res.data.success) {
        setIsReopenModalOpen(false);
        setReopenReason('');
        fetchAttendance();
        alert('Attendance reopened for editing.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reopen.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">
            School Attendance Register & Audit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official class registers, duplicate prevention controls, authorized corrections, and audit tracking.
          </p>
        </div>

        {sheetData?.isLocked && ['SCHOOL_ADMIN', 'PRINCIPAL'].includes(user?.role || '') && (
          <button
            onClick={() => setIsReopenModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reopen Attendance for Editing
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              const c = classes.find((cl) => cl._id === e.target.value);
              if (c?.sections?.[0]) setSelectedSectionId(c.sections[0]._id);
            }}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
          >
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Section</label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
          >
            {classes
              .find((c) => c._id === selectedClassId)
              ?.sections?.map((sec: any) => (
                <option key={sec._id} value={sec._id}>
                  Section {sec.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
          />
        </div>
      </div>

      {/* Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              {sheetData?.totalEnrolled || 0} Students on Register
            </span>
            <span className="text-slate-300">•</span>
            {sheetData?.isLocked ? (
              <Badge variant="warning">
                <Lock className="w-3 h-3 mr-1 inline" /> Locked
              </Badge>
            ) : (
              <Badge variant="neutral">Open / Editable</Badge>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
              <tr>
                <th className="px-6 py-3.5">Roll</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Admission No</th>
                <th className="px-6 py-3.5">Recorded Status</th>
                <th className="px-6 py-3.5">Remarks</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : !sheetData?.students || sheetData.students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                sheetData.students.map((student: any) => (
                  <tr key={student.studentId} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono font-bold text-slate-700">
                      {student.rollNumber || '-'}
                    </td>
                    <td className="px-6 py-3 font-bold text-slate-900">{student.name}</td>
                    <td className="px-6 py-3 font-mono text-slate-600">{student.admissionNumber}</td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={
                          student.status === 'PRESENT'
                            ? 'success'
                            : student.status === 'ABSENT'
                            ? 'danger'
                            : student.status === 'LATE'
                            ? 'warning'
                            : student.status === 'APPROVED_LEAVE'
                            ? 'info'
                            : 'neutral'
                        }
                      >
                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-[11px] max-w-xs truncate">
                      {student.remarks || '-'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {student.recordId && ['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR'].includes(user?.role || '') && (
                        <button
                          onClick={() => {
                            setSelectedRecord(student);
                            setNewStatus(student.status === 'ABSENT' ? 'PRESENT' : 'APPROVED_LEAVE');
                            setIsCorrectModalOpen(true);
                          }}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                        >
                          Correct with Audit →
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correct Attendance Modal */}
      <Modal
        isOpen={isCorrectModalOpen}
        onClose={() => setIsCorrectModalOpen(false)}
        title="Authorized Attendance Correction"
        subtitle={`Correction for ${selectedRecord?.name} on ${selectedDate}`}
      >
        <form onSubmit={handleApplyCorrection} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
            <strong>Audited Correction:</strong> Current status is <strong>{selectedRecord?.status}</strong>. Every modification records previous value, new value, reason, and your user identity.
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">New Status *</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            >
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late Arrival</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="APPROVED_LEAVE">Approved Leave</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Correction Reason *</label>
            <textarea
              required
              rows={3}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="e.g. Doctor certificate provided, marked absent by mistake..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCorrectModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Apply Correction & Log
            </button>
          </div>
        </form>
      </Modal>

      {/* Reopen Modal */}
      <Modal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        title="Reopen Attendance Register"
        subtitle={`Reopen locked records for Section ${classes.find((c) => c._id === selectedClassId)?.name} on ${selectedDate}`}
      >
        <form onSubmit={handleReopen} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Administrative Reason *</label>
            <textarea
              required
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g. Teacher requested modifications due to student late arrivals from excursion"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsReopenModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700"
            >
              Reopen Register
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

