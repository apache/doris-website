---
{
    "title": "CURRENT_CATALOG",
    "language": "ja",
    "description": "現在の SQL クライアント接続のカタログを取得します。"
}
---

## 説明

現在の SQL クライアント接続のカタログを取得します。

## 構文

```sql
CURRENT_CATALOG()
```

## 戻り値

現在の SQL クライアント接続のカタログ名を返します。

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
