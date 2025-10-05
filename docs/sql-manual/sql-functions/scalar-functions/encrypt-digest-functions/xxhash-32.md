---
{
    "title": "XXHASH_32",
    "language": "en"
}
---

## Description

Calculate the 32-bit xxhash value of the input string or binary.

-Note: When calculating hash values, it is recommended to use `xxhash_32` instead of `murmur_hash3_32`.

## Syntax

```sql
XXHASH_32( <input> [ , <input> ... ] )
```

## Parameters

| parameter | description      |
|-----------|------------------|
| `<input>`   | The 32-bit xxhash value to be calculated, accept string and binary types |

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

```sql
-- vb (VarBinary) and vc (VarChar) used the same string during insertion.
SELECT * FROM mysql_catalog.binary_test.binary_test;
```
```text
+------+------------+------+
| id   | vb         | vc   |
+------+------------+------+
|    1 | 0x616263   | abc  |
|    2 | 0x78797A   | xyz  |
|    3 | NULL       | NULL |
+------+------------+------+
```

```sql
SELECT XXHASH_32(vb), XXHASH_32(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+---------------+---------------+
| XXHASH_32(vb) | XXHASH_32(vc) |
+---------------+---------------+
|     852579327 |     852579327 |
|    -242012205 |    -242012205 |
|          NULL |          NULL |
+---------------+---------------+
```