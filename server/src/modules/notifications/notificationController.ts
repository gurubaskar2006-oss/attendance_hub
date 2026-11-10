import { Response } from 'express';
import { Notification } from '../../models/Notification';
import { AuthRequest } from '../../middleware/auth';
import { smsAdapter } from '../../services/smsAdapter';
import { whatsappAdapter } from '../../services/whatsappAdapter';

/**
 * List notification logs for the tenant
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const channel = req.query.channel as string;
    const status = req.query.status as string;

    const query: any = { tenantId: req.tenantId };
    if (channel) query.channel = channel;
    if (status) query.status = status;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('studentId', 'firstName lastName admissionNumber')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.', error: err.message });
  }
};

/**
 * Get in-app notifications for the currently logged-in user
 */
export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find({
      tenantId: req.tenantId,
      recipientUserId: req.user!._id,
      channel: 'PORTAL',
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      tenantId: req.tenantId,
      recipientUserId: req.user!._id,
      channel: 'PORTAL',
      readAt: null,
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch user notifications.', error: err.message });
  }
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientUserId: req.user!._id },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Notification marked as read.', data: notification });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.', error: err.message });
  }
};

/**
 * Get status of notification gateways (SMS & WhatsApp)
 */
export const getProvidersStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        sms: smsAdapter.getStatus(),
        whatsapp: whatsappAdapter.getStatus(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to check provider status.', error: err.message });
  }
};

