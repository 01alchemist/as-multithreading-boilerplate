const chalk = require('chalk')

let pixelsPtr = null
let contextPtr = null
let jobs = null

function initialize(params) {
  return createJobs(params)
}

class Profiler {
  constructor() {
    this.startTime = null
    this.duration = null
  }
  start() {
    this.startTime = Date.now()
  }
  end() {
    this.duration = Date.now() - this.startTime
  }
  print() {
    // console.log(chalk.blue(`time: ${this.duration.toFixed(2)}ms`));
  }
}

function createJobs(params) {
  const tileSize = params.tileSize
  jobs = []
  var col = Math.ceil(params.width / tileSize)
  var row = Math.ceil(params.height / tileSize)
  var count = 0
  for (var j = 0; j < row; j++) {
    for (var i = 0; i < col; i++) {
      let job = {
        id: j + '_' + i,
        iterations: 1,
        profiler: params.profiler || new Profiler(),
        payload: {
          samples: 4,
          width: tileSize,
          height: tileSize,
          xoffset: i * tileSize,
          yoffset: j * tileSize,
        },
      }
      job.done = onJobDone.bind(job)
      jobs.push(job)
    }
  }
  return jobs
}

function onJobDone() {
  // console.log('job done')
}

module.exports = {
  initialize,
}
