const { exec } = require('child_process');
const redis = require('redis');
const worker = require('./src/worker');
const [, , env] = process.argv;
const redisOptions = require('./config.json')[env];
const client = redis.createClient(redisOptions);

const execute = function (command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout) => {
      if (err) return reject(stdout);
      resolve(stdout);
    });
  });
};

const test = function (githubPayload) {
  return new Promise((resolve, reject) => {
    const { cloneUrl, commitSHA } = githubPayload;
    const tasks = [
      '[ ! -d testTemp ] && mkdir testTemp',
      'cd testTemp',
      `[ ! -d ${commitSHA} ] && git clone ${cloneUrl} ${commitSHA}`,
      `cd ${commitSHA}`,
      `ln -s ../../node_modules`,
      `mocha --reporter=json`,
      `cd ..`,
      `[ -d ${commitSHA} ] && rm -rf ${commitSHA}`,
    ];
    execute(tasks.join(';')).then(resolve).catch(reject);
  });
};

const workerOptions = {
  client,
  queue: 'testQueue',
  jobTitle: 'test',
  timeout: 1,
  handler: test,
  statusKey: 'testingStatus',
};
worker(workerOptions);
