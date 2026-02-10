---
{
    "title": "MURMUR_HASH3_32",
    "language": "en",
    "description": "Calculate 32-bit murmur3 hash value"
}
---

## Description

Calculate 32-bit murmur3 hash value

-Note: When calculating hash values, it is recommended to use `xxhash_32` instead of `murmur_hash3_32`。

## Syntax

```sql
MURMUR_HASH3_32( <str> [ , <str> ... ] )
```

## Parameters

| parameter | description |
|-----------| -- |
| `<str>`   | The 32-bit murmur3 hash value to be calculated |

## Return Value

Returns the 32-bit murmur3 hash of the input string.

-When the parameter is NULL, it returns NULL

## Examples

```sql
select murmur_hash3_32(null), murmur_hash3_32("hello"), murmur_hash3_32("hello", "world");
```

```text
+-----------------------+--------------------------+-----------------------------------+
| murmur_hash3_32(NULL) | murmur_hash3_32('hello') | murmur_hash3_32('hello', 'world') |
+-----------------------+--------------------------+-----------------------------------+
|                  NULL |               1321743225 |                         984713481 |
+-----------------------+--------------------------+-----------------------------------+
```