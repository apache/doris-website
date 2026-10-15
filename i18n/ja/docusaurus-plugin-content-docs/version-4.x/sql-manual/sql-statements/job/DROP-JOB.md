---
{
    "title": "DROP JOB",
    "language": "ja",
    "description": "JOB ジョブを削除します。対象のジョブは直ちに停止され、削除されます。"
}
---

## 説明 {#description}

JOB ジョブを削除します。対象のジョブは直ちに停止され、削除されます。

## 構文 {#syntax}

```sql
DROP JOB where jobName = <job_name> ;
```

## 必須パラメータ {#required-parameters}

**1. `<job_name>`**
> 削除するタスクの `<job_name>`。

## アクセス権限の要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 実行タイプ | 備考 |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV | データベース | 非ストリーミング | 現在、この操作を実行できるのは **ADMIN** 権限を持つユーザーだけです |
| LOAD_PRIV | データベース | ストリーミング | **LOAD** 権限でこの操作を実行できます |


## 例 {#examples}

- example という名前のジョブを削除します。

    ```sql
    DROP JOB where jobName='example';
    ```
