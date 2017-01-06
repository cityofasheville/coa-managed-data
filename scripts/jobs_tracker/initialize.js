const fs = require('fs');

function initializeJobTracker(workingDirectory, files, jobFileName, init, logger) {
  let jobTracker = {
    startDate: new Date(),
    currentDate: new Date(),
    dependencies: {},
    jobStatus: {},
    sequencedToDo: [],
    freeToDo: [],
    running: [],
  };
  if (init) {
    let fd = fs.openSync(`${workingDirectory}/${jobFileName}`, 'r');
    const jobsDef = JSON.parse(fs.readFileSync(fd, { encoding: 'utf8' }));
    fs.closeSync(fd);

    // Let's just set up the dependencies by job name
    jobsDef.sequencedJobs.forEach((job) => {
      if (!(job.name in jobTracker.dependencies)) {
        jobTracker.dependencies[job.name] = [];
        jobTracker.jobStatus[job.name] = 'Not Started';
        jobTracker.sequencedToDo.push(job);
      }
    });
    jobsDef.freeJobs.forEach((job) => {
      if (!(job.name in jobTracker.dependencies)) {
        jobTracker.dependencies[job.name] = [];
        jobTracker.jobStatus[job.name] = 'Not Started';
        jobTracker.freeToDo.push(job);
      }
    });
    fd = fs.openSync(`${workingDirectory}/jobstatus.json`, 'w');
    fs.writeFileSync(fd, JSON.stringify(jobTracker), { encoding: 'utf8' });
    fs.closeSync(fd);
  } else {
    if (files.indexOf('jobstatus.json') < 0) {
      logger.error(`Unable to find jobstatus.json in jobs directory ${workingDirectory}`);
      process.exit(1);
    }
    const fd = fs.openSync(`${workingDirectory}/jobstatus.json`, 'r');
    jobTracker = JSON.parse(fs.readFileSync(fd, { encoding: 'utf8' }));
    fs.closeSync(fd);
  }

  if (files.indexOf('jobs') < 0) {
    fs.mkdirSync(`${workingDirectory}/jobs`);
  }
  return jobTracker;
}

module.exports = initializeJobTracker;
