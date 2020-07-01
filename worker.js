const { lintRepo } = require('./lint');
const redis = require('redis');
const redisConnectionDetails = require('./secret.json');

let redisOptions = redisConnectionDetails.production;
const [, , env] = process.argv;
if (env === 'dev') {
  redisOptions = redisConnectionDetails.dev;
}

const client = redis.createClient(redisOptions);

const getJob = function () {
  const timeout = 1;
  return new Promise((resolve, rej) => {
    client.brpop('queue', timeout, (err, res) => {
      if (err) {
        rej('no job');
      }
      if (res) {
        const [, id] = res;
        resolve(id);
      }
      rej('no job');
    });
  });
};

const updateEslintResults = function (id, result) {
  return new Promise((res, rej) => {
    client.hmset(
      id,
      ['eslint', JSON.stringify(result), 'status', 'completed', 'completedAt', new Date().toJSON()],
      (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      }
    );
  });
};

const serve = function () {
  getJob()
    .then((id) => {
      client.hgetall(id, (err, res) => {
        if (err) {
          console.error('Error while fetching job');
          serve();
        } else {
          lintRepo(res).then((result) => {
            updateEslintResults(id, result).then(() => {
              serve();
            });
          });
        }
      });
    })
    .catch(() => {
      serve();
    });
};

serve();
