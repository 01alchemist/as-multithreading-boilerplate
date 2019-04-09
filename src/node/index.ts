// #!/usr/bin/env ts-node
/**
 * Author : Nidin Vinayakan <01@01alchemist.com>
 */
import * as fs from 'fs'
import * as path from 'path'
import {
  Worker,
  MessageChannel,
  MessagePort,
  isMainThread,
  parentPort,
} from 'worker_threads'
import { Commands } from './common'

const wasmMemory = new WebAssembly.Memory({
  initial: 1,
  maximum: 256,
  shared: true,
})

const worker = new Worker(path.resolve(__dirname, './worker.import.js'))
const subChannel = new MessageChannel()
try {
  worker.postMessage(
    {
      command: Commands.INIT,
      data: {
        port: subChannel.port1,
        memory: wasmMemory,
      },
    },
    [subChannel.port1]
  )
} catch (e) {
  console.error(e)
}

subChannel.port2.on('message', value => {
  console.log('[main] received:', value)
})

setTimeout(() => {}, 10000)
