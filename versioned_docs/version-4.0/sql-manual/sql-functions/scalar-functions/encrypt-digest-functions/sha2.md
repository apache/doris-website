---
{
"title": "SHA2",
"language": "en"
}
---

## Description

The information is digested using SHA2.

## Syntax

```sql
SHA2( <input>, <digest_length>)
```

## Parameters

| parameter         | description                |
|-------------------|----------------------------|
| `<input>`           | Content to be encrypted, accept string and binary types      |
| `<digest_length>` | Summary length, supports 224, 256, 384, 512. must be constant |

## Return Value

Returns the sha2 value of the input string

## Examples

```sql
select sha2('abc', 224), sha2('abc', 384), sha2(NULL, 512);
```

```text
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
| sha2('abc', 224)                                         | sha2('abc', 384)                                                                                 | sha2(NULL, 512) |
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
| 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 | cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7 | NULL            |
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
```

```SQL
select sha2('abc', 225);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = sha2 functions only support digest length of [224, 256, 384, 512]
```

```SQL
select sha2('str', k1) from str;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = the second parameter of sha2 must be a literal but got: k1
```

```SQL
select sha2(k0, k1) from str;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = the second parameter of sha2 must be a literal but got: k1
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
SELECT SHA2(vb, 224), SHA2(vc, 224) FROM mysql_catalog.binary_test.binary_test;
```
```text
+----------------------------------------------------------+----------------------------------------------------------+
| SHA2(vb, 224)                                            | SHA2(vc, 224)                                            |
+----------------------------------------------------------+----------------------------------------------------------+
| 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 | 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 |
| 30e90f1cd0ceff8eb3dd6a540a605c0666f841d35de63c57e4dd2877 | 30e90f1cd0ceff8eb3dd6a540a605c0666f841d35de63c57e4dd2877 |
| NULL                                                     | NULL                                                     |
+----------------------------------------------------------+----------------------------------------------------------+
```
