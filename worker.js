const { hgetall, brpop, hmset, sadd } = require('./lib/redisFunctions');

const parseJobDetails = function (jobDetails) {
  const parsedDetails = Object.keys(jobDetails).reduce((parsed, detail) => {
    return [...parsed, detail, jobDetails[detail]];
  }, []);
  return parsedDetails;
};

const getFinalDetails = function (jobResult, jobTitle, statusKey) {
  const updatedJobDetails = {};
  const jobCompletedKey = `${jobTitle}CompletedAt`;
  updatedJobDetails[jobCompletedKey] = new Date().toJSON();
  updatedJobDetails[statusKey] = 'completed';
  updatedJobDetails[jobTitle] = jobResult;
  return parseJobDetails(updatedJobDetails);
};

const getJobDetailsForProcessing = function (jobTitle, statusKey) {
  return [`${jobTitle}StartedAt`, new Date().toJSON(), statusKey, 'processing'];
};

const worker = function (options) {
  const { client, jobSet, jobTitle, timeout, statusKey } = workerOptions;
  brpop(client, options.queue, timeout)
    .then((jobId) => {
      const processingDetails = getJobDetailsForProcessing(jobTitle, statusKey);
      return hmset(client, jobId, processingDetails);
    })
    .then((jobId) => {
      hgetall(client, jobId)
        .then((job) => options.handler(job))
        .then((result) => {
          const jobDetails = getFinalDetails(result, jobTitle, statusKey);
          hmset(client, jobId, jobDetails).then(() => {
            sadd(client, jobSet, jobId).then(() => worker(workerOptions));
          });
        });
    })
    .catch(() => worker(workerOptions));
};

module.exports = worker;
