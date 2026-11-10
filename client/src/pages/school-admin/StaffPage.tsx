import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, KeyRound, ShieldAlert, CheckCircle2, UserX } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  // Add Form
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'TEACHER',
    designation: 'Senior Teacher',
    department: 'General',
    qualification: 'M.Sc., B.Ed.',
    staffType: 'TEACHING',
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff');
      if (res.data.success) {
        setStaffList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/staff', formData);
      if (res.data.success) {
        setIsAddModalOpen(false);
        fetchStaff();
        alert('Staff member registered successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create staff account.');
    }
  };

  const handleToggleStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/staff/${staffId}/status`, { isActive: !currentStatus });
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      await api.post(`/staff/${selectedStaff._id}/reset-password`, { newPassword });
      setIsResetModalOpen(false);
      setNewPassword('');
      alert(`Password reset for ${selectedStaff.userId?.firstName}.`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const filtered = staffList.filter(
    (s) =>
      s.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      s.designation.toLowerCase().includes(search.toLowerCase()) ||
      s.userId?.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.userId?.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.userId?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">
            Faculty & Staff Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Teacher profiles, credentials, department allocations, and access permissions.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Faculty / Staff
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, employee ID, designation, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none"
        />
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3.5">Emp ID</th>
                <th className="px-6 py-3.5">Staff Name & Contact</th>
                <th className="px-6 py-3.5">Role & Designation</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading staff directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                filtered.map((staff) => (
                  <tr key={staff._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      {staff.employeeId}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block text-sm">
                        {staff.userId?.firstName} {staff.userId?.lastName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {staff.userId?.email} {staff.userId?.phone ? `• ${staff.userId.phone}` : ''}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="purple">{staff.userId?.role}</Badge>
                      </div>
                      <span className="text-slate-700 font-semibold block mt-1 text-[11px]">
                        {staff.designation}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {staff.department || 'General'}
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant={staff.isActive ? 'success' : 'danger'}>
                        {staff.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setIsResetModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5 inline mr-1" />
                          Password
                        </button>

                        <button
                          onClick={() => handleToggleStatus(staff._id, staff.isActive)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            staff.isActive
                              ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {staff.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Faculty / Staff Account"
        subtitle="Create user login and assign designation"
      >
        <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) =>
                  setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })
                }
                placeholder="e.g. EMP-TCH-201"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role Permission *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              >
                <option value="TEACHER">Teacher</option>
                <option value="COORDINATOR">Academic Coordinator</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="STAFF">Administrative Staff</option>
              </select>
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
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Designation *</label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Senior PGT Chemistry"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Science"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Initial Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            />
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
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Admin Password Reset"
        subtitle={`Reset password for ${selectedStaff?.userId?.firstName} ${selectedStaff?.userId?.lastName}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">New Password (min 6 chars) *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Save New Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

