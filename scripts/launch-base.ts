// tslint:disable
const path = require('path')
const minimist = require('minimist')
const spawn = require('child_process').spawn
const fs = require('fs')
const baseDir = path.resolve(__dirname, '../')
let envPath = `${baseDir}/env/${process.env.USER}.env`
if (!fs.existsSync(envPath)) {
  envPath = `${baseDir}/.env`
}

export const EnvFile = envPath

console.log(`Loading env vars from: ${envPath}`)
require('dotenv').config({
  path: envPath,
})

export default async function launch(options?) {
  options = options || minimist(process.argv.slice(2))
  if (options.env) {
    const env =
      options.env instanceof Array ? options.env : options.env.split(',')
    env.forEach(element => {
      const [key, value] = element.split('=')
      const isReference = value.indexOf('process.env.') > -1
      process.env[key] = isReference ? process.env[value.slice(12)] : value
    })
  }
  const cmds =
    options.cmds ||
    process.argv.slice(2).filter(arg => arg.indexOf('--cwd') === -1)
  const cwd = baseDir + (options.cwd ? '/' + options.cwd : '/')

  if (!options.silent) {
    console.log(
      '###############################################################################################################'
    )
    console.log('#  🚀  Launching   : ' + cmds.join(' '))
    console.log('#  📂  CWD         : ' + cwd)
    console.log(
      '###############################################################################################################'
    )
  }
  const stdio = options.stdio !== undefined ? options.stdio : 'inherit'
  const instance = spawn(cmds[0], cmds.slice(1), {
    stdio,
    cwd,
    shell: options.shell !== undefined ? options.shell : true,
  })
  instance.name = cmds[0]

  function exit(code) {
    if (instance) {
      console.log('')
      process.removeListener('SIGINT', exit)
      if (stdio !== 'inherit') {
        instance.kill('SIGINT')
      }
    }
  }

  process.on('SIGINT', <any>exit)

  return new Promise(function(resolve, reject) {
    let lastData = ''
    let lastErrorData = ''
    if (stdio !== 'inherit' && instance.stdout) {
      instance.stdout.on('data', function(data) {
        lastData = data.toString()
      })
      if (instance.stderr) {
        instance.stderr.on('data', function(data) {
          lastErrorData = data.toString()
        })
      }
    }
    instance.on('close', async code => {
      if (!options.dontExit) {
        console.log(`[${instance.name}] exit code:${code}`)
        process.exit(code)
      } else {
        console.log(`[${instance.name}] exit code:${code}`)
        code == 0 ? resolve(lastData) : reject(lastErrorData)
      }
    })
  })
}
