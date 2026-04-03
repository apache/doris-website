---
{
    "title": "MURMUR_HASH3_64_V2",
    "language": "en",
    "description": "Computes a signed 64-bit MurmurHash3 hash value."
}
---

## Description

Computes a singed 64-bit MurmurHash3 hash value. The unsigned version refer to [murmur_hash3_u64_v2](./murmur-hash3-u64-v2.md)

The difference from `MURMUR_HASH3_64` is: this version reuses the 128-bit processing function of MurmurHash3, outputting only the first 64-bit hash value, which is consistent with the [standard library](https://mmh3.readthedocs.io/en/latest/api.html#mmh3.hash64) implementation.

Note: According to testing, the performance of `xxhash_64` is approximately 2 times that of `murmur_hash3_64`. Therefore, when calculating hash values, it is recommended to use `xxhash_64` instead of `murmur_hash3_64`.

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

```sql
-- The function outputs a signed 64-bit integer.
SELECT
    mmhash3_64_v2,
    mmhash3_u64_v2,
    i64_to_ui64 = mmhash3_u64_v2 AS is_equal
FROM (
    SELECT
        murmur_hash3_64_v2('1013199993_1756808272') AS mmhash3_64_v2,
        murmur_hash3_u64_v2('1013199993_1756808272') AS mmhash3_u64_v2,
        CAST(murmur_hash3_64_v2('1013199993_1756808272') AS LARGEINT) & 18446744073709551615 AS i64_to_ui64
) t;
```
```text
+----------------------+----------------------+----------+
| mmhash3_64_v2        | mmhash3_u64_v2       | is_equal |
+----------------------+----------------------+----------+
| -2648103510258542450 | 15798640563451009166 |        1 |
+----------------------+----------------------+----------+
```