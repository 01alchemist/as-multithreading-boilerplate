const path = require("path");
const chalk = require("chalk");
const fs = require("fs");
const { parentPort } = require("worker_threads");
const fscache = require("./fs-cache");
const { Commands, Events, sleep } = require("./common");

const [moduleName] = ["untouched", "optimized"];
const wasmBytes = fs.readFileSync(
  path.resolve(__dirname, `../../build/${moduleName}.wasm`)
);
// const wasmModule = new WebAssembly.Module(
//   wasmBytes
// );

let wasmInstance = null;
let workerId = null;
let port = null;
let context = null;
let count = 0;
let totalCount = 0;
parentPort.on("message", async event => {
  try {
    // console.log(`[worker-${event.id}]: ${event.command}`);
    totalCount = event.totalCount;
    switch (event.command) {
      case Commands.INIT:
        workerId = event.id;
        port = event.data.port;
        const memory = event.data.memory;
        const { instance: wasmInstance } = await WebAssembly.instantiate(
          wasmBytes,
          {
            index: {
              waiting: () => console.log(` worker [${workerId}] waiting `),
              log: value =>
                console.log(
                  ` worker [${workerId}] ++[${count}]: ${value} / ${totalCount}`
                )
            },
            env: {
              memory,
              abort: (...args) => {}
            }
          }
        );
        if (workerId === 0) {
          context = wasmInstance.exports.createContext();
        } else {
          context = event.data.context;
          wasmInstance.exports.setContext(context);
        }
        fscache.init(wasmInstance.exports);
        console.log(`[worker-${event.id}]: context:${context}`);
        port.postMessage({ id: workerId, event: Events.INITED, context });
        break;
      case Commands.RUN:
        try {
          // Read file
          ++count
          const t1 = Date.now()
          const data = fscache.readFileSync(
            path.resolve(__dirname, "../../test.txt"),
            "utf-8"
          );
          const diff = Date.now() - t1
          console.log(`ReadFileSync[${workerId}]: [${count}] ${diff.toFixed(3)}ms`);
          // console.log(
          //   `####################### data[${workerId}] #######################`
          // );
          // console.log("data:", data);
          // console.log("####################### data #######################");
        } catch (e) {
          console.log(
            `####################### error[${workerId}] #######################`
          );
          console.log(`Error[${workerId}] => `, e);
          console.log("####################### error #######################");
        }
        port.postMessage({ id: workerId, event: Events.FINISHED });
        break;
    }
  } catch (e) {
    console.error(e);
  }
});
