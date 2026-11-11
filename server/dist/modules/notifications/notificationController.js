"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProvidersStatus = exports.markNotificationRead = exports.getMyNotifications = exports.getNotifications = void 0;
const Notification_1 = require("../../models/Notification");
const smsAdapter_1 = require("../../services/smsAdapter");
const whatsappAdapter_1 = require("../../services/whatsappAdapter");
/**
 * List notification logs for the tenant
 */
const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const channel = req.query.channel;
        const status = req.query.status;
        const query = { tenantId: req.tenantId };
        if (channel)
            query.channel = channel;
        if (status)
            query.status = status;
        const [notifications, total] = await Promise.all([
            Notification_1.Notification.find(query)
                .populate('studentId', 'firstName lastName admissionNumber')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Notification_1.Notification.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch notifications.', error: err.message });
    }
};
exports.getNotifications = getNotifications;
/**
 * Get in-app notifications for the currently logged-in user
 */
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification_1.Notification.find({
            tenantId: req.tenantId,
            recipientUserId: req.user._id,
            channel: 'PORTAL',
        })
            .sort({ createdAt: -1 })
            .limit(30);
        const unreadCount = await Notification_1.Notification.countDocuments({
            tenantId: req.tenantId,
            recipientUserId: req.user._id,
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch user notifications.', error: err.message });
    }
};
exports.getMyNotifications = getMyNotifications;
/**
 * Mark notification as read
 */
const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification_1.Notification.findOneAndUpdate({ _id: id, recipientUserId: req.user._id }, { readAt: new Date() }, { new: true });
        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found.' });
            return;
        }
        res.status(200).json({ success: true, message: 'Notification marked as read.', data: notification });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to mark notification as read.', error: err.message });
    }
};
exports.markNotificationRead = markNotificationRead;
/**
 * Get status of notification gateways (SMS & WhatsApp)
 */
const getProvidersStatus = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                sms: smsAdapter_1.smsAdapter.getStatus(),
                whatsapp: whatsappAdapter_1.whatsappAdapter.getStatus(),
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to check provider status.', error: err.message });
    }
};
exports.getProvidersStatus = getProvidersStatus;
