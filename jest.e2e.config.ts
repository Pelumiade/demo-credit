import type { Config } from 'jest';
import base from './jest.config';

const config: Config = {
  ...base,
  testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/e2e/jest.e2e.setup.ts'],
  testTimeout: 60000,
  collectCoverageFrom: [],
  coverageThreshold: undefined,
};

export default config;
