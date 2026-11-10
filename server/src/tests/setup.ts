import { connectMemoryDatabase, disconnectDatabase } from '../config/database';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await connectMemoryDatabase();
}, 300000);

afterAll(async () => {
  await disconnectDatabase();
});
