const fs = require("fs");
let instance, dataView, u8Array;

let strCache = new Map();

const to_wasm_string = str => {
  if (strCache.has(str)) {
    return strCache.get(str);
  }
  const bytes = Buffer.from(str, "utf16le");
  const ptr = instance.__alloc(4 + bytes.length);
  dataView.setUint32(ptr, str.length, true);
  u8Array.set(bytes, ptr + 4);
  strCache.set(str, ptr);
  return ptr;
};
const to_wasm_bytes = bytes => {
  const ptr = instance.__alloc(bytes.length);
  u8Array.set(bytes, ptr);
  return ptr;
};

const to_js_string = ptr => {
  const length = dataView.getUint32(ptr, true);
  const bytes = u8Array.subarray(ptr + 4, ptr + 4 + length * 2);
  const str = Buffer.from(bytes).toString("utf16le");
  return str;
};

const wasmCache = {
  has(key) {
    return to_js_string(instance.cache_has(to_wasm_string(key)));
  },
  get(key) {
    return to_js_string(instance.cache_get(to_wasm_string(key)));
  },
  set(key, value) {
    return instance.cache_set(to_wasm_string(key), to_wasm_string(value));
  }
};

module.exports = {
  init: ({ memory, ...exports }) => {
    dataView = new DataView(memory.buffer);
    u8Array = new Uint8Array(memory.buffer);
    instance = exports;
  },
  readFileSync: (path, encoding) => {
    let cachedData;
    try {
      // if (wasmCache.has(path)) {
        cachedData = wasmCache.get(path);
      // }
      // console.log("cachedData:", cachedData.length);
    } catch (e) {
      // console.log(e);
      cachedData = null;
    }
    if (cachedData) {
      return cachedData;
    } else {
      const content = fs.readFileSync(path, encoding);
      wasmCache.set(path, content);
      return content;
    }
  }
};
