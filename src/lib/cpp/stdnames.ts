/** Names of the standard library the runner knows, grouped by what the parser and the checker need to know about them. */

/** Class templates of the standard library (written with `<…>`). */
export const STD_TEMPLATES = new Set([
  "vector", "map", "set", "multiset", "multimap", "unordered_map", "unordered_set", "unordered_multimap", "unordered_multiset", "pair", "tuple", "array", "stack",
  "queue", "deque", "priority_queue", "bitset", "function", "less", "greater", "less_equal", "greater_equal", "equal_to", "not_equal_to", "numeric_limits", "initializer_list",
  "list", "forward_list", "optional", "unique_ptr", "shared_ptr", "reference_wrapper", "plus", "minus", "multiplies", "divides", "modulus",
]);

/** Function templates that are sometimes written with explicit arguments: `max<int>(a, b)`. */
export const STD_FUNCTION_TEMPLATES = new Set(["max", "min", "swap", "get", "make_pair", "make_tuple", "abs", "accumulate", "tie", "move", "forward", "make_unique", "make_shared"]);

/** Non-template types of the standard library. */
export const STD_PLAIN_TYPES = new Set(["string", "ostream", "istream", "ios", "ios_base", "streamsize", "size_type", "wstring", "string_view", "nullptr_t", "ptrdiff_t", "ofstream", "ifstream", "stringstream", "istringstream", "ostringstream"]);

/** Types that are in the global namespace as well (no `std::` needed). */
export const GLOBAL_TYPES = new Set([
  "size_t", "int8_t", "int16_t", "int32_t", "int64_t", "uint8_t", "uint16_t", "uint32_t", "uint64_t", "intptr_t", "uintptr_t", "ptrdiff_t", "wchar_t", "time_t", "clock_t",
]);
