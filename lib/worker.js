const { hgetall, brpop, hmset } = require('./redisFunctions');

const parseJobDetails = function (jobDetails) {
  const parsedDetails = Object.keys(jobDetails).reduce((parsed, detail) => {
    return [...parsed, detail, jobDetails[detail]];
  }, []);
  return parsedDetails;
};

const updateJobDetails = function (jobResult, jobTitle) {
  const updatedJobDetails = {
    status: 'completed',
    completedAt: new Date().toJSON(),
  };
  updatedJobDetails[jobTitle] = jobResult;
  return parseJobDetails(updatedJobDetails);
};

const worker = function (client, queue, timeout = 10, jobTitle, handler) {
  brpop(client, queue, timeout)
    .then((jobId) => hmset(client, jobId, ['pickedAt', new Date().toJSON()]))
    .then((jobId) => {
      hgetall(client, jobId)
        .then((job) => handler(job))
        .then((result) => {
          const jobDetails = updateJobDetails(result, jobTitle);
          hmset(client, jobId, jobDetails).then(() => {
            worker(client, queue, jobTitle, timeout, handler);
          });
        });
    })
    .catch(() => worker(client, queue, jobTitle, timeout, handler));
};

module.exports = worker;
