import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../index';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { AcademicYear } from '../models/AcademicYear';
import { Class } from '../models/Class';
import { Section } from '../models/Section';
import { Subject } from '../models/Subject';
import { TeacherAssignment } from '../models/TeacherAssignment';
import { Student } from '../models/Student';
import { Examination } from '../models/Examination';
import { ExaminationSubject } from '../models/ExaminationSubject';
import { config } from '../config/env';

describe('Teacher Assignment Authorization Enforcement', () => {
  const schoolId = 'SCH-TCH-AUTH-001';
  let teacherToken: string;
  let adminToken: string;

  let assignedClassId: string;
  let assignedSectionId: string;
  let assignedSubjId: string;

  let unassignedClassId: string;
  let unassignedSectionId: string;
  let unassignedSubjId: string;

  let assignedExamSubjId: string;
  let unassignedExamSubjId: string;

  let studentAssignedId: string;
  let studentUnassignedId: string;

  beforeAll(async () => {
    // 1. School
    await Tenant.create({
      tenantId: schoolId,
      name: 'Teacher Authorization School',
      code: 'TAS01',
      status: 'ACTIVE',
      address: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
      contact: { email: 'info@tas01.edu', phone: '+91 44 2498 0001' },
      settings: { attendanceCutoffTime: '09:30' },
    });

    const defaultHash = await bcrypt.hash('Password@123', 10);

    // 2. School Admin User
    const adminUser = await User.create({
      tenantId: schoolId,
      email: 'admin.auth@school.edu',
      passwordHash: defaultHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SCHOOL_ADMIN',
      isActive: true,
    });
    adminToken = jwt.sign(
      { userId: adminUser._id, tenantId: schoolId, role: 'SCHOOL_ADMIN', email: adminUser.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // 3. Teacher User
    const teacherUser = await User.create({
      tenantId: schoolId,
      email: 'teacher.auth@school.edu',
      passwordHash: defaultHash,
      firstName: 'Kavitha',
      lastName: 'Teacher',
      role: 'TEACHER',
      isActive: true,
    });
    teacherToken = jwt.sign(
      { userId: teacherUser._id, tenantId: schoolId, role: 'TEACHER', email: teacherUser.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // 4. Academic Year
    const year = await AcademicYear.create({
      tenantId: schoolId,
      name: '2025-2026',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-04-30'),
      isCurrent: true,
    });

    // 5. Classes & Sections
    const classA = await Class.create({ tenantId: schoolId, name: 'Class 9', gradeLevel: 9 });
    const secA = await Section.create({ tenantId: schoolId, classId: classA._id, name: 'A' });
    assignedClassId = String(classA._id);
    assignedSectionId = String(secA._id);

    const classB = await Class.create({ tenantId: schoolId, name: 'Class 10', gradeLevel: 10 });
    const secB = await Section.create({ tenantId: schoolId, classId: classB._id, name: 'B' });
    unassignedClassId = String(classB._id);
    unassignedSectionId = String(secB._id);

    // 6. Subjects
    const subjMath = await Subject.create({ tenantId: schoolId, name: 'Math', code: 'M9' });
    const subjSci = await Subject.create({ tenantId: schoolId, name: 'Science', code: 'S10' });
    assignedSubjId = String(subjMath._id);
    unassignedSubjId = String(subjSci._id);

    // 7. Teacher Assignment: Teacher assigned ONLY to Class 9-A for Math
    await TeacherAssignment.create({
      tenantId: schoolId,
      teacherId: teacherUser._id,
      academicYearId: year._id,
      classId: classA._id,
      sectionId: secA._id,
      subjectId: subjMath._id,
      isClassTeacher: true,
    });

    // 8. Students
    const stu1 = await Student.create({
      tenantId: schoolId,
      admissionNumber: 'STU-9A-001',
      firstName: 'Student',
      lastName: 'Nine',
      dateOfBirth: new Date('2011-01-01'),
      gender: 'MALE',
      academicYearId: year._id,
      classId: classA._id,
      sectionId: secA._id,
      status: 'ACTIVE',
    });
    studentAssignedId = String(stu1._id);

    const stu2 = await Student.create({
      tenantId: schoolId,
      admissionNumber: 'STU-10B-001',
      firstName: 'Student',
      lastName: 'Ten',
      dateOfBirth: new Date('2010-01-01'),
      gender: 'MALE',
      academicYearId: year._id,
      classId: classB._id,
      sectionId: secB._id,
      status: 'ACTIVE',
    });
    studentUnassignedId = String(stu2._id);

    // 9. Exams
    const exam = await Examination.create({
      tenantId: schoolId,
      name: 'Mid-Term 2025',
      academicYearId: year._id,
      startDate: new Date(),
      endDate: new Date(),
    });

    const es1 = await ExaminationSubject.create({
      tenantId: schoolId,
      examinationId: exam._id,
      classId: classA._id,
      subjectId: subjMath._id,
      maxMarks: 100,
      passingMarks: 35,
    });
    assignedExamSubjId = String(es1._id);

    const es2 = await ExaminationSubject.create({
      tenantId: schoolId,
      examinationId: exam._id,
      classId: classB._id,
      subjectId: subjSci._id,
      maxMarks: 100,
      passingMarks: 35,
    });
    unassignedExamSubjId = String(es2._id);
  });

  afterAll(async () => {
    await Promise.all([
      Tenant.deleteMany({ tenantId: schoolId }),
      User.deleteMany({ tenantId: schoolId }),
      AcademicYear.deleteMany({ tenantId: schoolId }),
      Class.deleteMany({ tenantId: schoolId }),
      Section.deleteMany({ tenantId: schoolId }),
      Subject.deleteMany({ tenantId: schoolId }),
      TeacherAssignment.deleteMany({ tenantId: schoolId }),
      Student.deleteMany({ tenantId: schoolId }),
      Examination.deleteMany({ tenantId: schoolId }),
      ExaminationSubject.deleteMany({ tenantId: schoolId }),
    ]);
  });

  it('rejects teacher attempting to view attendance for an UNASSIGNED class with 403', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/sheet?classId=${unassignedClassId}&sectionId=${unassignedSectionId}&date=2026-03-10`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not assigned/i);
  });

  it('rejects teacher attempting to submit attendance for an UNASSIGNED class with 403', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/mark')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: unassignedClassId,
        sectionId: unassignedSectionId,
        date: '2026-03-10',
        records: [{ studentId: studentUnassignedId, status: 'PRESENT' }],
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not assigned/i);
  });

  it('allows teacher to submit attendance for their ASSIGNED class with 200', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/mark')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: assignedClassId,
        sectionId: assignedSectionId,
        date: '2026-03-10',
        records: [{ studentId: studentAssignedId, status: 'PRESENT' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects teacher attempting to submit marks for an UNASSIGNED subject/class with 403', async () => {
    const res = await request(app)
      .post(`/api/v1/examinations/subjects/${unassignedExamSubjId}/marks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        marks: [{ studentId: studentUnassignedId, marksObtained: 85 }],
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('allows teacher to submit marks for their ASSIGNED subject and class with 200', async () => {
    const res = await request(app)
      .post(`/api/v1/examinations/subjects/${assignedExamSubjId}/marks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        marks: [{ studentId: studentAssignedId, marksObtained: 92 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('allows School Admin to submit attendance and marks for ANY class without teacher assignment restriction', async () => {
    // Admin marks attendance for Class 10-B
    const attRes = await request(app)
      .post('/api/v1/attendance/mark')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        classId: unassignedClassId,
        sectionId: unassignedSectionId,
        date: '2026-03-10',
        records: [{ studentId: studentUnassignedId, status: 'PRESENT' }],
      });
    expect(attRes.status).toBe(200);

    // Admin enters marks for Class 10-B Science
    const marksRes = await request(app)
      .post(`/api/v1/examinations/subjects/${unassignedExamSubjId}/marks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        marks: [{ studentId: studentUnassignedId, marksObtained: 88 }],
      });
    expect(marksRes.status).toBe(200);
  });
});
