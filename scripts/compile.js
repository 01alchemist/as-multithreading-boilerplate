#!/usr/bin/env ts-node
/**
 * Author : Nidin Vinayakan <01@01alchemist.com>
 */
const { launch } = require('./launch-base')
const minimist = require('minimist')
const path = require('path')
const chalk = require('chalk')
const { env, envInt } = require('../src/common/env')

const args = process.argv.slice(2)
const options = minimist(args)

const sharedMemory = envInt('SHARED_MEMORY', 0)
const _features = env('ASC_FEATURES', '')
const features = _features.length > 0 ? ['--enable=' + _features] : []
console.log(chalk.green('Enabled features:', _features))

const opt = (options, name, extra = []) =>
  options[name] ? ['--' + name, ...extra] : []

async function compile() {
  try {
    await launch({
      shell: true,
      cwd: options.cwd,
      cmds: [
        'asc',
        ...options._,
        '-b',
        options.o,
        '-t',
        options.o.replace('.wasm', '.wat'),
        '--sourceMap',
        '--validate',
        '--importMemory',
        '--sharedMemory', options.sharedMemory ? options.sharedMemory : sharedMemory,
        ...features,
        ...opt(options, 'debug'),
        ...opt(options, 'optimize'),
      ],
    })
  } catch (e) {
    console.error(
      chalk.bgRed(chalk.white(' FAILED ')) +
      chalk.red(' Task terminated with a non-zero exit code')
    )
    console.error(e)
    process.exit(1)
  }
}

compile()
