import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Tenant } from '../models/Tenant';
import { SoftwareLicense } from '../models/SoftwareLicense';
import { User } from '../models/User';
import { AcademicYear } from '../models/AcademicYear';
import { Class } from '../models/Class';
import { Section } from '../models/Section';
import { Subject } from '../models/Subject';
import { TeacherAssignment } from '../models/TeacherAssignment';
import { Student } from '../models/Student';
import { Staff } from '../models/Staff';
import { Parent } from '../models/Parent';
import { ParentStudentRelationship } from '../models/ParentStudentRelationship';
import { Attendance } from '../models/Attendance';
import { Examination } from '../models/Examination';
import { ExaminationSubject } from '../models/ExaminationSubject';
import { Marks } from '../models/Marks';
import { LeaveRequest } from '../models/LeaveRequest';
import { Announcement } from '../models/Announcement';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { logger } from '../utils/logger';

export const runSeed = async () => {
  try {
    logger.info('Starting comprehensive development database seeding...');
    await connectDatabase();

    // Clear existing collections safely
    await Promise.all([
      Tenant.deleteMany({}),
      SoftwareLicense.deleteMany({}),
      User.deleteMany({}),
      AcademicYear.deleteMany({}),
      Class.deleteMany({}),
      Section.deleteMany({}),
      Subject.deleteMany({}),
      TeacherAssignment.deleteMany({}),
      Student.deleteMany({}),
      Staff.deleteMany({}),
      Parent.deleteMany({}),
      ParentStudentRelationship.deleteMany({}),
      Attendance.deleteMany({}),
      Examination.deleteMany({}),
      ExaminationSubject.deleteMany({}),
      Marks.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Announcement.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    logger.info('Existing database collections cleared.');

    const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

    // 1. Create 6th Civilians Corporation Super Admin
    const superAdmin = await User.create({
      tenantId: 'PLATFORM',
      email: 'superadmin@6thcivilians.com',
      phone: '+91 98400 12345',
      passwordHash: defaultPasswordHash,
      firstName: 'Vikram',
      lastName: 'Chandar',
      role: 'SUPER_ADMIN',
      isActive: true,
      permissions: ['*'],
    });
    logger.info('Created Super Admin: superadmin@6thcivilians.com');

    // 2. Onboard School 1: St. Xavier's Matriculation Higher Secondary School, Chennai
    const tenant1Id = 'SCH-SXMHSS-001';
    const school1 = await Tenant.create({
      tenantId: tenant1Id,
      name: "St. Xavier's Matriculation Higher Secondary School",
      code: 'SXMHSS',
      affiliation: 'MATRICULATION',
      registrationNumber: 'TN-EDU-CHN-2018-842',
      address: {
        street: '124, Santhome High Road, Mylapore',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600004',
        country: 'India',
      },
      contact: {
        email: 'info@stxavierschennai.edu.in',
        phone: '+91 44 2498 7654',
        website: 'https://stxavierschennai.edu.in',
      },
      status: 'ACTIVE',
      settings: {
        attendanceCutoffTime: '09:15',
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

    // Permanent Software License for School 1
    const license1 = await SoftwareLicense.create({
      licenseKey: 'LIC-PERM-SXMHSS-2026-XAVIER',
      tenantId: tenant1Id,
      schoolName: school1.name,
      customerName: 'St. Xavier Educational Trust',
      customerContact: {
        email: 'trustee@stxavierschennai.edu.in',
        phone: '+91 94440 99887',
      },
      agreementReference: '6THCIV-2026-LIC-0084',
      purchaseDate: new Date('2026-01-15'),
      activationDate: new Date('2026-01-16'),
      status: 'ACTIVE',
      licenseType: 'PERMANENT',
      tier: 'ENTERPRISE',
      limits: { maxStudents: 3000, maxStaff: 250 },
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
          startDate: new Date('2026-01-16'),
          validUntil: new Date('2027-01-16'),
          notes: 'Year 1 AMC Covered',
        },
        cloudStorageAllocatedGb: 50,
        smsCreditsPurchased: 10000,
        smsCreditsUsed: 420,
        whatsappCreditsPurchased: 5000,
        whatsappCreditsUsed: 180,
      },
    });

    // School Admin User
    const schoolAdmin = await User.create({
      tenantId: tenant1Id,
      email: 'admin@stxaviers.edu.in',
      phone: '+91 98401 22334',
      passwordHash: defaultPasswordHash,
      firstName: 'Francis',
      lastName: 'Xavier',
      role: 'SCHOOL_ADMIN',
      isActive: true,
    });

    // Principal User & Staff Profile
    const principalUser = await User.create({
      tenantId: tenant1Id,
      email: 'principal@stxaviers.edu.in',
      phone: '+91 98402 33445',
      passwordHash: defaultPasswordHash,
      firstName: 'Dr. Mary',
      lastName: 'Selvaraj',
      role: 'PRINCIPAL',
      isActive: true,
    });
    await Staff.create({
      tenantId: tenant1Id,
      userId: principalUser._id,
      employeeId: 'EMP-PRIN-01',
      staffType: 'ADMINISTRATIVE',
      designation: 'Principal',
      department: 'Administration',
      qualification: 'M.Sc., M.Ed., Ph.D.',
      joiningDate: new Date('2015-06-01'),
    });

    // Academic Coordinator User & Staff Profile
    const coordUser = await User.create({
      tenantId: tenant1Id,
      email: 'coordinator@stxaviers.edu.in',
      phone: '+91 98403 44556',
      passwordHash: defaultPasswordHash,
      firstName: 'Suresh',
      lastName: 'Kalyanaraman',
      role: 'COORDINATOR',
      isActive: true,
    });
    await Staff.create({
      tenantId: tenant1Id,
      userId: coordUser._id,
      employeeId: 'EMP-COORD-01',
      staffType: 'TEACHING',
      designation: 'Academic Coordinator',
      department: 'High School',
      qualification: 'M.Sc. Physics, B.Ed.',
      joiningDate: new Date('2018-06-01'),
    });

    // Teacher 1 (Class Teacher 10-A, Mathematics)
    const teacher1User = await User.create({
      tenantId: tenant1Id,
      email: 'kavitha.math@stxaviers.edu.in',
      phone: '+91 98404 55667',
      passwordHash: defaultPasswordHash,
      firstName: 'Kavitha',
      lastName: 'Sundaram',
      role: 'TEACHER',
      isActive: true,
    });
    await Staff.create({
      tenantId: tenant1Id,
      userId: teacher1User._id,
      employeeId: 'EMP-TCH-101',
      staffType: 'TEACHING',
      designation: 'Senior PGT Mathematics',
      department: 'Mathematics',
      qualification: 'M.Sc., B.Ed.',
      joiningDate: new Date('2019-07-15'),
    });

    // Teacher 2 (Science)
    const teacher2User = await User.create({
      tenantId: tenant1Id,
      email: 'raghavan.sci@stxaviers.edu.in',
      phone: '+91 98405 66778',
      passwordHash: defaultPasswordHash,
      firstName: 'Raghavan',
      lastName: 'Narayanan',
      role: 'TEACHER',
      isActive: true,
    });
    await Staff.create({
      tenantId: tenant1Id,
      userId: teacher2User._id,
      employeeId: 'EMP-TCH-102',
      staffType: 'TEACHING',
      designation: 'TGT Science',
      department: 'Science',
      qualification: 'M.Sc. Chemistry, B.Ed.',
      joiningDate: new Date('2021-06-10'),
    });

    // Academic Year
    const academicYear = await AcademicYear.create({
      tenantId: tenant1Id,
      name: '2025-2026',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-04-30'),
      isCurrent: true,
    });

    // Classes & Sections
    const class10 = await Class.create({
      tenantId: tenant1Id,
      name: 'Class 10',
      gradeLevel: 10,
      displayOrder: 1,
    });

    const sec10A = await Section.create({
      tenantId: tenant1Id,
      classId: class10._id,
      name: 'A',
      roomNumber: 'Room 204',
      capacity: 40,
    });

    const sec10B = await Section.create({
      tenantId: tenant1Id,
      classId: class10._id,
      name: 'B',
      roomNumber: 'Room 205',
      capacity: 40,
    });

    const class9 = await Class.create({
      tenantId: tenant1Id,
      name: 'Class 9',
      gradeLevel: 9,
      displayOrder: 2,
    });
    const sec9A = await Section.create({
      tenantId: tenant1Id,
      classId: class9._id,
      name: 'A',
      roomNumber: 'Room 104',
      capacity: 40,
    });

    // Subjects
    const subjMath = await Subject.create({
      tenantId: tenant1Id,
      name: 'Mathematics',
      code: 'MAT101',
      department: 'Mathematics',
    });
    const subjSci = await Subject.create({
      tenantId: tenant1Id,
      name: 'Science',
      code: 'SCI101',
      department: 'Science',
    });
    const subjEng = await Subject.create({
      tenantId: tenant1Id,
      name: 'English',
      code: 'ENG101',
      department: 'Languages',
    });
    const subjTam = await Subject.create({
      tenantId: tenant1Id,
      name: 'Tamil',
      code: 'TAM101',
      department: 'Languages',
    });
    const subjSoc = await Subject.create({
      tenantId: tenant1Id,
      name: 'Social Science',
      code: 'SOC101',
      department: 'Social Science',
    });

    // Teacher Allocations: Kavitha is Class Teacher for 10-A and teaches Math
    await TeacherAssignment.create({
      tenantId: tenant1Id,
      teacherId: teacher1User._id,
      academicYearId: academicYear._id,
      classId: class10._id,
      sectionId: sec10A._id,
      subjectId: subjMath._id,
      isClassTeacher: true,
    });

    // Raghavan teaches Science to 10-A
    await TeacherAssignment.create({
      tenantId: tenant1Id,
      teacherId: teacher2User._id,
      academicYearId: academicYear._id,
      classId: class10._id,
      sectionId: sec10A._id,
      subjectId: subjSci._id,
      isClassTeacher: false,
    });

    // Students in Class 10-A
    const studentsData = [
      { adm: 'SX-2025-001', roll: '01', first: 'Aarav', last: 'Kumar', dob: '2010-04-12', gender: 'MALE' as const },
      { adm: 'SX-2025-002', roll: '02', first: 'Divya', last: 'Subramanian', dob: '2010-06-25', gender: 'FEMALE' as const },
      { adm: 'SX-2025-003', roll: '03', first: 'Harish', last: 'Rajan', dob: '2010-01-19', gender: 'MALE' as const },
      { adm: 'SX-2025-004', roll: '04', first: 'Kaviya', last: 'Ramesh', dob: '2010-08-30', gender: 'FEMALE' as const },
      { adm: 'SX-2025-005', roll: '05', first: 'Mukesh', last: 'Kannan', dob: '2010-11-05', gender: 'MALE' as const },
      { adm: 'SX-2025-006', roll: '06', first: 'Nithya', last: 'Sridhar', dob: '2010-03-14', gender: 'FEMALE' as const },
      { adm: 'SX-2025-007', roll: '07', first: 'Pranav', last: 'Balaji', dob: '2010-09-22', gender: 'MALE' as const },
      { adm: 'SX-2025-008', roll: '08', first: 'Rhea', last: 'Venkatesh', dob: '2010-05-18', gender: 'FEMALE' as const },
      { adm: 'SX-2025-009', roll: '09', first: 'Siddharth', last: 'Gopal', dob: '2010-07-08', gender: 'MALE' as const },
      { adm: 'SX-2025-010', roll: '10', first: 'Varsha', last: 'Anand', dob: '2010-12-01', gender: 'FEMALE' as const },
    ];

    const studentDocs = [];
    for (const s of studentsData) {
      const student = await Student.create({
        tenantId: tenant1Id,
        admissionNumber: s.adm,
        rollNumber: s.roll,
        firstName: s.first,
        lastName: s.last,
        dateOfBirth: new Date(s.dob),
        gender: s.gender,
        academicYearId: academicYear._id,
        classId: class10._id,
        sectionId: sec10A._id,
        bloodGroup: 'B+',
        status: 'ACTIVE',
        emergencyContact: {
          name: `${s.last} (Parent)`,
          relationship: 'Parent',
          phone: '+91 98409 11223',
        },
      });
      studentDocs.push(student);
    }
    logger.info(`Enrolled ${studentDocs.length} students in Class 10-A.`);

    // 3. Parent 1: Subramanian (Father of Divya)
    const parent1User = await User.create({
      tenantId: tenant1Id,
      email: 'subramanian.parent@gmail.com',
      phone: '+91 98409 11223',
      passwordHash: defaultPasswordHash,
      firstName: 'Subramanian',
      lastName: 'Iyer',
      role: 'PARENT',
      isActive: true,
    });
    const parent1Profile = await Parent.create({
      tenantId: tenant1Id,
      userId: parent1User._id,
      occupation: 'Senior Software Architect',
      preferredLanguage: 'ta', // Tamil preference
      communicationConsent: { sms: true, whatsapp: true, email: true, consentDate: new Date() },
    });
    // Link to Divya (Index 1)
    await ParentStudentRelationship.create({
      tenantId: tenant1Id,
      parentId: parent1Profile._id,
      studentId: studentDocs[1]._id,
      relationshipType: 'FATHER',
      isPrimaryContact: true,
      isVerified: true,
      verifiedBy: schoolAdmin._id,
    });

    // Parent 2: Ramesh (Father of Kaviya)
    const parent2User = await User.create({
      tenantId: tenant1Id,
      email: 'ramesh.parent@gmail.com',
      phone: '+91 98409 33445',
      passwordHash: defaultPasswordHash,
      firstName: 'Ramesh',
      lastName: 'Natarajan',
      role: 'PARENT',
      isActive: true,
    });
    const parent2Profile = await Parent.create({
      tenantId: tenant1Id,
      userId: parent2User._id,
      occupation: 'Chartered Accountant',
      preferredLanguage: 'en',
      communicationConsent: { sms: true, whatsapp: true, email: true, consentDate: new Date() },
    });
    // Link to Kaviya (Index 3)
    await ParentStudentRelationship.create({
      tenantId: tenant1Id,
      parentId: parent2Profile._id,
      studentId: studentDocs[3]._id,
      relationshipType: 'FATHER',
      isPrimaryContact: true,
      isVerified: true,
      verifiedBy: schoolAdmin._id,
    });

    // 4. Attendance Data for Past 5 Days & Today
    const today = new Date().toISOString().split('T')[0];
    const pastDates = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      pastDates.push(d.toISOString().split('T')[0]);
    }

    for (const d of pastDates) {
      for (let idx = 0; idx < studentDocs.length; idx++) {
        const student = studentDocs[idx];
        let status = 'PRESENT';
        let remarks = '';

        // Deterministic variation for demo
        if (idx === 2 && (d === pastDates[2] || d === pastDates[3] || d === pastDates[4])) {
          status = 'ABSENT'; // Harish absent for 3 consecutive days to trigger alert!
          remarks = 'Unwell, high fever';
        } else if (idx === 4 && d === pastDates[1]) {
          status = 'LATE';
          remarks = 'School bus breakdown';
        } else if (idx === 1 && d === pastDates[0]) {
          status = 'HALF_DAY';
          remarks = 'Doctor appointment in afternoon';
        }

        await Attendance.create({
          tenantId: tenant1Id,
          academicYearId: academicYear._id,
          classId: class10._id,
          sectionId: sec10A._id,
          studentId: student._id,
          date: d,
          session: 'FULL_DAY',
          status,
          remarks,
          markedBy: teacher1User._id,
          isLocked: d !== today,
        });
      }
    }
    logger.info('Populated attendance records across past 5 dates.');

    // 5. Examination: Term 1 Quarterly Examination 2025
    const examQuarterly = await Examination.create({
      tenantId: tenant1Id,
      academicYearId: academicYear._id,
      name: 'Quarterly Examination 2025',
      examType: 'QUARTERLY',
      startDate: '2025-09-15',
      endDate: '2025-09-24',
      isPublished: true,
      publishedAt: new Date('2025-09-28'),
      publishedBy: schoolAdmin._id,
    });

    // Configure Exam Subjects for Class 10
    const examSubjMath = await ExaminationSubject.create({
      tenantId: tenant1Id,
      examinationId: examQuarterly._id,
      classId: class10._id,
      subjectId: subjMath._id,
      maxMarks: 100,
      passingMarks: 35,
      examDate: '2025-09-15',
    });

    const examSubjSci = await ExaminationSubject.create({
      tenantId: tenant1Id,
      examinationId: examQuarterly._id,
      classId: class10._id,
      subjectId: subjSci._id,
      maxMarks: 100,
      passingMarks: 35,
      examDate: '2025-09-17',
    });

    const examSubjEng = await ExaminationSubject.create({
      tenantId: tenant1Id,
      examinationId: examQuarterly._id,
      classId: class10._id,
      subjectId: subjEng._id,
      maxMarks: 100,
      passingMarks: 35,
      examDate: '2025-09-19',
    });

    const examSubjTam = await ExaminationSubject.create({
      tenantId: tenant1Id,
      examinationId: examQuarterly._id,
      classId: class10._id,
      subjectId: subjTam._id,
      maxMarks: 100,
      passingMarks: 35,
      examDate: '2025-09-22',
    });

    // Populate Marks for Divya Subramanian (Index 1) and Kaviya Ramesh (Index 3)
    const marksData = [
      { studentId: studentDocs[1]._id, examSubjectId: examSubjMath._id, marks: 96, grade: 'A+' },
      { studentId: studentDocs[1]._id, examSubjectId: examSubjSci._id, marks: 92, grade: 'A+' },
      { studentId: studentDocs[1]._id, examSubjectId: examSubjEng._id, marks: 88, grade: 'A' },
      { studentId: studentDocs[1]._id, examSubjectId: examSubjTam._id, marks: 95, grade: 'A+' },

      { studentId: studentDocs[3]._id, examSubjectId: examSubjMath._id, marks: 84, grade: 'A' },
      { studentId: studentDocs[3]._id, examSubjectId: examSubjSci._id, marks: 89, grade: 'A' },
      { studentId: studentDocs[3]._id, examSubjectId: examSubjEng._id, marks: 91, grade: 'A+' },
      { studentId: studentDocs[3]._id, examSubjectId: examSubjTam._id, marks: 87, grade: 'A' },

      { studentId: studentDocs[0]._id, examSubjectId: examSubjMath._id, marks: 76, grade: 'B' },
      { studentId: studentDocs[0]._id, examSubjectId: examSubjSci._id, marks: 74, grade: 'B' },
      { studentId: studentDocs[0]._id, examSubjectId: examSubjEng._id, marks: 80, grade: 'A' },
      { studentId: studentDocs[0]._id, examSubjectId: examSubjTam._id, marks: 78, grade: 'B' },
    ];

    for (const m of marksData) {
      await Marks.create({
        tenantId: tenant1Id,
        examinationId: examQuarterly._id,
        examinationSubjectId: m.examSubjectId,
        studentId: m.studentId,
        marksObtained: m.marks,
        grade: m.grade,
        enteredBy: teacher1User._id,
      });
    }

    // 6. Announcements
    await Announcement.create({
      tenantId: tenant1Id,
      title: 'Annual Science & Tech Exhibition 2026',
      content:
        'The Annual Science & Technology Exhibition will be held on 24th November in the school main auditorium. Parents are warmly invited to visit and encourage student innovators between 10:00 AM and 03:00 PM.',
      targetAudience: 'ALL',
      priority: 'HIGH',
      authorId: schoolAdmin._id,
    });

    await Announcement.create({
      tenantId: tenant1Id,
      title: 'Class 10 Special Revision Classes for Board Exams',
      content:
        'Special revision and practice sessions for Class 10 students commence next Monday. Attendance is strictly compulsory.',
      targetAudience: 'CLASS',
      targetClassId: class10._id,
      priority: 'NORMAL',
      authorId: coordUser._id,
    });

    // 7. Leave Request from Parent Subramanian for Divya
    await LeaveRequest.create({
      tenantId: tenant1Id,
      studentId: studentDocs[1]._id,
      parentId: parent1User._id,
      startDate: '2026-03-10',
      endDate: '2026-03-11',
      totalDays: 2,
      reason: 'Family religious ceremony in Madurai.',
      status: 'APPROVED',
      reviewedBy: teacher1User._id,
      reviewRemarks: 'Approved. Please collect homework worksheets beforehand.',
      reviewedAt: new Date(),
      autoAttendanceMarked: true,
    });

    // 8. Onboard School 2 (Demonstrating Multi-Tenant Isolation)
    const tenant2Id = 'SCH-GIPS-002';
    const school2 = await Tenant.create({
      tenantId: tenant2Id,
      name: 'Greenwood International Public School',
      code: 'GIPS',
      affiliation: 'CBSE',
      registrationNumber: 'KA-EDU-BLR-2020-112',
      address: {
        street: '88, Sarjapur Outer Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
        country: 'India',
      },
      contact: {
        email: 'admissions@greenwoodblr.edu.in',
        phone: '+91 80 4123 4567',
        website: 'https://greenwoodblr.edu.in',
      },
      status: 'ACTIVE',
      settings: {
        attendanceCutoffTime: '09:00',
        sessionMode: 'FULL_DAY',
        gradingSystem: 'LETTER_GRADE',
        gradeScale: [
          { grade: 'A1', minMarks: 91, maxMarks: 100 },
          { grade: 'A2', minMarks: 81, maxMarks: 90 },
          { grade: 'B1', minMarks: 71, maxMarks: 80 },
        ],
        enableSms: true,
        enableWhatsapp: false,
        defaultNotificationLanguage: 'en',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        consecutiveAbsenceAlertThreshold: 3,
      },
    });

    await SoftwareLicense.create({
      licenseKey: 'LIC-PERM-GIPS-2026-GREEN',
      tenantId: tenant2Id,
      schoolName: school2.name,
      customerName: 'Greenwood Educational Foundation',
      customerContact: {
        email: 'trustee@greenwoodblr.edu.in',
        phone: '+91 99000 11223',
      },
      agreementReference: '6THCIV-2026-LIC-0085',
      purchaseDate: new Date('2026-02-01'),
      activationDate: new Date('2026-02-02'),
      status: 'ACTIVE',
      licenseType: 'PERMANENT',
      tier: 'ENTERPRISE',
      limits: { maxStudents: 2000, maxStaff: 180 },
      commercialServices: {
        annualMaintenanceContract: { active: true, startDate: new Date() },
        cloudStorageAllocatedGb: 30,
        smsCreditsPurchased: 5000,
        smsCreditsUsed: 50,
        whatsappCreditsPurchased: 1000,
        whatsappCreditsUsed: 0,
      },
    });

    await User.create({
      tenantId: tenant2Id,
      email: 'admin@greenwood.edu.in',
      phone: '+91 99001 22334',
      passwordHash: defaultPasswordHash,
      firstName: 'Ananya',
      lastName: 'Rao',
      role: 'SCHOOL_ADMIN',
      isActive: true,
    });

    logger.info('============================================================');
    logger.info('  DEVELOPMENT DATABASE SEEDING COMPLETED SUCCESSFULLY!     ');
    logger.info('============================================================');
    logger.info('  DEMO CREDENTIALS (Default Password for all: Password@123):');
    logger.info('  1. Super Admin:        superadmin@6thcivilians.com');
    logger.info("  2. School 1 Admin:     admin@stxaviers.edu.in (Code: SXMHSS)");
    logger.info('  3. Principal:          principal@stxaviers.edu.in');
    logger.info('  4. Coordinator:        coordinator@stxaviers.edu.in');
    logger.info('  5. Teacher (Class 10): kavitha.math@stxaviers.edu.in');
    logger.info('  6. Parent (Divya):     subramanian.parent@gmail.com');
    logger.info('  7. Parent (Kaviya):    ramesh.parent@gmail.com');
    logger.info('  8. School 2 Admin:     admin@greenwood.edu.in (Code: GIPS)');
    logger.info('============================================================');
  } catch (err: any) {
    logger.error('Error during database seeding:', err);
    throw err;
  }
};

if (require.main === module) {
  runSeed()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

