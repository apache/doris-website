---
{
  "title": "ジョブを一時停止",
  "language": "ja",
  "description": "ユーザーがRUNNING状態のジョブを一時停止すると、実行中のタスクが中断され、ジョブの状態がPAUSEDに変更されます。"
}
---
## 説明

ユーザーがRUNNING状態のジョブを一時停止すると、実行中のタスクが中断され、ジョブの状態がPAUSEDに変更されます。停止されたジョブは、RESUME操作によって再開できます。

## 構文

```sql
PAUSE JOB WHERE jobname = <job_name> ;
```
## 必須パラメータ

**1. `<job_name>`**
> 一時停止するジョブの名前。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります:

| Privilege | Object | ExecuteType | Notes |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV | Database | NO Streaming | 現在、この操作を実行するには**ADMIN**権限のみをサポートしています |
| LOAD_PRIV | Database | Streaming | この操作を実行するための**LOAD**権限をサポートしています |

## 例

- exampleという名前のジョブを一時停止する。

   ```sql 
   PAUSE JOB where jobname='example'; 
   ```
