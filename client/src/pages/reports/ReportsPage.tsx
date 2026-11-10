import React, { useState, useEffect } from 'react';
import { FileText, Download, GraduationCap, CalendarCheck, ShieldCheck, Printer } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const ReportsPage: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [examinations, setExaminations] = useState<any[]>([]);

  // Selection states
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clsRes, stuRes, examRes] = await Promise.all([
          api.get('/academic/classes'),
          api.get('/students?limit=200'),
          api.get('/examinations'),
        ]);

        if (clsRes.data.success) {
          setClasses(clsRes.data.data);
          if (clsRes.data.data[0]) {
            setSelectedClassId(clsRes.data.data[0]._id);
            if (clsRes.data.data[0].sections?.[0]) {
              setSelectedSectionId(clsRes.data.data[0].sections[0]._id);
            }
          }
        }
        if (stuRes.data.success) {
          setStudents(stuRes.data.data.students);
          if (stuRes.data.data.students[0]) setSelectedStudentId(stuRes.data.data.students[0]._id);
        }
        if (examRes.data.success) {
          setExaminations(examRes.data.data);
          if (examRes.data.data[0]) setSelectedExamId(examRes.data.data[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleDownloadReportCard = async () => {
    if (!selectedStudentId || !selectedExamId) {
      alert('Please select a student and an examination.');
      return;
    }
    try {
      const url = `/reports/student/${selectedStudentId}/exam/${selectedExamId}/pdf`;
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err: any) {
      alert('Failed to download report card. Please try again.');
    }
  };

  const handleDownloadAttendanceReport = async () => {
    if (!selectedClassId || !selectedSectionId) {
      alert('Please select class and section.');
      return;
    }
    try {
      const url = `/reports/class/${selectedClassId}/section/${selectedSectionId}/monthly-attendance/pdf?month=${selectedMonth}&year=${selectedYear}`;
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err: any) {
      alert('Failed to download attendance register. Please try again.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-navy-900 tracking-tight">
          Official Reports & Document Generator
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Server-side PDF generation powered by actual database marks and attendance records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Progress Report Card Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-900">Student Progress Report Card</h2>
              <p className="text-xs text-slate-500">Official term mark sheet with school header and signatures</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName} (Adm #{s.admissionNumber} - {s.classId?.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Examination</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
              >
                {examinations.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.name} ({ex.examType})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadReportCard}
                className="w-full py-2.5 px-4 rounded-xl bg-navy-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Report Card PDF
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Class Attendance Register Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-900">Monthly Attendance Register</h2>
              <p className="text-xs text-slate-500">Official class monthly attendance summary register</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    const c = classes.find((cl) => cl._id === e.target.value);
                    if (c?.sections?.[0]) setSelectedSectionId(c.sections[0]._id);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                >
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Section</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                >
                  {classes
                    .find((c) => c._id === selectedClassId)
                    ?.sections?.map((s: any) => (
                      <option key={s._id} value={s._id}>
                        Section {s.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Year</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadAttendanceReport}
                className="w-full py-2.5 px-4 rounded-xl bg-navy-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Attendance Register PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

