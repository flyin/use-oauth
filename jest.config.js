module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  setupFilesAfterEnv: ['<rootDir>/node_modules/jest-enzyme/lib/index.js'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  transform: {
    '.*': 'babel-jest',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
};
