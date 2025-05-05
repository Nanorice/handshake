// Jest configuration
module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'node',
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // A longer timeout for tests
  testTimeout: 30000,
  
  // Setup files to run before each test suite
  setupFiles: ['./jest.setup.js'],
}; 