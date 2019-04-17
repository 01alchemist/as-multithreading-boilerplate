const { parentPort } = require('worker_threads')
const fs = require('fs')
const path = require('path')
const worker = require('../common/worker')

// const target = 'optimized'
const target = 'untouched'

const wasmLibModule = new WebAssembly.Module(
  fs.readFileSync(path.resolve(__dirname, '../../lib/lib.wasm'))
)
const wasmModule = new WebAssembly.Module(
  fs.readFileSync(path.resolve(__dirname, `../../build/${target}.wasm`))
)

worker.configure(wasmLibModule, wasmModule)

parentPort.on('message', async message => {
  worker.handleMessage(message)
})
