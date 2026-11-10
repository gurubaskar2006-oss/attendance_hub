import React, { useState, useEffect } from 'react';
import { Award, Plus, FileText, CheckCircle2, AlertCircle, Download, BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const ExaminationsPage: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isConfigSubjectOpen, setIsConfigSubjectOpen] = useState(false);
  const [isMarksEntryOpen, setIsMarksEntryOpen] = useState(false);

  // Selected State
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [selectedExamSubject, setSelectedExamSubject] = useState<any>(null);

  // Forms
  const [examForm, setExamForm] = useState({
    name: '',
    examType: 'QUARTERLY',
    startDate: '2026-03-15',
    endDate: '2026-03-24',
  });

  const [subjectConfigForm, setSubjectConfigForm] = useState({
    classId: '',
    subjectId: '',
    maxMarks: 100,
    passingMarks: 35,
    examDate: '2026-03-16',
  });

  // Marks Entry state
  const [marksSheet, setMarksSheet] = useState<any>(null);
  const [marksList, setMarksList] = useState<any[]>([]);
  const [savingMarks, setSavingMarks] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const [examRes, classRes, subjRes] = await Promise.all([
        api.get('/examinations'),
        api.get('/academic/classes'),
        api.get('/academic/subjects'),
      ]);
      if (examRes.data.success) setExams(examRes.data.data);
      if (classRes.data.success) setClasses(classRes.data.data);
      if (subjRes.data.success) setSubjects(subjRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/examinations', examForm);
      if (res.data.success) {
        setIsCreateExamOpen(false);
        fetchExams();
        alert('Examination created successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create exam.');
    }
  };

  const handleConfigSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    try {
      const res = await api.post(`/examinations/${selectedExam._id}/subjects`, subjectConfigForm);
      if (res.data.success) {
        setIsConfigSubjectOpen(false);
        fetchExams();
        alert('Subject exam parameters configured successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to configure subject.');
    }
  };

  const openMarksEntry = async (examSubject: any) => {
    setSelectedExamSubject(examSubject);
    try {
      const res = await api.get(`/examinations/subjects/${examSubject._id}/marks`);
      if (res.data.success) {
        setMarksSheet(res.data.data);
        setMarksList(res.data.data.students);
        setIsMarksEntryOpen(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load marks sheet.');
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedExamSubject) return;
    setSavingMarks(true);
    try {
      const res = await api.post(`/examinations/subjects/${selectedExamSubject._id}/marks`, {
        marks: marksList.map((m) => ({
          studentId: m.studentId,
          marksObtained: Number(m.marksObtained),
          isAbsent: Boolean(m.isAbsent),
          remarks: m.remarks,
        })),
      });

      if (res.data.success) {
        setIsMarksEntryOpen(false);
        alert('Marks recorded and grades computed successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save marks.');
    } finally {
      setSavingMarks(false);
    }
  };

  const handlePublishResults = async (examId: string) => {
    if (!confirm('Publish official results for this examination? Results will become visible in parent portal.'))
      return;
    try {
      await api.patch(`/examinations/${examId}/publish`);
      fetchExams();
      alert('Examination results published successfully.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish results.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">
            Examinations & Academic Assessment
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Exam schedules, subject maximum marks, grading calculations, results publication, and official report cards.
          </p>
        </div>

        <button
          onClick={() => setIsCreateExamOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Examination
        </button>
      </div>

      {/* Examinations Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading examinations...</div>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No examinations scheduled for current session.
          </div>
        ) : (
          exams.map((exam) => (
            <div
              key={exam._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-navy-900">{exam.name}</span>
                    <Badge variant={exam.isPublished ? 'success' : 'warning'}>
                      {exam.isPublished ? 'RESULTS PUBLISHED' : 'SCHEDULED / IN PROGRESS'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Type: {exam.examType.replace('_', ' ')} • Schedule: {exam.startDate} to {exam.endDate}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedExam(exam);
                      if (classes[0]) setSubjectConfigForm((prev) => ({ ...prev, classId: classes[0]._id }));
                      if (subjects[0]) setSubjectConfigForm((prev) => ({ ...prev, subjectId: subjects[0]._id }));
                      setIsConfigSubjectOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    + Configure Subject
                  </button>

                  {!exam.isPublished && (
                    <button
                      onClick={() => handlePublishResults(exam._id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs"
                    >
                      Publish Results
                    </button>
                  )}
                </div>
              </div>

              {/* Configured Subjects for this Exam */}
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-2">
                  Configured Examination Subjects ({exam.configuredSubjectsCount || 0})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {exam.subjects && exam.subjects.length > 0 ? (
                    exam.subjects.map((es: any) => (
                      <div
                        key={es._id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">
                              {es.subjectId?.name}
                            </span>
                            <Badge variant="purple">{es.classId?.name}</Badge>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-1">
                            Max: {es.maxMarks} • Pass: {es.passingMarks}
                          </span>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-end">
                          <button
                            onClick={() => openMarksEntry(es)}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                          >
                            Enter / Edit Marks →
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 py-4 text-center text-xs text-slate-400 italic">
                      No subjects configured yet. Click "+ Configure Subject" above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Examination */}
      <Modal
        isOpen={isCreateExamOpen}
        onClose={() => setIsCreateExamOpen(false)}
        title="Schedule New Examination"
        subtitle="Define examination term and overall schedule dates"
      >
        <form onSubmit={handleCreateExam} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Exam Name *</label>
            <input
              type="text"
              required
              value={examForm.name}
              onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
              placeholder="e.g. Term 1 Quarterly Examination 2026"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Exam Type</label>
            <select
              value={examForm.examType}
              onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            >
              <option value="UNIT_TEST">Unit Test</option>
              <option value="QUARTERLY">Quarterly Examination</option>
              <option value="HALF_YEARLY">Half-Yearly Examination</option>
              <option value="ANNUAL">Annual Examination</option>
              <option value="CUSTOM">Custom Assessment</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={examForm.startDate}
                onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={examForm.endDate}
                onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateExamOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Schedule Exam
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Configure Subject */}
      <Modal
        isOpen={isConfigSubjectOpen}
        onClose={() => setIsConfigSubjectOpen(false)}
        title="Configure Subject for Exam"
        subtitle={`Add subject exam parameters to ${selectedExam?.name}`}
      >
        <form onSubmit={handleConfigSubject} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Class *</label>
              <select
                required
                value={subjectConfigForm.classId}
                onChange={(e) => setSubjectConfigForm({ ...subjectConfigForm, classId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Subject *</label>
              <select
                required
                value={subjectConfigForm.subjectId}
                onChange={(e) => setSubjectConfigForm({ ...subjectConfigForm, subjectId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Marks *</label>
              <input
                type="number"
                required
                value={subjectConfigForm.maxMarks}
                onChange={(e) =>
                  setSubjectConfigForm({
                    ...subjectConfigForm,
                    maxMarks: Number(e.target.value),
                    passingMarks: Math.round(Number(e.target.value) * 0.35),
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Passing Marks *</label>
              <input
                type="number"
                required
                value={subjectConfigForm.passingMarks}
                onChange={(e) =>
                  setSubjectConfigForm({ ...subjectConfigForm, passingMarks: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Exam Date</label>
              <input
                type="date"
                value={subjectConfigForm.examDate}
                onChange={(e) => setSubjectConfigForm({ ...subjectConfigForm, examDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsConfigSubjectOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Save Subject Config
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Marks Entry Sheet */}
      <Modal
        isOpen={isMarksEntryOpen}
        onClose={() => setIsMarksEntryOpen(false)}
        title="Subject Marks Entry"
        subtitle={`Class: ${marksSheet?.examSubject?.classId?.name} • Subject: ${marksSheet?.examSubject?.subjectId?.name} (Max Marks: ${marksSheet?.examSubject?.maxMarks})`}
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5">Roll</th>
                  <th className="px-4 py-2.5">Student Name</th>
                  <th className="px-4 py-2.5">Marks (Max: {marksSheet?.examSubject?.maxMarks})</th>
                  <th className="px-4 py-2.5">Absent?</th>
                  <th className="px-4 py-2.5">Calculated Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marksList.map((m, idx) => {
                  const maxMarks = marksSheet?.examSubject?.maxMarks || 100;
                  const marksVal = Number(m.marksObtained || 0);
                  const isInvalid = marksVal > maxMarks || marksVal < 0;

                  return (
                    <tr key={m.studentId} className={isInvalid ? 'bg-rose-50' : 'hover:bg-slate-50'}>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-600">{m.rollNumber || '-'}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{m.name}</td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          disabled={m.isAbsent}
                          value={m.marksObtained}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMarksList((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, marksObtained: val } : item))
                            );
                          }}
                          className={`w-20 px-2 py-1 rounded border font-mono font-bold ${
                            isInvalid
                              ? 'border-rose-500 bg-white text-rose-700'
                              : 'border-slate-200 bg-white text-slate-900'
                          }`}
                        />
                        {isInvalid && (
                          <span className="text-[10px] text-rose-600 block mt-0.5">Exceeds max!</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={m.isAbsent}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setMarksList((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, isAbsent: checked, marksObtained: checked ? 0 : item.marksObtained } : item
                                )
                              );
                            }}
                          />
                          <span className="text-slate-600">Absent</span>
                        </label>
                      </td>
                      <td className="px-4 py-2.5">
                        {m.isAbsent ? (
                          <Badge variant="danger">AB</Badge>
                        ) : (
                          <Badge variant="purple">
                            {marksVal >= 90
                              ? 'A+'
                              : marksVal >= 80
                              ? 'A'
                              : marksVal >= 60
                              ? 'B'
                              : marksVal >= 35
                              ? 'C'
                              : 'F'}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsMarksEntryOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingMarks}
              onClick={handleSaveMarks}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {savingMarks ? 'Saving...' : 'Save & Compute Grades'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

