import { AL_MASK, MAX_SIZE_32 } from 'internal/allocator'

declare function logi(arg: i32): void

var startOffset: usize = (HEAP_BASE + AL_MASK) & ~AL_MASK
var offsetPtr: usize = startOffset
var START_TOP = (HEAP_BASE + 8 + AL_MASK) & ~AL_MASK
var MEMORY_TOP = atomic.load<usize>(offsetPtr)

if (MEMORY_TOP === 0) {
  atomic.store<usize>(offsetPtr, START_TOP)
}

@global @inline export function allocator_get_offset(): usize {
  return atomic.load<usize>(offsetPtr)
}

@global export function __memory_allocate(size: usize): usize {
  if (size) {
    if (size > MAX_SIZE_32) unreachable()
    let currentOffset: usize
    let top: usize
    do {
      currentOffset = allocator_get_offset()
      top = (currentOffset + size + AL_MASK) & ~AL_MASK
      let pagesBefore = memory.size()
      if (top > (<usize>pagesBefore) << 16) {
        let pagesNeeded = ((top - currentOffset + 0xffff) & ~0xffff) >>> 16
        let pagesWanted = max(pagesBefore, pagesNeeded) // double memory
        if (memory.grow(pagesWanted) < 0) {
          if (memory.grow(pagesNeeded) < 0) {
            unreachable() // out of memory
          }
        }
      }
    } while (
      atomic.cmpxchg<usize>(offsetPtr, currentOffset, top) != currentOffset
    )

    return currentOffset
  }
  return 0
}

@global export function __memory_free(ptr: usize): void {
  // Drop it on the floor, for now
  // In the future: figure out the size from the header or other info,
  // add to free list, etc etc.
}

@global export function __memory_reset(): void {
  atomic.store<usize>(offsetPtr, startOffset)
}
