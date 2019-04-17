const worker = require('../common/worker')

addEventListener("message", worker.handleMessage, false);
