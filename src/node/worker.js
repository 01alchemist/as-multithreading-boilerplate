const { parentPort } = require('worker_threads')
const fs = require('fs')
const path = require('path')
const { Commands, Events } = require('./common')

const wasmModule = new WebAssembly.Module(
  fs.readFileSync(path.resolve(__dirname, '../../build/optimized.wasm'))
)

let wasmInstance = null
let workerId = null
let port = null;
console.log('[worker]: OK')

parentPort.on('message', async event => {
  try {
    console.log(`[worker-${event.id}]: ${event.command}`)
    switch (event.command) {
      case Commands.INIT:
        workerId = event.id
        port = event.data.port;
        wasmInstance = await WebAssembly.instantiate(wasmModule, {
          env: {
            memory: event.data.memory,
          },
        })
        port.postMessage({ id: workerId, event: Events.INITED })
        break
      case Commands.RUN:
        port.postMessage({ id: workerId, event: Events.FINISHED })
        break
    }
  } catch (e) {
    console.error(e)
  }
})
