import React, { useState, useEffect } from 'react';
import { Users, Plus, Link as LinkIcon, Trash2, Search, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const ParentsPage: React.FC = () => {
  const [parents, setParents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Forms
  const [parentForm, setParentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    occupation: '',
    preferredLanguage: 'en',
  });

  const [linkForm, setLinkForm] = useState({
    parentId: '',
    studentId: '',
    relationshipType: 'FATHER',
    isPrimaryContact: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [parentsRes, studentsRes] = await Promise.all([
        api.get('/parents'),
        api.get('/students?limit=200'),
      ]);
      if (parentsRes.data.success) setParents(parentsRes.data.data);
      if (studentsRes.data.success) setStudents(studentsRes.data.data.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/parents', parentForm);
      if (res.data.success) {
        setIsAddParentModalOpen(false);
        fetchData();
        alert('Parent registered successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create parent.');
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/parents/link-child', linkForm);
      if (res.data.success) {
        setIsLinkModalOpen(false);
        fetchData();
        alert('Student successfully linked to parent profile.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to link student.');
    }
  };

  const handleUnlink = async (relId: string) => {
    if (!confirm('Unlink this child from parent profile?')) return;
    try {
      await api.delete(`/parents/unlink-child/${relId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unlink.');
    }
  };

  const filtered = parents.filter(
    (p) =>
      p.userId?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      p.userId?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      p.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.userId?.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">
            Parent & Guardian Portal Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified parent-child relationships, mobile notification contacts, and language preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition-colors shadow-xs"
          >
            <LinkIcon className="w-4 h-4 text-emerald-600" />
            Link Child to Parent
          </button>
          <button
            onClick={() => setIsAddParentModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Register Parent
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search parent by name, email, or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none"
        />
      </div>

      {/* Parents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3.5">Parent Details</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5">Preferred Language</th>
                <th className="px-6 py-3.5">Linked Verified Children</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Loading parents...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No parents found.
                  </td>
                </tr>
              ) : (
                filtered.map((parent) => (
                  <tr key={parent._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block text-sm">
                        {parent.userId?.firstName} {parent.userId?.lastName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {parent.occupation || 'Parent / Guardian'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800 block">
                        {parent.userId?.phone}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {parent.userId?.email}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant={parent.preferredLanguage === 'ta' ? 'purple' : 'neutral'}>
                        {parent.preferredLanguage === 'ta' ? 'தமிழ் (Tamil)' : 'English'}
                      </Badge>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {parent.linkedChildren && parent.linkedChildren.length > 0 ? (
                          parent.linkedChildren.map((child: any) => (
                            <div
                              key={child._id}
                              className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px]"
                            >
                              <span className="font-semibold text-slate-800">
                                {child.studentId?.firstName} {child.studentId?.lastName} (
                                {child.studentId?.classId?.name})
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 capitalize">
                                  {child.relationshipType.toLowerCase()}
                                </span>
                                <button
                                  onClick={() => handleUnlink(child._id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                  title="Unlink child"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            No linked students
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setLinkForm((prev) => ({ ...prev, parentId: parent._id }));
                          setIsLinkModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
                      >
                        + Link Child
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Parent Modal */}
      <Modal
        isOpen={isAddParentModalOpen}
        onClose={() => setIsAddParentModalOpen(false)}
        title="Register Parent Account"
        subtitle="Create login credentials for parent portal"
      >
        <form onSubmit={handleCreateParent} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={parentForm.firstName}
                onChange={(e) => setParentForm({ ...parentForm, firstName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={parentForm.lastName}
                onChange={(e) => setParentForm({ ...parentForm, lastName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={parentForm.email}
                onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={parentForm.phone}
                onChange={(e) => setParentForm({ ...parentForm, phone: e.target.value })}
                placeholder="+91 98400 00000"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={parentForm.password}
                onChange={(e) => setParentForm({ ...parentForm, password: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Preferred Language</label>
              <select
                value={parentForm.preferredLanguage}
                onChange={(e) => setParentForm({ ...parentForm, preferredLanguage: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddParentModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Register Parent
            </button>
          </div>
        </form>
      </Modal>

      {/* Link Child Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Link & Verify Student to Parent"
        subtitle="Establish verified parent-student association for portal access"
      >
        <form onSubmit={handleLinkStudent} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Parent *</label>
            <select
              required
              value={linkForm.parentId}
              onChange={(e) => setLinkForm({ ...linkForm, parentId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            >
              <option value="">Select Parent Profile</option>
              {parents.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.userId?.firstName} {p.userId?.lastName} ({p.userId?.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Student *</label>
            <select
              required
              value={linkForm.studentId}
              onChange={(e) => setLinkForm({ ...linkForm, studentId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.firstName} {s.lastName} (Adm #{s.admissionNumber} - {s.classId?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Relationship Type</label>
              <select
                value={linkForm.relationshipType}
                onChange={(e) => setLinkForm({ ...linkForm, relationshipType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              >
                <option value="FATHER">Father</option>
                <option value="MOTHER">Mother</option>
                <option value="LEGAL_GUARDIAN">Legal Guardian</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkForm.isPrimaryContact}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, isPrimaryContact: e.target.checked })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Primary Notification Contact
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Verify & Link Child
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

