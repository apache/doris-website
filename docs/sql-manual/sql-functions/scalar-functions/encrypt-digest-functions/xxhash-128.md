---
{
    "title": "XXHASH_128",
    "language": "en",
    "description": "Calculate the 128-bit xxhash value of the input string or binary."
}
---

## Description

Calculate the 128-bit xxhash value of the input string or binary.

## Syntax

```sql
XXHASH_128( <input> [ , <input> ... ] )
```

## Parameters

| parameter | description      |
|-----------|------------------|
| `<input>`   | The 128-bit xxhash value to be calculated, accept string and binary types |

## Return Value

Returns the 128-bit xxhash value of the input string.

## Examples

```sql
select xxhash_128(NULL), xxhash_128("hello"), xxhash_128("hello", "world");
```

```text
+------------------+-----------------------------------------+----------------------------------------+
| xxhash_128(NULL) | xxhash_128("hello")                     | xxhash_128("hello", "world")           |
+------------------+-----------------------------------------+----------------------------------------+
| NULL             | -98478366302105124680504504609445627880 | -9508340982777299797928774324431085410 |
+------------------+-----------------------------------------+----------------------------------------+
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
SELECT XXHASH_128(vb), XXHASH_128(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+-----------------------------------------+-----------------------------------------+
| XXHASH_128(vb)                          | XXHASH_128(vc)                          |
+-----------------------------------------+-----------------------------------------+
|   8891052093862885505146213044715469136 |   8891052093862885505146213044715469136 |
| -14492046026574147306325126754808553697 | -14492046026574147306325126754808553697 |
|                                    NULL |                                    NULL |
+-----------------------------------------+-----------------------------------------+
```

