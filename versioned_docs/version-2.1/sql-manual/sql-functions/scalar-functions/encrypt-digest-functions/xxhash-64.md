---
{
    "title": "XXHASH_64",
    "language": "en",
    "description": "Calculates the 64-bit xxhash value of the input string"
}
---

## Description

Calculates the 64-bit xxhash value of the input string

-Note: After testing, the performance of `xxhash_64` is about twice that of `murmur_hash3_64`, so when calculating hash values, it is recommended to use `xxhash_64` instead of `murmur_hash3_64`.

## Syntax

```sql
XXHASH_64( <str> [ , <str> ... ] )
```

## Parameters

| parameter | description      |
|-----------|------------------|
| `<str>`   | The 64-bit xxhash value to be calculated |

## Return Value

Returns the 64-bit xxhash value of the input string.

## Examples

```sql
select xxhash_64(NULL), xxhash_64("hello"), xxhash_64("hello", "world");
```

```text
+-----------------+----------------------+-----------------------------+
| xxhash_64(NULL) | xxhash_64('hello')   | xxhash_64('hello', 'world') |
+-----------------+----------------------+-----------------------------+
|            NULL | -7685981735718036227 |         7001965798170371843 |
+-----------------+----------------------+-----------------------------+
```