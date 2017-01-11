/* eslint-disable no-console */
const logger = require('coa-node-logging').createLogger('JobRunner', null);
const commandLine = require('coa-command-line-args');
const JobRunner = require('./jobrunner/jobrunner');
require('dotenv').config();

const usage = function usage() {
  const usageString = `Usage: ${commandLine.stripPath(process.argv[1])} working_directory`
                    + ' [--parallelLoad=load_points]'
                    + ' [--jobFile=job_file_name]'
                    + ' [--init]';
  console.log(usageString);
};

const args = commandLine.extractOptions(process.argv.slice(2));
if (args.args.length < 1) {
  usage();
  process.exit(1);
}

const loadPoints = ('parallelLoad' in args.options) ? args.options.parallelLoad : 2;
const jobFileName = ('jobFile' in args.options) ? args.options.jobFile : 'etl_jobs.json';
const workingDirectory = args.args[0];

const runner = new JobRunner(workingDirectory, jobFileName, args.options.init, logger);
runner.initializeRun();
runner.harvestRunningJobs();
runner.fillJobQueue(loadPoints);
