import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, RefreshCw, CheckCircle2, AlertOctagon, History } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const LicensesPage: React.FC = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Transfer form
  const [targetSchoolName, setTargetSchoolName] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferring, setTransferring] = useState(false);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/licenses');
      if (res.data.success) {
        setLicenses(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleUpdateStatus = async (licenseKey: string, newStatus: string) => {
    if (!confirm(`Change license ${licenseKey} status to ${newStatus}?`)) return;

    try {
      await api.patch(`/platform/licenses/${licenseKey}/status`, {
        status: newStatus,
        reason: 'Super Admin manual adjustment',
      });
      fetchLicenses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update license status.');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicense) return;
    setTransferring(true);

    try {
      await api.post(`/platform/licenses/${selectedLicense.licenseKey}/transfer`, {
        targetSchoolName,
        reason: transferReason,
      });
      setIsTransferModalOpen(false);
      setTargetSchoolName('');
      setTransferReason('');
      fetchLicenses();
      alert('License successfully transferred with full audit logging.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'License transfer failed.');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-navy-900 tracking-tight">
          Permanent Software Licenses
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          One-time permanent software license registry. Schools hold permanent software ownership without mandatory recurring software subscription.
        </p>
      </div>

      {/* Licenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3.5">License Key & Tier</th>
                <th className="px-6 py-3.5">Licensed School</th>
                <th className="px-6 py-3.5">Purchase Date</th>
                <th className="px-6 py-3.5">Capacity Limits</th>
                <th className="px-6 py-3.5">Commercial Services (AMC)</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading permanent licenses...
                  </td>
                </tr>
              ) : licenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No software licenses issued yet.
                  </td>
                </tr>
              ) : (
                licenses.map((lic) => (
                  <tr key={lic.licenseKey} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900 block text-xs">
                        {lic.licenseKey}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="purple">{lic.tier}</Badge>
                        <span className="text-[10px] text-slate-400 font-bold">PERMANENT</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 block text-sm">
                        {lic.schoolName}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Customer: {lic.customerName}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-slate-700 block font-medium">
                        {new Date(lic.purchaseDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Ref: {lic.agreementReference}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-slate-800 font-semibold block">
                        {lic.limits?.maxStudents?.toLocaleString() || 'Unlimited'} Students
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {lic.limits?.maxStaff || 'Unlimited'} Staff
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-semibold text-emerald-700 block">
                          AMC: {lic.commercialServices?.annualMaintenanceContract?.active ? 'Active' : 'Expired'}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          SMS Credits: {lic.commercialServices?.smsCreditsPurchased - lic.commercialServices?.smsCreditsUsed} remaining
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          lic.status === 'ACTIVE'
                            ? 'success'
                            : lic.status === 'SUSPENDED'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {lic.status}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedLicense(lic);
                            setIsTransferModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                          title="Transfer License"
                        >
                          Transfer
                        </button>
                        {lic.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleUpdateStatus(lic.licenseKey, 'SUSPENDED')}
                            className="px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold text-xs"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(lic.licenseKey, 'ACTIVE')}
                            className="px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer License Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Audited License Transfer"
        subtitle={`Transfer permanent license ${selectedLicense?.licenseKey} to a new school ownership`}
      >
        <form onSubmit={handleTransfer} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
            <strong>Audited Transfer Protocol:</strong> Software license transfer records original customer, transfer authorization timestamp, administrator identity, and statutory reason.
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Target School Entity Name *</label>
            <input
              type="text"
              required
              value={targetSchoolName}
              onChange={(e) => setTargetSchoolName(e.target.value)}
              placeholder="e.g. St. Xavier Matriculation Academy - Branch 2"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Legal / Operational Reason for Transfer *</label>
            <textarea
              required
              rows={3}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Provide reason for transfer (e.g., Trust restructuring, institution rebranding, management change)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transferring}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {transferring ? 'Recording Transfer...' : 'Authorize & Transfer License'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

