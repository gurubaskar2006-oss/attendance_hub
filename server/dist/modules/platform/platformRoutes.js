"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const platformController_1 = require("./platformController");
const auth_1 = require("../../middleware/auth");
const role_1 = require("../../middleware/role");
const router = (0, express_1.Router)();
// Protect all routes with Super Admin check
router.use(auth_1.authenticate, (0, role_1.requireRole)(['SUPER_ADMIN']));
router.get('/dashboard', platformController_1.getPlatformDashboard);
router.get('/schools', platformController_1.getSchools);
router.post('/schools', platformController_1.createSchool);
router.patch('/schools/:tenantId/status', platformController_1.updateSchoolStatus);
router.get('/licenses', platformController_1.getLicenses);
router.patch('/licenses/:licenseKey/status', platformController_1.updateLicenseStatus);
router.post('/licenses/:licenseKey/transfer', platformController_1.transferLicense);
router.get('/settings', platformController_1.getPlatformSettings);
router.get('/audit-logs', platformController_1.getAuditLogs);
exports.default = router;
