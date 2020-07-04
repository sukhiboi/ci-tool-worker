const redis = require('redis');
const { exec } = require('child_process');
const Listr = require('listr');

const worker = require('./worker');
const [, , env] = process.argv;
const redisOptions = require('../config.json.json')[env];
const client = redis.createClient(redisOptions);

const createTempFolder = function () {
  return new Promise((res) => {
    exec(`mkdir testingTemp`, (err, stdout) => {
      if (err) {
        res(stdout);
      }
      res(stdout);
    });
  });
};

const cloneRepo = function (cloneUrl) {
  return new Promise((res) => {
    exec(`cd testingTemp;git clone ${cloneUrl}`, (err, stdout) => {
      if (err) {
        throw new Error(err);
      }
      res(stdout);
    });
  });
};

const installMocha = function (repoName) {
  return new Promise((res) => {
    exec(`cd testingTemp/${repoName}; npm install mocha`, (err, stdout) => {
      if (err) {
        throw new Error('unable to install eslint');
      }
      res(stdout);
    });
  });
};

const test = function (repoName) {
  return new Promise((res) => {
    exec(`cd testingTemp/${repoName}; mkdir test; mocha`, (err, stdout) => {
      if (err) {
        res('failing');
      }
      res('passing');
    });
  });
};

const deleteLocalRepo = function (repoName) {
  return new Promise((res) => {
    if (repoName) {
      exec(`cd testingTemp; rm -rf ${repoName}`, res);
    }
  });
};

const testRepo = function (payload) {
  return new Promise((res) => {
    const { cloneUrl, repoName, jobId } = payload;
    const tasks = new Listr([
      {
        title: 'creating temp folder for testing',
        task: () => createTempFolder(),
      },
      {
        title: 'cloning repo',
        task: () => cloneRepo(cloneUrl),
      },
      {
        title: 'installing mocha',
        task: () => installMocha(repoName),
      },
      {
        title: 'testing',
        task: () => {
          return new Promise((resolve) => {
            test(repoName, payload).then((report) => {
              res(report);
              resolve(deleteLocalRepo(repoName));
            });
          });
        },
      },
    ]);
    console.log(`Processing job ${jobId}`);
    tasks.run();
  });
};

worker(client, 'testQueue', 1, 'test', testRepo);
