const chalk = require('chalk')
const { envInt } = require('./env')
const { Commands, Events, generateMessageId, sleep } = require('./index')

let jobs;
let queue = [];
let workers = []
let numWorker = 0
let numWorkerReady = 0
let numWorkerDone = 0
let numWorkerRunning = 0
let enabled = true
let wasmMemory
let workerParams = null
let startTime = null;
let initializePromise
let startPromise
let sharedSpace = {}
let totalJobs = 0;
let jobsDone = 0;
let iterations = 0
let maxIterations = 1

const maxMemory = envInt('SHARED_MEMORY', 0)

function initialize(numCPU, createWorker, params) {
  wasmMemory = new WebAssembly.Memory({
    initial: maxMemory,
    maximum: maxMemory,
    shared: true,
  })
  
  workerParams = {
    payload: {
      wasmMemory,
      ...params.payload
    },
    transfers: (params.transfers ? params.transfers : []),
  }
  numWorker = numCPU - 1

  return new Promise(async (resolve, reject) => {
    initializePromise = {
      resolve,
      reject
    }
    for (let i = 0; i < numWorker; i++) {
      workers.push(createWorker(i, onWorkerMessage))
    }
    initWorker(0, workerParams)
  })
}

function initWorker(index, params) {
  const worker = workers[index]
  worker.instance.postMessage(
    {
      command: Commands.INIT,
      workerId: index + 1,
      id: generateMessageId(),
      port: worker.subChannel.port1,
      payload: params.payload,
    },
    [...params.transfers, worker.subChannel.port1]
  )
}

function start(_jobs) {
  if (!enabled) {
    return;
  }
  totalJobs = _jobs.length * maxIterations
  console.log(chalk.blue(`Total jobs: ${_jobs.length} x ${maxIterations} = ${totalJobs}`))
  startTime = Date.now();
  jobs = _jobs
  return new Promise(function (resolve, reject) {
    startPromise = {
      resolve, reject
    }
    internalStart()
  })
}

async function internalStart() {
  if (!enabled) {
    return;
  }

  if (queue.length == 0) {
    queue = jobs.sort((a, b) => a.profiler.duration - b.profiler.duration).concat();
    iterations++;
  }
  let promises = [];
  workers.forEach((worker, i) => {
    let job = queue.shift();
    if (job) {
      promises.push(run(job, worker.instance));
      numWorkerRunning++;
    }
  });
  console.log('Started!');

  await Promise.all(promises);
}

async function run(job, worker) {
  if (!enabled) {
    return
  }
  return new Promise(async function (resolve, reject) {
    try {
      job.profiler.start()
      worker.postMessage({ id: generateMessageId(), command: Commands.RUN, payload: { job: { id: job.id, ...job.payload } } })
      job.resolve = resolve
      job.reject = reject
    } catch (e) {
      reject(e)
    }
  })
}

async function onWorkerMessage(message) {
  const { event, payload } = message
  // console.log(`app[main]: message_id=${message.id} event=${event}`)
  switch (event) {
    case Events.INITED: {
      if (payload.sharedSpace) {
        sharedSpace = {
          ...sharedSpace,
          ...payload.sharedSpace
        }
      }
      await sleep(0);
      console.log('############################################################');
      numWorkerReady++
      if (numWorkerReady === numWorker) {
        initializePromise.resolve()
      } else {
        workerParams.payload.sharedSpace = sharedSpace
        initWorker(numWorkerReady, workerParams)
      }
      break
    }

    case Events.FINISHED: {
      numWorkerDone++
      let job = jobs.find(job => job.id === payload.job.id)
      if (job) {
        job.profiler.end()
        job.profiler.print()
        job.done()
        job.resolve()
      }

      console.log(`--> Progress ${++jobsDone}/${totalJobs}`);

      if (numWorkerDone >= numWorkerRunning) {
        numWorkerDone = 0
        numWorkerRunning = 0
        if (iterations > maxIterations) {
          const time = Date.now() - startTime
          console.log(`Finished ${Math.round(time / 1000)}`)
          startPromise.resolve()
          return
        } else {
          internalStart()
        }
      }
      break
    }
  }
}

module.exports = {
  initialize,
  start
}
