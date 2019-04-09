require('ts-node').register()

const { parentPort } = require('worker_threads')
import * as fs from 'fs'
import * as path from 'path'
import { Commands } from './common'

const wasmModule = new WebAssembly.Module(
  fs.readFileSync(path.resolve(__dirname, '../../build/optimized.wasm'))
)

let wasmInstance = null

console.log('[worker]: OK')

parentPort.on('message', async event => {
  try {
    console.log('[worker]: ' + event.command)
    switch (event.command) {
      case Commands.INIT:
        wasmInstance = await WebAssembly.instantiate(wasmModule, {
          env: {
            memory: event.data.memory,
          },
        })
        console.log(wasmInstance.exports)
        break
    }
    event.data.port.postMessage('the worker is sending this')
    event.data.port.close()
  } catch (e) {
    console.error(e)
  }
})
