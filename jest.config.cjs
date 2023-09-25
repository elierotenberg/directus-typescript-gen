// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require(`path`);
module.exports = {
  maxConcurrency: 30,
  testEnvironment: `node`,
  testMatch: [path.join(process.cwd(), `./build/**/*.test.cjs`)],
  testTimeout: 30000,
};
