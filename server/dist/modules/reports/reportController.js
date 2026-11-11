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
exports.downloadMonthlyAttendancePdf = exports.downloadReportCardPdf = void 0;
const Student_1 = require("../../models/Student");
const Examination_1 = require("../../models/Examination");
const ExaminationSubject_1 = require("../../models/ExaminationSubject");
const Marks_1 = require("../../models/Marks");
const Attendance_1 = require("../../models/Attendance");
const Tenant_1 = require("../../models/Tenant");
const Class_1 = require("../../models/Class");
const Section_1 = require("../../models/Section");
const pdfService_1 = require("../../services/pdfService");
const attendanceCalculator_1 = require("../../services/attendanceCalculator");
/**
 * Download Student Progress Report Card as a generated PDF
 */
const downloadReportCardPdf = async (req, res) => {
    try {
        const { studentId, examinationId } = req.params;
        const [student, exam, tenant] = await Promise.all([
            Student_1.Student.findOne({ _id: studentId, tenantId: req.tenantId })
                .populate('classId', 'name')
                .populate('sectionId', 'name')
                .populate('academicYearId', 'name'),
            Examination_1.Examination.findOne({ _id: examinationId, tenantId: req.tenantId }),
            Tenant_1.Tenant.findOne({ tenantId: req.tenantId }),
        ]);
        if (!student || !exam || !tenant) {
            res.status(404).json({ success: false, message: 'Student, examination, or school profile not found.' });
            return;
        }
        // Check parent permission if parent user
        if (req.user?.role === 'PARENT') {
            const { Parent } = await Promise.resolve().then(() => __importStar(require('../../models/Parent')));
            const { ParentStudentRelationship } = await Promise.resolve().then(() => __importStar(require('../../models/ParentStudentRelationship')));
            const parent = await Parent.findOne({ tenantId: req.tenantId, userId: req.user._id });
            const verified = parent
                ? await ParentStudentRelationship.findOne({
                    tenantId: req.tenantId,
                    parentId: parent._id,
                    studentId: student._id,
                    isVerified: true,
                })
                : null;
            if (!verified) {
                res.status(403).json({ success: false, message: 'Unauthorized to download this student report.' });
                return;
            }
        }
        // Get subjects and marks
        const examSubjects = await ExaminationSubject_1.ExaminationSubject.find({
            tenantId: req.tenantId,
            examinationId: exam._id,
            classId: student.classId,
        }).populate('subjectId', 'name code');
        const marksRecords = await Marks_1.Marks.find({
            tenantId: req.tenantId,
            examinationId: exam._id,
            studentId: student._id,
        });
        const marksMap = new Map();
        marksRecords.forEach((m) => marksMap.set(String(m.examinationSubjectId), m));
        let totalMaxMarks = 0;
        let totalMarksObtained = 0;
        let isAnyFailed = false;
        const subjectRows = examSubjects.map((es) => {
            const mark = marksMap.get(String(es._id));
            const subj = es.subjectId;
            const obtained = mark ? mark.marksObtained : 0;
            const isAbsent = mark ? mark.isAbsent : false;
            totalMaxMarks += es.maxMarks;
            if (!isAbsent)
                totalMarksObtained += obtained;
            if (obtained < es.passingMarks || isAbsent)
                isAnyFailed = true;
            return {
                subjectName: subj?.name || 'Subject',
                subjectCode: subj?.code || '',
                maxMarks: es.maxMarks,
                passingMarks: es.passingMarks,
                marksObtained: obtained,
                isAbsent,
                grade: mark?.grade || (isAbsent ? 'AB' : 'F'),
            };
        });
        const percentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100 * 10) / 10 : 0;
        // Get real student attendance statistics using unified calculator
        const attendanceRecords = await Attendance_1.Attendance.find({
            tenantId: req.tenantId,
            studentId: student._id,
        });
        const attCalc = attendanceCalculator_1.AttendanceCalculatorService.calculate(attendanceRecords);
        const pdfBuffer = await pdfService_1.pdfService.generateReportCard({
            schoolName: tenant.name,
            affiliation: tenant.affiliation,
            address: `${tenant.address.city}, ${tenant.address.state}`,
            studentName: student.fullName(),
            admissionNumber: student.admissionNumber,
            className: student.classId?.name || 'Class',
            sectionName: student.sectionId?.name || '',
            rollNumber: student.rollNumber,
            academicYear: student.academicYearId?.name || '2025-2026',
            examName: exam.name,
            subjects: subjectRows,
            totalMaxMarks,
            totalMarksObtained,
            percentage,
            overallGrade: percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : percentage >= 35 ? 'C' : 'F',
            resultStatus: isAnyFailed ? 'FAIL' : 'PASS',
            attendanceSummary: {
                totalDays: attCalc.totalDays,
                presentDays: attCalc.presentDays + attCalc.lateDays,
                percentage: attCalc.percentage,
            },
            teacherRemarks: isAnyFailed
                ? 'Requires additional attention in weaker subjects. Regular practice advised.'
                : 'Consistent and commendable performance. Keep up the great work!',
            generatedDate: new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="ReportCard_${student.admissionNumber}_${exam._id}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to generate PDF report card.', error: err.message });
    }
};
exports.downloadReportCardPdf = downloadReportCardPdf;
/**
 * Download Monthly Attendance Register PDF for a class & section
 */
const downloadMonthlyAttendancePdf = async (req, res) => {
    try {
        const { classId, sectionId } = req.params;
        const { month, year } = req.query;
        const currentYear = year ? String(year) : new Date().getFullYear().toString();
        const currentMonth = month ? String(month).padStart(2, '0') : (new Date().getMonth() + 1).toString().padStart(2, '0');
        const monthPrefix = `${currentYear}-${currentMonth}`;
        const [tenant, classDoc, sectionDoc, students] = await Promise.all([
            Tenant_1.Tenant.findOne({ tenantId: req.tenantId }),
            Class_1.Class.findOne({ _id: classId, tenantId: req.tenantId }),
            Section_1.Section.findOne({ _id: sectionId, tenantId: req.tenantId }),
            Student_1.Student.find({ tenantId: req.tenantId, classId, sectionId, status: 'ACTIVE' }).sort({
                rollNumber: 1,
                firstName: 1,
            }),
        ]);
        if (!tenant || !classDoc || !sectionDoc) {
            res.status(404).json({ success: false, message: 'Class or school profile not found.' });
            return;
        }
        // Calculate unique working dates in that month for this class
        const distinctDates = await Attendance_1.Attendance.distinct('date', {
            tenantId: req.tenantId,
            classId,
            sectionId,
            date: { $regex: `^${monthPrefix}` },
        });
        const totalWorkingDays = distinctDates.length || 24;
        const studentRows = await Promise.all(students.map(async (student) => {
            const records = await Attendance_1.Attendance.find({
                tenantId: req.tenantId,
                studentId: student._id,
                date: { $regex: `^${monthPrefix}` },
            });
            const calc = attendanceCalculator_1.AttendanceCalculatorService.calculate(records);
            return {
                rollNumber: student.rollNumber,
                admissionNumber: student.admissionNumber,
                studentName: student.fullName(),
                presentDays: calc.presentDays,
                absentDays: calc.absentDays,
                lateDays: calc.lateDays,
                leaveDays: calc.leaveDays,
                attendancePercentage: calc.percentage,
            };
        }));
        const pdfBuffer = await pdfService_1.pdfService.generateMonthlyAttendanceReport({
            schoolName: tenant.name,
            className: classDoc.name,
            sectionName: sectionDoc.name,
            monthYear: monthPrefix,
            totalWorkingDays,
            students: studentRows,
            generatedDate: new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Attendance_${classDoc.name}_${sectionDoc.name}_${monthPrefix}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to generate attendance report PDF.', error: err.message });
    }
};
exports.downloadMonthlyAttendancePdf = downloadMonthlyAttendancePdf;
