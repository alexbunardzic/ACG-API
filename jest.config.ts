import type { Config } from 'jest';

const base = {
  preset: 'ts-jest',
  testEnvironment: 'node' as const,
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
};

const config: Config = {
  testTimeout: 60_000,
  projects: [
    {
      ...base,
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
    },
    {
      ...base,
      displayName: 'arch',
      testMatch: ['<rootDir>/test/architecture/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/architecture/jest.setup.ts'],
    },
    {
      ...base,
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
    },
  ],
};

export default config;
