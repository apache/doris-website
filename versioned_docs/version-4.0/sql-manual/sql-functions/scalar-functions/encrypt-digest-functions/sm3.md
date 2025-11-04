---
{
"title": "SM3",
"language": "en"
}
---

## Description

Calculation SM3 256-bit

## Syntax

```sql
SM3( <input> )
```

## Parameters


| parameter | description |
|-----------|-------------|
| `<input>`   | The value of sm3 that needs to be calculated, accept string and binary types  |

## Return Value
Returns the sm3 value of the input string

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
SELECT SM3(vb), SM3(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+------------------------------------------------------------------+------------------------------------------------------------------+
| SM3(vb)                                                          | SM3(vc)                                                          |
+------------------------------------------------------------------+------------------------------------------------------------------+
| 66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0 | 66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0 |
| 869fff440724014a7e086c8b3680f4cfc6a3390670f6e7755a4f0c43c1c31db6 | 869fff440724014a7e086c8b3680f4cfc6a3390670f6e7755a4f0c43c1c31db6 |
| NULL                                                             | NULL                                                             |
+------------------------------------------------------------------+------------------------------------------------------------------+
```