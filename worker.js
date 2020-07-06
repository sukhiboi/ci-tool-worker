const { hgetall, brpop, hmset, sadd } = require('./lib/redisFunctions');
const { subtractDates } = require('./utils');

const parseJobDetails = function (jobDetails) {
  const parsedDetails = Object.keys(jobDetails).reduce((parsed, detail) => {
    return [...parsed, detail, jobDetails[detail]];
  }, []);
  return parsedDetails;
};

const updateJobDetails = function (jobResult, jobTitle, statusKey) {
  const updatedJobDetails = {};
  const jobCompletedKey = `${jobTitle}CompletedAt`;
  updatedJobDetails[jobCompletedKey] = new Date().toJSON();
  updatedJobDetails[statusKey] = 'completed';
  updatedJobDetails[jobTitle] = jobResult;
  return parseJobDetails(updatedJobDetails);
};

const worker = function (workerOptions) {
  const {
    client,
    queue,
    jobSet,
    jobTitle,
    timeout,
    handler,
    statusKey,
  } = workerOptions;
  brpop(client, queue, timeout)
    .then((jobId) => {
      const startedAt = new Date().toJSON();
      const updateDetails = [`${jobTitle}StartedAt`, startedAt];
      return hmset(client, jobId, [...updateDetails, statusKey, 'processing']);
    })
    .then((jobId) => {
      hgetall(client, jobId)
        .then((job) => {
          const scheduledAtKey = `${jobTitle}ScheduledAt`;
          const waitingTime = subtractDates(startedAt, job[scheduledAtKey]);
          console.log(`Waiting Time - ${waitingTime}`);
          return handler(job);
        })
        .then((result) => {
          const jobDetails = updateJobDetails(result, jobTitle, statusKey);
          hmset(client, jobId, jobDetails).then(() => {
            const startedAtKey = `${jobTitle}StartedAt`;
            const executionTime = subtractDates(startedAt, job[startedAtKey]);
            console.log(`Execution Time - ${executionTime}`);
            sadd(client, jobSet, jobId).then(() => {
              worker(workerOptions);
            });
          });
        });
    })
    .catch(() => worker(workerOptions));
};

module.exports = worker;
