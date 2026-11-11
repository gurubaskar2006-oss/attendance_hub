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
exports.promoteStudents = exports.bulkImportStudents = exports.updateStudent = exports.createStudent = exports.getStudentById = exports.getStudents = void 0;
const Student_1 = require("../../models/Student");
const ParentStudentRelationship_1 = require("../../models/ParentStudentRelationship");
const AcademicYear_1 = require("../../models/AcademicYear");
/**
 * List students with pagination, search, and filtering
 */
const getStudents = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const search = req.query.search?.trim();
        const classId = req.query.classId;
        const sectionId = req.query.sectionId;
        const status = req.query.status;
        const query = { tenantId: req.tenantId };
        if (classId)
            query.classId = classId;
        if (sectionId)
            query.sectionId = sectionId;
        if (status)
            query.status = status;
        else
            query.status = { $ne: 'WITHDRAWN' }; // default show active and transferred
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { admissionNumber: { $regex: search, $options: 'i' } },
                { rollNumber: { $regex: search, $options: 'i' } },
            ];
        }
        const [students, total] = await Promise.all([
            Student_1.Student.find(query)
                .populate('classId', 'name gradeLevel')
                .populate('sectionId', 'name')
                .populate('academicYearId', 'name isCurrent')
                .sort({ classId: 1, sectionId: 1, rollNumber: 1, firstName: 1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Student_1.Student.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: {
                students,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch students.', error: err.message });
    }
};
exports.getStudents = getStudents;
/**
 * Get single student profile with parents linked
 */
const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student_1.Student.findOne({ _id: id, tenantId: req.tenantId })
            .populate('classId', 'name gradeLevel')
            .populate('sectionId', 'name roomNumber')
            .populate('academicYearId', 'name');
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found in your school records.' });
            return;
        }
        // If Parent role, verify that this parent is linked to this student
        if (req.user?.role === 'PARENT') {
            const { Parent } = await Promise.resolve().then(() => __importStar(require('../../models/Parent')));
            const parent = await Parent.findOne({ tenantId: req.tenantId, userId: req.user._id });
            const verified = parent
                ? await ParentStudentRelationship_1.ParentStudentRelationship.findOne({
                    tenantId: req.tenantId,
                    parentId: parent._id,
                    studentId: student._id,
                    isVerified: true,
                })
                : null;
            if (!verified) {
                res.status(403).json({
                    success: false,
                    message: 'Access Denied: You are not authorized to view this student profile.',
                });
                return;
            }
        }
        // Fetch linked parent records
        const relationships = await ParentStudentRelationship_1.ParentStudentRelationship.find({
            tenantId: req.tenantId,
            studentId: student._id,
        }).populate({
            path: 'parentId',
            populate: { path: 'userId', select: 'firstName lastName email phone' },
        });
        res.status(200).json({
            success: true,
            data: {
                student,
                parents: relationships,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch student details.', error: err.message });
    }
};
exports.getStudentById = getStudentById;
/**
 * Create a new student
 */
const createStudent = async (req, res) => {
    try {
        const { admissionNumber, firstName, lastName, dateOfBirth, gender, academicYearId, classId, sectionId, rollNumber, bloodGroup, address, emergencyContact, } = req.body;
        if (!admissionNumber || !firstName || !lastName || !dateOfBirth || !classId || !sectionId) {
            res.status(400).json({
                success: false,
                message: 'Admission number, first name, last name, DOB, class, and section are required.',
            });
            return;
        }
        const admNo = admissionNumber.toUpperCase().trim();
        // Check duplicate admission number in this school
        const existing = await Student_1.Student.findOne({ tenantId: req.tenantId, admissionNumber: admNo });
        if (existing) {
            res.status(409).json({
                success: false,
                message: `Student with admission number "${admNo}" already exists in this school.`,
            });
            return;
        }
        let yearId = academicYearId;
        if (!yearId) {
            const currentYear = await AcademicYear_1.AcademicYear.findOne({ tenantId: req.tenantId, isCurrent: true });
            yearId = currentYear?._id;
        }
        const student = await Student_1.Student.create({
            tenantId: req.tenantId,
            admissionNumber: admNo,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            dateOfBirth: new Date(dateOfBirth),
            gender: gender || 'MALE',
            academicYearId: yearId,
            classId,
            sectionId,
            rollNumber: rollNumber?.trim(),
            bloodGroup,
            address,
            emergencyContact,
            status: 'ACTIVE',
        });
        res.status(201).json({
            success: true,
            message: 'Student enrolled successfully.',
            data: student,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create student.', error: err.message });
    }
};
exports.createStudent = createStudent;
/**
 * Update student profile
 */
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        delete updateData.tenantId; // Never permit modifying tenant
        const student = await Student_1.Student.findOneAndUpdate({ _id: id, tenantId: req.tenantId }, updateData, { new: true });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found.' });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Student details updated successfully.',
            data: student,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update student.', error: err.message });
    }
};
exports.updateStudent = updateStudent;
/**
 * Bulk import students via JSON/CSV data
 */
const bulkImportStudents = async (req, res) => {
    try {
        const { students: rawStudents, defaultClassId, defaultSectionId } = req.body;
        if (!Array.isArray(rawStudents) || rawStudents.length === 0) {
            res.status(400).json({ success: false, message: 'Payload must include a non-empty array of students.' });
            return;
        }
        const currentYear = await AcademicYear_1.AcademicYear.findOne({ tenantId: req.tenantId, isCurrent: true });
        const academicYearId = currentYear?._id;
        const imported = [];
        const skipped = [];
        for (const item of rawStudents) {
            const admNo = item.admissionNumber?.toString().toUpperCase().trim();
            if (!admNo || !item.firstName || !item.lastName) {
                skipped.push({ row: item, reason: 'Missing mandatory fields (admissionNumber, firstName, lastName)' });
                continue;
            }
            // Check duplicate
            const exists = await Student_1.Student.findOne({ tenantId: req.tenantId, admissionNumber: admNo });
            if (exists) {
                skipped.push({ admissionNumber: admNo, reason: 'Duplicate admission number in this school' });
                continue;
            }
            const newStudent = await Student_1.Student.create({
                tenantId: req.tenantId,
                admissionNumber: admNo,
                firstName: item.firstName.trim(),
                lastName: item.lastName.trim(),
                dateOfBirth: item.dateOfBirth ? new Date(item.dateOfBirth) : new Date('2015-01-01'),
                gender: ['MALE', 'FEMALE', 'OTHER'].includes(item.gender?.toUpperCase()) ? item.gender.toUpperCase() : 'MALE',
                academicYearId,
                classId: item.classId || defaultClassId,
                sectionId: item.sectionId || defaultSectionId,
                rollNumber: item.rollNumber?.toString().trim(),
                bloodGroup: item.bloodGroup,
                emergencyContact: {
                    phone: item.parentPhone || item.phone || '',
                    name: item.parentName || 'Parent',
                    relationship: 'Parent',
                },
                status: 'ACTIVE',
            });
            imported.push(newStudent);
        }
        res.status(200).json({
            success: true,
            message: `Bulk import completed: ${imported.length} students imported, ${skipped.length} skipped.`,
            data: {
                importedCount: imported.length,
                skippedCount: skipped.length,
                skipped,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Bulk import failed.', error: err.message });
    }
};
exports.bulkImportStudents = bulkImportStudents;
/**
 * Promote students to next class / academic year
 */
const promoteStudents = async (req, res) => {
    try {
        const { studentIds, targetClassId, targetSectionId, targetAcademicYearId } = req.body;
        if (!Array.isArray(studentIds) || !targetClassId || !targetSectionId) {
            res.status(400).json({
                success: false,
                message: 'studentIds, targetClassId, and targetSectionId are required for promotion.',
            });
            return;
        }
        const result = await Student_1.Student.updateMany({ _id: { $in: studentIds }, tenantId: req.tenantId }, {
            classId: targetClassId,
            sectionId: targetSectionId,
            ...(targetAcademicYearId && { academicYearId: targetAcademicYearId }),
        });
        res.status(200).json({
            success: true,
            message: `Successfully promoted ${result.modifiedCount} students.`,
            data: { modifiedCount: result.modifiedCount },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Promotion failed.', error: err.message });
    }
};
exports.promoteStudents = promoteStudents;
