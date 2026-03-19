---
{
  "title": "タスクをキャンセル",
  "language": "ja",
  "description": "CREATE JOB文で作成された実行中のタスクをキャンセルします。"
}
---
## 説明

CREATE JOB文で作成された実行中のタスクをキャンセルします。

- タスクはCREATE JOB文で作成されている必要があります。
- 実行中のタスクである必要があります。
- この機能はバージョン2.1.0からサポートされています。

## 構文

```sql
CANCEL TASK WHERE jobName = '<job_name>' AND taskId = '<task_id>';
```
## 必須パラメータ

**<job_name>**

> ジョブの名前、string型。

**<task_id>**

> タスクID、integer型。tasksテーブル値関数を通じてクエリできます。例：SELECT * FROM tasks('type'='insert')。詳細については、「taskテーブル値関数」を参照してください。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくともADMIN_PRIV権限を持つ必要があります。

## 例

jobName 'example'、taskId 378912のバックグラウンドタスクをキャンセルします。

```sql
CANCEL TASK WHERE jobName='example' AND taskId=378912
```
