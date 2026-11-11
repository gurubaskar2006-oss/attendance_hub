"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAnnouncement = exports.createAnnouncement = exports.getAnnouncements = void 0;
const Announcement_1 = require("../../models/Announcement");
/**
 * List announcements with role-based filtering
 */
const getAnnouncements = async (req, res) => {
    try {
        const userRole = req.user?.role;
        const query = { tenantId: req.tenantId };
        // Role-based visibility
        if (userRole === 'PARENT') {
            query.$or = [{ targetAudience: 'ALL' }, { targetAudience: 'PARENTS' }];
        }
        else if (userRole === 'TEACHER') {
            query.$or = [{ targetAudience: 'ALL' }, { targetAudience: 'TEACHERS' }];
        }
        const announcements = await Announcement_1.Announcement.find(query)
            .populate('authorId', 'firstName lastName role')
            .populate('targetClassId', 'name')
            .sort({ publishedAt: -1 });
        res.status(200).json({ success: true, data: announcements });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch announcements.', error: err.message });
    }
};
exports.getAnnouncements = getAnnouncements;
/**
 * Create announcement
 */
const createAnnouncement = async (req, res) => {
    try {
        const { title, content, targetAudience, targetClassId, priority, attachmentUrl, attachmentName } = req.body;
        if (!title || !content) {
            res.status(400).json({ success: false, message: 'Title and content are required.' });
            return;
        }
        const announcement = await Announcement_1.Announcement.create({
            tenantId: req.tenantId,
            title: title.trim(),
            content: content.trim(),
            targetAudience: targetAudience || 'ALL',
            targetClassId: targetClassId || null,
            priority: priority || 'NORMAL',
            authorId: req.user._id,
            attachmentUrl,
            attachmentName,
            publishedAt: new Date(),
        });
        const populated = await Announcement_1.Announcement.findById(announcement._id).populate('authorId', 'firstName lastName role');
        res.status(201).json({
            success: true,
            message: 'Announcement published successfully.',
            data: populated,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create announcement.', error: err.message });
    }
};
exports.createAnnouncement = createAnnouncement;
/**
 * Delete announcement
 */
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Announcement_1.Announcement.findOneAndDelete({ _id: id, tenantId: req.tenantId });
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Announcement not found.' });
            return;
        }
        res.status(200).json({ success: true, message: 'Announcement removed successfully.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete announcement.', error: err.message });
    }
};
exports.deleteAnnouncement = deleteAnnouncement;
