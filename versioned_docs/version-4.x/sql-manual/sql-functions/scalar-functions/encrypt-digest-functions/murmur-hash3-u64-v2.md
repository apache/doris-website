---
{
    "title": "MURMUR_HASH3_U64_V2",
    "language": "en",
    "description": "Computes an unsigned 64-bit MurmurHash3 hash value."
}
---

## Description

Computes an unsigned 64-bit MurmurHash3 hash value, returned as LARGEINT type. The unsigned version refer to [murmur_hash3_64_v2](./murmur-hash3-64-v2.md)

This function reuses the implementation of `MURMUR_HASH3_64_V2` and masks the result to unsigned 64-bit range (0 to 2^64-1), which is consistent with the [standard library](https://mmh3.readthedocs.io/en/latest/api.html#mmh3.hash64) implementation when interpreted as unsigned.

## Syntax

```sql
MURMUR_HASH3_U64_V2( <str> [ , <str> ... ] )
```

## Parameters

| Parameter | Description                                                  |
| --------- | ------------------------------------------------------------ |
| `<str>`   | The String type value to be computed as an unsigned 64-bit MurmurHash3 hash |

## Return Value

Returns the unsigned 64-bit MurmurHash3 hash value of the input string as LARGEINT type.

Returns NULL if any parameter is NULL.

## Examples

```sql
select murmur_hash3_u64_v2(null), murmur_hash3_u64_v2("hello"), murmur_hash3_u64_v2("hello", "world");
```

```text
+----------------------------+-------------------------------+----------------------------------------+
| murmur_hash3_u64_v2(null)  | murmur_hash3_u64_v2("hello")  | murmur_hash3_u64_v2("hello", "world")  |
+----------------------------+-------------------------------+----------------------------------------+
|                       NULL |          14688674573012802306 |                   17783800982478351481 |
+----------------------------+-------------------------------+----------------------------------------+
```


```sql
-- The function outputs an unsigned 64-bit integer.
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
