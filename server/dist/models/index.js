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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Tenant"), exports);
__exportStar(require("./SoftwareLicense"), exports);
__exportStar(require("./User"), exports);
__exportStar(require("./AcademicYear"), exports);
__exportStar(require("./Class"), exports);
__exportStar(require("./Section"), exports);
__exportStar(require("./Subject"), exports);
__exportStar(require("./TeacherAssignment"), exports);
__exportStar(require("./Student"), exports);
__exportStar(require("./Parent"), exports);
__exportStar(require("./ParentStudentRelationship"), exports);
__exportStar(require("./Staff"), exports);
__exportStar(require("./Attendance"), exports);
__exportStar(require("./AttendanceCorrection"), exports);
__exportStar(require("./LeaveRequest"), exports);
__exportStar(require("./Examination"), exports);
__exportStar(require("./ExaminationSubject"), exports);
__exportStar(require("./Marks"), exports);
__exportStar(require("./Announcement"), exports);
__exportStar(require("./Notification"), exports);
__exportStar(require("./AuditLog"), exports);
__exportStar(require("./Timetable"), exports);
