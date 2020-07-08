const http = require('http');

const [, , expectedJobCount, jobType] = process.argv;

const httpGet = function (options) {
  return new Promise((resolve) => {
    http.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
  });
};

const options = {
  hostname: 'localhost',
  port: '4000',
  path: `/complete-job-count/${jobType}`,
};

setInterval(() => {
  httpGet(options).then((actualJobCount) => {
    if (actualJobCount == expectedJobCount) {
      process.exit();
    }
  });
}, 2000);
