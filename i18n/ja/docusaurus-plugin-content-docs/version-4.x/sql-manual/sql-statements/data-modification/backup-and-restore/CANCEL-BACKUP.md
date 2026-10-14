---
{
    "title": "CANCEL BACKUP",
    "language": "ja",
    "description": "このステートメントは、実行中の BACKUP タスクをキャンセルします。"
}
---

## 説明

このステートメントは、実行中の BACKUP タスクをキャンセルします。

## 構文

```sql
CANCEL BACKUP FROM <db_name>;
```

## パラメータ

**1.`<db_name>`**

バックアップタスクが属するデータベースの名前。

## 例

1. example_db に属する BACKUP タスクをキャンセルします。

```sql
CANCEL BACKUP FROM example_db;
```
