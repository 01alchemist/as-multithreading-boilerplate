require('ts-node').register()
const path = require('path')

console.log('[worker.importer]: OK')



const workerFile = path.resolve(
  __dirname,
  __filename.replace('.import.js', '.ts')
)

console.log('[WorkerFile]:' + workerFile)

require(workerFile)
