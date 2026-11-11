"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academicController_1 = require("./academicController");
const auth_1 = require("../../middleware/auth");
const tenant_1 = require("../../middleware/tenant");
const role_1 = require("../../middleware/role");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.enforceTenant);
// Academic Years
router.get('/years', academicController_1.getAcademicYears);
router.post('/years', (0, role_1.requireRole)(['SCHOOL_ADMIN', 'PRINCIPAL']), academicController_1.createAcademicYear);
router.patch('/years/:id/set-current', (0, role_1.requireRole)(['SCHOOL_ADMIN', 'PRINCIPAL']), academicController_1.setCurrentAcademicYear);
// Classes & Sections
router.get('/classes', academicController_1.getClasses);
router.post('/classes', (0, role_1.requireRole)(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), academicController_1.createClass);
router.post('/sections', (0, role_1.requireRole)(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), academicController_1.createSection);
// Subjects
router.get('/subjects', academicController_1.getSubjects);
router.post('/subjects', (0, role_1.requireRole)(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), academicController_1.createSubject);
// Allocations
router.get('/allocations', academicController_1.getAllocations);
router.post('/allocations', (0, role_1.requireRole)(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), academicController_1.createAllocation);
router.delete('/allocations/:id', (0, role_1.requireRole)(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), academicController_1.deleteAllocation);
exports.default = router;
