"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyChildren = exports.unlinkStudent = exports.linkStudentToParent = exports.createParent = exports.getParents = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Parent_1 = require("../../models/Parent");
const User_1 = require("../../models/User");
const Student_1 = require("../../models/Student");
const ParentStudentRelationship_1 = require("../../models/ParentStudentRelationship");
const AuditLog_1 = require("../../models/AuditLog");
/**
 * List parents with linked students
 */
const getParents = async (req, res) => {
    try {
        const search = req.query.search?.trim();
        const query = { tenantId: req.tenantId };
        const parents = await Parent_1.Parent.find(query)
            .populate('userId', 'firstName lastName email phone isActive')
            .sort({ createdAt: -1 });
        // Populate linked children for each parent
        const parentsWithChildren = await Promise.all(parents.map(async (p) => {
            const relations = await ParentStudentRelationship_1.ParentStudentRelationship.find({
                tenantId: req.tenantId,
                parentId: p._id,
            }).populate({
                path: 'studentId',
                populate: [
                    { path: 'classId', select: 'name' },
                    { path: 'sectionId', select: 'name' },
                ],
            });
            return {
                ...p.toObject(),
                linkedChildren: relations,
            };
        }));
        res.status(200).json({ success: true, data: parentsWithChildren });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch parents.', error: err.message });
    }
};
exports.getParents = getParents;
/**
 * Create a new parent profile and user account
 */
const createParent = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, occupation, alternatePhone, address, preferredLanguage, } = req.body;
        if (!firstName || !lastName || !email || !password || !phone) {
            res.status(400).json({
                success: false,
                message: 'First name, last name, email, phone, and initial password are required.',
            });
            return;
        }
        const userEmail = email.toLowerCase().trim();
        const existing = await User_1.User.findOne({ tenantId: req.tenantId, email: userEmail });
        if (existing) {
            res.status(409).json({ success: false, message: `Email "${userEmail}" is already registered in this school.` });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await User_1.User.create({
            tenantId: req.tenantId,
            email: userEmail,
            phone,
            passwordHash,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: 'PARENT',
            isActive: true,
        });
        const parent = await Parent_1.Parent.create({
            tenantId: req.tenantId,
            userId: user._id,
            occupation,
            alternatePhone,
            address,
            preferredLanguage: preferredLanguage || 'en',
            communicationConsent: {
                sms: true,
                whatsapp: true,
                email: true,
                consentDate: new Date(),
            },
        });
        const populated = await Parent_1.Parent.findById(parent._id).populate('userId', 'firstName lastName email phone');
        res.status(201).json({
            success: true,
            message: 'Parent profile created successfully.',
            data: populated,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create parent profile.', error: err.message });
    }
};
exports.createParent = createParent;
/**
 * Link verified student to parent profile
 */
const linkStudentToParent = async (req, res) => {
    try {
        const { parentId, studentId, relationshipType, isPrimaryContact, notes } = req.body;
        if (!parentId || !studentId) {
            res.status(400).json({ success: false, message: 'parentId and studentId are required.' });
            return;
        }
        // Verify parent and student exist under this tenant
        const [parent, student] = await Promise.all([
            Parent_1.Parent.findOne({ _id: parentId, tenantId: req.tenantId }),
            Student_1.Student.findOne({ _id: studentId, tenantId: req.tenantId }),
        ]);
        if (!parent) {
            res.status(404).json({ success: false, message: 'Parent record not found in this school.' });
            return;
        }
        if (!student) {
            res.status(404).json({ success: false, message: 'Student record not found in this school.' });
            return;
        }
        // Check if link already exists
        const existing = await ParentStudentRelationship_1.ParentStudentRelationship.findOne({
            tenantId: req.tenantId,
            parentId,
            studentId,
        });
        if (existing) {
            res.status(409).json({ success: false, message: 'Student is already linked to this parent.' });
            return;
        }
        const relationship = await ParentStudentRelationship_1.ParentStudentRelationship.create({
            tenantId: req.tenantId,
            parentId,
            studentId,
            relationshipType: relationshipType || 'FATHER',
            isPrimaryContact: Boolean(isPrimaryContact),
            isVerified: true,
            verifiedBy: req.user?._id,
            verificationDate: new Date(),
            notes,
        });
        await AuditLog_1.AuditLog.create({
            tenantId: req.tenantId,
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            action: 'PARENT_STUDENT_LINK_VERIFIED',
            entity: 'ParentStudentRelationship',
            entityId: String(relationship._id),
            details: { parentId, studentId, relationshipType },
            status: 'SUCCESS',
        });
        const populated = await ParentStudentRelationship_1.ParentStudentRelationship.findById(relationship._id)
            .populate('studentId', 'admissionNumber firstName lastName classId sectionId')
            .populate({
            path: 'parentId',
            populate: { path: 'userId', select: 'firstName lastName email phone' },
        });
        res.status(201).json({
            success: true,
            message: 'Student successfully linked and verified for parent.',
            data: populated,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to link student to parent.', error: err.message });
    }
};
exports.linkStudentToParent = linkStudentToParent;
/**
 * Remove parent-child relationship
 */
const unlinkStudent = async (req, res) => {
    try {
        const { relationshipId } = req.params;
        const removed = await ParentStudentRelationship_1.ParentStudentRelationship.findOneAndDelete({
            _id: relationshipId,
            tenantId: req.tenantId,
        });
        if (!removed) {
            res.status(404).json({ success: false, message: 'Relationship record not found.' });
            return;
        }
        res.status(200).json({ success: true, message: 'Student successfully unlinked from parent.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to unlink student.', error: err.message });
    }
};
exports.unlinkStudent = unlinkStudent;
/**
 * For authenticated parent: get their own verified linked children
 */
const getMyChildren = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        const parent = await Parent_1.Parent.findOne({
            tenantId: req.tenantId,
            userId: req.user._id,
        });
        if (!parent) {
            res.status(200).json({ success: true, data: [] });
            return;
        }
        const relations = await ParentStudentRelationship_1.ParentStudentRelationship.find({
            tenantId: req.tenantId,
            parentId: parent._id,
            isVerified: true,
        }).populate({
            path: 'studentId',
            populate: [
                { path: 'classId', select: 'name' },
                { path: 'sectionId', select: 'name' },
                { path: 'academicYearId', select: 'name' },
            ],
        });
        res.status(200).json({
            success: true,
            data: relations.map((r) => ({
                relationshipId: r._id,
                relationshipType: r.relationshipType,
                isPrimaryContact: r.isPrimaryContact,
                student: r.studentId,
            })),
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch linked children.', error: err.message });
    }
};
exports.getMyChildren = getMyChildren;
