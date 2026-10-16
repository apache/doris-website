---
{
    "title": "CANCEL TASK",
    "language": "ja",
    "description": "CREATE JOB ステートメントで作成された実行中のタスクをキャンセルします。"
}
---

## 説明

CREATE JOB ステートメントで作成された実行中のタスクをキャンセルします。

- タスクは CREATE JOB ステートメントで作成されたものである必要があります。
- タスクは実行中である必要があります。
- この機能はバージョン 2.1.0 以降でサポートされています。

## 構文

```sql
CANCEL TASK WHERE jobName = '<job_name>' AND taskId = '<task_id>';
```
## 必須パラメータ

**<job_name>**

> ジョブ名。文字列型です。

**<task_id>**

> タスク ID。整数型です。tasks テーブル値関数を使用して照会できます。例: SELECT * FROM tasks('type'='insert')。詳細については、「タスクのテーブル値関数」を参照してください。

## アクセス権限の要件

この SQL コマンドを実行するユーザーには、少なくとも ADMIN_PRIV 権限が必要です。

## 例

jobName が 'example'、taskId が 378912 のバックグラウンドタスクをキャンセルします。


```sql
CANCEL TASK WHERE jobName='example' AND taskId=378912
```
