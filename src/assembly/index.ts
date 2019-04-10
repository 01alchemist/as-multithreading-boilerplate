import './allocator'

var contextId: i32 = 0
class Context {
  id: i32
  constructor() {
    this.id = contextId++
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
