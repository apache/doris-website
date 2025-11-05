---
{
"title": "SHA1",
"language": "en"
}
---

## Description

Use the SHA1 algorithm to digest the information.

## Alias
SHA

## Syntax

``` sql
SHA1( <input> )
```

## Parameters

| parameter | description         |
|-----------|-------------|
| `<input>`   | The sha1 value to be calculated, accept string and binary types |

## Return Value

Returns the sha1 value of the input string


## Examples

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
SELECT SHA1(vb), SHA1(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+------------------------------------------+------------------------------------------+
| SHA1(vb)                                 | SHA1(vc)                                 |
+------------------------------------------+------------------------------------------+
| a9993e364706816aba3e25717850c26c9cd0d89d | a9993e364706816aba3e25717850c26c9cd0d89d |
| 66b27417d37e024c46526c2f6d358a754fc552f3 | 66b27417d37e024c46526c2f6d358a754fc552f3 |
| NULL                                     | NULL                                     |
+------------------------------------------+------------------------------------------+
```