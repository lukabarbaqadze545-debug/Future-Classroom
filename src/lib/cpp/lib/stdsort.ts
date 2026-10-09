import { runtimeError } from "../errors";

/**
 * The sorting and heap algorithms of libstdc++ (GCC's standard library), step for step.
 *
 * std::sort is not stable, and when elements compare equal their final order depends
 * on exactly how the algorithm moves them. A program that sorts records by one field
 * must print what g++ prints, so these follow the real code: introsort (quicksort with
 * a median-of-three pivot, heapsort when it goes too deep, insertion sort for the
 * small pieces) and the bottom-up `__adjust_heap` that priority_queue uses.
 */

type Less = (a: any, b: any) => boolean;

const THRESHOLD = 16;

const lg = (n: number): number => 31 - Math.clz32(n);

function bad(): never {
  throw runtimeError("bad-comparator", "the comparison function is not valid: it must return false when two elements are equal (use < instead of <=)", 0);
}

/* ----------------------------------- heaps ----------------------------------- */

function pushHeapAt(a: any[], first: number, hole: number, top: number, value: any, less: Less): void {
  let parent = (hole - 1) >> 1;
  while (hole > top && less(a[first + parent], value)) {
    a[first + hole] = a[first + parent];
    hole = parent;
    parent = (hole - 1) >> 1;
  }
  a[first + hole] = value;
}

function adjustHeap(a: any[], first: number, hole: number, len: number, value: any, less: Less): void {
  const top = hole;
  let child = hole;
  while (child < ((len - 1) >> 1)) {
    child = 2 * (child + 1);
    if (less(a[first + child], a[first + child - 1])) child--;
    a[first + hole] = a[first + child];
    hole = child;
  }
  if ((len & 1) === 0 && child === ((len - 2) >> 1)) {
    child = 2 * (child + 1);
    a[first + hole] = a[first + child - 1];
    hole = child - 1;
  }
  pushHeapAt(a, first, hole, top, value, less);
}

/** std::make_heap on a[first, last). */
export function makeHeap(a: any[], first: number, last: number, less: Less): void {
  const len = last - first;
  if (len < 2) return;
  let parent = (len - 2) >> 1;
  for (;;) {
    adjustHeap(a, first, parent, len, a[first + parent], less);
    if (parent === 0) return;
    parent--;
  }
}

/** std::push_heap: the new element is a[last - 1]. */
export function pushHeap(a: any[], first: number, last: number, less: Less): void {
  pushHeapAt(a, first, last - first - 1, 0, a[last - 1], less);
}

function popHeapTo(a: any[], first: number, last: number, result: number, less: Less): void {
  const value = a[result];
  a[result] = a[first];
  adjustHeap(a, first, 0, last - first, value, less);
}

/** std::pop_heap: the largest goes to a[last - 1]. */
export function popHeap(a: any[], first: number, last: number, less: Less): void {
  if (last - first < 2) return;
  popHeapTo(a, first, last - 1, last - 1, less);
}

export function sortHeap(a: any[], first: number, last: number, less: Less): void {
  while (last - first > 1) {
    last--;
    popHeapTo(a, first, last, last, less);
  }
}

function heapSelect(a: any[], first: number, middle: number, last: number, less: Less): void {
  makeHeap(a, first, middle, less);
  for (let i = middle; i < last; i++) if (less(a[i], a[first])) popHeapTo(a, first, middle, i, less);
}

/** std::partial_sort(first, middle, last). */
export function partialSort(a: any[], first: number, middle: number, last: number, less: Less): void {
  heapSelect(a, first, middle, last, less);
  sortHeap(a, first, middle, less);
}

/* ---------------------------------- introsort ---------------------------------- */

function swap(a: any[], i: number, j: number): void {
  const t = a[i];
  a[i] = a[j];
  a[j] = t;
}

function moveMedianToFirst(a: any[], result: number, x: number, y: number, z: number, less: Less): void {
  if (less(a[x], a[y])) {
    if (less(a[y], a[z])) swap(a, result, y);
    else if (less(a[x], a[z])) swap(a, result, z);
    else swap(a, result, x);
  } else if (less(a[x], a[z])) swap(a, result, x);
  else if (less(a[y], a[z])) swap(a, result, z);
  else swap(a, result, y);
}

function unguardedPartition(a: any[], first: number, last: number, pivot: number, less: Less): number {
  for (;;) {
    while (less(a[first], a[pivot])) {
      first++;
      if (first >= a.length) bad();
    }
    last--;
    while (less(a[pivot], a[last])) {
      last--;
      if (last < 0) bad();
    }
    if (!(first < last)) return first;
    swap(a, first, last);
    first++;
  }
}

function partitionPivot(a: any[], first: number, last: number, less: Less): number {
  const mid = first + ((last - first) >> 1);
  moveMedianToFirst(a, first, first + 1, mid, last - 1, less);
  return unguardedPartition(a, first + 1, last, first, less);
}

function unguardedLinearInsert(a: any[], last: number, less: Less): void {
  const value = a[last];
  let next = last - 1;
  while (less(value, a[next])) {
    a[last] = a[next];
    last = next;
    next--;
    if (next < 0) bad();
  }
  a[last] = value;
}

function insertionSort(a: any[], first: number, last: number, less: Less): void {
  if (first === last) return;
  for (let i = first + 1; i < last; i++) {
    if (less(a[i], a[first])) {
      const value = a[i];
      for (let j = i; j > first; j--) a[j] = a[j - 1];
      a[first] = value;
    } else unguardedLinearInsert(a, i, less);
  }
}

function introsortLoop(a: any[], first: number, last: number, depth: number, less: Less): void {
  while (last - first > THRESHOLD) {
    if (depth === 0) {
      partialSort(a, first, last, last, less);
      return;
    }
    depth--;
    const cut = partitionPivot(a, first, last, less);
    introsortLoop(a, cut, last, depth, less);
    last = cut;
  }
}

function finalInsertionSort(a: any[], first: number, last: number, less: Less): void {
  if (last - first > THRESHOLD) {
    insertionSort(a, first, first + THRESHOLD, less);
    for (let i = first + THRESHOLD; i < last; i++) unguardedLinearInsert(a, i, less);
  } else insertionSort(a, first, last, less);
}

/** std::sort(first, last, comp) on a copy of the elements; returns the sorted array. */
export function stdSort(a: any[], less: Less): any[] {
  if (a.length > 1) {
    introsortLoop(a, 0, a.length, lg(a.length) * 2, less);
    finalInsertionSort(a, 0, a.length, less);
  }
  return a;
}

/** std::nth_element(first, nth, last). */
export function nthElement(a: any[], nth: number, less: Less): any[] {
  let first = 0;
  let last = a.length;
  if (first === last || nth === last) return a;
  let depth = lg(last - first) * 2;
  while (last - first > 3) {
    if (depth === 0) {
      heapSelect(a, first, nth + 1, last, less);
      swap(a, first, nth);
      return a;
    }
    depth--;
    const cut = partitionPivot(a, first, last, less);
    if (cut <= nth) first = cut;
    else last = cut;
  }
  insertionSort(a, first, last, less);
  return a;
}
