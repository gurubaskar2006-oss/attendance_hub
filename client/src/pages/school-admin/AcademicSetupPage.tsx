import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Plus, Layers, UserCheck, CheckCircle2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const AcademicSetupPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'years' | 'classes' | 'subjects' | 'allocations'>('classes');

  const [years, setYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  // Forms
  const [yearForm, setYearForm] = useState({ name: '2026-2027', startDate: '2026-06-01', endDate: '2027-04-30', isCurrent: false });
  const [classForm, setClassForm] = useState({ name: '', gradeLevel: 1, displayOrder: 1, initialSections: 'A,B' });
  const [sectionForm, setSectionForm] = useState({ classId: '', name: '', roomNumber: '', capacity: 40 });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', department: 'General', isElective: false });
  const [allocationForm, setAllocationForm] = useState({
    teacherId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    isClassTeacher: false,
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [yearsRes, classesRes, subjectsRes, allocsRes, staffRes] = await Promise.all([
        api.get('/academic/years'),
        api.get('/academic/classes'),
        api.get('/academic/subjects'),
        api.get('/academic/allocations'),
        api.get('/staff'),
      ]);

      if (yearsRes.data.success) setYears(yearsRes.data.data);
      if (classesRes.data.success) setClasses(classesRes.data.data);
      if (subjectsRes.data.success) setSubjects(subjectsRes.data.data);
      if (allocsRes.data.success) setAllocations(allocsRes.data.data);
      if (staffRes.data.success) {
        setTeachers(staffRes.data.data.filter((s: any) => s.staffType === 'TEACHING'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic/years', yearForm);
      setIsYearModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create academic year.');
    }
  };

  const handleSetCurrentYear = async (id: string) => {
    try {
      await api.patch(`/academic/years/${id}/set-current`);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to set current academic year.');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sections = classForm.initialSections.split(',').map((s) => s.trim());
      await api.post('/academic/classes', { ...classForm, sections });
      setIsClassModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create class.');
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic/sections', sectionForm);
      setIsSectionModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create section.');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic/subjects', subjectForm);
      setIsSubjectModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create subject.');
    }
  };

  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic/allocations', allocationForm);
      setIsAllocationModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign teacher allocation.');
    }
  };

  const handleDeleteAllocation = async (id: string) => {
    if (!confirm('Remove this teacher allocation?')) return;
    try {
      await api.delete(`/academic/allocations/${id}`);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove allocation.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-navy-900 tracking-tight">
          Academic Structure Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure academic calendar, class levels, sections, subjects curriculum, and teacher allocations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'classes'
              ? 'border-navy-900 text-navy-900'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Classes & Sections ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'subjects'
              ? 'border-navy-900 text-navy-900'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Subjects Curriculum ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'allocations'
              ? 'border-navy-900 text-navy-900'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Teacher Allocations ({allocations.length})
        </button>
        <button
          onClick={() => setActiveTab('years')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'years'
              ? 'border-navy-900 text-navy-900'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Academic Years ({years.length})
        </button>
      </div>

      {/* Tab: Classes & Sections */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsClassModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" /> Add Class
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-navy-900">{cls.name}</h3>
                  <Badge variant="neutral">Grade {cls.gradeLevel}</Badge>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                    Sections:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cls.sections && cls.sections.length > 0 ? (
                      cls.sections.map((sec: any) => (
                        <span
                          key={sec._id}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700"
                        >
                          Section {sec.name} {sec.roomNumber ? `(${sec.roomNumber})` : ''}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No sections added</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      setSectionForm({ classId: cls._id, name: '', roomNumber: '', capacity: 40 });
                      setIsSectionModalOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    + Add Section
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Subjects */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3.5">Subject Code</th>
                  <th className="px-6 py-3.5">Subject Name</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3 font-mono font-bold text-slate-900">{s.code}</td>
                    <td className="px-6 py-3 font-bold text-slate-800">{s.name}</td>
                    <td className="px-6 py-3 text-slate-600">{s.department || 'General'}</td>
                    <td className="px-6 py-3">
                      <Badge variant={s.isElective ? 'purple' : 'neutral'}>
                        {s.isElective ? 'Elective' : 'Core Subject'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Teacher Allocations */}
      {activeTab === 'allocations' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAllocationModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" /> Assign Teacher
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3.5">Teacher</th>
                  <th className="px-6 py-3.5">Class & Section</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Class Teacher Role</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((alloc) => (
                  <tr key={alloc._id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-slate-900 block">
                        {alloc.teacherId?.firstName} {alloc.teacherId?.lastName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {alloc.teacherId?.email}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">
                      {alloc.classId?.name} - Section {alloc.sectionId?.name}
                    </td>
                    <td className="px-6 py-3.5">
                      {alloc.subjectId ? (
                        <span className="font-bold text-slate-800">
                          {alloc.subjectId?.name} ({alloc.subjectId?.code})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None (Class Teacher Only)</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {alloc.isClassTeacher ? (
                        <Badge variant="success">Class Teacher</Badge>
                      ) : (
                        <span className="text-slate-400 text-xs">Subject Teacher</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteAllocation(alloc._id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove allocation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Academic Years */}
      {activeTab === 'years' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsYearModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" /> Add Academic Year
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3.5">Academic Session</th>
                  <th className="px-6 py-3.5">Start Date</th>
                  <th className="px-6 py-3.5">End Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {years.map((y) => (
                  <tr key={y._id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3.5 font-bold text-slate-900 text-sm">{y.name}</td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {new Date(y.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {new Date(y.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={y.isCurrent ? 'success' : 'neutral'}>
                        {y.isCurrent ? 'ACTIVE CURRENT' : 'ARCHIVED'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {!y.isCurrent && (
                        <button
                          onClick={() => handleSetCurrentYear(y._id)}
                          className="px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs"
                        >
                          Set as Current
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Class */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title="Add Class"
        subtitle="Create academic class and initial sections"
      >
        <form onSubmit={handleCreateClass} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Class Name *</label>
            <input
              type="text"
              required
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              placeholder="e.g. Class 10 or Grade 10"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Grade Level *</label>
              <input
                type="number"
                required
                value={classForm.gradeLevel}
                onChange={(e) => setClassForm({ ...classForm, gradeLevel: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Initial Sections (comma separated)</label>
              <input
                type="text"
                value={classForm.initialSections}
                onChange={(e) => setClassForm({ ...classForm, initialSections: e.target.value })}
                placeholder="A, B, C"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none uppercase"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsClassModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Create Class
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Section */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title="Add Section to Class"
        subtitle="Create section identifier and room assignment"
      >
        <form onSubmit={handleCreateSection} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Section Name *</label>
            <input
              type="text"
              required
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value.toUpperCase() })}
              placeholder="e.g. C or Rose"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none uppercase font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Room Number</label>
              <input
                type="text"
                value={sectionForm.roomNumber}
                onChange={(e) => setSectionForm({ ...sectionForm, roomNumber: e.target.value })}
                placeholder="e.g. Room 204"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Capacity</label>
              <input
                type="number"
                value={sectionForm.capacity}
                onChange={(e) => setSectionForm({ ...sectionForm, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsSectionModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Add Section
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Subject */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="Add Subject"
        subtitle="Configure subject curriculum details"
      >
        <form onSubmit={handleCreateSubject} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject Name *</label>
              <input
                type="text"
                required
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                placeholder="e.g. Computer Science"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject Code *</label>
              <input
                type="text"
                required
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. CS101"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none uppercase font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsSubjectModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Create Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Teacher Allocation */}
      <Modal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        title="Assign Teacher Allocation"
        subtitle="Map teacher to class, section, and subject responsibility"
      >
        <form onSubmit={handleCreateAllocation} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Teacher *</label>
            <select
              required
              value={allocationForm.teacherId}
              onChange={(e) => setAllocationForm({ ...allocationForm, teacherId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            >
              <option value="">Select Faculty Member</option>
              {teachers.map((t) => (
                <option key={t.userId?._id} value={t.userId?._id}>
                  {t.userId?.firstName} {t.userId?.lastName} ({t.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Class *</label>
              <select
                required
                value={allocationForm.classId}
                onChange={(e) => {
                  const cId = e.target.value;
                  const c = classes.find((cl) => cl._id === cId);
                  setAllocationForm({
                    ...allocationForm,
                    classId: cId,
                    sectionId: c?.sections?.[0]?._id || '',
                  });
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Section *</label>
              <select
                required
                value={allocationForm.sectionId}
                onChange={(e) => setAllocationForm({ ...allocationForm, sectionId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              >
                <option value="">Select Section</option>
                {classes
                  .find((c) => c._id === allocationForm.classId)
                  ?.sections?.map((sec: any) => (
                    <option key={sec._id} value={sec._id}>
                      Section {sec.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Subject (Optional if Class Teacher only)</label>
            <select
              value={allocationForm.subjectId}
              onChange={(e) => setAllocationForm({ ...allocationForm, subjectId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            >
              <option value="">No Subject (General Responsibility)</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center pt-2">
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allocationForm.isClassTeacher}
                onChange={(e) =>
                  setAllocationForm({ ...allocationForm, isClassTeacher: e.target.checked })
                }
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Designate as Primary Class Teacher (Takes routine daily attendance)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAllocationModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Assign Allocation
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Academic Year */}
      <Modal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        title="Add Academic Year"
        subtitle="Configure school session dates"
      >
        <form onSubmit={handleCreateYear} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Session Name *</label>
            <input
              type="text"
              required
              value={yearForm.name}
              onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
              placeholder="e.g. 2026-2027"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={yearForm.startDate}
                onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={yearForm.endDate}
                onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center pt-2">
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={yearForm.isCurrent}
                onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Set as Current Active Session
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsYearModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Save Academic Year
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

