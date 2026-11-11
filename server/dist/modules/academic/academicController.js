"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllocation = exports.createAllocation = exports.getAllocations = exports.createSubject = exports.getSubjects = exports.createSection = exports.createClass = exports.getClasses = exports.setCurrentAcademicYear = exports.createAcademicYear = exports.getAcademicYears = void 0;
const AcademicYear_1 = require("../../models/AcademicYear");
const Class_1 = require("../../models/Class");
const Section_1 = require("../../models/Section");
const Subject_1 = require("../../models/Subject");
const TeacherAssignment_1 = require("../../models/TeacherAssignment");
/**
 * List academic years for the authenticated tenant
 */
const getAcademicYears = async (req, res) => {
    try {
        const years = await AcademicYear_1.AcademicYear.find({ tenantId: req.tenantId }).sort({ startDate: -1 });
        res.status(200).json({ success: true, data: years });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch academic years.', error: err.message });
    }
};
exports.getAcademicYears = getAcademicYears;
/**
 * Create an academic year
 */
const createAcademicYear = async (req, res) => {
    try {
        const { name, startDate, endDate, isCurrent } = req.body;
        if (!name || !startDate || !endDate) {
            res.status(400).json({ success: false, message: 'Name, startDate, and endDate are required.' });
            return;
        }
        if (isCurrent) {
            await AcademicYear_1.AcademicYear.updateMany({ tenantId: req.tenantId }, { isCurrent: false });
        }
        const year = await AcademicYear_1.AcademicYear.create({
            tenantId: req.tenantId,
            name,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isCurrent: Boolean(isCurrent),
        });
        res.status(201).json({ success: true, message: 'Academic year created successfully.', data: year });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create academic year.', error: err.message });
    }
};
exports.createAcademicYear = createAcademicYear;
/**
 * Set an academic year as current
 */
const setCurrentAcademicYear = async (req, res) => {
    try {
        const { id } = req.params;
        await AcademicYear_1.AcademicYear.updateMany({ tenantId: req.tenantId }, { isCurrent: false });
        const year = await AcademicYear_1.AcademicYear.findOneAndUpdate({ _id: id, tenantId: req.tenantId }, { isCurrent: true }, { new: true });
        if (!year) {
            res.status(404).json({ success: false, message: 'Academic year not found.' });
            return;
        }
        res.status(200).json({ success: true, message: `Academic year ${year.name} set as current.`, data: year });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to set current academic year.', error: err.message });
    }
};
exports.setCurrentAcademicYear = setCurrentAcademicYear;
/**
 * List classes with sections for the tenant
 */
const getClasses = async (req, res) => {
    try {
        const classes = await Class_1.Class.find({ tenantId: req.tenantId }).sort({ gradeLevel: 1, displayOrder: 1 });
        // Embed sections
        const classesWithSections = await Promise.all(classes.map(async (cls) => {
            const sections = await Section_1.Section.find({ tenantId: req.tenantId, classId: cls._id }).sort({ name: 1 });
            return {
                ...cls.toObject(),
                sections,
            };
        }));
        res.status(200).json({ success: true, data: classesWithSections });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch classes.', error: err.message });
    }
};
exports.getClasses = getClasses;
/**
 * Create a class
 */
const createClass = async (req, res) => {
    try {
        const { name, gradeLevel, displayOrder, sections } = req.body;
        if (!name || gradeLevel === undefined) {
            res.status(400).json({ success: false, message: 'Class name and gradeLevel are required.' });
            return;
        }
        const newClass = await Class_1.Class.create({
            tenantId: req.tenantId,
            name,
            gradeLevel: Number(gradeLevel),
            displayOrder: Number(displayOrder || 0),
        });
        // Optionally create initial sections (e.g. ['A', 'B'])
        if (Array.isArray(sections) && sections.length > 0) {
            for (const secName of sections) {
                await Section_1.Section.create({
                    tenantId: req.tenantId,
                    classId: newClass._id,
                    name: typeof secName === 'string' ? secName.toUpperCase() : secName.name.toUpperCase(),
                });
            }
        }
        res.status(201).json({ success: true, message: 'Class created successfully.', data: newClass });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create class.', error: err.message });
    }
};
exports.createClass = createClass;
/**
 * Create a section for a class
 */
