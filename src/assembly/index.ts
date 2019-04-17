import './allocator'
/**
 * Shared context, this will be shared between workers
 */
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

/**
 * Get pixels data
 */
export function getPixels(): Uint8Array {
  return currentContext.pixels
}

export function setPixels(p: Uint8Array): void {
  currentContext.pixels = p
}

/**
 * Local context
 */
class LocalContext {
  var1:i32 = 0;
  constructor(){}
}
export function createLocalContext():LocalContext {
  return new LocalContext()
}
