import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  // [...]
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  cacheDirectory: '<rootDir>/.jest/cache',
  collectCoverage: true,
  coverageReporters: ['text', 'html', 'clover', 'lcov', 'json'],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/src/index.ts',
    '/src/data/*',
    '/src/graphql/*',
    '/src/migrate.ts',
    '/src/schema.ts'
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};

export default jestConfig;
