module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  verbose: true,
  testTimeout: 300000,
  setupFilesAfterEnv: ['./src/tests/setup.ts']
};
