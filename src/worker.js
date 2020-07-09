const chalk = require('chalk');
const { hgetall, brpop, hmset } = require('./../lib/redisFunctions');

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

const printLog = function (message) {
  const prompt = chalk.bold.green(`${new Date().toJSON()} >`);
  console.log(`${prompt} ${chalk.bold(message)}`);
};

const worker = function (options) {
  const { client, jobTitle, timeout, statusKey } = options;
  brpop(client, options.queue, timeout)
    .then((jobId) => {
      const processingDetails = getJobDetailsForProcessing(jobTitle, statusKey);
      return hmset(client, jobId, processingDetails);
    })
    .then((jobId) => {
      printLog(`Started ${jobId}`);
      hgetall(client, jobId)
        .then((job) => options.handler(job))
        .then((result) => {
          const jobDetails = getFinalDetails(result, jobTitle, statusKey);
          hmset(client, jobId, jobDetails).then(() => {
            printLog(`Completed ${jobId}`);
            worker(options);
          });
        });
    })
    .catch(() => worker(options));
};

module.exports = worker;
