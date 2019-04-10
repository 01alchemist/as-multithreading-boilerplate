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
  MessagePort,
  isMainThread,
  parentPort,
} = require('worker_threads')
const os = require('os')
const { Commands, Events, sleep } = require('./common')

const numWorker = os.cpus().length - 1
let numWorkerReady = 0
let _resolve, _reject
let context = null
let workers = []
let numTasksDone = 0
const tasks = [
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 1, data: [2, 2, 2, 2, 2] },
]
const totalTasks = tasks.length

function createWorker(id) {
  const worker = new Worker(path.resolve(__dirname, './worker.js'))
  const subChannel = new MessageChannel()
  try {
    subChannel.port2.on('message', onWorkerMessage)
    return { id, worker, subChannel: subChannel, busy: true }
  } catch (e) {
    console.error(e)
    throw e
  }
}

async function initWorker(id, context) {
  try {
    const workerInfo = workers[id]
    workerInfo.worker.postMessage(
      {
        command: Commands.INIT,
        id,
        data: {
          port: workerInfo.subChannel.port1,
          memory: workerInfo.wasmMemory,
          context,
        },
      },
      [workerInfo.subChannel.port1]
    )
  } catch (e) {
    console.error(e)
    return reject()
  }
}

async function onWorkerMessage(value) {
  console.log('[main] received:', value)
  const { event, id } = value
  const workerInfo = workers[id]
  switch (event) {
    case Events.INITED:
      numWorkerReady++
      if (value.context) {
        context = value.context
      }
      if (numWorkerReady === numWorker) {
        _resolve()
      } else {
        initWorker(id + 1, context)
      }
      break
    case Events.FINISHED:
      numTasksDone++
      if (numTasksDone === totalTasks) {
        console.log(chalk.green('All tasks done'))
        process.exit(0)
      }
      break
  }
  workerInfo.busy = false
}

async function initialize() {
  console.log('Initializing....')
  const wasmMemory = new WebAssembly.Memory({
    initial: 1,
    maximum: 256,
    shared: true,
  })

  return new Promise(async (resolve, reject) => {
    _resolve = resolve
    _reject = reject
    for (let i = 0; i < numWorker; i++) {
      const workerInfo = createWorker(i)
      workers.push(workerInfo)
    }
    initWorker(0)
  })
}

async function doWork() {
  console.log('Starting tasks....')

  const freeWorkers = workers.filter(({ busy }) => !busy)
  freeWorkers.forEach(workerInfo => {
    workerInfo.busy = true
    workerInfo.worker.postMessage({
      command: Commands.RUN,
      id: workerInfo.id,
      task: tasks.pop(),
    })
  })
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
