const { lintRepo } = require('./lint');
const { testRepo } = require('./testRunner');
const redis = require('redis');
const redisConnectionDetails = require('./secret.json');

let redisOptions = redisConnectionDetails.production;
const [, , workerType, env] = process.argv;
if (env === 'dev') {
  redisOptions = redisConnectionDetails.dev;
}

const processor = workerType === 'linter' ? lintRepo : testRepo;
const queueBroker = workerType === 'linter' ? 'lintQueue' : 'testQueue';
const updateDataCategory = workerType === 'linter' ? 'eslint' : 'test';

const client = redis.createClient(redisOptions);

const getJob = function () {
  const timeout = 1;
  return new Promise((resolve, rej) => {
    client.brpop(queueBroker, timeout, (err, res) => {
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

const updateResults = function (id, result) {
  return new Promise((res, rej) => {
    client.hmset(
      id,
      [
        updateDataCategory,
        result,
        'status',
        'completed',
        'completedAt',
        new Date().toJSON(),
      ],
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

const serve = function (processor) {
  getJob()
    .then((id) => {
      client.hgetall(id, (err, res) => {
        if (err) {
          console.error('Error while fetching job');
          serve(processor);
        } else {
          processor(res).then((result) => {
            updateResults(id, result).then(() => {
              serve(processor);
            });
          });
        }
      });
    })
    .catch(() => {
      serve(processor);
    });
};

serve(processor);
