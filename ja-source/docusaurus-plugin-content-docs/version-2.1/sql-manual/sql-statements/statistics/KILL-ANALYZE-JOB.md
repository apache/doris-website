---
{
  "title": "KILL ANALYZE JOBの実行",
  "language": "ja",
  "description": "バックグラウンドで実行されている統計情報収集ジョブを停止します。"
}
---
## 説明

バックグラウンドで実行されている統計情報収集ジョブを停止します。

## 構文

```sql
KILL ANALYZE <job_id>
```
## 必須パラメータ

**<job_id>**

> ジョブのidを指定します。ジョブのjob_idはSHOW ANALYZEを使用して取得できます。詳細な使用方法については、「SHOW ANALYZE」の章を参照してください。

## オプションパラメータ

なし

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege (Privilege) | Object (Object) | Notes (Notes) |
| --------------------- | --------------- | ------------- |
| SELECT_PRIV           | Table           |               |

## 使用上の注意

既に実行されたジョブは停止できません。

## 例

idが10036の統計情報ジョブレコードを停止する

```sql
kill analyze 10036
```
