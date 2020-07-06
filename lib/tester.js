const { exec } = require('child_process');
const redis = require('redis');
const Listr = require('listr');
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

const test = function (githubPayload) {
  return new Promise((res) => {
    const { cloneUrl, repoName, jobId } = githubPayload;
    const tasks = new Listr([
      {
        title: 'Creating temporary directory',
        task: () => {
          return new Promise((resolve) => {
            execute('mkdir testTemp').then(resolve).catch(resolve);
          });
        },
      },
      {
        title: 'Clone repository',
        task: () => execute(`cd testTemp; git clone ${cloneUrl}`),
      },
      {
        title: 'Installing Dependencies',
        task: () => execute(`cd testTemp/${repoName}; npm install`),
      },
      {
        title: 'Setting up popular Testing libraries',
        task: () => {
          return new Listr(
            [
              {
                title: 'Installing Mocha',
                task: () =>
                  execute(`cd testTemp/${repoName}; npm install mocha`),
              },
              {
                title: 'Installing Chai',
                task: () =>
                  execute(`cd testTemp/${repoName}; npm install chai`),
              },
              {
                title: 'Installing SuperTest',
                task: () =>
                  execute(`cd testTemp/${repoName}; npm install supertest`),
              },
            ],
            { concurrent: true }
          );
        },
      },
      {
        title: 'Testing',
        task: () => {
          return new Promise((resolve) => {
            const command = `cd testTemp/${repoName}; mocha --reporter=json`;
            execute(command).then((result) => {
              resolve(res(result));
            });
          });
        },
      },
      {
        title: 'Deleting repository',
        task: () => execute(`rm -rf testTemp/${repoName}`),
      },
    ]);
    console.log(`\nProcessing ${jobId}\n`);
    tasks.run();
  });
};

const workerOptions = {
  client,
  queue: 'testQueue',
  jobSet: 'completedTestJobs',
  jobTitle: 'test',
  timeout: 1,
  handler: test,
  statusKey: 'testingStatus',
};
worker(workerOptions);
