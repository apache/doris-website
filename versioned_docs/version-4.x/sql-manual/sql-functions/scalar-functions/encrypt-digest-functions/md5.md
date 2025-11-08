---
{
"title": "MD5",
"language": "en"
}
---

## description

Calculates an MD5 128-bit checksum for the string or binary.

## Syntax

```sql
MD5( <input> )
```

## Parameters

| parameter | description |
| -- | -- |
| `<input>` | The MD5 value to be calculated, accept string and binary types |

## Return Value

Returns the MD5 value of a string.

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
SELECT MD5(vb), MD5(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+----------------------------------+----------------------------------+
| MD5(vb)                          | MD5(vc)                          |
+----------------------------------+----------------------------------+
| 900150983cd24fb0d6963f7d28e17f72 | 900150983cd24fb0d6963f7d28e17f72 |
| d16fb36f0911f878998c136191af705e | d16fb36f0911f878998c136191af705e |
| NULL                             | NULL                             |
+----------------------------------+----------------------------------+
```