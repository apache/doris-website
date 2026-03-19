---
{
  "title": "UUID_NUMERIC",
  "language": "ja",
  "description": "LARGEINT型のuuidを返す"
}
---
## 説明

LARGEINT型のuuidを返す

## 構文

```sql
UUID_NUMERIC()
```
## 戻り値

LARGEINT型のuuidを返します。LARGEINTはInt128であるため、uuid_numeric()は負の値を生成する場合があります

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