const createSection = async (req, res) => {
    try {
        const { classId, name, roomNumber, capacity } = req.body;
        if (!classId || !name) {
            res.status(400).json({ success: false, message: 'classId and section name are required.' });
            return;
        }
        const section = await Section_1.Section.create({
            tenantId: req.tenantId,
            classId,
            name: name.toUpperCase().trim(),
            roomNumber,
            capacity: capacity || 45,
        });
        res.status(201).json({ success: true, message: 'Section created successfully.', data: section });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create section.', error: err.message });
    }
};
exports.createSection = createSection;
/**
 * List subjects for the tenant
 */
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject_1.Subject.find({ tenantId: req.tenantId }).sort({ name: 1 });
        res.status(200).json({ success: true, data: subjects });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch subjects.', error: err.message });
    }
};
exports.getSubjects = getSubjects;
/**
 * Create a subject
 */
const createSubject = async (req, res) => {
    try {
        const { name, code, isElective, department } = req.body;
        if (!name || !code) {
            res.status(400).json({ success: false, message: 'Subject name and unique code are required.' });
            return;
        }
        const subject = await Subject_1.Subject.create({
            tenantId: req.tenantId,
            name: name.trim(),
            code: code.toUpperCase().trim(),
            isElective: Boolean(isElective),
            department,
        });
        res.status(201).json({ success: true, message: 'Subject created successfully.', data: subject });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create subject.', error: err.message });
    }
};
exports.createSubject = createSubject;
/**
 * List teacher allocations for classes and sections
 */
const getAllocations = async (req, res) => {
    try {
        const query = { tenantId: req.tenantId };
        // If requesting user is a Teacher, return only their assignments
        if (req.user?.role === 'TEACHER') {
            query.teacherId = req.user._id;
        }
        const allocations = await TeacherAssignment_1.TeacherAssignment.find(query)
            .populate('teacherId', 'firstName lastName email phone')
            .populate('classId', 'name gradeLevel')
            .populate('sectionId', 'name roomNumber')
            .populate('subjectId', 'name code')
            .populate('academicYearId', 'name isCurrent');
        res.status(200).json({ success: true, data: allocations });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch teacher allocations.', error: err.message });
    }
};
exports.getAllocations = getAllocations;
/**
 * Assign teacher to a class/section/subject
 */
const createAllocation = async (req, res) => {
    try {
        const { teacherId, academicYearId, classId, sectionId, subjectId, isClassTeacher } = req.body;
        if (!teacherId || !classId || !sectionId) {
            res.status(400).json({ success: false, message: 'teacherId, classId, and sectionId are required.' });
            return;
        }
        let yearId = academicYearId;
        if (!yearId) {
            const currentYear = await AcademicYear_1.AcademicYear.findOne({ tenantId: req.tenantId, isCurrent: true });
            yearId = currentYear?._id;
        }
        // If marked as class teacher, unmark previous class teacher for this class & section
        if (isClassTeacher) {
            await TeacherAssignment_1.TeacherAssignment.updateMany({ tenantId: req.tenantId, classId, sectionId, academicYearId: yearId }, { isClassTeacher: false });
        }
        const allocation = await TeacherAssignment_1.TeacherAssignment.create({
            tenantId: req.tenantId,
            teacherId,
            academicYearId: yearId,
            classId,
            sectionId,
            subjectId: subjectId || null,
            isClassTeacher: Boolean(isClassTeacher),
        });
        const populated = await TeacherAssignment_1.TeacherAssignment.findById(allocation._id)
            .populate('teacherId', 'firstName lastName email')
            .populate('classId', 'name')
            .populate('sectionId', 'name')
            .populate('subjectId', 'name code');
        res.status(201).json({ success: true, message: 'Teacher allocation created successfully.', data: populated });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create teacher allocation.', error: err.message });
    }
};
exports.createAllocation = createAllocation;
/**
 * Delete a teacher allocation
 */
const deleteAllocation = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await TeacherAssignment_1.TeacherAssignment.findOneAndDelete({ _id: id, tenantId: req.tenantId });
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Allocation not found.' });
            return;
        }
        res.status(200).json({ success: true, message: 'Allocation removed successfully.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete allocation.', error: err.message });
    }
};
exports.deleteAllocation = deleteAllocation;
