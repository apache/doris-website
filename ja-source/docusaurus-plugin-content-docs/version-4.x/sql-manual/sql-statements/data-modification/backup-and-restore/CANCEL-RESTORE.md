---
{
  "title": "CANCEL RESTORE",
  "description": "このステートメントは、実行中のRESTOREタスクをキャンセルするために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、実行中のRESTOREタスクをキャンセルするために使用されます。

## 構文

```sql
CANCEL RESTORE FROM <db_name>;
```
## パラメータ

**1.`<db_name>`**

リカバリタスクが属するデータベースの名前。

## Usage 注釈

- キャンセルがCOMITまたはリカバリの後段階付近で行われる場合、リカバリ中のTableにアクセスできなくなる可能性があります。この場合、データリカバリはリカバリジョブを再度実行することによってのみ実行できます。

## Example

1. example_db配下のRESTOREタスクをキャンセルする。

```sql
CANCEL RESTORE FROM example_db;
```
