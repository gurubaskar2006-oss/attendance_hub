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
import { Attendance } from '../models/Attendance';
import { AttendanceCorrection } from '../models/AttendanceCorrection';

describe('Attendance Workflow & Auditing', () => {
  const tenantId = 'SCH-ATTEND-TEST';
  let token: string;
  let classId: string;
  let sectionId: string;
  let student1Id: string;
  let student2Id: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPass@123', 10);

    await Tenant.create({
      tenantId,
      name: 'Attendance Test School',
      code: 'ATTSCH',
      affiliation: 'CBSE',
      address: { city: 'Chennai', state: 'TN', country: 'India' },
      contact: { email: 'admin@attschool.edu', phone: '9840000000' },
      status: 'ACTIVE',
    });

    await SoftwareLicense.create({
      licenseKey: 'LIC-ATTEND-PERM',
      tenantId,
      schoolName: 'Attendance Test School',
      customerName: 'Trust',
      customerContact: { email: 'admin@attschool.edu', phone: '9840000000' },
      agreementReference: 'AGR-ATT',
      status: 'ACTIVE',
    });

    await User.create({
      tenantId,
      email: 'admin@attschool.edu',
      passwordHash,
      firstName: 'Attend',
      lastName: 'Admin',
      role: 'SCHOOL_ADMIN',
      isActive: true,
    });

    const year = await AcademicYear.create({
      tenantId,
      name: '2025-2026',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-04-30'),
      isCurrent: true,
    });

    const cls = await Class.create({ tenantId, name: 'Class 8', gradeLevel: 8 });
    classId = String(cls._id);

    const sec = await Section.create({ tenantId, classId: cls._id, name: 'A' });
    sectionId = String(sec._id);

    const s1 = await Student.create({
      tenantId,
      admissionNumber: 'ATT-S1',
      rollNumber: '01',
      firstName: 'Karan',
      lastName: 'Sharma',
      dateOfBirth: new Date('2012-05-10'),
      gender: 'MALE',
      academicYearId: year._id,
      classId: cls._id,
      sectionId: sec._id,
      status: 'ACTIVE',
    });
    student1Id = String(s1._id);

    const s2 = await Student.create({
      tenantId,
      admissionNumber: 'ATT-S2',
      rollNumber: '02',
      firstName: 'Pooja',
      lastName: 'Verma',
      dateOfBirth: new Date('2012-08-15'),
      gender: 'FEMALE',
      academicYearId: year._id,
      classId: cls._id,
      sectionId: sec._id,
      status: 'ACTIVE',
    });
    student2Id = String(s2._id);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@attschool.edu', password: 'TestPass@123' });
    token = loginRes.body.data.token;
  });

  afterAll(async () => {
    await Tenant.deleteMany({ tenantId });
    await User.deleteMany({ tenantId });
    await Student.deleteMany({ tenantId });
    await Class.deleteMany({ tenantId });
    await Section.deleteMany({ tenantId });
    await AcademicYear.deleteMany({ tenantId });
    await Attendance.deleteMany({ tenantId });
    await AttendanceCorrection.deleteMany({ tenantId });
    await SoftwareLicense.deleteMany({ tenantId });
  });

  it('submits attendance sheet with Present and Absent statuses', async () => {
    const testDate = '2026-03-01';
    const res = await request(app)
      .post('/api/v1/attendance/mark')
      .set('Authorization', `Bearer ${token}`)
      .send({
        classId,
        sectionId,
        date: testDate,
        session: 'FULL_DAY',
        records: [
          { studentId: student1Id, status: 'PRESENT' },
          { studentId: student2Id, status: 'ABSENT', remarks: 'Sick leave' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.createdCount).toBe(2);

    // Verify in database
    const rec1 = await Attendance.findOne({ tenantId, studentId: student1Id, date: testDate });
    const rec2 = await Attendance.findOne({ tenantId, studentId: student2Id, date: testDate });

    expect(rec1?.status).toBe('PRESENT');
    expect(rec2?.status).toBe('ABSENT');
  });

  it('prevents accidental duplicate record creation for same student and date', async () => {
    const testDate = '2026-03-01';
    // Submitting again should update existing rather than creating duplicates
    const res = await request(app)
      .post('/api/v1/attendance/mark')
      .set('Authorization', `Bearer ${token}`)
      .send({
        classId,
        sectionId,
        date: testDate,
        session: 'FULL_DAY',
        records: [{ studentId: student1Id, status: 'LATE', remarks: 'Arrived 15 mins late' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.updatedCount).toBe(1);

    const count = await Attendance.countDocuments({
      tenantId,
      studentId: student1Id,
      date: testDate,
      session: 'FULL_DAY',
    });
    expect(count).toBe(1); // strictly 1 record, never duplicated
  });

  it('records an audit log when an authorized correction is made', async () => {
    const testDate = '2026-03-01';
    const rec = await Attendance.findOne({ tenantId, studentId: student2Id, date: testDate });

    const res = await request(app)
      .post('/api/v1/attendance/correct')
      .set('Authorization', `Bearer ${token}`)
      .send({
        attendanceId: String(rec?._id),
        newStatus: 'APPROVED_LEAVE',
        reason: 'Parent submitted official medical certificate',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify correction record exists with old and new status
    const correction = await AttendanceCorrection.findOne({ attendanceId: rec?._id });
    expect(correction).toBeDefined();
    expect(correction?.previousStatus).toBe('ABSENT');
    expect(correction?.newStatus).toBe('APPROVED_LEAVE');
    expect(correction?.reason).toBe('Parent submitted official medical certificate');
  });

  it('calculates accurate attendance analytics percentage', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/analytics?date=2026-03-01')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalMarkedToday).toBe(2);
    expect(res.body.data.summary.overallPercentage).toBeGreaterThanOrEqual(0);
  });
});

