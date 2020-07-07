const { exec } = require('child_process');
const { existsSync } = require('fs');
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

const lint = function (githubPayload) {
  return new Promise((res) => {
    const { cloneUrl, jobId, commitSHA } = githubPayload;
    const tasks = new Listr([
      {
        title: 'Creating temporary director',
        task: () => {
          return new Promise((resolve) => {
            execute('mkdir lintTemp').then(resolve).catch(resolve);
          });
        },
      },
      {
        title: 'Clone repository',
        task: () => execute(`cd lintTemp; git clone ${cloneUrl} ${commitSHA}`),
      },
      {
        title: 'Setting up Eslint',
        task: () => {
          return new Listr(
            [
              {
                title: 'Cloning .eslintrc',
                skip: () => {
                  if (existsSync(`./lintTemp/${commitSHA}/.eslintrc`))
                    return '.eslintrc already exists';
                },
                task: () => {
                  const curlCommand =
                    'curl -s https://gist.githubusercontent.com/sukhiboi/a8d7e70398b4317e37cd04b135df243c/raw/084dc3cd1a9f7693354f63260f73a9feec91b70d/.eslintrc';
                  return execute(
                    `${curlCommand} >> ./lintTemp/${commitSHA}/.eslintrc`
                  );
                },
              },
              {
                title: 'Installing Eslint',
                task: () =>
                  execute(`cd lintTemp/${commitSHA}; npm install eslint`),
              },
            ],
            { concurrent: true }
          );
        },
      },
      {
        title: 'Linting',
        task: () => {
          return new Promise((resolve) => {
            const command = `eslint --format json --ignore-pattern 'node_modules/' lintTemp/${commitSHA} --ext .js`;
            execute(command).then((result) => {
              resolve(res(result));
            });
          });
        },
      },
      {
        title: 'Deleting repository',
        task: () => execute(`rm -rf lintTemp/${commitSHA}`),
      },
    ]);
    console.log(`\nProcessing ${jobId}\n`);
    tasks.run();
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
