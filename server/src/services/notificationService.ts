import { Notification } from '../models/Notification';
import { smsAdapter } from './smsAdapter';
import { whatsappAdapter } from './whatsappAdapter';
import { logger } from '../utils/logger';

export interface ISendAttendanceAlertParams {
  tenantId: string;
  studentId: string;
  studentName: string;
  className: string;
  sectionName: string;
  date: string;
  status: 'ABSENT' | 'LATE';
  parentUserId?: any;
  parentPhone?: string;
  parentName: string;
  preferredLanguage?: 'en' | 'ta';
}

export class NotificationService {
  /**
   * Send attendance alert (Absent / Late) with English and Tamil template support
   */
  public async sendAttendanceAlert(params: ISendAttendanceAlertParams): Promise<void> {
    const lang = params.preferredLanguage || 'en';

    const messageEn =
      params.status === 'ABSENT'
        ? `Dear Parent, your child ${params.studentName} of Class ${params.className}-${params.sectionName} has been marked absent today (${params.date}). Please contact the school if this is unexpected.`
        : `Dear Parent, your child ${params.studentName} of Class ${params.className}-${params.sectionName} arrived late to school today (${params.date}).`;

    const messageTa =
      params.status === 'ABSENT'
        ? `அன்பார்ந்த பெற்றோரே, உங்கள் குழந்தை ${params.studentName} (வகுப்பு ${params.className}-${params.sectionName}) இன்று (${params.date}) பள்ளிக்கு வரவில்லை என பதிவு செய்யப்பட்டுள்ளது. எதிர்பாராததாக இருப்பின் பள்ளியை தொடர்பு கொள்ளவும்.`
        : `அன்பார்ந்த பெற்றோரே, உங்கள் குழந்தை ${params.studentName} (வகுப்பு ${params.className}-${params.sectionName}) இன்று (${params.date}) பள்ளிக்கு தாமதமாக வந்துள்ளார்.`;

    const primaryMessage = lang === 'ta' ? messageTa : messageEn;

    try {
      // 1. Create Portal In-App Notification
      const notificationDoc = await Notification.create({
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
        const smsResult = await smsAdapter.send({
          toPhone: params.parentPhone,
          message: primaryMessage,
        });

        // Record SMS dispatch
        await Notification.create({
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
        await whatsappAdapter.sendTemplate({
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

      logger.info(
        `[NOTIFICATION SERVICE] Attendance notification processed for student ${params.studentName} (ID: ${params.studentId})`
      );
    } catch (err: any) {
      logger.error('[NOTIFICATION SERVICE] Error dispatching attendance notification:', err);
    }
  }

  /**
   * Generic notification creator for announcements and exam results
   */
  public async createNotification(data: {
    tenantId: string;
    recipientUserId?: any;
    recipientName: string;
    channel?: 'PORTAL' | 'SMS' | 'WHATSAPP';
    event: 'LEAVE_STATUS' | 'EXAM_PUBLISHED' | 'ANNOUNCEMENT' | 'GENERAL';
    title: string;
    messageEn: string;
    messageTa?: string;
  }) {
    return Notification.create({
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

export const notificationService = new NotificationService();

