---
{
  "title": "MD5",
  "language": "ja",
  "description": "文字列またはバイナリのMD5 128ビットチェックサムを計算します。"
}
---
## description

文字列またはバイナリのMD5 128ビットチェックサムを計算します。

## Syntax

```sql
MD5( <input> )
```
## パラメータ

| parameter | description |
| -- | -- |
| `<input>` | 計算対象のMD5値、文字列およびバイナリ型を受け付けます |

## 戻り値

文字列のMD5値を返します。

## 例

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
