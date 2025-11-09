/**
 * Jest Test Setup File
 * This file runs before all tests and provides global setup/teardown
 */

// Suppress console.log during tests (optional - comment out if you need to debug)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Global test timeout
jest.setTimeout(30000);

// Setup global test utilities if needed
global.testUtils = {
  TEST_LEAGUE_ID: 'IRRTEST01',
  TEST_DATA_PATH: './data/IRRTEST01',
  BACKUP_SUFFIX: '.test-backup'
};

// Global beforeAll hook
beforeAll(async () => {
  console.log('=== Starting Test Suite ===');
});

// Global afterAll hook
afterAll(async () => {
  console.log('=== Test Suite Complete ===');
});
