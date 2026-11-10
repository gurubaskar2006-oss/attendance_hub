import { Response } from 'express';
import { Announcement } from '../../models/Announcement';
import { AuthRequest } from '../../middleware/auth';
import { AuditLog } from '../../models/AuditLog';

/**
 * List announcements with role-based filtering
 */
export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const query: any = { tenantId: req.tenantId };

    // Role-based visibility
    if (userRole === 'PARENT') {
      query.$or = [{ targetAudience: 'ALL' }, { targetAudience: 'PARENTS' }];
    } else if (userRole === 'TEACHER') {
      query.$or = [{ targetAudience: 'ALL' }, { targetAudience: 'TEACHERS' }];
    }

    const announcements = await Announcement.find(query)
      .populate('authorId', 'firstName lastName role')
      .populate('targetClassId', 'name')
      .sort({ publishedAt: -1 });

    res.status(200).json({ success: true, data: announcements });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcements.', error: err.message });
  }
};

/**
 * Create announcement
 */
export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, targetAudience, targetClassId, priority, attachmentUrl, attachmentName } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Title and content are required.' });
      return;
    }

    const announcement = await Announcement.create({
      tenantId: req.tenantId,
      title: title.trim(),
      content: content.trim(),
      targetAudience: targetAudience || 'ALL',
      targetClassId: targetClassId || null,
      priority: priority || 'NORMAL',
      authorId: req.user!._id,
      attachmentUrl,
      attachmentName,
      publishedAt: new Date(),
    });

    const populated = await Announcement.findById(announcement._id).populate(
      'authorId',
      'firstName lastName role'
    );

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      data: populated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create announcement.', error: err.message });
  }
};

/**
 * Delete announcement
 */
export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await Announcement.findOneAndDelete({ _id: id, tenantId: req.tenantId });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Announcement not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Announcement removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete announcement.', error: err.message });
  }
};

