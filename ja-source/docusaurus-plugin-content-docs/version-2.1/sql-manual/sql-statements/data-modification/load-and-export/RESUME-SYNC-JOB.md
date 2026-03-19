---
{
  "title": "SYNC JOBを再開",
  "language": "ja",
  "description": "データベース内でjobname により中断されているresident data synchronization jobを再開します。再開されると、"
}
---
## 説明

`job_name`によってデータベース内で一時停止されているresident data synchronizationジョブを再開します。再開されると、ジョブは一時停止前の最新位置から継続してデータを同期します。

## 構文

```sql
RESUME SYNC JOB [<db>.]<job_name>
```
## 必須パラメータ

**1. `<job_name>`**

> 再開するデータ同期ジョブの名前を指定します。

## オプションパラメータ
**1. `<db>`**
> `[<db>.]`プレフィックスを使用してデータベースが指定された場合、そのデータベース内でジョブが検索されます。指定されない場合は、現在のデータベースが使用されます。

## アクセス制御要件

任意のユーザーまたはロールがこの操作を実行できます。

## 例

1. `job_name`という名前のデータ同期ジョブを再開します。

   ```sql
   RESUME SYNC JOB `job_name`;
   ```
