#!/usr/bin/env ts-node
/**
 * Author : Nidin Vinayakan <01@01alchemist.com>
 */
const { launch } = require('./launch-base')
const minimist = require('minimist')
const path = require('path')
const chalk = require('chalk')

const args = process.argv.slice(2)
const options = minimist(args)
const base = path.resolve(__dirname, '../')

async function compile() {
  try {
    await launch({
      cwd: options.cwd,
      cmds: [
        'asc',
        ...options._,
        '-b',
        options.o,
        '-t',
        options.o.replace('.wasm', '.wat'),
        // '--importMemory',
        '--sourceMap',
        // '--validate',
        ...(options.sharedMemory
          ? ['--sharedMemory', options.sharedMemory, '--memoryBase 8']
          : []),
        '--enable',
        'threads',
        ...(options.debug ? ['--debug'] : []),
        ...(options.optimize ? ['--optimize'] : []),
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
