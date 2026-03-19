---
{
  "title": "DROP JOB",
  "description": "ユーザーがJOBジョブを削除します。ジョブは即座に停止され削除されます。",
  "language": "ja"
}
---
## 説明

ユーザーはJOBジョブを削除します。ジョブは直ちに停止され、削除されます。

## 構文

```sql
DROP JOB where jobName = <job_name> ;
```
## 必須パラメータ

**1. `<job_name>`**
> 削除対象のタスクの`<job_name>`。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object | 注釈 |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Database | 現在この操作を実行するには**ADMIN**権限のみサポートされています |

## 例

- exampleという名前のジョブを削除する。

    ```sql
    DROP JOB where jobName='example';
    ```
