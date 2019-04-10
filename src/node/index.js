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

let workers = []
let numTasksDone = 0
const tasks = [
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 1, data: [2, 2, 2, 2, 2] },
]
const totalTasks = tasks.length

async function initialize() {
  console.log('Initializing....')
  let numReady = 0
  const numCPU = os.cpus().length - 1
  const wasmMemory = new WebAssembly.Memory({
    initial: 1,
    maximum: 256,
    shared: true,
  })

  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < numCPU; i++) {
      const worker = new Worker(path.resolve(__dirname, './worker.js'))
      const subChannel = new MessageChannel()
      try {
        worker.postMessage(
          {
            command: Commands.INIT,
            id: i,
            data: {
              port: subChannel.port1,
              memory: wasmMemory,
            },
          },
          [subChannel.port1]
        )

        subChannel.port2.on('message', value => {
          console.log('[main] received:', value)
          const { event, id } = value
          const workerInfo = workers[id]
          switch (event) {
            case Events.INITED:
              numReady++
              if (numReady === workers.length) {
                resolve()
              }
              break
            case Events.FINISHED:
              if (numTasksDone === totalTasks) {
                console.log(chalk.green('All tasks done'))
              }
              break
          }
          workerInfo.busy = false
        })

        workers.push({ id: i, worker, port: subChannel.port2, busy: true })
        // await sleep()
      } catch (e) {
        console.error(e)
        return reject()
      }
    }
  })
}

async function doWork() {
  console.log('Starting tasks....')

  const freeWorkers = workers.filter(({ busy }) => !busy)
  freeWorkers.forEach(workerInfo => {
    workerInfo.busy = true
    workerInfo.worker.postMessage({
      command: Commands.RUN,
      task: tasks.pop(),
    })
  })
}

initialize()
  .then(doWork)
  .catch(error => {
    console.log(
      `${chalk.bgRed(chalk.white(' ERROR '))} ${chalk.red(
        'Task terminated with error'
      )}`
    )
    console.error(error)
    process.exit(1)
  })
