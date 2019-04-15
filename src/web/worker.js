addEventListener("message", handleMessage, false);

const { parentPort } = require('worker_threads')
const fs = require('fs')
const path = require('path')
const worker = require('../common/worker')

// const target = 'optimized'
const target = 'untouched'

let wasmInstance;
let wasmExp;
let pixels_ptr;
let context_ptr;
let locals_ptr;
let id;

async function onMessageReceived(e) {
    try {
        const data = e.data;

        switch (data.command) {
            case "init": {
                id = data.id;
                const lib = await WebAssembly.instantiate(data.wasmLibModule, {
                    env: {
                        __syscall2: Date.now
                    }
                })
                console.log(lib)
                const instance = await WebAssembly.instantiate(data.wasmModule, {
                    env: {
                        memory: data.memory,
                        abort: function () { },
                    },
                    // lib: lib.exports,
                    JSMath: Math,
                    raytrace: {
                        // id: workerId,
                        logf: f => console.log("float:" + f),
                        logi: i => console.log("int:" + i),
                        'FastMath.cos': lib.exports._cos,
                        'FastMath.sin': lib.exports._sin,
                        'FastMath.random': lib.exports._random,
                    },
                });

                wasmInstance = instance;
                wasmExp = instance.exports;
                if (id == 1) {
                    context_ptr = wasmExp.createContext(data.width, data.height);
                    pixels_ptr = wasmExp.getPixels();
                    locals_ptr = wasmExp.createLocals();
                    postMessage({ event: "inited", context_ptr, pixels_ptr });
                } else {
                    context_ptr = data.context_ptr;
                    wasmExp.setContext(context_ptr);
                    pixels_ptr = wasmExp.getPixels();
                    locals_ptr = wasmExp.createLocals();
                    postMessage({ event: "inited" });
                }
                break;
            }
            case "run": {
                pixels_ptr = wasmExp.getPixels();
                const { job } = data;
                wasmExp.render(locals_ptr, job.samples, job.xoffset, job.yoffset, job.width, job.height);
                postMessage({ event: "done", job, id });
                break;
            }
        }
    } catch(e) {
        console.log(e);
    }
}
