"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const Notification_1 = require("../models/Notification");
const smsAdapter_1 = require("./smsAdapter");
const whatsappAdapter_1 = require("./whatsappAdapter");
const logger_1 = require("../utils/logger");
class NotificationService {
    /**
     * Send attendance alert (Absent / Late) with English and Tamil template support
     */
    async sendAttendanceAlert(params) {
        const lang = params.preferredLanguage || 'en';
        const messageEn = params.status === 'ABSENT'
            ? `Dear Parent, your child ${params.studentName} of Class ${params.className}-${params.sectionName} has been marked absent today (${params.date}). Please contact the school if this is unexpected.`
            : `Dear Parent, your child ${params.studentName} of Class ${params.className}-${params.sectionName} arrived late to school today (${params.date}).`;
        const messageTa = params.status === 'ABSENT'
            ? `அன்பார்ந்த பெற்றோரே, உங்கள் குழந்தை ${params.studentName} (வகுப்பு ${params.className}-${params.sectionName}) இன்று (${params.date}) பள்ளிக்கு வரவில்லை என பதிவு செய்யப்பட்டுள்ளது. எதிர்பாராததாக இருப்பின் பள்ளியை தொடர்பு கொள்ளவும்.`
            : `அன்பார்ந்த பெற்றோரே, உங்கள் குழந்தை ${params.studentName} (வகுப்பு ${params.className}-${params.sectionName}) இன்று (${params.date}) பள்ளிக்கு தாமதமாக வந்துள்ளார்.`;
        const primaryMessage = lang === 'ta' ? messageTa : messageEn;
        try {
            // 1. Create Portal In-App Notification
            const notificationDoc = await Notification_1.Notification.create({
                tenantId: params.tenantId,
                recipientUserId: params.parentUserId,
                recipientPhone: params.parentPhone,
                recipientName: params.parentName,
                channel: 'PORTAL',
                event: params.status === 'ABSENT' ? 'ATTENDANCE_ABSENT' : 'ATTENDANCE_LATE',
                title: params.status === 'ABSENT' ? 'Student Absence Alert' : 'Late Arrival Notice',
                messageEn,
                messageTa,
                status: 'SENT',
                studentId: params.studentId,
                sentAt: new Date(),
            });
            // 2. Dispatch SMS (Real or Simulated)
            if (params.parentPhone) {
                const smsResult = await smsAdapter_1.smsAdapter.send({
                    toPhone: params.parentPhone,
                    message: primaryMessage,
                });
                // Record SMS dispatch
                await Notification_1.Notification.create({
                    tenantId: params.tenantId,
                    recipientUserId: params.parentUserId,
                    recipientPhone: params.parentPhone,
                    recipientName: params.parentName,
                    channel: 'SMS',
                    event: params.status === 'ABSENT' ? 'ATTENDANCE_ABSENT' : 'ATTENDANCE_LATE',
                    title: 'SMS Attendance Notice',
                    messageEn: primaryMessage,
                    status: smsResult.status,
                    providerResponse: { messageId: smsResult.providerMessageId },
                    errorDetails: smsResult.error,
                    studentId: params.studentId,
                    sentAt: new Date(),
                });
            }
            // 3. Dispatch WhatsApp (if enabled)
            if (params.parentPhone) {
                await whatsappAdapter_1.whatsappAdapter.sendTemplate({
                    toPhone: params.parentPhone,
                    templateName: 'attendance_alert',
                    languageCode: lang,
                    bodyParameters: [
                        params.parentName,
                        params.studentName,
                        `${params.className}-${params.sectionName}`,
                        params.date,
                    ],
                });
            }
            logger_1.logger.info(`[NOTIFICATION SERVICE] Attendance notification processed for student ${params.studentName} (ID: ${params.studentId})`);
        }
        catch (err) {
            logger_1.logger.error('[NOTIFICATION SERVICE] Error dispatching attendance notification:', err);
        }
    }
    /**
     * Generic notification creator for announcements and exam results
     */
    async createNotification(data) {
        return Notification_1.Notification.create({
            tenantId: data.tenantId,
            recipientUserId: data.recipientUserId,
            recipientName: data.recipientName,
            channel: data.channel || 'PORTAL',
            event: data.event,
            title: data.title,
            messageEn: data.messageEn,
            messageTa: data.messageTa,
            status: 'SENT',
            sentAt: new Date(),
        });
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
