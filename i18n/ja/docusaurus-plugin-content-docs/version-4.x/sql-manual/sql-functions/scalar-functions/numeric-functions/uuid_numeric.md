---
{
  "title": "UUID_NUMERIC",
  "description": "LARGEINT型のuuidを返す",
  "language": "ja"
}
---
## 説明

LARGEINT型のuuidを返します

## 構文

```sql
UUID_NUMERIC()
```
## 戻り値

LARGEINT型のuuidを返します。LARGEINTはInt128であることに注意してください。そのため、uuid_numeric()は負の値を生成する可能性があります。

## 例

```sql
select uuid_numeric()
```
```text
+----------------------------------------+
| uuid_numeric()                         |
+----------------------------------------+
| 82218484683747862468445277894131281464 |
+----------------------------------------+
```
