#!/usr/bin/env ts-node
/**
 * Author : Nidin Vinayakan <01@01alchemist.com>
 */
import launch from './launch-base'
import * as minimist from 'minimist'
import * as path from 'path'
import chalk from 'chalk'

const args = process.argv.slice(2)
const options = minimist(args)

const base = path.resolve(__dirname, '../')
;(async () => {
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
})()
