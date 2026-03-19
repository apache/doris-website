---
{
  "title": "JOBを再開",
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
> リカバリタスクの`<job_name>`。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege | Object | 注釈 |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Database | 現在この操作を実行するには**ADMIN**権限のみサポートされています |

## 例

- exampleという名前のジョブを再開する。

   ```sql
   RESUME JOB where jobName= 'example';
   ```
