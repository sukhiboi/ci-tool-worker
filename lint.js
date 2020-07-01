const { existsSync } = require('fs');
const { exec } = require('child_process');
const Listr = require('listr');

const cloneRepo = function (cloneUrl) {
  return new Promise((res) => {
    exec(`git clone ${cloneUrl}`, (err, stdout) => {
      if (err) {
        throw new Error(err);
      }
      res(stdout);
    });
  });
};

const checkEslintrc = function (repoName) {
  return new Promise((res, rej) => {
    const isLintFileAvailable = existsSync(`./${repoName}/.eslintrc`);
    if (!isLintFileAvailable) {
      const curlCommand =
        'curl -s https://gist.githubusercontent.com/sukhiboi/a8d7e70398b4317e37cd04b135df243c/raw/084dc3cd1a9f7693354f63260f73a9feec91b70d/.eslintrc >> ./.eslintrc';
      exec(`cd ${repoName}; ${curlCommand}`, (err) => {
        if (err) {
          rej('error while fetching .eslintrc');
        }
        res();
      });
    } else {
      res();
    }
  });
};

const installEslint = function (repoName) {
  return new Promise((res) => {
    exec(`cd ${repoName}; npm install eslint`, (err, stdout) => {
      if (err) {
        throw new Error('unable to install eslint');
      }
      res(stdout);
    });
  });
};

const lint = function (repoName) {
  return new Promise((res) => {
    exec(`cd ${repoName}; eslint *.js`, (err, stdout, stderr) => {
      const eslintReport = { eslint: { warnings: stdout } };
      if (err) {
        eslintReport.eslint = { errors: stderr, warnings: stdout };
      }
      res(eslintReport);
    });
  });
};

const deleteLocalRepo = function (repoName) {
  return new Promise((res) => {
    if (repoName) {
      exec(`rm -rf ${repoName}`, res);
    }
  });
};

const lintRepo = function (payload) {
  return new Promise((res) => {
    const { cloneUrl, repoName, jobId } = payload;
    const tasks = new Listr([
      {
        title: 'cloning repo',
        task: () => cloneRepo(cloneUrl),
      },
      {
        title: 'installing eslint',
        task: () => installEslint(repoName),
      },
      {
        title: 'checking .eslintrc',
        task: () => checkEslintrc(repoName),
      },
      {
        title: 'linting',
        task: () => {
          return new Promise((resolve) => {
            lint(repoName, payload).then((report) => {
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

module.exports = { lintRepo };
