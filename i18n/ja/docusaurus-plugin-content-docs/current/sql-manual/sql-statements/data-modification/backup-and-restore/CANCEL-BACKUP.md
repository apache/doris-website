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
CANCEL [GLOBAL] BACKUP [FROM <db_name>];
```
## パラメータ

**1.`<db_name>`**

バックアップタスクが属するデータベースの名前。

## 例

1. example_db下のBACKUPタスクをキャンセルします。

```sql
CANCEL BACKUP FROM example_db;
```
2. GLOBAL BACKUPタスクをキャンセルします。

```sql
CANCEL GLOBAL BACKUP;
```
