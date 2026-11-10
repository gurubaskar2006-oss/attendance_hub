import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Upload,
  UserCheck,
  Filter,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Add form
  const [formData, setFormData] = useState({
    admissionNumber: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '2012-05-15',
    gender: 'MALE',
    classId: '',
    sectionId: '',
    rollNumber: '',
    bloodGroup: 'O+',
    parentPhone: '',
    parentName: '',
  });

  // Bulk CSV state
  const [csvText, setCsvText] = useState(
    `admissionNumber,firstName,lastName,dateOfBirth,gender,rollNumber,parentPhone,parentName
SX-2025-011,Naveen,Balasubramaniam,2010-04-12,MALE,11,9840112233,Balasubramaniam
SX-2025-012,Keerthana,Raghavan,2010-09-18,FEMALE,12,9840223344,Raghavan
SX-2025-013,Manoj,Kumar,2010-01-25,MALE,13,9840334455,Kumar`
  );
  const [bulkResult, setBulkResult] = useState<any>(null);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academic/classes');
      if (res.data.success) {
        setClasses(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let query = `/students?search=${encodeURIComponent(search)}`;
      if (selectedClassId) query += `&classId=${selectedClassId}`;
      if (selectedSectionId) query += `&sectionId=${selectedSectionId}`;

      const res = await api.get(query);
      if (res.data.success) {
        setStudents(res.data.data.students);
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
    fetchStudents();
  }, [selectedClassId, selectedSectionId, search]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        emergencyContact: {
          name: formData.parentName || 'Parent',
          relationship: 'Parent',
          phone: formData.parentPhone,
        },
      };

      const res = await api.post('/students', payload);
      if (res.data.success) {
        setIsAddModalOpen(false);
        fetchStudents();
        alert('Student registered successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create student.');
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSectionId) {
      alert('Please select default Class and Section for the bulk import.');
      return;
    }

    try {
      // Parse CSV text
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map((h) => h.trim());
      const studentObjects = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map((v) => v.trim());
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx];
        });
        studentObjects.push(obj);
      }

      const res = await api.post('/students/bulk-import', {
        students: studentObjects,
        defaultClassId: selectedClassId,
        defaultSectionId: selectedSectionId,
      });

      if (res.data.success) {
        setBulkResult(res.data.data);
        fetchStudents();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Bulk import failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">
            Student Management Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enrolled student database with class, section, parent links, and admission records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Bulk CSV Import
          </button>
          <button
            onClick={() => {
              if (classes[0]) {
                setFormData((prev) => ({
                  ...prev,
                  classId: classes[0]._id,
                  sectionId: classes[0].sections?.[0]?._id || '',
                }));
              }
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Enroll Student
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, admission no, or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSectionId('');
            }}
            className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="">All Sections</option>
            {classes
              .find((c) => c._id === selectedClassId)
              ?.sections?.map((sec: any) => (
                <option key={sec._id} value={sec._id}>
                  Section {sec.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3.5">Roll</th>
                <th className="px-6 py-3.5">Student Details</th>
                <th className="px-6 py-3.5">Admission No</th>
                <th className="px-6 py-3.5">Class & Section</th>
                <th className="px-6 py-3.5">Gender & Blood</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No students match the criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                      {student.rollNumber || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block text-sm">
                        {student.firstName} {student.lastName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        DOB: {new Date(student.dateOfBirth).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      {student.admissionNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">
                        {student.classId?.name || 'Class'}
                      </span>
                      <span className="text-slate-500 text-[11px] block">
                        Section {student.sectionId?.name || 'A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <span className="capitalize">{student.gender.toLowerCase()}</span>
                      {student.bloodGroup && (
                        <span className="text-slate-400 text-[10px] ml-1">
                          ({student.bloodGroup})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={student.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {student.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll New Student"
        subtitle="Create official student admission record"
      >
        <form onSubmit={handleCreateStudent} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Admission Number *</label>
              <input
                type="text"
                required
                value={formData.admissionNumber}
                onChange={(e) =>
                  setFormData({ ...formData, admissionNumber: e.target.value.toUpperCase() })
                }
                placeholder="e.g. SX-2025-099"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Roll Number</label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="e.g. 15"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="First name"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Last name"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assign Class *</label>
              <select
                required
                value={formData.classId}
                onChange={(e) => {
                  const cId = e.target.value;
                  const c = classes.find((cl) => cl._id === cId);
                  setFormData({
                    ...formData,
                    classId: cId,
                    sectionId: c?.sections?.[0]?._id || '',
                  });
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              >
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assign Section *</label>
              <select
                required
                value={formData.sectionId}
                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              >
                {classes
                  .find((c) => c._id === formData.classId)
                  ?.sections?.map((s: any) => (
                    <option key={s._id} value={s._id}>
                      Section {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Parent Phone</label>
              <input
                type="text"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                placeholder="+91 98400 00000"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
              <input
                type="text"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                placeholder="e.g. B+"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Enroll Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk CSV Import Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => {
          setIsBulkModalOpen(false);
          setBulkResult(null);
        }}
        title="Bulk Student Import"
        subtitle="Import students in batch using CSV format with duplicate admission number validation"
        maxWidth="2xl"
      >
        <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Class *</label>
              <select
                required
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  const cls = classes.find((c) => c._id === e.target.value);
                  if (cls?.sections?.[0]) setSelectedSectionId(cls.sections[0]._id);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none bg-white"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Section *</label>
              <select
                required
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none bg-white"
              >
                <option value="">Select Section</option>
                {classes
                  .find((c) => c._id === selectedClassId)
                  ?.sections?.map((sec: any) => (
                    <option key={sec._id} value={sec._id}>
                      Section {sec.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">CSV Data (Paste below):</label>
            <textarea
              required
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full font-mono text-[11px] p-3 rounded-xl border border-slate-200 focus:outline-none"
            />
          </div>

          {bulkResult && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800">
              <strong>Import Complete:</strong> {bulkResult.importedCount} students added successfully.
              {bulkResult.skippedCount > 0 && (
                <span className="text-amber-800 block mt-1">
                  {bulkResult.skippedCount} rows skipped due to duplicate admission numbers.
                </span>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Parse & Import CSV
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

