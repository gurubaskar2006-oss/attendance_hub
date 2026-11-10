import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Award, CalendarCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const CoordinatorDashboard: React.FC = () => {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allocRes, clsRes, examRes] = await Promise.all([
          api.get('/academic/allocations'),
          api.get('/academic/classes'),
          api.get('/examinations'),
        ]);

        if (allocRes.data.success) setAllocations(allocRes.data.data);
        if (clsRes.data.success) setClasses(clsRes.data.data);
        if (examRes.data.success) setExams(examRes.data.data);
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Badge variant="purple">Academic Coordinator Control</Badge>
          <span className="text-xs font-semibold text-slate-400">•</span>
          <span className="text-xs font-semibold text-slate-500">Curriculum & Allocation Oversight</span>
        </div>
        <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
          Academic Coordination Hub
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor faculty subject allocations, timetable distribution, and examination syllabus compliance.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Total Allocated Classes
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{classes.length}</span>
          <span className="text-xs text-slate-500">Active levels & sections</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Teacher Assignments
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {allocations.length}
          </span>
          <span className="text-xs text-slate-500">Active class & subject mappings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Active Examinations
          </span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">{exams.length}</span>
          <span className="text-xs text-slate-500">Assessments tracked</span>
        </div>
      </div>

      {/* Teacher Allocation Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Teacher Class & Subject Allocations
          </h2>
          <Link
            to="/academic-setup"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Manage Allocations <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
              <tr>
                <th className="px-4 py-3">Faculty Member</th>
                <th className="px-4 py-3">Assigned Class & Section</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocations.map((alloc) => (
                <tr key={alloc._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {alloc.teacherId?.firstName} {alloc.teacherId?.lastName}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {alloc.classId?.name} - {alloc.sectionId?.name}
                  </td>
                  <td className="px-4 py-3">
                    {alloc.subjectId ? (
                      <span className="font-semibold text-slate-800">
                        {alloc.subjectId?.name} ({alloc.subjectId?.code})
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Class Teacher Only</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {alloc.isClassTeacher ? (
                      <Badge variant="success">Class Teacher</Badge>
                    ) : (
                      <span className="text-slate-400 text-xs">Subject Teacher</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

