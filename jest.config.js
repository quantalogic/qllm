// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest', // Use ts-jest for TypeScript files
      '^.+\\.jsx?$': 'babel-jest', // Use babel-jest for JavaScript files
    },
    moduleNameMapper: {
        // Add any necessary mappings for non-JS modules here
    },
    testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
  };
