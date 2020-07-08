const { exec } = require('child_process');
const redis = require('redis');
const worker = require('./../worker');

const [, , env] = process.argv;
const redisOptions = require('../config.json')[env];
const client = redis.createClient(redisOptions);

const execute = function (command) {
  return new Promise((resolve) => {
    exec(command, (err, stdout) => {
      if (err) return resolve(stdout);
      resolve(stdout);
    });
  });
};

const lint = function (githubPayload) {
  return new Promise((resolve, reject) => {
    const { cloneUrl, commitSHA } = githubPayload;
    const tasks = [
      '[ ! -d lintTemp ] && mkdir lintTemp',
      'cd lintTemp',
      `[ ! -d ${commitSHA} ] && git clone ${cloneUrl} ${commitSHA}`,
      `cd ${commitSHA}`,
      `[ ! -f .eslintrc ] && curl -s https://gist.githubusercontent.com/sukhiboi/a8d7e70398b4317e37cd04b135df243c/raw/084dc3cd1a9f7693354f63260f73a9feec91b70d/.eslintrc > .eslintrc 2> /dev/null`,
      `ln -s ../../node_modules`,
      `eslint --format json --ignore-pattern 'node_modules/' . --ext .js`,
      `cd ..`,
      `[ -d ${commitSHA} ] && rm -rf ${commitSHA}`,
    ];
    execute(tasks.join(';')).then(resolve).catch(reject);
  });
};

const workerOptions = {
  client,
  queue: 'lintQueue',
  jobSet: 'completedLintJobs',
  jobTitle: 'lint',
  timeout: 1,
  handler: lint,
  statusKey: 'lintingStatus',
};
worker(workerOptions);
