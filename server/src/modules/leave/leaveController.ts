import { Response } from 'express';
import { LeaveRequest } from '../../models/LeaveRequest';
import { Attendance } from '../../models/Attendance';
import { Student } from '../../models/Student';
import { ParentStudentRelationship } from '../../models/ParentStudentRelationship';
import { AcademicYear } from '../../models/AcademicYear';
import { AuthRequest } from '../../middleware/auth';
import { notificationService } from '../../services/notificationService';
import { AuditLog } from '../../models/AuditLog';

/**
 * List leave requests
 * Parents see their own submitted requests.
 * Teachers/Admins see all requests for their school or assigned classes.
 */
export const getLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = { tenantId: req.tenantId };

    if (req.user?.role === 'PARENT') {
      query.parentId = req.user._id;
    }

    const requests = await LeaveRequest.find(query)
      .populate({
        path: 'studentId',
        select: 'firstName lastName admissionNumber rollNumber classId sectionId',
        populate: [
          { path: 'classId', select: 'name' },
          { path: 'sectionId', select: 'name' },
        ],
      })
      .populate('parentId', 'firstName lastName email phone')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests.', error: err.message });
  }
};

/**
 * Parent submits a leave request for verified child
 */
export const submitLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, startDate, endDate, totalDays, reason, attachmentUrl } = req.body;

    if (!studentId || !startDate || !endDate || !reason) {
      res.status(400).json({
        success: false,
        message: 'studentId, startDate, endDate, and reason are required.',
      });
      return;
    }

    // Verify parent-child authorization
    if (req.user?.role === 'PARENT') {
      const { Parent } = await import('../../models/Parent');
      const parent = await Parent.findOne({ tenantId: req.tenantId, userId: req.user._id });
      const verified = parent
        ? await ParentStudentRelationship.findOne({
            tenantId: req.tenantId,
            parentId: parent._id,
            studentId,
            isVerified: true,
          })
        : null;

      if (!verified) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are not authorized to submit leave for this student.',
        });
        return;
      }
    }

    const leaveRequest = await LeaveRequest.create({
      tenantId: req.tenantId,
      studentId,
      parentId: req.user!._id,
      startDate: String(startDate),
      endDate: String(endDate),
      totalDays: Number(totalDays || 1),
      reason: reason.trim(),
      attachmentUrl,
      status: 'PENDING',
    });

    const populated = await LeaveRequest.findById(leaveRequest._id).populate(
      'studentId',
      'firstName lastName admissionNumber classId sectionId'
    );

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully.',
      data: populated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to submit leave request.', error: err.message });
  }
};

/**
 * Review leave request (Approve or Reject)
 * Automatically synchronizes with attendance on approval!
 */
export const reviewLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED.' });
      return;
    }

    const leave = await LeaveRequest.findOne({ _id: id, tenantId: req.tenantId }).populate('studentId');
    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave request not found.' });
      return;
    }

    leave.status = status;
    leave.reviewRemarks = remarks?.trim();
    leave.reviewedBy = req.user!._id as any;
    leave.reviewedAt = new Date();

    // If approved, integrate directly into attendance records
    if (status === 'APPROVED') {
      const student = leave.studentId as any;
      const currentYear = await AcademicYear.findOne({ tenantId: req.tenantId, isCurrent: true });

      // Generate date array from startDate to endDate
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        await Attendance.findOneAndUpdate(
          {
            tenantId: req.tenantId,
            studentId: student._id,
            date: dateStr,
            session: 'FULL_DAY',
          },
          {
            academicYearId: currentYear?._id,
            classId: student.classId,
            sectionId: student.sectionId,
            status: 'APPROVED_LEAVE',
            remarks: `Approved Leave: ${leave.reason}`,
            markedBy: req.user!._id,
          },
          { upsert: true }
        );
      }

      leave.autoAttendanceMarked = true;
    }

    await leave.save();

    // Send notification to parent
    notificationService.createNotification({
      tenantId: req.tenantId!,
      recipientUserId: leave.parentId,
      recipientName: 'Parent',
      event: 'LEAVE_STATUS',
      title: `Leave Request ${status}`,
      messageEn: `Your leave request for ${leave.startDate} to ${leave.endDate} has been ${status.toLowerCase()}.${remarks ? ` Remarks: ${remarks}` : ''}`,
      messageTa: `உங்கள் விடுப்பு விண்ணப்பம் (${leave.startDate} முதல் ${leave.endDate} வரை) ${status === 'APPROVED' ? 'ஏற்றுக்கொள்ளப்பட்டது' : 'நிராகரிக்கப்பட்டது'}.`,
    }).catch(() => {});

    await AuditLog.create({
      tenantId: req.tenantId,
      userId: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      action: `LEAVE_REQUEST_${status}`,
      entity: 'LeaveRequest',
      entityId: String(leave._id),
      details: { status, remarks },
      status: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()} and attendance records synchronized.`,
      data: leave,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to review leave request.', error: err.message });
  }
};

