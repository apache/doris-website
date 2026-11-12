---
{
    "title": "RESUME JOB",
    "language": "ja",
    "description": "PAUSED 状態のジョブを RUNNING 状態に戻します。RUNNING 状態のジョブは、スケジュールされた期間に従って実行されます。"
}
---

## 説明 {#description}

PAUSED 状態のジョブを RUNNING 状態に戻します。RUNNING 状態のジョブは、スケジュールされた期間に従って実行されます。

## 構文 {#syntax}

```sql
RESUME JOB where jobName = <job_name> ;
```
## 必須パラメータ {#required-parameters}

**1. `<job_name>`**
> 復旧タスクの `<job_name>`。

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です：

| 権限 (Privilege) | オブジェクト (Object) | 実行タイプ (ExecuteType) | 備考 (Notes) |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV | データベース | NO Streaming | 現在、この操作の実行には **ADMIN** 権限のみ対応しています |
| LOAD_PRIV | データベース | Streaming | **LOAD** 権限でこの操作を実行できます |

## 例 {#example}

- example という名前のジョブを再開します。

   ```sql
   RESUME JOB where jobName= 'example';
   ```
