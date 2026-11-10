import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Users, Calendar, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL',
    targetClassId: '',
    priority: 'NORMAL',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [annRes, clsRes] = await Promise.all([
        api.get('/announcements'),
        api.get('/academic/classes'),
      ]);
      if (annRes.data.success) setAnnouncements(annRes.data.data);
      if (clsRes.data.success) setClasses(clsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/announcements', formData);
      if (res.data.success) {
        setIsModalOpen(false);
        setFormData({ title: '', content: '', targetAudience: 'ALL', targetClassId: '', priority: 'NORMAL' });
        fetchData();
        alert('Announcement posted successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post announcement.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const canCreate = ['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR'].includes(user?.role || '');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">
            Institutional Notices & Circulars
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            School-wide broadcasts, emergency alerts, exam circulars, and class-specific notices.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Post Notice / Circular
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading notices...</div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No active announcements.
          </div>
        ) : (
          announcements.map((item) => (
            <div
              key={item._id}
              className={`p-6 rounded-2xl border bg-white shadow-sm space-y-3 ${
                item.priority === 'URGENT'
                  ? 'border-rose-300 ring-1 ring-rose-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-navy-900">{item.title}</span>
                    <Badge
                      variant={
                        item.priority === 'URGENT'
                          ? 'danger'
                          : item.priority === 'HIGH'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {item.priority}
                    </Badge>
                    <Badge variant="purple">Audience: {item.targetAudience}</Badge>
                    {item.targetClassId && (
                      <Badge variant="info">{item.targetClassId.name}</Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Posted by: {item.authorId?.firstName} {item.authorId?.lastName} (
                    {item.authorId?.role?.replace('_', ' ')}) •{' '}
                    {new Date(item.publishedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {canCreate && (
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Delete notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {item.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Post Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Post Institutional Circular"
        subtitle="Broadcast announcement to teachers, parents, or specific classes"
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Notice Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Annual Sports Meet 2026 Registration"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              >
                <option value="ALL">Entire Campus (All)</option>
                <option value="PARENTS">Parents Only</option>
                <option value="TEACHERS">Teachers Only</option>
                <option value="CLASS">Specific Class</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent / Emergency</option>
              </select>
            </div>
          </div>

          {formData.targetAudience === 'CLASS' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Target Class</label>
              <select
                value={formData.targetClassId}
                onChange={(e) => setFormData({ ...formData, targetClassId: e.target.value })}
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
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notice Content *</label>
            <textarea
              required
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter announcement text..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
            />
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
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-slate-800"
            >
              Post Notice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

