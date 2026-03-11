---
{
  "title": "RESUME JOB",
  "description": "PAUSED状態のジョブをRUNNING状態に復元します。RUNNING状態のジョブは、スケジュールされた期間に従って実行されます。",
  "language": "ja"
}
---
## デスクリプション

PAUSED状態のジョブをRUNNING状態に復元します。RUNNING状態のジョブは、スケジュールされた期間に従って実行されます。

## Syntax

```sql
RESUME JOB where jobName = <job_name> ;
```
## 必須パラメータ

**1. `<job_name>`**
> リカバリタスクの `<job_name>` です。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object | ExecuteType | 注釈 |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV | Database | NO Streaming | 現在はこの操作を実行するために **ADMIN** 権限のみをサポートしています |
| LOAD_PRIV | Database | Streaming | この操作を実行するために **LOAD** 権限をサポートしています |

## 例

- example という名前のジョブを再開します。

   ```sql
   RESUME JOB where jobName= 'example';
   ```
