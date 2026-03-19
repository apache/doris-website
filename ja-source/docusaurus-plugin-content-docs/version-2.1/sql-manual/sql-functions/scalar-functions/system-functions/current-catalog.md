---
{
  "title": "現在のカタログ",
  "language": "ja",
  "description": "現在のsql client connectionのcatalogを取得する。"
}
---
## 説明

現在のsqlクライアント接続のカタログを取得します。

## 構文

```sql
CURRENT_CATALOG()
```
## 戻り値

現在のsqlクライアント接続のカタログ名。

## 例

```sql
select current_catalog();
```
```text
+-------------------+
| current_catalog() |
+-------------------+
| internal          |
+-------------------+
```
