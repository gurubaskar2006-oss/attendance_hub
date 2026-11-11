"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.getPlatformSettings = exports.transferLicense = exports.updateLicenseStatus = exports.getLicenses = exports.updateSchoolStatus = exports.createSchool = exports.getSchools = exports.getPlatformDashboard = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Tenant_1 = require("../../models/Tenant");
const SoftwareLicense_1 = require("../../models/SoftwareLicense");
const User_1 = require("../../models/User");
const Student_1 = require("../../models/Student");
const Staff_1 = require("../../models/Staff");
const Notification_1 = require("../../models/Notification");
const AuditLog_1 = require("../../models/AuditLog");
const smsAdapter_1 = require("../../services/smsAdapter");
const whatsappAdapter_1 = require("../../services/whatsappAdapter");
const env_1 = require("../../config/env");
/**
 * Super Admin Platform Overview Dashboard
 */
const getPlatformDashboard = async (req, res) => {
    try {
        const [totalSchools, activeSchools, suspendedSchools, totalLicenses, activeLicenses, totalStudents, totalStaff, totalNotifications, recentAuditLogs,] = await Promise.all([
            Tenant_1.Tenant.countDocuments(),
            Tenant_1.Tenant.countDocuments({ status: 'ACTIVE' }),
            Tenant_1.Tenant.countDocuments({ status: 'SUSPENDED' }),
            SoftwareLicense_1.SoftwareLicense.countDocuments(),
            SoftwareLicense_1.SoftwareLicense.countDocuments({ status: 'ACTIVE' }),
            Student_1.Student.countDocuments({ status: 'ACTIVE' }),
            Staff_1.Staff.countDocuments({ isActive: true }),
            Notification_1.Notification.countDocuments(),
            AuditLog_1.AuditLog.find().sort({ createdAt: -1 }).limit(10),
        ]);
        const systemHealth = {
            database: 'HEALTHY',
            apiUptimeSeconds: Math.floor(process.uptime()),
            memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            nodeVersion: process.version,
            environment: env_1.config.env,
        };
        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalSchools,
                    activeSchools,
                    suspendedSchools,
                    totalLicenses,
                    activeLicenses,
                    deactivatedLicenses: totalLicenses - activeLicenses,
                    totalStudents,
                    totalStaff,
                    totalNotifications,
                },
                systemHealth,
                recentActivity: recentAuditLogs,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve platform dashboard metrics.',
            error: err.message,
        });
    }
};
exports.getPlatformDashboard = getPlatformDashboard;
/**
 * List all schools with license and metric summaries
 */
const getSchools = async (req, res) => {
    try {
        const schools = await Tenant_1.Tenant.find().sort({ createdAt: -1 });
        const schoolSummaries = await Promise.all(schools.map(async (school) => {
            const [license, studentCount, staffCount, adminUser] = await Promise.all([
                SoftwareLicense_1.SoftwareLicense.findOne({ tenantId: school.tenantId }),
                Student_1.Student.countDocuments({ tenantId: school.tenantId, status: 'ACTIVE' }),
                Staff_1.Staff.countDocuments({ tenantId: school.tenantId, isActive: true }),
                User_1.User.findOne({ tenantId: school.tenantId, role: 'SCHOOL_ADMIN' }).select('email phone firstName lastName'),
            ]);
            return {
                ...school.toObject(),
                license,
                metrics: {
                    studentCount,
                    staffCount,
                },
                primaryAdmin: adminUser,
            };
        }));
        res.status(200).json({
            success: true,
            data: schoolSummaries,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch schools.',
            error: err.message,
        });
    }
};
exports.getSchools = getSchools;
/**
 * Register a new school, issue permanent license, and create initial School Admin
 */
