const increment = function (client, key) {
  return new Promise((resolve, reject) => {
    client.incr(key, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const lpush = function (client, key, value) {
  return new Promise((resolve, reject) => {
    client.lpush(key, value, (err) => {
      if (err) return reject(`Unable to push ${value} to ${key} queue`);
      resolve();
    });
  });
};

const hgetall = function (client, key) {
  return new Promise((resolve, reject) => {
    client.hgetall(key, (err, result) => {
      if (err) return reject('Unable to resolve hash of ', key);
      resolve(result);
    });
  });
};

const hmset = function (client, jobId, jobDetails) {
  return new Promise((resolve, reject) => {
    client.hmset(jobId, jobDetails, (err) => {
      if (err) return reject('Unable to create ', jobId);
      resolve(jobId);
    });
  });
};

const brpop = function (client, key, timeout) {
  return new Promise((resolve, reject) => {
    client.brpop(key, timeout, (err, result) => {
      if (err) return reject('Unable to pop from list');
      if (!result) return reject('Unable to pop from list');
      const [, jobId] = result;
      return resolve(jobId);
    });
  });
};

module.exports = { increment, lpush, hmset, hgetall, brpop };
