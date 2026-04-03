---
{
  "title": "バックアップをキャンセル",
  "language": "ja",
  "description": "このステートメントは、実行中のBACKUPタスクをキャンセルするために使用されます。"
}
---
## 説明

このステートメントは進行中のBACKUPタスクをキャンセルするために使用されます。

## 構文

```sql
CANCEL BACKUP FROM <db_name>;
```
## パラメータ

**1.`<db_name>`**

バックアップタスクが属するデータベースの名前。

## 例

1. example_db配下のBACKUPタスクをキャンセルする。

```sql
CANCEL BACKUP FROM example_db;
```
