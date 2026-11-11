"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentReportCard = exports.publishResults = exports.saveMarks = exports.getMarksSheet = exports.configureExamSubject = exports.createExamination = exports.getExaminations = void 0;
const Examination_1 = require("../../models/Examination");
const ExaminationSubject_1 = require("../../models/ExaminationSubject");
const Marks_1 = require("../../models/Marks");
const Student_1 = require("../../models/Student");
const Tenant_1 = require("../../models/Tenant");
const AcademicYear_1 = require("../../models/AcademicYear");
const TeacherAssignment_1 = require("../../models/TeacherAssignment");
const Staff_1 = require("../../models/Staff");
const AuditLog_1 = require("../../models/AuditLog");
// Grade calculation helper based on tenant settings
const calculateGrade = (percentage, gradeScale) => {
    if (!gradeScale || gradeScale.length === 0) {
        if (percentage >= 90)
            return 'A+';
        if (percentage >= 80)
            return 'A';
        if (percentage >= 70)
            return 'B';
        if (percentage >= 50)
            return 'C';
        if (percentage >= 35)
            return 'D';
        return 'F';
    }
    for (const scale of gradeScale) {
        if (percentage >= scale.minMarks && percentage <= scale.maxMarks) {
            return scale.grade;
        }
    }
    return 'F';
};
/**
 * List examinations for the tenant
 */
const getExaminations = async (req, res) => {
    try {
        const exams = await Examination_1.Examination.find({ tenantId: req.tenantId })
            .populate('academicYearId', 'name isCurrent')
            .sort({ startDate: -1 });
        const examsWithSubjects = await Promise.all(exams.map(async (exam) => {
            const subjects = await ExaminationSubject_1.ExaminationSubject.find({
                tenantId: req.tenantId,
                examinationId: exam._id,
            })
                .populate('subjectId', 'name code')
                .populate('classId', 'name');
            return {
                ...exam.toObject(),
                configuredSubjectsCount: subjects.length,
                subjects,
            };
        }));
        res.status(200).json({ success: true, data: examsWithSubjects });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch examinations.', error: err.message });
    }
};
exports.getExaminations = getExaminations;
/**
 * Create an examination
 */
const createExamination = async (req, res) => {
    try {
        const { name, examType, startDate, endDate, academicYearId } = req.body;
        if (!name || !startDate || !endDate) {
            res.status(400).json({ success: false, message: 'Name, startDate, and endDate are required.' });
            return;
        }
        let yearId = academicYearId;
        if (!yearId) {
            const currentYear = await AcademicYear_1.AcademicYear.findOne({ tenantId: req.tenantId, isCurrent: true });
            yearId = currentYear?._id;
        }
        const exam = await Examination_1.Examination.create({
            tenantId: req.tenantId,
            name: name.trim(),
            examType: examType || 'QUARTERLY',
            startDate,
            endDate,
            academicYearId: yearId,
        });
        res.status(201).json({ success: true, message: 'Examination created successfully.', data: exam });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create examination.', error: err.message });
    }
};
exports.createExamination = createExamination;
/**
 * Configure subject for an examination (Class, Subject, MaxMarks, PassingMarks)
 */
