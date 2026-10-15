---
{
    "title": "DROP ANALYZE JOB",
    "language": "ja",
    "description": "指定した統計情報収集ジョブの履歴を削除します。"
}
---

## 説明

指定した統計情報収集ジョブの履歴を削除します。

## 構文

```sql
DROP ANALYZE JOB <job_id>
```

# 必須パラメータ

**<job_id>**

> ジョブの ID を指定します。job_id は SHOW ANALYZE を実行して取得できます。詳しい使い方については、「SHOW ANALYZE」のセクションを参照してください。

## アクセス制御の要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
| ----------- | ------ | ----- |
| SELECT_PRIV | テーブル |       |

## 例

ID が 10036 の統計情報収集ジョブのレコードを削除します。

```sql
DROP ANALYZE JOB 10036
```
