"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewLeaveRequest = exports.submitLeaveRequest = exports.getLeaveRequests = void 0;
const LeaveRequest_1 = require("../../models/LeaveRequest");
const Attendance_1 = require("../../models/Attendance");
const ParentStudentRelationship_1 = require("../../models/ParentStudentRelationship");
const AcademicYear_1 = require("../../models/AcademicYear");
const notificationService_1 = require("../../services/notificationService");
const AuditLog_1 = require("../../models/AuditLog");
/**
 * List leave requests
 * Parents see their own submitted requests.
 * Teachers/Admins see all requests for their school or assigned classes.
 */
const getLeaveRequests = async (req, res) => {
    try {
        const query = { tenantId: req.tenantId };
        if (req.user?.role === 'PARENT') {
            query.parentId = req.user._id;
        }
        const requests = await LeaveRequest_1.LeaveRequest.find(query)
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch leave requests.', error: err.message });
    }
};
exports.getLeaveRequests = getLeaveRequests;
/**
 * Parent submits a leave request for verified child
 */
const submitLeaveRequest = async (req, res) => {
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
            const { Parent } = await Promise.resolve().then(() => __importStar(require('../../models/Parent')));
            const parent = await Parent.findOne({ tenantId: req.tenantId, userId: req.user._id });
            const verified = parent
                ? await ParentStudentRelationship_1.ParentStudentRelationship.findOne({
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
        const leaveRequest = await LeaveRequest_1.LeaveRequest.create({
            tenantId: req.tenantId,
            studentId,
            parentId: req.user._id,
            startDate: String(startDate),
            endDate: String(endDate),
            totalDays: Number(totalDays || 1),
            reason: reason.trim(),
            attachmentUrl,
            status: 'PENDING',
        });
        const populated = await LeaveRequest_1.LeaveRequest.findById(leaveRequest._id).populate('studentId', 'firstName lastName admissionNumber classId sectionId');
        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully.',
            data: populated,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to submit leave request.', error: err.message });
    }
};
exports.submitLeaveRequest = submitLeaveRequest;
/**
 * Review leave request (Approve or Reject)
 * Automatically synchronizes with attendance on approval!
 */
const reviewLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body; // 'APPROVED' or 'REJECTED'
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED.' });
            return;
        }
        const leave = await LeaveRequest_1.LeaveRequest.findOne({ _id: id, tenantId: req.tenantId }).populate('studentId');
        if (!leave) {
            res.status(404).json({ success: false, message: 'Leave request not found.' });
            return;
        }
        leave.status = status;
        leave.reviewRemarks = remarks?.trim();
        leave.reviewedBy = req.user._id;
        leave.reviewedAt = new Date();
        // If approved, integrate directly into attendance records
        if (status === 'APPROVED') {
            const student = leave.studentId;
            const currentYear = await AcademicYear_1.AcademicYear.findOne({ tenantId: req.tenantId, isCurrent: true });
            // Generate date array from startDate to endDate
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                await Attendance_1.Attendance.findOneAndUpdate({
                    tenantId: req.tenantId,
                    studentId: student._id,
                    date: dateStr,
                    session: 'FULL_DAY',
                }, {
                    academicYearId: currentYear?._id,
                    classId: student.classId,
                    sectionId: student.sectionId,
                    status: 'APPROVED_LEAVE',
                    remarks: `Approved Leave: ${leave.reason}`,
                    markedBy: req.user._id,
                }, { upsert: true });
            }
            leave.autoAttendanceMarked = true;
        }
        await leave.save();
        // Send notification to parent
        notificationService_1.notificationService.createNotification({
            tenantId: req.tenantId,
            recipientUserId: leave.parentId,
            recipientName: 'Parent',
            event: 'LEAVE_STATUS',
            title: `Leave Request ${status}`,
            messageEn: `Your leave request for ${leave.startDate} to ${leave.endDate} has been ${status.toLowerCase()}.${remarks ? ` Remarks: ${remarks}` : ''}`,
            messageTa: `உங்கள் விடுப்பு விண்ணப்பம் (${leave.startDate} முதல் ${leave.endDate} வரை) ${status === 'APPROVED' ? 'ஏற்றுக்கொள்ளப்பட்டது' : 'நிராகரிக்கப்பட்டது'}.`,
        }).catch(() => { });
        await AuditLog_1.AuditLog.create({
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to review leave request.', error: err.message });
    }
};
exports.reviewLeaveRequest = reviewLeaveRequest;
