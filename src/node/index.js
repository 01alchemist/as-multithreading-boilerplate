// #!/usr/bin/env node
/**
 * Author : Nidin Vinayakan <01@01alchemist.com>
 */
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const {
  Worker,
  MessageChannel,
} = require('worker_threads')
const os = require('os')
const { loadEnv } = require('../common/env')
loadEnv('.');
const WorkerManager = require('../common/worker-manager')
const JobManager = require('../common/job-manager')

const params = { tileSize: 64, width: 600, height: 400 }

function createWorker(id, onWorkerMessage) {
  const worker = new Worker(path.resolve(__dirname, './worker.js'))
  const subChannel = new MessageChannel()
  try {
    subChannel.port2.on('message', onWorkerMessage)
    return { id, instance: worker, subChannel: subChannel, busy: true }
  } catch (e) {
    console.error(e)
    throw e
  }
}

async function initialize() {
  console.log(chalk.blue('Initializing....'))
  await WorkerManager.initialize(os.cpus().length, createWorker, { payload: params })
  // await WorkerManager.initialize(3, createWorker, { payload: params })
  console.log('Initialized')
}

async function doWork() {
  console.log(chalk.blue('Starting tasks....'))
  const jobs = JobManager.initialize(params)
  await WorkerManager.start(jobs)
  console.log(chalk.green('Finished'))
}

initialize()
  .then(() => doWork())
  .catch(error => {
    console.log(
      `${chalk.bgRed(chalk.white(' ERROR '))} ${chalk.red(
        'Task terminated with error'
      )}`
    )
    console.error(error)
    process.exit(1)
  })
