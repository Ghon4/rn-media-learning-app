/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: {
              module: 'commonjs',
              esModuleInterop: true,
              isolatedModules: true,
            },
          },
        ],
      },
      moduleFileExtensions: ['ts', 'js', 'json'],
    },
    {
      displayName: 'native',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/src/**/*.test.tsx'],
    },
  ],
};
