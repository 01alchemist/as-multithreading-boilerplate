module.exports = {
  Commands: {
    INIT: 'INIT',
    RUN: 'RUN',
  },
  Events: {
    INITED: 'INITED',
    FINISHED: 'FINISHED',
  },
  async sleep(time = 100) {
    return new Promise(resolve => setTimeout(resolve, time))
  },
}
