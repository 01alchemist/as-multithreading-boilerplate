import './allocator'

class Context {
  pixels: Uint8Array
  constructor() {
    this.pixels = new Uint8Array(10)
  }
}

var currentContext: Context = null
export function createContext(): Context {
  currentContext = new Context()
  return currentContext
}
export function getContext(): Context {
  return currentContext
}
export function setContext(context: Context): Context {
  currentContext = context
  return currentContext
}

export function getPixels(): Uint8Array {
  return currentContext.pixels
}

export function setPixels(p: Uint8Array): void {
  currentContext.pixels = p
}

export function getMemoryOffset(): usize {
  return allocator_get_offset()
}

class Locals {
  var1:i32 = 0;
  constructor(){}
}
export function createLocals():Locals {
  return new Locals()
}
