---
{
  "title": "SHOW CREATE LOAD",
  "language": "ja",
  "description": "このステートメントは、importジョブの作成ステートメントを表示するために使用されます。"
}
---
## 説明

この文は、インポートジョブの作成文を表示するために使用されます。

## 構文

```sql
SHOW CREATE LOAD FOR <load_name>;
```
## 必須パラメータ

**`<load_name>`**

> ルーチンimportジョブの名前。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege | Object | Notes |
| :---------------- | :------------- | :---------------------------- |
| ADMIN/NODE_PRIV | Database | クラスター管理者権限が必要です。 |

## 戻り値

指定されたimportジョブの作成文を返します。

## 例

- デフォルトデータベースで指定されたimportジョブの作成文を表示します。

```sql
SHOW CREATE LOAD for test_load
```
