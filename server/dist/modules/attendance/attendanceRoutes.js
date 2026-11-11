"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendanceController_1 = require("./attendanceController");
const auth_1 = require("../../middleware/auth");
const tenant_1 = require("../../middleware/tenant");
const role_1 = require("../../middleware/role");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, tenant_1.enforceTenant);
// Attendance routes
router.get('/sheet', attendanceController_1.getAttendanceSheet);
router.post('/mark', (0, role_1.requireRole)(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER']), attendanceController_1.markAttendance);
router.post('/correct', (0, role_1.requireRole)(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), attendanceController_1.correctAttendance);
router.patch('/reopen', (0, role_1.requireRole)(['SCHOOL_ADMIN', 'PRINCIPAL']), attendanceController_1.reopenAttendance);
router.get('/analytics', attendanceController_1.getAttendanceAnalytics);
router.get('/calendar', attendanceController_1.getAttendanceCalendar);
exports.default = router;