const configureExamSubject = async (req, res) => {
    try {
        const { id: examinationId } = req.params;
        const { classId, subjectId, maxMarks, passingMarks, examDate } = req.body;
        if (!classId || !subjectId || maxMarks === undefined) {
            res.status(400).json({ success: false, message: 'classId, subjectId, and maxMarks are required.' });
            return;
        }
        const examSubject = await ExaminationSubject_1.ExaminationSubject.findOneAndUpdate({ tenantId: req.tenantId, examinationId, classId, subjectId }, {
            maxMarks: Number(maxMarks),
            passingMarks: Number(passingMarks !== undefined ? passingMarks : Math.round(Number(maxMarks) * 0.35)),
            examDate,
        }, { upsert: true, new: true })
            .populate('subjectId', 'name code')
            .populate('classId', 'name');
        res.status(200).json({
            success: true,
            message: 'Exam subject configured successfully.',
            data: examSubject,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to configure exam subject.', error: err.message });
    }
};
exports.configureExamSubject = configureExamSubject;
/**
 * Get marks entry sheet for a specific exam subject
 */
const getMarksSheet = async (req, res) => {
    try {
        const { examSubjectId } = req.params;
        const examSubject = await ExaminationSubject_1.ExaminationSubject.findOne({
            _id: examSubjectId,
            tenantId: req.tenantId,
        })
            .populate('examinationId')
            .populate('classId')
            .populate('subjectId');
        if (!examSubject) {
            res.status(404).json({ success: false, message: 'Examination subject not found.' });
            return;
        }
        // Verify Teacher Assignment if user is a teacher
        if (req.user?.role === 'TEACHER') {
            const staff = await Staff_1.Staff.findOne({ tenantId: req.tenantId, userId: req.user._id });
            const teacherIds = [req.user._id];
            if (staff)
                teacherIds.push(staff._id);
            const targetClassId = examSubject.classId?._id || examSubject.classId;
            const targetSubjId = examSubject.subjectId?._id || examSubject.subjectId;
            const assignment = await TeacherAssignment_1.TeacherAssignment.findOne({
                tenantId: req.tenantId,
                teacherId: { $in: teacherIds },
                classId: targetClassId,
                $or: [
                    { subjectId: targetSubjId },
                    { isClassTeacher: true },
                ],
            });
            if (!assignment) {
                res.status(403).json({
                    success: false,
                    message: 'Access Denied: You are not authorized to view marks for this class and subject.',
                });
                return;
            }
        }
        // Get all students in the class
        const students = await Student_1.Student.find({
            tenantId: req.tenantId,
            classId: examSubject.classId._id,
            status: 'ACTIVE',
        })
            .populate('sectionId', 'name')
            .sort({ 'sectionId.name': 1, rollNumber: 1, firstName: 1 });
        // Get existing marks
        const existingMarks = await Marks_1.Marks.find({
            tenantId: req.tenantId,
            examinationSubjectId: examSubject._id,
        });
        const marksMap = new Map();
        existingMarks.forEach((m) => marksMap.set(String(m.studentId), m));
        const sheet = students.map((student) => {
            const mark = marksMap.get(String(student._id));
            return {
                studentId: student._id,
                rollNumber: student.rollNumber,
                admissionNumber: student.admissionNumber,
                name: student.fullName(),
                sectionName: student.sectionId?.name || '',
                marksObtained: mark ? mark.marksObtained : 0,
                isAbsent: mark ? mark.isAbsent : false,
                grade: mark ? mark.grade : '',
                remarks: mark ? mark.remarks : '',
                marksId: mark ? mark._id : null,
            };
        });
        res.status(200).json({
            success: true,
            data: {
                examSubject,
                students: sheet,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch marks sheet.', error: err.message });
    }
};
exports.getMarksSheet = getMarksSheet;
/**
 * Enter/Batch save marks with validation against max marks and grade computation
 */
const saveMarks = async (req, res) => {
    try {
        const { examSubjectId } = req.params;
        const { marks: marksList } = req.body; // array of { studentId, marksObtained, isAbsent, remarks }
        if (!Array.isArray(marksList) || marksList.length === 0) {
            res.status(400).json({ success: false, message: 'Marks array is required.' });
            return;
        }
        const [examSubject, tenant] = await Promise.all([
            ExaminationSubject_1.ExaminationSubject.findOne({ _id: examSubjectId, tenantId: req.tenantId }),
            Tenant_1.Tenant.findOne({ tenantId: req.tenantId }),
        ]);
        if (!examSubject) {
            res.status(404).json({ success: false, message: 'Examination subject not found.' });
            return;
        }
        // Verify Teacher Assignment if user is a teacher
        if (req.user?.role === 'TEACHER') {
            const staff = await Staff_1.Staff.findOne({ tenantId: req.tenantId, userId: req.user._id });
            const teacherIds = [req.user._id];
            if (staff)
                teacherIds.push(staff._id);
            const targetClassId = examSubject.classId?._id || examSubject.classId;
            const targetSubjId = examSubject.subjectId?._id || examSubject.subjectId;
            const assignment = await TeacherAssignment_1.TeacherAssignment.findOne({
                tenantId: req.tenantId,
                teacherId: { $in: teacherIds },
                classId: targetClassId,
                $or: [
                    { subjectId: targetSubjId },
                    { isClassTeacher: true },
                ],
            });
            if (!assignment) {
                res.status(403).json({
                    success: false,
                    message: 'Access Denied: You are not authorized to submit marks for this class and subject.',
                });
                return;
            }
        }
        const maxMarks = examSubject.maxMarks;
        const gradeScale = tenant?.settings.gradeScale;
        let savedCount = 0;
        for (const item of marksList) {
            const { studentId, marksObtained, isAbsent, remarks } = item;
            const numMarks = Number(marksObtained || 0);
            // Validate marks against max marks
            if (numMarks < 0 || numMarks > maxMarks) {
                res.status(400).json({
                    success: false,
                    message: `Marks obtained (${numMarks}) cannot exceed maximum marks (${maxMarks}) or be less than 0.`,
                });
                return;
            }
            const percentage = (numMarks / maxMarks) * 100;
            const calculatedGrade = isAbsent ? 'AB' : calculateGrade(percentage, gradeScale);
            const existing = await Marks_1.Marks.findOne({
                tenantId: req.tenantId,
                examinationSubjectId: examSubject._id,
                studentId,
            });
            if (existing) {
                if (existing.marksObtained !== numMarks) {
                    existing.history.push({
                        previousMarks: existing.marksObtained,
                        newMarks: numMarks,
                        reason: remarks || 'Marks updated by teacher/admin',
                        updatedBy: req.user._id,
                        date: new Date(),
                    });
                }
                existing.marksObtained = numMarks;
                existing.isAbsent = Boolean(isAbsent);
                existing.grade = calculatedGrade;
                if (remarks !== undefined)
                    existing.remarks = remarks;
                await existing.save();
            }
            else {
                await Marks_1.Marks.create({
                    tenantId: req.tenantId,
                    examinationId: examSubject.examinationId,
                    examinationSubjectId: examSubject._id,
                    studentId,
                    marksObtained: numMarks,
                    isAbsent: Boolean(isAbsent),
                    grade: calculatedGrade,
                    remarks,
                    enteredBy: req.user._id,
                });
            }
            savedCount++;
        }
        res.status(200).json({
            success: true,
            message: `Marks saved successfully for ${savedCount} students.`,
            savedCount,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to save marks.', error: err.message });
    }
};
exports.saveMarks = saveMarks;
/**
 * Publish results for an examination
 */
const publishResults = async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Examination_1.Examination.findOneAndUpdate({ _id: id, tenantId: req.tenantId }, {
            isPublished: true,
            publishedAt: new Date(),
            publishedBy: req.user._id,
        }, { new: true });
        if (!exam) {
            res.status(404).json({ success: false, message: 'Examination not found.' });
            return;
        }
        await AuditLog_1.AuditLog.create({
            tenantId: req.tenantId,
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            action: 'EXAM_RESULTS_PUBLISHED',
            entity: 'Examination',
            entityId: String(exam._id),
            details: { examName: exam.name },
            status: 'SUCCESS',
        });
        res.status(200).json({ success: true, message: `Results published for "${exam.name}".`, data: exam });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to publish examination results.', error: err.message });
    }
};
exports.publishResults = publishResults;
/**
 * Get comprehensive student report card summary
 */
const getStudentReportCard = async (req, res) => {
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
        if (!student || !exam) {
            res.status(404).json({ success: false, message: 'Student or examination not found.' });
            return;
        }
        // Get subjects configured for this class and exam
        const examSubjects = await ExaminationSubject_1.ExaminationSubject.find({
            tenantId: req.tenantId,
            examinationId: exam._id,
            classId: student.classId,
        }).populate('subjectId', 'name code');
        // Get marks obtained
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
        const subjects = examSubjects.map((es) => {
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
                grade: mark?.grade || 'F',
                remarks: mark?.remarks || '',
            };
        });
        const percentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100 * 10) / 10 : 0;
        const overallGrade = calculateGrade(percentage, tenant?.settings.gradeScale);
        res.status(200).json({
            success: true,
            data: {
                student: {
                    id: student._id,
                    name: student.fullName(),
                    admissionNumber: student.admissionNumber,
                    rollNumber: student.rollNumber,
                    className: student.classId?.name,
                    sectionName: student.sectionId?.name,
                },
                examination: {
                    id: exam._id,
                    name: exam.name,
                    examType: exam.examType,
                    isPublished: exam.isPublished,
                },
                summary: {
                    totalSubjects: subjects.length,
                    totalMaxMarks,
                    totalMarksObtained,
                    percentage,
                    overallGrade,
                    resultStatus: isAnyFailed ? 'FAIL' : 'PASS',
                },
                subjects,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to retrieve report card.', error: err.message });
    }
};
exports.getStudentReportCard = getStudentReportCard;
