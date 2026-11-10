import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  KeyRound,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const SchoolsPage: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  // Form state for school onboarding
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    affiliation: 'CBSE',
    registrationNumber: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    contactEmail: '',
    contactPhone: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: '',
    tier: 'ENTERPRISE',
    maxStudents: 2500,
    maxStaff: 200,
    agreementReference: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/schools');
      if (res.data.success) {
        setSchools(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change school status to ${newStatus}?`)) return;

    try {
      await api.patch(`/platform/schools/${tenantId}/status`, {
        status: newStatus,
        reason: 'Super Admin manual action',
      });
      fetchSchools();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update school status.');
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        affiliation: formData.affiliation,
        registrationNumber: formData.registrationNumber,
        address: {
          city: formData.city,
          state: formData.state,
          country: 'India',
        },
        contact: {
          email: formData.contactEmail,
          phone: formData.contactPhone,
        },
        adminFirstName: formData.adminFirstName,
        adminLastName: formData.adminLastName,
        adminEmail: formData.adminEmail,
        adminPhone: formData.adminPhone,
        adminPassword: formData.adminPassword,
        tier: formData.tier,
        maxStudents: Number(formData.maxStudents),
        maxStaff: Number(formData.maxStaff),
        agreementReference: formData.agreementReference || `AGR-${Date.now()}`,
      };

      const res = await api.post('/platform/schools', payload);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchSchools();
        alert('School registered and permanent software license issued successfully!');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to onboard school.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.tenantId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">
            Registered School Tenants
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Independent school deployments under 6th Civilians Corporation permanent licensing model.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Onboard New School
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by school name, unique code, or tenant ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Showing {filteredSchools.length} of {schools.length} schools
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3.5">School & Tenant</th>
                <th className="px-6 py-3.5">Affiliation & Location</th>
                <th className="px-6 py-3.5">Admin Account</th>
                <th className="px-6 py-3.5">Enrolled / Staff</th>
                <th className="px-6 py-3.5">License Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading school directory...
                  </td>
                </tr>
              ) : filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No schools matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSchools.map((school) => (
                  <tr key={school.tenantId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">
                          {school.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500">
                            {school.tenantId}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono font-bold text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            CODE: {school.code}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700 block">
                        {school.affiliation}
                      </span>
                      <span className="text-slate-500 text-[11px] block mt-0.5">
                        {school.address?.city}, {school.address?.state}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800 block">
                        {school.primaryAdmin
                          ? `${school.primaryAdmin.firstName} ${school.primaryAdmin.lastName}`
                          : 'Not assigned'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono block">
                        {school.primaryAdmin?.email || school.contact?.email}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">
                        {school.metrics?.studentCount || 0} Students
                      </span>
                      <span className="text-slate-500 text-[11px] block">
                        {school.metrics?.staffCount || 0} Staff
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <Badge variant={school.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {school.status}
                        </Badge>
                        {school.license && (
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {school.license.tier} • PERM
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(school.tenantId, school.status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          school.status === 'ACTIVE'
                            ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {school.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard School Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard New School"
        subtitle="Provision unique tenantId, permanent license, and initial School Administrator"
        maxWidth="2xl"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateSchool} className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold uppercase tracking-wider text-slate-700 block mb-2">
              1. School Information
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">School Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Modern Matriculation Higher Secondary School"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Unique Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MMHSS"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Board / Affiliation</label>
                <select
                  value={formData.affiliation}
                  onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                >
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="MATRICULATION">Matriculation</option>
                  <option value="STATE_BOARD">State Board</option>
                  <option value="IB">IB / Cambridge</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">City, State</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold uppercase tracking-wider text-slate-700 block mb-2">
              2. Initial School Administrator Credentials
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.adminFirstName}
                  onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                  placeholder="e.g. John"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.adminLastName}
                  onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                  placeholder="e.g. Doe"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Admin Email *</label>
                <input
                  type="email"
                  required
                  value={formData.adminEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, adminEmail: e.target.value, contactEmail: e.target.value })
                  }
                  placeholder="admin@school.edu.in"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold uppercase tracking-wider text-slate-700 block mb-2">
              3. Permanent License Entitlement
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">License Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                >
                  <option value="STANDARD">Standard</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Max Students</label>
                <input
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Max Staff</label>
                <input
                  type="number"
                  value={formData.maxStaff}
                  onChange={(e) => setFormData({ ...formData, maxStaff: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Onboarding School...' : 'Issue License & Create School'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

