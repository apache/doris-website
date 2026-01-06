---
{
    "title": "MURMUR_HASH3_64_V2",
    "language": "en",
    "description": "Computes a 64-bit MurmurHash3 hash value."
}
---

## Description

Computes a 64-bit MurmurHash3 hash value.

The difference from `MURMUR_HASH3_64` is: this version reuses the 128-bit processing function of MurmurHash3, outputting only the first 64-bit hash value, which is consistent with the [standard library](https://mmh3.readthedocs.io/en/latest/api.html#mmh3.hash64) implementation.

Note: According to testing, the performance of `xxhash_64` is approximately 2 times that of `murmur_hash3_64`. Therefore, when calculating hash values, it is recommended to use `xxhash_64` instead of `murmur_hash3_64`. If better 64-bit MurmurHash3 performance is needed, consider using `murmur_hash3_64`.

## Syntax

```sql
MURMUR_HASH3_64_V2( <str> [ , <str> ... ] )
```

## Parameters

| Parameter | Description                                           |
| --------- | ----------------------------------------------------- |
| `<str>`   | The value to be computed as a 64-bit MurmurHash3 hash |

## Return Value

Returns the 64-bit MurmurHash3 hash value of the input string.

Returns NULL if any parameter is NULL.

## Examples

```sql
select murmur_hash3_64_v2(null), murmur_hash3_64_v2("hello"), murmur_hash3_64_v2("hello", "world");
```

```text
+--------------------------+-----------------------------+--------------------------------------+
| murmur_hash3_64_v2(null) | murmur_hash3_64_v2("hello") | murmur_hash3_64_v2("hello", "world") |
+--------------------------+-----------------------------+--------------------------------------+
|                     NULL |        -3758069500696749310 |                  -662943091231200135 |
+--------------------------+-----------------------------+--------------------------------------+
```