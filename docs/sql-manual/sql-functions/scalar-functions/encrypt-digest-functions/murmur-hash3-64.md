---
{
    "title": "MURMUR_HASH3_64",
    "language": "en"
}
---

## Description

Calculate 64-bit murmur3 hash value

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