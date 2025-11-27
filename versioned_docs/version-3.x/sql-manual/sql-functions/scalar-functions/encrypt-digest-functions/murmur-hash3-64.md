---
{
    "title": "MURMUR_HASH3_64",
    "language": "en"
}
---

## Description

Calculate 64-bit murmur3 hash value

The difference from `MURMUR_HASH3_64_V2` is: This version is specifically optimized for 64-bit output, with slightly better performance than the v2 version, but is inconsistent with the [standard library](https://mmh3.readthedocs.io/en/latest/api.html#mmh3.hash64) implementation.

-Note: After testing, the performance of `xxhash_64` is about twice that of `murmur_hash3_64`, so when calculating hash values, it is recommended to use `xxhash_64` instead of `murmur_hash3_64`.

## Syntax

```sql
MURMUR_HASH3_64( <str> [ , <str> ... ] )
```

## Parameters

| parameter      | description                                             |
|---------|------------------------------------------------|
| `<str>` | The 64-bit murmur3 hash value to be calculated |

## Return Value

Returns the 64-bit murmur3 hash of the input string.

Returns NULL if any parameter input is NULL.

## Examples

```sql
select murmur_hash3_64(null), murmur_hash3_64("hello"), murmur_hash3_64("hello", "world");
```

```text
+-----------------------+--------------------------+-----------------------------------+
| murmur_hash3_64(NULL) | murmur_hash3_64('hello') | murmur_hash3_64('hello', 'world') |
+-----------------------+--------------------------+-----------------------------------+
|                  NULL |     -3215607508166160593 |               3583109472027628045 |
+-----------------------+--------------------------+-----------------------------------+
```