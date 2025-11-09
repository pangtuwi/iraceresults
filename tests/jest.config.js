module.exports = {
  // Use Node.js environment for testing
  testEnvironment: 'node',

  // Pattern to find test files
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Files to collect coverage from
  collectCoverageFrom: [
    '../*.js',
    '!../app.js',
    '!../jest.config.js',
    '!../coverage/**',
    '!../tests/**',
    '!../node_modules/**'
  ],

  // Output directory for coverage reports
  coverageDirectory: '../coverage',

  // Timeout for async tests (30 seconds for recalculation operations)
  testTimeout: 30000,

  // Setup file to run before tests
  setupFilesAfterEnv: ['<rootDir>/setup.js'],

  // Verbose output
  verbose: true,

  // Root directory for tests
  rootDir: '.',

  // Module paths
  modulePaths: ['<rootDir>/..'],

  // Coverage thresholds (optional - can be adjusted)
  coverageThresholds: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