const createSchool = async (req, res) => {
    try {
        const { name, code, affiliation, registrationNumber, address, contact, adminFirstName, adminLastName, adminEmail, adminPhone, adminPassword, tier, maxStudents, maxStaff, agreementReference, } = req.body;
        if (!name || !code || !contact?.email || !adminEmail || !adminPassword) {
            res.status(400).json({
                success: false,
                message: 'School name, unique code, contact email, and admin credentials are required.',
            });
            return;
        }
        const schoolCode = code.toUpperCase().trim();
        const existingTenant = await Tenant_1.Tenant.findOne({ code: schoolCode });
        if (existingTenant) {
            res.status(409).json({
                success: false,
                message: `School with code "${schoolCode}" already exists.`,
            });
            return;
        }
        // Generate unique tenantId
        const tenantId = `SCH-${schoolCode}-${Date.now().toString().slice(-4)}`;
        // Create Tenant
        const tenant = await Tenant_1.Tenant.create({
            tenantId,
            name,
            code: schoolCode,
            affiliation: affiliation || 'CBSE',
            registrationNumber,
            address: {
                street: address?.street || '',
                city: address?.city || 'Chennai',
                state: address?.state || 'Tamil Nadu',
                postalCode: address?.postalCode || '',
                country: address?.country || 'India',
            },
            contact: {
                email: contact.email,
                phone: contact.phone || adminPhone || '',
                website: contact.website || '',
            },
            status: 'ACTIVE',
            settings: {
                attendanceCutoffTime: '09:30',
                sessionMode: 'FULL_DAY',
                gradingSystem: 'LETTER_GRADE',
                gradeScale: [
                    { grade: 'A+', minMarks: 90, maxMarks: 100, remarks: 'Outstanding' },
                    { grade: 'A', minMarks: 80, maxMarks: 89, remarks: 'Excellent' },
                    { grade: 'B', minMarks: 70, maxMarks: 79, remarks: 'Very Good' },
                    { grade: 'C', minMarks: 50, maxMarks: 69, remarks: 'Good' },
                    { grade: 'D', minMarks: 35, maxMarks: 49, remarks: 'Pass' },
                    { grade: 'F', minMarks: 0, maxMarks: 34, remarks: 'Needs Improvement' },
                ],
                enableSms: true,
                enableWhatsapp: true,
                defaultNotificationLanguage: 'en',
                workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                consecutiveAbsenceAlertThreshold: 3,
            },
        });
        // Generate unique Permanent Software License
        const licenseKey = `LIC-PERM-${schoolCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const license = await SoftwareLicense_1.SoftwareLicense.create({
            licenseKey,
            tenantId,
            schoolName: name,
            customerName: name,
            customerContact: {
                email: contact.email,
                phone: contact.phone || adminPhone,
            },
            agreementReference: agreementReference || `AGR-${Date.now()}`,
            purchaseDate: new Date(),
            activationDate: new Date(),
            status: 'ACTIVE',
            licenseType: 'PERMANENT',
            tier: tier || 'ENTERPRISE',
            limits: {
                maxStudents: maxStudents || 2500,
                maxStaff: maxStaff || 200,
            },
            licensedModules: [
                'ATTENDANCE',
                'STUDENTS',
                'STAFF',
                'PARENTS',
                'EXAMINATIONS',
                'REPORTS',
                'LEAVE_MANAGEMENT',
                'ANNOUNCEMENTS',
                'NOTIFICATIONS',
            ],
            commercialServices: {
                annualMaintenanceContract: {
                    active: true,
                    startDate: new Date(),
                    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    notes: 'Standard 1st Year Maintenance Included',
                },
                cloudStorageAllocatedGb: 25,
                smsCreditsPurchased: 5000,
                smsCreditsUsed: 0,
                whatsappCreditsPurchased: 2000,
                whatsappCreditsUsed: 0,
            },
        });
        // Create First School Admin User
        const passwordHash = await bcryptjs_1.default.hash(adminPassword, 10);
        const adminUser = await User_1.User.create({
            tenantId,
            email: adminEmail.toLowerCase().trim(),
            phone: adminPhone,
            passwordHash,
            firstName: adminFirstName,
            lastName: adminLastName,
            role: 'SCHOOL_ADMIN',
            isActive: true,
        });
        // Audit Log
        await AuditLog_1.AuditLog.create({
            tenantId: 'PLATFORM',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: 'SUPER_ADMIN',
            action: 'SCHOOL_ONBOARDED',
            entity: 'Tenant',
            entityId: tenantId,
            details: {
                schoolName: name,
                schoolCode,
                adminEmail,
                licenseKey,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'SUCCESS',
        });
        res.status(201).json({
            success: true,
            message: 'School, permanent license, and initial administrator account created successfully.',
            data: {
                tenant,
                license,
                adminUser: {
                    id: adminUser._id,
                    email: adminUser.email,
                    firstName: adminUser.firstName,
                    lastName: adminUser.lastName,
                    role: adminUser.role,
                },
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to create school.',
            error: err.message,
        });
    }
};
exports.createSchool = createSchool;
/**
 * Activate or deactivate school account
 */
const updateSchoolStatus = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { status, reason } = req.body;
        if (!['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status)) {
            res.status(400).json({
                success: false,
                message: 'Invalid status. Must be ACTIVE, SUSPENDED, or INACTIVE.',
            });
            return;
        }
        const school = await Tenant_1.Tenant.findOne({ tenantId });
        if (!school) {
            res.status(404).json({
                success: false,
                message: 'School not found.',
            });
            return;
        }
        school.status = status;
        await school.save();
        // Also sync license status
        if (status === 'SUSPENDED') {
            await SoftwareLicense_1.SoftwareLicense.updateOne({ tenantId }, { status: 'SUSPENDED' });
        }
        else if (status === 'ACTIVE') {
            await SoftwareLicense_1.SoftwareLicense.updateOne({ tenantId }, { status: 'ACTIVE' });
        }
        await AuditLog_1.AuditLog.create({
            tenantId: 'PLATFORM',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: 'SUPER_ADMIN',
            action: `SCHOOL_STATUS_CHANGED_TO_${status}`,
            entity: 'Tenant',
            entityId: tenantId,
            details: { previousStatus: school.status, newStatus: status, reason },
            ipAddress: req.ip,
            status: 'SUCCESS',
        });
        res.status(200).json({
            success: true,
            message: `School status updated to ${status}.`,
            data: school,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to update school status.',
            error: err.message,
        });
    }
};
exports.updateSchoolStatus = updateSchoolStatus;
/**
 * List all permanent software licenses
 */
const getLicenses = async (req, res) => {
    try {
        const licenses = await SoftwareLicense_1.SoftwareLicense.find().sort({ purchaseDate: -1 });
        res.status(200).json({
            success: true,
            data: licenses,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch software licenses.',
            error: err.message,
        });
    }
};
exports.getLicenses = getLicenses;
/**
 * Update software license status (ACTIVE, SUSPENDED, REVOKED)
 */
const updateLicenseStatus = async (req, res) => {
    try {
        const { licenseKey } = req.params;
        const { status, reason } = req.body;
        if (!['ACTIVE', 'SUSPENDED', 'REVOKED'].includes(status)) {
            res.status(400).json({
                success: false,
                message: 'Invalid license status. Must be ACTIVE, SUSPENDED, or REVOKED.',
            });
            return;
        }
        const license = await SoftwareLicense_1.SoftwareLicense.findOne({ licenseKey });
        if (!license) {
            res.status(404).json({
                success: false,
                message: 'Software license not found.',
            });
            return;
        }
        license.status = status;
        await license.save();
        // If suspended or revoked, update tenant status too
        if (status !== 'ACTIVE') {
            await Tenant_1.Tenant.updateOne({ tenantId: license.tenantId }, { status: 'SUSPENDED' });
        }
        await AuditLog_1.AuditLog.create({
            tenantId: 'PLATFORM',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: 'SUPER_ADMIN',
            action: `LICENSE_STATUS_UPDATED_TO_${status}`,
            entity: 'SoftwareLicense',
            entityId: licenseKey,
            details: { reason },
            ipAddress: req.ip,
            status: 'SUCCESS',
        });
        res.status(200).json({
            success: true,
            message: `Software license status updated to ${status}.`,
            data: license,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to update license status.',
            error: err.message,
        });
    }
};
exports.updateLicenseStatus = updateLicenseStatus;
/**
 * Transfer software license ownership with audited process
 */
const transferLicense = async (req, res) => {
    try {
        const { licenseKey } = req.params;
        const { targetSchoolName, targetTenantId, reason } = req.body;
        if (!targetSchoolName || !reason) {
            res.status(400).json({
                success: false,
                message: 'Target school name and transfer reason are mandatory for audited license transfer.',
            });
            return;
        }
        const license = await SoftwareLicense_1.SoftwareLicense.findOne({ licenseKey });
        if (!license) {
            res.status(404).json({
                success: false,
                message: 'Software license not found.',
            });
            return;
        }
        license.transferHistory.push({
            transferredToSchoolName: targetSchoolName,
            transferredBy: req.user._id,
            date: new Date(),
            reason,
            previousTenantId: license.tenantId,
        });
        license.schoolName = targetSchoolName;
        if (targetTenantId) {
            license.tenantId = targetTenantId;
        }
        await license.save();
        await AuditLog_1.AuditLog.create({
            tenantId: 'PLATFORM',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: 'SUPER_ADMIN',
            action: 'LICENSE_TRANSFERRED',
            entity: 'SoftwareLicense',
            entityId: licenseKey,
            details: { targetSchoolName, reason },
            ipAddress: req.ip,
            status: 'SUCCESS',
        });
        res.status(200).json({
            success: true,
            message: 'Software license successfully transferred with full audit logging.',
            data: license,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to transfer software license.',
            error: err.message,
        });
    }
};
exports.transferLicense = transferLicense;
/**
 * Get platform settings and service providers status
 */
const getPlatformSettings = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                company: {
                    name: '6th Civilians Corporation',
                    product: 'School Operations Platform',
                    deploymentRegion: 'India (ap-south-1)',
                    licensingModel: 'One-Time Permanent License',
                },
                providers: {
                    sms: smsAdapter_1.smsAdapter.getStatus(),
                    whatsapp: whatsappAdapter_1.whatsappAdapter.getStatus(),
                    storage: {
                        driver: env_1.config.storage.driver,
                        isConfigured: env_1.config.storage.driver === 'local' || Boolean(env_1.config.storage.s3.bucket),
                    },
                },
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch platform settings.',
            error: err.message,
        });
    }
};
exports.getPlatformSettings = getPlatformSettings;
/**
 * Retrieve platform-level audit logs
 */
const getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const [logs, total] = await Promise.all([
            AuditLog_1.AuditLog.find()
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            AuditLog_1.AuditLog.countDocuments(),
        ]);
        res.status(200).json({
            success: true,
            data: {
                logs,
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
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs.',
            error: err.message,
        });
    }
};
exports.getAuditLogs = getAuditLogs;
