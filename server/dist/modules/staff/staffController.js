"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetStaffPassword = exports.toggleStaffStatus = exports.getStaffById = exports.createStaff = exports.getStaffList = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Staff_1 = require("../../models/Staff");
const User_1 = require("../../models/User");
const TeacherAssignment_1 = require("../../models/TeacherAssignment");
const AuditLog_1 = require("../../models/AuditLog");
/**
 * List all staff members
 */
const getStaffList = async (req, res) => {
    try {
        const { staffType, designation, department } = req.query;
        const query = { tenantId: req.tenantId };
        if (staffType)
            query.staffType = staffType;
        if (designation)
            query.designation = designation;
        if (department)
            query.department = department;
        const staffMembers = await Staff_1.Staff.find(query)
            .populate('userId', 'firstName lastName email phone role isActive lastLogin avatarUrl')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: staffMembers });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch staff members.', error: err.message });
    }
};
exports.getStaffList = getStaffList;
/**
 * Create a new staff member (creates both User and Staff records)
 */
const createStaff = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, role, // TEACHER, PRINCIPAL, COORDINATOR, STAFF
        employeeId, staffType, designation, department, qualification, joiningDate, emergencyContact, } = req.body;
        if (!firstName || !lastName || !email || !password || !employeeId || !designation) {
            res.status(400).json({
                success: false,
                message: 'First name, last name, email, password, employee ID, and designation are required.',
            });
            return;
        }
        const empId = employeeId.toUpperCase().trim();
        const userEmail = email.toLowerCase().trim();
        // Check duplicate employee ID in this school
        const existingStaff = await Staff_1.Staff.findOne({ tenantId: req.tenantId, employeeId: empId });
        if (existingStaff) {
            res.status(409).json({ success: false, message: `Employee ID "${empId}" is already registered in this school.` });
            return;
        }
        // Check duplicate user email in this school
        const existingUser = await User_1.User.findOne({ tenantId: req.tenantId, email: userEmail });
        if (existingUser) {
            res.status(409).json({ success: false, message: `Email "${userEmail}" is already in use by another user in this school.` });
            return;
        }
        // Create User record
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const userRole = ['TEACHER', 'PRINCIPAL', 'COORDINATOR', 'STAFF'].includes(role) ? role : 'TEACHER';
        const user = await User_1.User.create({
            tenantId: req.tenantId,
            email: userEmail,
            phone,
            passwordHash,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: userRole,
            isActive: true,
        });
        // Create Staff profile
        const staff = await Staff_1.Staff.create({
            tenantId: req.tenantId,
            userId: user._id,
            employeeId: empId,
            staffType: staffType || 'TEACHING',
            designation: designation.trim(),
            department: department?.trim(),
            qualification: qualification?.trim(),
            joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            emergencyContact,
            isActive: true,
        });
        const populated = await Staff_1.Staff.findById(staff._id).populate('userId', 'firstName lastName email phone role isActive');
        res.status(201).json({
            success: true,
            message: 'Staff member account created successfully.',
            data: populated,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create staff member.', error: err.message });
    }
};
exports.createStaff = createStaff;
/**
 * Get staff details and teaching assignments
 */
const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await Staff_1.Staff.findOne({ _id: id, tenantId: req.tenantId }).populate('userId', 'firstName lastName email phone role isActive lastLogin');
        if (!staff) {
            res.status(404).json({ success: false, message: 'Staff member not found.' });
            return;
        }
        // Fetch assignments if teaching staff
        const assignments = await TeacherAssignment_1.TeacherAssignment.find({
            tenantId: req.tenantId,
            teacherId: staff.userId,
        })
            .populate('classId', 'name')
            .populate('sectionId', 'name')
            .populate('subjectId', 'name code')
            .populate('academicYearId', 'name isCurrent');
        res.status(200).json({
            success: true,
            data: {
                staff,
                assignments,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch staff member details.', error: err.message });
    }
};
exports.getStaffById = getStaffById;
/**
 * Toggle active status of staff account
 */
const toggleStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const staff = await Staff_1.Staff.findOne({ _id: id, tenantId: req.tenantId });
        if (!staff) {
            res.status(404).json({ success: false, message: 'Staff member not found.' });
            return;
        }
        staff.isActive = Boolean(isActive);
        await staff.save();
        // Update corresponding user record
        await User_1.User.updateOne({ _id: staff.userId, tenantId: req.tenantId }, { isActive: Boolean(isActive) });
        res.status(200).json({
            success: true,
            message: `Staff account ${isActive ? 'activated' : 'deactivated'} successfully.`,
            data: staff,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update staff status.', error: err.message });
    }
};
exports.toggleStaffStatus = toggleStaffStatus;
/**
 * Reset staff user password by administrator
 */
const resetStaffPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
            return;
        }
        const staff = await Staff_1.Staff.findOne({ _id: id, tenantId: req.tenantId });
        if (!staff) {
            res.status(404).json({ success: false, message: 'Staff member not found.' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await User_1.User.updateOne({ _id: staff.userId, tenantId: req.tenantId }, { passwordHash });
        await AuditLog_1.AuditLog.create({
            tenantId: req.tenantId,
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            action: 'STAFF_PASSWORD_RESET_BY_ADMIN',
            entity: 'Staff',
            entityId: String(staff._id),
            status: 'SUCCESS',
        });
        res.status(200).json({ success: true, message: 'Password reset successfully.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to reset password.', error: err.message });
    }
};
exports.resetStaffPassword = resetStaffPassword;
