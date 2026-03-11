---
{
  "title": "同期ジョブを再開する",
  "description": "データベース内でjobname によって中断されているresident data synchronization jobを再開します。再開されると、",
  "language": "ja"
}
---
## デスクリプション

データベース内で中断されているresident data synchronization jobを`job_name`によって再開します。再開されると、ジョブは中断前の最新の位置からデータの同期を継続します。

## Syntax

```sql
RESUME SYNC JOB [<db>.]<job_name>
```
## 必要なパラメータ

**1. `<job_name>`**

> 再開するデータ同期ジョブの名前を指定します。

## オプションパラメータ
**1. `<db>`**
> `[<db>.]`プレフィックスを使用してデータベースが指定されている場合、そのデータベース内でジョブが検索されます。指定されていない場合は、現在のデータベースが使用されます。


## アクセス制御要件

任意のユーザーまたはロールがこの操作を実行できます。


## 例

1. `job_name`という名前のデータ同期ジョブを再開します。

   ```sql
   RESUME SYNC JOB `job_name`;
   ```
