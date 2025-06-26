---
{
    "title": "XXHASH_32",
    "language": "en"
}
---

## Description

Calculate the 32-bit xxhash value of the input string

-Note: When calculating hash values, it is recommended to use `xxhash_32` instead of `murmur_hash3_32`.

## Syntax

```sql
XXHASH_32( <str> [ , <str> ... ] )
```

## Parameters

| parameter | description      |
|-----------|------------------|
| `<str>`   | The 32-bit xxhash value to be calculated |

## Return Value

Returns the 32-bit xxhash value of the input string.

## Examples

```sql
select xxhash_32(NULL), xxhash_32("hello"), xxhash_32("hello", "world");
```

```text
+-----------------+--------------------+-----------------------------+
| xxhash_32(NULL) | xxhash_32('hello') | xxhash_32('hello', 'world') |
+-----------------+--------------------+-----------------------------+
|            NULL |          -83855367 |                  -920844969 |
+-----------------+--------------------+-----------------------------+
```