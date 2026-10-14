---
{
    "title": "CANCEL RESTORE",
    "language": "ja",
    "description": "このステートメントは、実行中の RESTORE タスクをキャンセルするために使用します。"
}
---

## 説明

このステートメントは、実行中の RESTORE タスクをキャンセルするために使用します。

## 構文

```sql
CANCEL RESTORE FROM <db_name>;
```

## パラメータ

**1.`<db_name>`**

復元タスクが属するデータベースの名前。

## 使用上の注意

- 復元が COMMIT ステージ付近またはそれ以降の段階にあるときにキャンセルすると、復元対象のテーブルにアクセスできなくなる場合があります。その場合、復元ジョブを再度実行することでのみデータを復元できます。

## 例

1. example_db の RESTORE タスクをキャンセルします。

```sql
CANCEL RESTORE FROM example_db;
```
