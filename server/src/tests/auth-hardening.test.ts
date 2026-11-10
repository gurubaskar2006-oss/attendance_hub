import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../index';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';

describe('Authentication Hardening, Refresh Token Lifecycle & Replay Protection', () => {
  const tenantId = 'SCH-AUTH-HARDEN';
  const email = 'harden.user@school.edu';
  const password = 'Password@123';

  beforeAll(async () => {
    await Tenant.create({
      tenantId,
      name: 'Auth Hardening School',
      code: 'AHS01',
      status: 'ACTIVE',
      address: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
      contact: { email: 'info@ahs01.edu', phone: '+91 44 2498 0002' },
      settings: {},
    });

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      tenantId,
      email,
      passwordHash,
      firstName: 'Harden',
      lastName: 'User',
      role: 'TEACHER',
      isActive: true,
    });
  });

  afterAll(async () => {
    await Promise.all([
      Tenant.deleteMany({ tenantId }),
      User.deleteMany({ tenantId }),
    ]);
  });

  it('successful login generates access token and refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password, schoolCode: 'AHS01' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    // Verify token is hashed in database, not stored raw
    const userDoc = await User.findOne({ email });
    expect(userDoc?.refreshTokenHash).toBeDefined();
    expect(userDoc?.refreshTokenHash?.length).toBe(64); // SHA-256 hex length
  });

  it('POST /api/v1/auth/refresh rotates tokens successfully', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password, schoolCode: 'AHS01' });

    const initialRefreshToken = loginRes.body.data.refreshToken;
    const initialAccessToken = loginRes.body.data.token;

    // Exchange refresh token
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.token).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
    // Tokens must be rotated (new tokens issued)
    expect(refreshRes.body.data.token).not.toBe(initialAccessToken);
    expect(refreshRes.body.data.refreshToken).not.toBe(initialRefreshToken);
  });

  it('detects refresh token reuse (replay attack) and revokes all active sessions with 403', async () => {
    // 1. Fresh login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password, schoolCode: 'AHS01' });

    const token1 = loginRes.body.data.refreshToken;

    // 2. Legitimate refresh: rotates token1 -> token2
    const refreshRes1 = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: token1 });

    expect(refreshRes1.status).toBe(200);
    const token2 = refreshRes1.body.data.refreshToken;

    // 3. Attacker replays token1 (already rotated)
    const replayRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: token1 });

    expect(replayRes.status).toBe(403);
    expect(replayRes.body.message).toMatch(/reuse detected/i);

    // 4. Verify all active sessions were revoked (token2 is now also invalidated)
    const userDoc = await User.findOne({ email });
    expect(userDoc?.refreshTokenHash).toBeUndefined();

    const victimAttemptRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: token2 });

    expect(victimAttemptRes.status).toBe(401);
  });

  it('rejects tampered or malformed refresh token with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid.tampered.token' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it('logout invalidates refresh token and clears session', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password, schoolCode: 'AHS01' });

    const accessToken = loginRes.body.data.token;
    const refreshToken = loginRes.body.data.refreshToken;

    // Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(logoutRes.status).toBe(200);

    // Refresh attempt with logged out token must fail
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
  });
});
