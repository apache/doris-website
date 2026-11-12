---
{
    "title": "RESUME JOB",
    "language": "ja",
    "description": "PAUSED 状態の JOB を RUNNING 状態に戻します。RUNNING 状態の JOB は、スケジュールされた期間に従って実行されます。"
}
---

## 説明 {#description}

PAUSED 状態の JOB を RUNNING 状態に戻します。RUNNING 状態の JOB は、スケジュールされた期間に従って実行されます。

## 構文 {#syntax}

```sql
RESUME JOB where jobName = <job_name> ;
```
## 必須パラメータ {#required-parameters}

**1. `<job_name>`**
> リカバリタスクの `<job_name>`。

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーは、少なくとも次の権限を持っている必要があります。

| 権限 | オブジェクト | ExecuteType | 注記 |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV | データベース | NO Streaming | 現在、この操作の実行には **ADMIN** 権限のみがサポートされています |
| LOAD_PRIV | データベース | Streaming | **LOAD** 権限でこの操作を実行できます |

## 例 {#example}

- example という名前の JOB を再開します。

   ```sql
   RESUME JOB where jobName= 'example';
   ```
