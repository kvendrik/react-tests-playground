module.exports = {
  moduleDirectories: ['node_modules'],
  setupFilesAfterEnv: ['<rootDir>/testsSetup.ts'],
  moduleNameMapper: {
    '\\.(scss|css)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testURL: 'http://localhost/',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
