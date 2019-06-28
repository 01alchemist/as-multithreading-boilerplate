type MapT = Map<string, string>;
const addr = 0;
export class Cache {
  lock: i32 = 0;
  map: Map<string, string>;
  constructor(map: MapT | null = null) {
    this.init(map);
  }
  init(map: MapT | null): void {
    if (map === null) {
      this.map = new Map<string, string>();
    } else {
      this.map = map;
    }
  }
  has(key: string): bool {
    return this.map.has(key);
  }
  get(key: string): string {
    let data: string = this.map.get(key);
    return data;
  }
  set(key: string, value: string): void {
    // lock(addr)
    this.map.set(key, value);
    // unlock(addr)
  }
}
