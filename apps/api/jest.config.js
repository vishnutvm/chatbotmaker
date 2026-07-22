module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  /**
   * Layer B coverage target = domain / service logic.
   * Thin Nest wiring (modules, controllers, guards, strategies, DTO shells,
   * unused storage until Phase 5 file upload) is validated by API e2e /
   * Playwright, not unit-counted toward the campaign %.
   */
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.controller.ts',
    '!src/**/*.guard.ts',
    '!src/**/*.interface.ts',
    '!src/**/dto/**/*.ts',
    '!src/**/strategies/**/*.ts',
    '!src/common/types/**/*.ts',
    '!src/common/decorators/**/*.ts',
    '!src/infrastructure/storage/**/*.ts',
    '!src/infrastructure/database/prisma.service.ts',
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      // Progressive Layer B gate — raise toward 100% as gaps close.
      statements: 90,
      branches: 75,
      functions: 90,
      lines: 90,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@genie/types$': '<rootDir>/../../packages/types/src/index.ts',
  },
};
