import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../index';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { AcademicYear } from '../models/AcademicYear';
import { Class } from '../models/Class';
import { Section } from '../models/Section';
import { Subject } from '../models/Subject';
import { Student } from '../models/Student';
import { Parent } from '../models/Parent';
import { ParentStudentRelationship } from '../models/ParentStudentRelationship';
import { Examination } from '../models/Examination';
import { ExaminationSubject } from '../models/ExaminationSubject';
import { config } from '../config/env';

describe('PDF Report Security & Authorization', () => {
  const tenantId = 'SCH-PDF-SEC-001';
  let adminToken: string;
  let parentToken: string;
  let otherParentToken: string;
  let childId: string;
  let otherStudentId: string;
  let examId: string;

  beforeAll(async () => {
    await Tenant.create({
      tenantId,
      name: 'PDF Security School',
      code: 'PSS01',
      status: 'ACTIVE',
      address: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
      contact: { email: 'info@pss01.edu', phone: '+91 44 2498 0003' },
      affiliation: 'MATRICULATION',
      settings: {},
    });

    const defaultHash = await bcrypt.hash('Password@123', 10);

    // Admin
    const adminUser = await User.create({
      tenantId,
      email: 'admin.pdf@school.edu',
      passwordHash: defaultHash,
      firstName: 'Admin',
      lastName: 'PDF',
      role: 'SCHOOL_ADMIN',
      isActive: true,
    });
    adminToken = jwt.sign(
      { userId: adminUser._id, tenantId, role: 'SCHOOL_ADMIN', email: adminUser.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Parent A
    const parentAUser = await User.create({
      tenantId,
      email: 'parent.a@gmail.com',
      passwordHash: defaultHash,
      firstName: 'Parent',
      lastName: 'A',
      role: 'PARENT',
      isActive: true,
    });
    const parentA = await Parent.create({
      tenantId,
      userId: parentAUser._id,
      occupation: 'Engineer',
    });
    parentToken = jwt.sign(
      { userId: parentAUser._id, tenantId, role: 'PARENT', email: parentAUser.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Parent B
    const parentBUser = await User.create({
      tenantId,
      email: 'parent.b@gmail.com',
      passwordHash: defaultHash,
      firstName: 'Parent',
      lastName: 'B',
      role: 'PARENT',
      isActive: true,
    });
    await Parent.create({
      tenantId,
      userId: parentBUser._id,
      occupation: 'Doctor',
    });
    otherParentToken = jwt.sign(
      { userId: parentBUser._id, tenantId, role: 'PARENT', email: parentBUser.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Academic setup
    const year = await AcademicYear.create({
      tenantId,
      name: '2025-2026',
      startDate: new Date(),
      endDate: new Date(),
      isCurrent: true,
    });

    const cls = await Class.create({ tenantId, name: 'Class 10', gradeLevel: 10 });
    const sec = await Section.create({ tenantId, classId: cls._id, name: 'A' });
    const subj = await Subject.create({ tenantId, name: 'Math', code: 'M10' });

    // Students
    const student1 = await Student.create({
      tenantId,
      admissionNumber: 'STU-PDF-001',
      firstName: 'Ananya',
      lastName: 'A',
      dateOfBirth: new Date('2010-01-01'),
      gender: 'FEMALE',
      academicYearId: year._id,
      classId: cls._id,
      sectionId: sec._id,
      status: 'ACTIVE',
    });
    childId = String(student1._id);

    const student2 = await Student.create({
      tenantId,
      admissionNumber: 'STU-PDF-002',
      firstName: 'Bharath',
      lastName: 'B',
      dateOfBirth: new Date('2010-02-02'),
      gender: 'MALE',
      academicYearId: year._id,
      classId: cls._id,
      sectionId: sec._id,
      status: 'ACTIVE',
    });
    otherStudentId = String(student2._id);

    // Verified relation for Parent A -> Student 1
    await ParentStudentRelationship.create({
      tenantId,
      parentId: parentA._id,
      studentId: student1._id,
      relationshipType: 'FATHER',
      isVerified: true,
    });

    // Exam
    const exam = await Examination.create({
      tenantId,
      name: 'Annual Exam 2026',
      academicYearId: year._id,
      startDate: new Date(),
      endDate: new Date(),
    });
    examId = String(exam._id);

    await ExaminationSubject.create({
      tenantId,
      examinationId: exam._id,
      classId: cls._id,
      subjectId: subj._id,
      maxMarks: 100,
      passingMarks: 35,
    });
  });

  afterAll(async () => {
    await Promise.all([
      Tenant.deleteMany({ tenantId }),
      User.deleteMany({ tenantId }),
      AcademicYear.deleteMany({ tenantId }),
      Class.deleteMany({ tenantId }),
      Section.deleteMany({ tenantId }),
      Subject.deleteMany({ tenantId }),
      Student.deleteMany({ tenantId }),
      Parent.deleteMany({ tenantId }),
      ParentStudentRelationship.deleteMany({ tenantId }),
      Examination.deleteMany({ tenantId }),
      ExaminationSubject.deleteMany({ tenantId }),
    ]);
  });

  it('rejects access token in query string without Authorization header (401)', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/student/${childId}/exam/${examId}/pdf?token=${adminToken}`);

    // Must be rejected because query-string tokens are disabled
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/token required/i);
  });

  it('permits authorized PDF download with Authorization: Bearer header (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/student/${childId}/exam/${examId}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.body.length).toBeGreaterThan(500); // valid PDF binary payload
  });

  it('allows verified parent to download their own child report card (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/student/${childId}/exam/${examId}/pdf`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  it('rejects parent attempting to download report card of an unverified student with 403', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/student/${otherStudentId}/exam/${examId}/pdf`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/unauthorized/i);
  });
});
