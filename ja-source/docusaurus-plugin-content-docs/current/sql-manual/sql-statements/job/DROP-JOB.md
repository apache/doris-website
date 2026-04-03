---
{
  "title": "DROP JOB",
  "language": "ja",
  "description": "ユーザーがJOBジョブを削除します。ジョブは即座に停止され削除されます。"
}
---
## 説明

ユーザーはJOBジョブを削除します。ジョブは即座に停止され、削除されます。

## 構文

```sql
DROP JOB where jobName = <job_name> ;
```
## 必須パラメータ

**1. `<job_name>`**
> 削除するタスクの`<job_name>`。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege | Object | ExecuteType | Notes |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV | Database | NO Streaming | 現在この操作を実行するには**ADMIN**権限のみをサポート |
| LOAD_PRIV | Database | Streaming |この操作を実行するために**LOAD**権限をサポート |


## 例

- exampleという名前のジョブを削除する。

    ```sql
    DROP JOB where jobName='example';
    ```
