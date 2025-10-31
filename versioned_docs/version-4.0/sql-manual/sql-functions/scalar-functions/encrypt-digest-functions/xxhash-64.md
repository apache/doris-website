---
{
    "title": "XXHASH_64",
    "language": "en"
}
---

## Description

Calculates the 64-bit xxhash value of the input string or binary.

-Note: After testing, the performance of `xxhash_64` is about twice that of `murmur_hash3_64`, so when calculating hash values, it is recommended to use `xxhash_64` instead of `murmur_hash3_64`.

## Syntax

```sql
XXHASH_64( <input> [ , <input> ... ] )
```

## Parameters

| parameter | description      |
|-----------|------------------|
| `<input>`   | The 64-bit xxhash value to be calculated, accept string and binary types |

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
SELECT XXHASH_64(vb), XXHASH_64(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+---------------------+---------------------+
| XXHASH_64(vb)       | XXHASH_64(vc)       |
+---------------------+---------------------+
| 8696274497037089104 | 8696274497037089104 |
| 7095089596068863775 | 7095089596068863775 |
|                NULL |                NULL |
+---------------------+---------------------+
```