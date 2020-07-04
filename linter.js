const { exec } = require('child_process');
const { existsSync } = require('fs');
const redis = require('redis');
const Listr = require('listr');
const worker = require('./worker');

const [, , env] = process.argv;
const redisOptions = require('./secret.json')[env];
const client = redis.createClient(redisOptions);

const execute = function (command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) return resolve(stdout);
      resolve(stdout);
    });
  });
};

const lint = function (githubPayload) {
  return new Promise((res, rej) => {
    const { cloneUrl, repoName, jobId } = githubPayload;
    const tasks = new Listr([
      {
        title: 'Creating temporary director',
        task: () => {
          return new Promise((resolve, reject) => {
            execute('mkdir lintTemp').then(resolve).catch(resolve);
          });
        },
      },
      {
        title: 'Clone repository',
        task: () => execute(`cd lintTemp; git clone ${cloneUrl}`),
      },
      {
        title: 'Cloning .eslintrc',
        skip: () => {
          if (existsSync(`./lintTemp/${repoName}/.eslintrc`))
            return '.eslintrc already exists';
        },
        task: () => {
          const curlCommand =
            'curl -s https://gist.githubusercontent.com/sukhiboi/a8d7e70398b4317e37cd04b135df243c/raw/084dc3cd1a9f7693354f63260f73a9feec91b70d/.eslintrc';
          return execute(`${curlCommand} >> ./lintTemp/${repoName}/.eslintrc`);
        },
      },
      {
        title: 'Installing Eslint',
        task: () => execute(`cd lintTemp/${repoName}; npm install eslint`),
      },
      {
        title: 'Linting',
        task: () => {
          return new Promise((resolve, reject) => {
            const command = `eslint --format html --ignore-pattern 'node_modules/' lintTemp/${repoName} --ext .js`;
            execute(command).then((result) => {
              resolve(res(result));
            });
          });
        },
      },
      {
        title: 'Deleting repository',
        task: () => execute(`rm -rf lintTemp/${repoName}`),
      },
    ]);
    console.log(`Processing ${jobId}\n`);
    tasks.run();
  });
};

worker(client, 'lintQueue', 1, 'lint', lint);
