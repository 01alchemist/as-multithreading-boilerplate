// #!/usr/bin/env node
/**
 * Author : Nidin Vinayakan <01@01alchemist.com>
 */
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const {
  Worker,
  MessageChannel,
  MessagePort,
  isMainThread,
  parentPort
} = require("worker_threads");
const os = require("os");
const { Commands, Events, sleep } = require("./common");

const numWorker = os.cpus().length - 1;
let numWorkerReady = 0;
let _resolve, _reject;
let context = null;
let workers = [];
let numTasksDone = 0;
let totalCount = 0;
const tasksBackup = [
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 0, data: [1, 1, 1, 1, 1] },
  { id: 0, data: [2, 2, 2, 2, 2] }
].map(({ data }, i) => ({ id: i, data }));

let tasks = tasksBackup.concat();

const totalTasks = tasks.length;

function createWorker(id) {
  const worker = new Worker(path.resolve(__dirname, "./worker.js"));
  const subChannel = new MessageChannel();
  try {
    subChannel.port2.on("message", onWorkerMessage);
    return { id, worker, subChannel: subChannel, busy: true };
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function initWorker(id, context) {
  try {
    const workerInfo = workers[id];
    workerInfo.worker.postMessage(
      {
        command: Commands.INIT,
        id,
        data: {
          port: workerInfo.subChannel.port1,
          memory: workerInfo.wasmMemory,
          context
        }
      },
      [workerInfo.subChannel.port1]
    );
  } catch (e) {
    console.error(e);
    return reject();
  }
}

async function onWorkerMessage(value) {
  // console.log("[main] received:", value);
  const { event, id } = value;
  const workerInfo = workers[id];
  switch (event) {
    case Events.INITED:
      numWorkerReady++;
      if (value.context) {
        context = value.context;
      }
      if (numWorkerReady === numWorker) {
        _resolve();
      } else {
        initWorker(id + 1, context);
      }
      workerInfo.busy = false;
      break;
    case Events.FINISHED:
      numTasksDone++;
      workerInfo.busy = false;
      if (totalCount === 10) {
        console.log(chalk.green("All tasks done"));
        process.exit(0);
      }
      if (numTasksDone === totalTasks) {
        // console.log(chalk.green("All tasks done"));
        // process.exit(0);
        tasks = tasksBackup.concat();
        numTasksDone = 0;
      }
      if (tasks.length > 0) {
        doWork();
      }
      break;
  }
}

const _1p = 64 * 1024;
const _1mb = 1024 * 1024;
const _1gb = _1mb * 1024;
const _1gp = _1gb / _1p;

async function initialize() {
  console.log("Initializing....");
  const wasmMemory = new WebAssembly.Memory({
    initial: _1gp,
    maximum: _1gp,
    shared: true
  });
  console.log(
    "Memory:",
    (wasmMemory.buffer.byteLength / (1014 * 1014)).toFixed(2) + "mb"
  );
  return new Promise(async (resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
    for (let i = 0; i < numWorker; i++) {
      const workerInfo = createWorker(i);
      workerInfo.wasmMemory = wasmMemory;
      workers.push(workerInfo);
    }
    initWorker(0);
  });
}

async function doWork() {
  const freeWorkers = workers.filter(({ busy }) => !busy);
  // console.log(`Starting tasks.... freeWorkers:${freeWorkers.length}`);
  freeWorkers.forEach(async workerInfo => {
    workerInfo.busy = true;
    // await sleep(1000 + 1000 * Math.random());
    workerInfo.worker.postMessage({
      command: Commands.RUN,
      id: workerInfo.id,
      task: tasks.pop(),
      totalCount: ++totalCount
    });
  });
}

initialize()
  .then(() => doWork())
  .catch(error => {
    console.log(
      `${chalk.bgRed(chalk.white(" ERROR "))} ${chalk.red(
        "Task terminated with error"
      )}`
    );
    console.error(error);
    process.exit(1);
  });
