const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/**/__tests__/**/*.test.(ts|tsx)'],
  moduleNameMapper: {
    '^swiper/css(/.*)?$': '<rootDir>/__mocks__/styleMock.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
};

// next-intl is ESM-only. Apply this after next/jest's generated exclusions so
// the real translations can run in tests instead of mocking their output.
module.exports = async () => ({
  ...(await createJestConfig(customJestConfig)()),
  transformIgnorePatterns: [
    '/node_modules/(?!next-intl/|use-intl/|intl-messageformat/|@formatjs/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
});
