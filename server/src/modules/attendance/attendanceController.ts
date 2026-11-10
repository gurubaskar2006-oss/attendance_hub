import { Response } from 'express';
import { Attendance, AttendanceStatus, AttendanceSession } from '../../models/Attendance';
import { AttendanceCorrection } from '../../models/AttendanceCorrection';
import { Student } from '../../models/Student';
import { Class } from '../../models/Class';
import { Section } from '../../models/Section';
import { AcademicYear } from '../../models/AcademicYear';
import { ParentStudentRelationship } from '../../models/ParentStudentRelationship';
import { TeacherAssignment } from '../../models/TeacherAssignment';
import { Staff } from '../../models/Staff';
import { AuthRequest } from '../../middleware/auth';
import { notificationService } from '../../services/notificationService';
import { AuditLog } from '../../models/AuditLog';
import { AttendanceCalculatorService } from '../../services/attendanceCalculator';

/**
 * Fetch class attendance sheet for a given date, class, section, session
 */
export const getAttendanceSheet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, sectionId, date, session = 'FULL_DAY' } = req.query;

    if (!classId || !sectionId || !date) {
      res.status(400).json({
        success: false,
        message: 'classId, sectionId, and date (YYYY-MM-DD) are required.',
      });
      return;
    }

    // Verify Teacher Assignment if user is a teacher
    if (req.user?.role === 'TEACHER') {
      const staff = await Staff.findOne({ tenantId: req.tenantId, userId: req.user._id });
      const teacherIds = [req.user._id];
      if (staff) teacherIds.push(staff._id as any);

      const assignment = await TeacherAssignment.findOne({
        tenantId: req.tenantId,
        teacherId: { $in: teacherIds },
        classId,
        sectionId,
      });

      if (!assignment) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are not assigned to take attendance for this class and section.',
        });
        return;
      }
    }

    const queryDate = String(date);

    // 1. Fetch all active students enrolled in this class and section
    const students = await Student.find({
      tenantId: req.tenantId,
      classId,
      sectionId,
      status: 'ACTIVE',
    }).sort({ rollNumber: 1, firstName: 1 });

    // 2. Fetch existing attendance records for this class & date
    const existingRecords = await Attendance.find({
      tenantId: req.tenantId,
      classId,
      sectionId,
      date: queryDate,
      session: session as AttendanceSession,
    });

    const recordMap = new Map<string, any>();
    let isClassLocked = false;

    existingRecords.forEach((rec) => {
      recordMap.set(String(rec.studentId), rec);
      if (rec.isLocked) isClassLocked = true;
    });

    // 3. Assemble student sheet with current or default status
    const sheet = students.map((student) => {
      const record = recordMap.get(String(student._id));
      return {
        studentId: student._id,
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        name: student.fullName(),
        gender: student.gender,
        status: record ? record.status : 'PRESENT', // default to PRESENT for fast marking
        remarks: record ? record.remarks : '',
        isRecorded: Boolean(record),
        recordId: record ? record._id : null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        date: queryDate,
        session,
        classId,
        sectionId,
        totalEnrolled: students.length,
        isRecorded: existingRecords.length > 0,
        isLocked: isClassLocked,
        students: sheet,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance sheet.', error: err.message });
  }
};

/**
 * Submit or batch save attendance for a class
 */
export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      classId,
      sectionId,
      date,
      session = 'FULL_DAY',
      records, // array of { studentId, status, remarks }
      lockAfterSubmit = true,
    } = req.body;

    if (!classId || !sectionId || !date || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({
        success: false,
        message: 'classId, sectionId, date, and student records array are required.',
      });
      return;
    }

    const queryDate = String(date);

    // Verify Teacher Assignment if user is a teacher
    if (req.user?.role === 'TEACHER') {
      const staff = await Staff.findOne({ tenantId: req.tenantId, userId: req.user._id });
      const teacherIds = [req.user._id];
      if (staff) teacherIds.push(staff._id as any);

      const assignment = await TeacherAssignment.findOne({
        tenantId: req.tenantId,
        teacherId: { $in: teacherIds },
        classId,
        sectionId,
      });

      if (!assignment) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are not assigned to mark attendance for this class and section.',
        });
        return;
      }
    }

    // Fetch current academic year
    const currentYear = await AcademicYear.findOne({ tenantId: req.tenantId, isCurrent: true });
    if (!currentYear) {
      res.status(400).json({ success: false, message: 'No active academic year configured for this school.' });
      return;
    }

    const [classDoc, sectionDoc] = await Promise.all([
      Class.findById(classId),
      Section.findById(sectionId),
    ]);

    const absentStudentsToNotify: Array<{
      studentId: string;
      studentName: string;
      status: 'ABSENT' | 'LATE';
    }> = [];

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of records) {
      const { studentId, status, remarks } = item;

      // Check if attendance already exists
      const existing = await Attendance.findOne({
        tenantId: req.tenantId,
        studentId,
        date: queryDate,
        session,
      });

      if (existing) {
        if (existing.isLocked && req.user?.role === 'TEACHER') {
          // Locked attendance cannot be modified directly by teachers without reopen
          continue;
        }

        existing.status = status;
        if (remarks !== undefined) existing.remarks = remarks;
        if (lockAfterSubmit) {
          existing.isLocked = true;
          existing.lockedAt = new Date();
        }
        await existing.save();
        updatedCount++;
      } else {
        await Attendance.create({
          tenantId: req.tenantId,
          academicYearId: currentYear._id,
          classId,
          sectionId,
          studentId,
          date: queryDate,
          session,
          status,
          remarks,
          markedBy: req.user!._id,
          isLocked: Boolean(lockAfterSubmit),
          lockedAt: lockAfterSubmit ? new Date() : undefined,
        });
        createdCount++;
      }

      if (status === 'ABSENT' || status === 'LATE') {
        const student = await Student.findById(studentId);
        if (student) {
          absentStudentsToNotify.push({
            studentId,
            studentName: student.fullName(),
            status,
          });
        }
      }
    }

    // Trigger parent notifications asynchronously for absent/late students
    setImmediate(async () => {
      for (const item of absentStudentsToNotify) {
        try {
          const relationship = await ParentStudentRelationship.findOne({
            tenantId: req.tenantId,
            studentId: item.studentId,
            isPrimaryContact: true,
          }).populate({
            path: 'parentId',
            populate: { path: 'userId' },
          });

          const parentUser = (relationship?.parentId as any)?.userId;
          const parentProfile = relationship?.parentId as any;

          if (parentUser) {
            await notificationService.sendAttendanceAlert({
              tenantId: req.tenantId!,
              studentId: item.studentId,
              studentName: item.studentName,
              className: classDoc?.name || 'Class',
              sectionName: sectionDoc?.name || '',
              date: queryDate,
              status: item.status,
              parentUserId: parentUser._id,
              parentPhone: parentUser.phone,
              parentName: `${parentUser.firstName} ${parentUser.lastName}`,
              preferredLanguage: parentProfile?.preferredLanguage || 'en',
            });
          }
        } catch (notifErr) {
          // Handled gracefully in background
        }
      }
    });

    // Record Audit Log
    await AuditLog.create({
      tenantId: req.tenantId,
      userId: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      action: 'ATTENDANCE_MARKED',
      entity: 'Attendance',
      details: {
        classId,
        sectionId,
        date: queryDate,
        totalRecords: records.length,
        createdCount,
        updatedCount,
      },
      status: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: `Attendance marked successfully (${createdCount} created, ${updatedCount} updated).`,
      data: {
        createdCount,
        updatedCount,
        totalProcessed: records.length,
        absentNotifiedCount: absentStudentsToNotify.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to record attendance.', error: err.message });
  }
};

/**
 * Make an authorized correction to an attendance record with full audit trail
 */
export const correctAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { attendanceId, newStatus, reason } = req.body;

    if (!attendanceId || !newStatus || !reason) {
      res.status(400).json({
        success: false,
        message: 'attendanceId, newStatus, and a clear reason are required for correction.',
      });
      return;
    }

    const attendance = await Attendance.findOne({ _id: attendanceId, tenantId: req.tenantId });
    if (!attendance) {
      res.status(404).json({ success: false, message: 'Attendance record not found.' });
      return;
    }

    const previousStatus = attendance.status;

    // Create AttendanceCorrection audit record
    const correction = await AttendanceCorrection.create({
      tenantId: req.tenantId,
      attendanceId: attendance._id,
      studentId: attendance.studentId,
      date: attendance.date,
      previousStatus,
      newStatus,
      reason: reason.trim(),
      correctedBy: req.user!._id,
    });

    // Apply change
    attendance.status = newStatus;
    attendance.remarks = `Corrected from ${previousStatus}: ${reason.trim()}`;
    await attendance.save();

    await AuditLog.create({
      tenantId: req.tenantId,
      userId: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      action: 'ATTENDANCE_CORRECTED',
      entity: 'Attendance',
      entityId: String(attendance._id),
      details: { previousStatus, newStatus, reason },
      status: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: 'Attendance record corrected successfully with complete audit trail.',
      data: {
        attendance,
        correction,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to apply attendance correction.', error: err.message });
  }
};

/**
 * Reopen attendance for modification (Admin/Principal only)
 */
export const reopenAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, sectionId, date, session = 'FULL_DAY', reason } = req.body;

    if (!classId || !sectionId || !date) {
      res.status(400).json({ success: false, message: 'classId, sectionId, and date are required.' });
      return;
    }

    const result = await Attendance.updateMany(
      {
        tenantId: req.tenantId,
        classId,
        sectionId,
        date: String(date),
        session,
      },
      { isLocked: false }
    );

    await AuditLog.create({
      tenantId: req.tenantId,
      userId: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      action: 'ATTENDANCE_REOPENED',
      entity: 'Attendance',
      details: { classId, sectionId, date, reason },
      status: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: `Attendance reopened for class on ${date}. Teachers may now modify records.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to reopen attendance.', error: err.message });
  }
};

/**
 * Attendance Analytics: Today's KPIs, class-wise breakdown, monthly trends, consecutive absences
 */
export const getAttendanceAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = (req.query.date as string) || new Date().toISOString().split('T')[0];

    const [
      totalActiveStudents,
      todayRecords,
      classes,
    ] = await Promise.all([
      Student.countDocuments({ tenantId: req.tenantId, status: 'ACTIVE' }),
      Attendance.find({ tenantId: req.tenantId, date: today }),
      Class.find({ tenantId: req.tenantId }).sort({ gradeLevel: 1 }),
    ]);

    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    let approvedLeave = 0;

    todayRecords.forEach((r) => {
      if (r.status === 'PRESENT') present++;
      else if (r.status === 'ABSENT') absent++;
      else if (r.status === 'LATE') late++;
      else if (r.status === 'HALF_DAY') halfDay++;
      else if (r.status === 'APPROVED_LEAVE') approvedLeave++;
    });

    // Unified Attendance Percentage Calculation
    const calcResult = AttendanceCalculatorService.calculateFromCounts({
      present,
      absent,
      late,
      halfDay,
      approvedLeave,
    });
    const totalRecorded = calcResult.totalRecorded;
    const overallPercentage = calcResult.percentage;

    // Class-wise breakdown
    const classBreakdown = await Promise.all(
      classes.map(async (cls) => {
        const classStudents = await Student.countDocuments({
          tenantId: req.tenantId,
          classId: cls._id,
          status: 'ACTIVE',
        });

        const classRecords = todayRecords.filter((r) => String(r.classId) === String(cls._id));
        const classCalc = AttendanceCalculatorService.calculate(classRecords);

        return {
          classId: cls._id,
          className: cls.name,
          enrolledStudents: classStudents,
          recordedStudents: classRecords.length,
          presentCount: classCalc.presentDays + classCalc.lateDays,
          absentCount: classCalc.absentDays,
          percentage: classCalc.percentage,
        };
      })
    );

    // Consecutive absence alerts: find students with 3 or more consecutive absences
    const recentAbsences = await Attendance.aggregate([
      {
        $match: {
          tenantId: req.tenantId,
          status: 'ABSENT',
        },
      },
      {
        $group: {
          _id: '$studentId',
          totalAbsences: { $sum: 1 },
          dates: { $push: '$date' },
        },
      },
      {
        $match: { totalAbsences: { $gte: 3 } },
      },
      { $limit: 10 },
    ]);

    const populatedAlerts = await Promise.all(
      recentAbsences.map(async (alert) => {
        const student = await Student.findById(alert._id)
          .populate('classId', 'name')
          .populate('sectionId', 'name');
        return {
          studentId: alert._id,
          studentName: student ? student.fullName() : 'Unknown Student',
          admissionNumber: student?.admissionNumber,
          className: (student?.classId as any)?.name,
          sectionName: (student?.sectionId as any)?.name,
          consecutiveDays: alert.totalAbsences,
          dates: alert.dates.slice(-5),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        date: today,
        summary: {
          totalEnrolledStudents: totalActiveStudents,
          totalMarkedToday: totalRecorded,
          present,
          absent,
          late,
          halfDay,
          approvedLeave,
          overallPercentage,
        },
        classBreakdown,
        consecutiveAbsenceAlerts: populatedAlerts,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to generate attendance analytics.', error: err.message });
  }
};

/**
 * Attendance Calendar View for a specific student or class
 */
export const getAttendanceCalendar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, classId, sectionId, month, year } = req.query;

    const currentYear = year ? String(year) : new Date().getFullYear().toString();
    const currentMonth = month ? String(month).padStart(2, '0') : (new Date().getMonth() + 1).toString().padStart(2, '0');
    const monthPrefix = `${currentYear}-${currentMonth}`; // e.g. "2026-03"

    const query: any = {
      tenantId: req.tenantId,
      date: { $regex: `^${monthPrefix}` },
    };

    if (studentId) query.studentId = studentId;
    if (classId) query.classId = classId;
    if (sectionId) query.sectionId = sectionId;

    const records = await Attendance.find(query).sort({ date: 1 });

    // Standardized calculation using AttendanceCalculatorService
    const stats = AttendanceCalculatorService.calculate(records);

    res.status(200).json({
      success: true,
      data: {
        month: monthPrefix,
        statistics: {
          totalWorkingDays: stats.totalDays,
          presentDays: stats.presentDays,
          absentDays: stats.absentDays,
          lateDays: stats.lateDays,
          halfDays: stats.halfDays,
          leaveDays: stats.leaveDays,
          attendancePercentage: stats.percentage,
        },
        records,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance calendar.', error: err.message });
  }
};

