import "./allocator";
import { Cache } from "./cache";

var contextId: i32 = 0;
class Context {
  id: i32;
  cache: Cache;
  constructor() {
    this.id = contextId++;
    this.cache = new Cache();
  }
}

var currentContext: Context = null;
export function createContext(): Context {
  currentContext = new Context();
  return currentContext;
}
export function getContext(): Context {
  return currentContext;
}
export function setContext(context: Context): Context {
  currentContext = context;
  return currentContext;
}
// Cache methods
export function cache_has(key: string): boolean {
  if (currentContext) {
    return currentContext.cache.has(key);
  }
  return false;
}
export function cache_get(key: string): string {
  if (currentContext) {
    return currentContext.cache.get(key);
  }
  return null;
}
export function cache_set(key: string, value: string): void {
  if (currentContext) {
    currentContext.cache.set(key, value);
  }
}
