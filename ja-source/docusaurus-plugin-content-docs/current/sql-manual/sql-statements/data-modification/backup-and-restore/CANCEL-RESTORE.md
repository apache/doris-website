---
{
  "title": "キャンセル復元",
  "language": "ja",
  "description": "この文は実行中のRESTOREタスクをキャンセルするために使用されます。"
}
---
## 説明

このステートメントは、実行中のRESTOREタスクをキャンセルするために使用されます。

## 構文

```sql
CANCEL [GLOBAL] RESTORE [FROM <db_name>];
```
## Parameters

**1.`<db_name>`**

復旧タスクが属するデータベースの名前。

## Usage Notes

- COMMITまたは復旧のそれ以降の段階でキャンセルが実行された場合、復旧中のテーブルにアクセスできなくなる可能性があります。この場合、復旧ジョブを再度実行することによってのみデータ復旧を実行できます。

## Example

1. example_db配下のRESTOREタスクをキャンセルします。

```sql
CANCEL RESTORE FROM example_db;
```
2. GLOBAL RESTOREタスクをキャンセルします。

```sql
CANCEL GLOBAL RESTORE;
```
