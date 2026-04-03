---
{
  "title": "DROP ANALYZE JOB",
  "description": "指定された統計収集ジョブの履歴を削除します。",
  "language": "ja"
}
---
## 説明

指定された統計収集ジョブの履歴を削除します。

## 構文

```sql
DROP ANALYZE JOB <job_id>
```
# 必須パラメータ

**<job_id>**

> ジョブのIDを指定します。job_idはSHOW ANALYZEを実行することで取得できます。詳細な使用方法については、「SHOW ANALYZE」セクションを参照してください。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 備考 |
| ----------- | ------ | ----- |
| SELECT_PRIV | Table  |       |

## 例

ID 10036の統計情報ジョブレコードを削除する

```sql
DROP ANALYZE JOB 10036
```
