// #!/usr/bin/env node
/**
 * Author : Nidin Vinayakan <01@01alchemist.com>
 */
const chalk = require('chalk')
const { loadEnv } = require('../common/env')
loadEnv('.')
const WorkerManager = require('../common/worker-manager')
const JobManager = require('../common/job-manager')

const params = { tileSize: 64, width: 600, height: 400 }

function createWorker(id, onWorkerMessage) {
  try {
    const worker = new Worker('./worker.js')
    worker.onmessage = onWorkerMessage
    return { id, instance: worker, busy: true }
  } catch (e) {
    console.error(e)
    throw e
  }
}

async function initialize() {
  console.log(chalk.blue('Initializing....'))
  await WorkerManager.initialize(navigator.hardwareConcurrency, createWorker, {
    payload: params,
  })
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
        'Task terminated with error',
      )}`,
    )
    console.error(error)
    process.exit(1)
  })
