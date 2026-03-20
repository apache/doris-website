---
{
  "title": "SHOW CREATE LOAD",
  "description": "この文は、インポートジョブの作成文を表示するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、インポートジョブの作成ステートメントを表示するために使用されます。

## 構文

```sql
SHOW CREATE LOAD FOR <load_name>;
```
## Required パラメータ

**`<load_name>`**

> ルーティンimportジョブの名前。

## Access Control Requirements

このSQLコマンドを実行するユーザーは、最低限以下の権限を持つ必要があります：

| Privilege | Object | 注釈 |
| :---------------- | :------------- | :---------------------------- |
| ADMIN/NODE_PRIV | Database | クラスター管理者権限が必要です。 |

## Return Value

指定されたimportジョブの作成ステートメントを返します。

## Examples

- デフォルトデータベース内の指定されたimportジョブの作成ステートメントを表示します。

```sql
SHOW CREATE LOAD for test_load
```
