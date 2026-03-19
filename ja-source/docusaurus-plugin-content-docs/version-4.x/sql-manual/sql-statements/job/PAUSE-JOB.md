---
{
  "title": "ジョブの一時停止",
  "description": "ユーザーがRUNNING状態のジョブを一時停止すると、実行中のタスクが中断され、ジョブの状態がPAUSEDに変更されます。",
  "language": "ja"
}
---
## デスクリプション

ユーザーがRUNNING状態のジョブを一時停止すると、実行中のタスクが中断され、ジョブの状態がPAUSEDに変更されます。停止されたジョブはRESUME操作によって再開できます。

## Syntax

```sql
PAUSE JOB WHERE jobname = <job_name> ;
```
## 必須パラメータ

**1. `<job_name>`**
> 一時停止するジョブの名前。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege | Object | ExecuteType | 注釈 |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV | Database | NO Streaming | 現在、この操作を実行するには**ADMIN**権限のみをサポートしています |
| LOAD_PRIV | Database | Streaming | この操作を実行するために**LOAD**権限をサポートしています |

## 例

- exampleという名前のジョブを一時停止する。

   ```sql 
   PAUSE JOB where jobname='example'; 
   ```
