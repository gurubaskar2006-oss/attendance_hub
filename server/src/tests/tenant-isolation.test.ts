import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../index';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { SoftwareLicense } from '../models/SoftwareLicense';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { Section } from '../models/Section';
import { AcademicYear } from '../models/AcademicYear';
import { AuditLog } from '../models/AuditLog';

describe('Strict Multi-Tenant Isolation', () => {
  const schoolA = 'SCH-ISOLATION-A';
  const schoolB = 'SCH-ISOLATION-B';

  let tokenA: string;
  let tokenB: string;
  let studentAId: string;
  let studentBId: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPass@123', 10);

    // Create School A
    await Tenant.create({
      tenantId: schoolA,
      name: 'Alpha Academy',
      code: 'ALPHA',
      affiliation: 'CBSE',
      address: { city: 'Chennai', state: 'TN', country: 'India' },
      contact: { email: 'admin@alpha.edu', phone: '1111111111' },
      status: 'ACTIVE',
    });
    await SoftwareLicense.create({
      licenseKey: 'LIC-ALPHA-PERM',
      tenantId: schoolA,
      schoolName: 'Alpha Academy',
      customerName: 'Alpha Trust',
      customerContact: { email: 'admin@alpha.edu', phone: '1111111111' },
      agreementReference: 'AGR-ALPHA',
      status: 'ACTIVE',
    });
    const userA = await User.create({
      tenantId: schoolA,
      email: 'admin@alpha.edu',
      passwordHash,
      firstName: 'Alpha',
      lastName: 'Admin',
      role: 'SCHOOL_ADMIN',
      isActive: true,
    });

    // Create School B
    await Tenant.create({
      tenantId: schoolB,
      name: 'Beta High School',
      code: 'BETA',
      affiliation: 'ICSE',
      address: { city: 'Bengaluru', state: 'KA', country: 'India' },
      contact: { email: 'admin@beta.edu', phone: '2222222222' },
      status: 'ACTIVE',
    });
    await SoftwareLicense.create({
      licenseKey: 'LIC-BETA-PERM',
      tenantId: schoolB,
      schoolName: 'Beta High School',
      customerName: 'Beta Trust',
      customerContact: { email: 'admin@beta.edu', phone: '2222222222' },
      agreementReference: 'AGR-BETA',
      status: 'ACTIVE',
    });
    const userB = await User.create({
      tenantId: schoolB,
      email: 'admin@beta.edu',
      passwordHash,
      firstName: 'Beta',
      lastName: 'Admin',
      role: 'SCHOOL_ADMIN',
      isActive: true,
    });

    // Create Academic Data for School A
    const yearA = await AcademicYear.create({
      tenantId: schoolA,
      name: '2025-2026',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-04-30'),
      isCurrent: true,
    });
    const classA = await Class.create({ tenantId: schoolA, name: 'Grade 10', gradeLevel: 10 });
    const secA = await Section.create({ tenantId: schoolA, classId: classA._id, name: 'A' });

    const studentA = await Student.create({
      tenantId: schoolA,
      admissionNumber: 'ADM-ALPHA-01',
      firstName: 'Aarav',
      lastName: 'Alpha',
      dateOfBirth: new Date('2010-01-01'),
      gender: 'MALE',
      academicYearId: yearA._id,
      classId: classA._id,
      sectionId: secA._id,
      status: 'ACTIVE',
    });
    studentAId = String(studentA._id);

    // Create Academic Data for School B
    const yearB = await AcademicYear.create({
      tenantId: schoolB,
      name: '2025-2026',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-04-30'),
      isCurrent: true,
    });
    const classB = await Class.create({ tenantId: schoolB, name: 'Grade 10', gradeLevel: 10 });
    const secB = await Section.create({ tenantId: schoolB, classId: classB._id, name: 'A' });

    const studentB = await Student.create({
      tenantId: schoolB,
      admissionNumber: 'ADM-BETA-01',
      firstName: 'Bharat',
      lastName: 'Beta',
      dateOfBirth: new Date('2010-02-02'),
      gender: 'MALE',
      academicYearId: yearB._id,
      classId: classB._id,
      sectionId: secB._id,
      status: 'ACTIVE',
    });
    studentBId = String(studentB._id);

    // Logins to acquire tokens
    const resLoginA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@alpha.edu', password: 'TestPass@123' });
    tokenA = resLoginA.body.data.token;

    const resLoginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@beta.edu', password: 'TestPass@123' });
    tokenB = resLoginB.body.data.token;
  });

  afterAll(async () => {
    await Tenant.deleteMany({ tenantId: { $in: [schoolA, schoolB] } });
    await User.deleteMany({ tenantId: { $in: [schoolA, schoolB] } });
    await Student.deleteMany({ tenantId: { $in: [schoolA, schoolB] } });
    await Class.deleteMany({ tenantId: { $in: [schoolA, schoolB] } });
    await Section.deleteMany({ tenantId: { $in: [schoolA, schoolB] } });
    await AcademicYear.deleteMany({ tenantId: { $in: [schoolA, schoolB] } });
    await SoftwareLicense.deleteMany({ tenantId: { $in: [schoolA, schoolB] } });
  });

  it('School A cannot see School B students in student list', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    const students = res.body.data.students;
    const studentNames = students.map((s: any) => s.firstName);

    expect(studentNames).toContain('Aarav');
    expect(studentNames).not.toContain('Bharat');
  });

  it('School A receives 404 when directly requesting School B student ID', async () => {
    const res = await request(app)
      .get(`/api/v1/students/${studentBId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('blocks cross-tenant access attempt when user tries to inject a different tenantId in header', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-target-tenant', schoolB); // malicious attempt

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cross-tenant/i);

    // Verify security audit log was written
    const auditRecord = await AuditLog.findOne({
      tenantId: schoolA,
      action: 'CROSS_TENANT_ACCESS_BLOCKED',
    });
    expect(auditRecord).toBeDefined();
    expect(auditRecord?.status).toBe('DENIED');
  });

  it('prevents School Admin from modifying their school tenantId via update payload', async () => {
    const res = await request(app)
      .put(`/api/v1/students/${studentAId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        firstName: 'Aarav-Updated',
        tenantId: schoolB, // malicious attempt to move student to School B
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cross-tenant/i);

    // Verify the student remains strictly in School A and was not moved
    const updated = await Student.findById(studentAId);
    expect(updated?.tenantId).toBe(schoolA);
  });
});
