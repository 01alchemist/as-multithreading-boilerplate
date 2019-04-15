const { Commands, Events, generateMessageId } = require('./common')

let port = self;
let wasmInstance = null
let wasmExports = null
let workerId
let port = null
let sharedSpace = null
let localsPtr = null
let wasmModule = null;
let wasmLibModule = null;

module.exports = {
  configure(_wasmLibModule, _wasmModule) {
    wasmLibModule = _wasmLibModule
    wasmModule = _wasmModule
  },
  handleMessage(message) {
    try {
      if (workerId === undefined && message.workerId !== undefined) {
        workerId = message.workerId
      }
      // console.log(`app[worker.${workerId}]: message_id=${message.id} command=${message.command}`)
      const payload = message.payload
      switch (message.command) {
        case Commands.INIT:
          if (message.port) {
            port = message.port
          }

          if(payload.wasmLibModule){

          }

          const lib = await WebAssembly.instantiate(wasmLibModule, {
            env: {
              __syscall2: Date.now
            }
          })
          wasmInstance = await WebAssembly.instantiate(wasmModule, {
            env: {
              memory: payload.wasmMemory,
              abort: function () { },
            },
            JSMath: Math,
            allocator: {
              logi: i => console.log(" [wasm] ----> " + i)
            },
            raytrace: {
              id: workerId,
              logf: f => console.log("float:" + f),
              logi: i => console.log("int:" + i),
              'FastMath.cos': lib.exports._cos,
              'FastMath.sin': lib.exports._sin,
              'FastMath.random': lib.exports._random,
            },
          });
          wasmExports = wasmInstance.exports;

          if (workerId === 1) {
            wasmExports.seedRandom(Math.random());
            const contextPtr = wasmExports.createContext(payload.width, payload.height);
            const pixelsPtr = wasmExports.getPixels();
            localsPtr = wasmExports.createLocals();

            sharedSpace = { contextPtr, pixelsPtr }

            port.postMessage({
              id: generateMessageId(),
              workerId, event: Events.INITED,
              payload: { sharedSpace }
            })
          } else {
            const contextPtr = payload.sharedSpace.contextPtr;
            wasmExports.setContext(contextPtr);
            const pixelsPtr = wasmExports.getPixels();
            localsPtr = wasmExports.createLocals();

            sharedSpace = { contextPtr, pixelsPtr }

            console.log(sharedSpace);

            port.postMessage({
              id: generateMessageId(),
              workerId, event: Events.INITED,
              payload: { sharedSpace }
            })
          }

          break
        case Commands.RUN:
          const job = payload.job
          wasmExports.render(localsPtr, job.samples, job.xoffset, job.yoffset, job.width, job.height);
          debugger
          port.postMessage({ id: generateMessageId(), workerId, event: Events.FINISHED, payload })
          break
      }
    } catch (e) {
      console.error(e)
    }
  }
}
