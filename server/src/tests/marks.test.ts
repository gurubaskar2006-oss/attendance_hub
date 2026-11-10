import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../index';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { SoftwareLicense } from '../models/SoftwareLicense';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { Section } from '../models/Section';
import { Subject } from '../models/Subject';
import { AcademicYear } from '../models/AcademicYear';
import { Examination } from '../models/Examination';
import { ExaminationSubject } from '../models/ExaminationSubject';
import { Marks } from '../models/Marks';

describe('Examination & Marks Validation', () => {
  const tenantId = 'SCH-EXAM-TEST';
  let token: string;
  let examId: string;
  let examSubjectId: string;
  let studentId: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPass@123', 10);

    await Tenant.create({
      tenantId,
      name: 'Exam Test School',
      code: 'EXAMSCH',
      affiliation: 'CBSE',
      address: { city: 'Chennai', state: 'TN', country: 'India' },
      contact: { email: 'admin@examsch.edu', phone: '9840001111' },
      status: 'ACTIVE',
      settings: {
        gradeScale: [
          { grade: 'A+', minMarks: 90, maxMarks: 100 },
          { grade: 'A', minMarks: 80, maxMarks: 89 },
          { grade: 'B', minMarks: 60, maxMarks: 79 },
          { grade: 'C', minMarks: 35, maxMarks: 59 },
          { grade: 'F', minMarks: 0, maxMarks: 34 },
        ],
      },
    });

    await SoftwareLicense.create({
      licenseKey: 'LIC-EXAM-PERM',
      tenantId,
      schoolName: 'Exam Test School',
      customerName: 'Trust',
      customerContact: { email: 'admin@examsch.edu', phone: '9840001111' },
      agreementReference: 'AGR-EXAM',
      status: 'ACTIVE',
    });

    await User.create({
      tenantId,
      email: 'admin@examsch.edu',
      passwordHash,
      firstName: 'Exam',
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

    const cls = await Class.create({ tenantId, name: 'Class 9', gradeLevel: 9 });
    const sec = await Section.create({ tenantId, classId: cls._id, name: 'A' });
    const subj = await Subject.create({ tenantId, name: 'Science', code: 'SCI-09' });

    const student = await Student.create({
      tenantId,
      admissionNumber: 'EXAM-S1',
      rollNumber: '01',
      firstName: 'Anil',
      lastName: 'Kumble',
      dateOfBirth: new Date('2011-03-20'),
      gender: 'MALE',
      academicYearId: year._id,
      classId: cls._id,
      sectionId: sec._id,
      status: 'ACTIVE',
    });
    studentId = String(student._id);

    const exam = await Examination.create({
      tenantId,
      academicYearId: year._id,
      name: 'Mid Term Test 2025',
      examType: 'UNIT_TEST',
      startDate: '2025-10-01',
      endDate: '2025-10-05',
    });
    examId = String(exam._id);

    const examSubj = await ExaminationSubject.create({
      tenantId,
      examinationId: exam._id,
      classId: cls._id,
      subjectId: subj._id,
      maxMarks: 50,
      passingMarks: 18,
    });
    examSubjectId = String(examSubj._id);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@examsch.edu', password: 'TestPass@123' });
    token = loginRes.body.data.token;
  });

  afterAll(async () => {
    await Tenant.deleteMany({ tenantId });
    await User.deleteMany({ tenantId });
    await Student.deleteMany({ tenantId });
    await Class.deleteMany({ tenantId });
    await Section.deleteMany({ tenantId });
    await Subject.deleteMany({ tenantId });
    await AcademicYear.deleteMany({ tenantId });
    await Examination.deleteMany({ tenantId });
    await ExaminationSubject.deleteMany({ tenantId });
    await Marks.deleteMany({ tenantId });
    await SoftwareLicense.deleteMany({ tenantId });
  });

  it('rejects marks entry when marksObtained exceeds configured maxMarks', async () => {
    const res = await request(app)
      .post(`/api/v1/examinations/subjects/${examSubjectId}/marks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        marks: [{ studentId, marksObtained: 55, isAbsent: false }], // maxMarks is 50!
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot exceed maximum marks/i);
  });

  it('accepts valid marks and correctly computes grade', async () => {
    // 46 out of 50 = 92% -> Grade A+
    const res = await request(app)
      .post(`/api/v1/examinations/subjects/${examSubjectId}/marks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        marks: [{ studentId, marksObtained: 46, isAbsent: false }],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const saved = await Marks.findOne({ tenantId, studentId, examinationSubjectId: examSubjectId });
    expect(saved?.marksObtained).toBe(46);
    expect(saved?.grade).toBe('A+');
  });

  it('generates report card summary with accurate percentage and status', async () => {
    const res = await request(app)
      .get(`/api/v1/examinations/student/${studentId}/report-card/${examId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalMaxMarks).toBe(50);
    expect(res.body.data.summary.totalMarksObtained).toBe(46);
    expect(res.body.data.summary.percentage).toBe(92);
    expect(res.body.data.summary.resultStatus).toBe('PASS');
  });
});

