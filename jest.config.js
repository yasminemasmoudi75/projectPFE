module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './reports',
        outputName: 'junit.xml',
        suiteName: 'Tests CRM — Nexus',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: './reports',
        filename: 'report.html',
        openReport: false,
        pageTitle: 'Rapport de Tests — Nexus CRM',
        logoImgPath: undefined,
      },
    ],
  ],
};
