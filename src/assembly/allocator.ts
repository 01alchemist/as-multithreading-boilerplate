/** Number of alignment bits. */
@inline export const AL_BITS: u32 = 3;
/** Number of possible alignment values. */
@inline export const AL_SIZE: usize = 1 << <usize>AL_BITS;
/** Mask to obtain just the alignment bits. */
@inline export const AL_MASK: usize = AL_SIZE - 1;
/** Maximum 32-bit allocation size. */
@inline export const MAX_SIZE_32: usize = 1 << 30; // 1GB

var SATRT_OFFSET: usize = (__heap_base + AL_MASK) & ~AL_MASK;
var OFFSET_PTR: usize = SATRT_OFFSET;
var TOP = (__heap_base + 8 + AL_MASK) & ~AL_MASK;
store<usize>(OFFSET_PTR, TOP);

@global export function __allocator_get_offset(): usize {
  return atomic.load<usize>(OFFSET_PTR);
}

@global export function __allocator_set_offset(oldOffset: usize, newOffset: usize): usize {
  return atomic.cmpxchg<usize>(OFFSET_PTR, oldOffset, newOffset);
}

@global export function __memory_allocate(size: usize): usize {
  if (size) {
    if (size > MAX_SIZE_32) unreachable();
    let currentOffset: usize;
    let top: usize;
    do {
      currentOffset = __allocator_get_offset();
      top = (currentOffset + size + AL_MASK) & ~AL_MASK;
      let pagesBefore = memory.size();
      if (top > (<usize>pagesBefore) << 16) {
        let pagesNeeded = ((top - currentOffset + 0xffff) & ~0xffff) >>> 16;
        let pagesWanted = max(pagesBefore, pagesNeeded); // double memory
        if (memory.grow(pagesWanted) < 0) {
          if (memory.grow(pagesNeeded) < 0) {
            unreachable(); // out of memory
          }
        }
      }
    } while (
      atomic.cmpxchg<usize>(OFFSET_PTR, currentOffset, top) != currentOffset
    );

    return currentOffset;
  }
  return 0;
}

@global export function __memory_free(ptr: usize): void {
  // Drop it on the floor, for now
  // In the future: figure out the size from the header or other info,
  // add to free list, etc etc.
}

@global export function __memory_reset(): void {
  atomic.store<usize>(OFFSET_PTR, SATRT_OFFSET);
}

// Mutex
const SPIN_LOCK_ITER_LIMIT: i32 = 128;

@global export function lock(addr: usize): void {
    var stat = 0;
    for (let i = 0; i < SPIN_LOCK_ITER_LIMIT; i++) {
      stat = atomic.cmpxchg<i32>(addr, 0, 1)
      if (!stat) break;
    }
    if (stat == 1) {
      stat = atomic.xchg<i32>(addr, 2);
    }
    while (stat) {
      atomic.wait<i32>(addr, 0, 2); // <-- not sure about this params
      stat = atomic.xchg<i32>(addr, 2);
    }
}

@global export function unlock(addr: usize): void {
    if (addr == 2) addr = 0;
    else if (atomic.xchg<i32>(m, 0) == 1) return;
    for (let i = 0; i < SPIN_LOCK_ITER_LIMIT; i++) {
      if (addr && atomic.cmpxchg<i32>(addr, 1, 2)) return;
    }
    atomic.notify<i32>(addr, 1);
}
