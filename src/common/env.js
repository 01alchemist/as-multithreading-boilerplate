const fs = require('fs')

module.exports = {
  loadEnv(baseDir) {
    let envPath = `${baseDir}/env/${process.env.USER}.env`
    if (!fs.existsSync(envPath)) {
      envPath = `${baseDir}/.env`
    }

    console.log(`Loading env vars from: ${envPath}`)
    require('dotenv').config({
      path: envPath,
    })
    return envPath
  },
  env(name, defaultValue = null) {
    const envValue = process.env[name]
    return envValue || defaultValue
  },

  envBool(name, defaultValue = false) {
    const envValue = process.env[name]
    return envValue === 'false'
      ? false
      : Boolean(envValue) || Boolean(defaultValue)
  },
  envInt(name, defaultValue = null) {
    const envValue = process.env[name]
    return envValue ? parseInt(envValue) : defaultValue
  },
  envFloat(name, defaultValue = null) {
    const envValue = process.env[name]
    return envValue ? parseFloat(envValue) : defaultValue
  },
  envJson(name, defaultValue = {}) {
    const envValue = process.env[name]
    return envValue ? JSON.parse(envValue) : defaultValue
  },
}
