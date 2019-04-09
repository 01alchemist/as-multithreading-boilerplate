import "./allocator"

var contextId: i32 = 0
class Context {
  id: i32
  constructor() {
    this.id = contextId++;
  }
}
export function createContext(): Context {
  return new Context();
}
