# CI-STEP-WORKER

This repo contains the code of a workers which works for the the ci-step system.  
You can visit the repo of ci-step via this link [sukhiboi/ci-tool](https://github.com/sukhiboi/ci-tool)  
You can access the ci-step system via this link [ci-tool](https://ci-step.herokuapp.com)

---

## How to run these workers

There are two kind of workers in this repo

- Linter - Worker which lints the code
- Tester - Worker which test the code

The format of the command is

```bash
    node lib/(tester|linter).js (dev|production)
```

To run tester worker run lib/tester.js  
To run linter worker run lib/linter.js

They both works on 2 kind on environment

- dev - Development. It will work with local redis
- production - Production. It will work with heroku redis ( Careful the url might not be correct because it heroku changes it )

## Tester

---

It will create a temp directory named as 'tempTest' and work there only.  
What all it will do

- Clone the repo
- Install dependencies
- Install mocha, chai, supertest
- Run tests in the repo
- Update the result in the redis

You will be able to see the results in 'test' key when you hit the result url i.e. https://ci-step.herokuapp.com/results/you-job-id

## Linter

---

It will create a temp directory named as 'tempLint' and work there only.  
What all it will do

- Clone the repo
- Install eslint
- Clone .eslintrc if not available
- Perform linting
- Update the result in the redis

You will be able to see the results in 'lint' key when you hit the result url i.e. https://ci-step.herokuapp.com/results/you-job-id

## External Libraries used

---
- #### [Listr](https://www.npmjs.com/package/listr)
- #### [Redis](https://www.npmjs.com/package/redis)
