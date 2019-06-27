type MapT = Map<string, string>;
class Segment {
  locked: boolean = false;
  constructor(public map: MapT) {}
}
const addr = 0;
export class Cache {
  lock: i32 = 0;
  map: Map<string, string>;
  // segmentMap: Map<string, i32>;
  // segments: Segment[];
  // constructor(segments: Segment[] = null) {
  //   this.init(segments);
  // }
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
  // init(segments: Segment[] = null): void {
  //   if (segments === null) {
  //     this.segments = [];
  //     for (let i: i32 = 0; i < 16; i++) {
  //       let map = new Map<string, string>();
  //       this.segments[i] = new Segment(map);
  //     }
  //   } else {
  //     this.segments = segments;
  //   }
  // }
  // private get map(): MapT {
  //   let locked = false;
  //   while (!locked) {
  //     for (let i: i32 = 0; i < 16; i++) {
  //       let seg = this.segments[i];
  //       if (!seg.locked) {
  //         // atomic.
  //         return seg.map;
  //       }
  //     }
  //     locked = true;
  //   }
  //   return null;
  // }
  has(key: string): bool {
    return this.map.has(key);
  }
  get(key: string): string {
    let data: string = this.map.get(key);
    return data;
  }
  set(key: string, value: string): void {
    this.map.set(key, value);
  }
}
