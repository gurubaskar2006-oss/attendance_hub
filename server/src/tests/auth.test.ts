import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../index';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { SoftwareLicense } from '../models/SoftwareLicense';

describe('Authentication & Access Control', () => {
  const tenantId = 'SCH-TEST-AUTH-01';
  let adminUser: any;

  beforeAll(async () => {
    await Tenant.create({
      tenantId,
      name: 'Auth Test School',
      code: 'ATSCH',
      affiliation: 'CBSE',
      address: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
      contact: { email: 'admin@atschool.edu.in', phone: '9840011111' },
      status: 'ACTIVE',
    });

    await SoftwareLicense.create({
      licenseKey: 'LIC-AUTH-TEST-KEY-001',
      tenantId,
      schoolName: 'Auth Test School',
      customerName: 'Test Trust',
      customerContact: { email: 'admin@atschool.edu.in', phone: '9840011111' },
      agreementReference: 'TEST-AGR-01',
      status: 'ACTIVE',
    });

    const passwordHash = await bcrypt.hash('Secret@123', 10);
    adminUser = await User.create({
      tenantId,
      email: 'admin@atschool.edu.in',
      passwordHash,
      firstName: 'Test',
      lastName: 'Admin',
      role: 'SCHOOL_ADMIN',
      isActive: true,
    });
  });

  afterAll(async () => {
    await Tenant.deleteMany({ tenantId });
    await User.deleteMany({ tenantId });
    await SoftwareLicense.deleteMany({ tenantId });
  });

  it('should authenticate valid credentials and return JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@atschool.edu.in', password: 'Secret@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('SCHOOL_ADMIN');
    expect(res.body.data.tenant.tenantId).toBe(tenantId);
  });

  it('should reject invalid password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@atschool.edu.in', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject deactivated user with 403', async () => {
    await User.updateOne({ _id: adminUser._id }, { isActive: false });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@atschool.edu.in', password: 'Secret@123' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);

    // Revert
    await User.updateOne({ _id: adminUser._id }, { isActive: true });
  });

  it('should reject unauthenticated request to protected endpoints', async () => {
    const res = await request(app).get('/api/v1/students');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

