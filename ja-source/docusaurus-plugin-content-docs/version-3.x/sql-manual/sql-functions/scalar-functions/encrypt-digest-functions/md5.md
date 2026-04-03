---
{
  "title": "MD5",
  "description": "文字列のMD5 128ビットチェックサムを計算します",
  "language": "ja"
}
---
## description

文字列のMD5 128ビットチェックサムを計算します

## Syntax

```sql
MD5( <str> )
```
## パラメータ

| parameter | description |
| -- | -- |
| `<str>` | 計算するMD5値 |

## Return Value

文字列のMD5値を返します。

## Examples

```sql
select md5("abc");
```
```text
+----------------------------------+
| md5('abc')                       |
+----------------------------------+
| 900150983cd24fb0d6963f7d28e17f72 |
+----------------------------------+
```
