---
{
    "title": "ALTER STREAM",
    "language": "ja",
    "description": "テーブルストリームのコメントを変更します。"
}
---

## 説明

テーブルストリームのコメントを変更します。テーブルストリームの消費タイプ（`type`）と `show_initial_rows` プロパティは、作成後に変更できません。これらを変更するには、ストリームを削除して再作成してください。

## 構文

```sql
ALTER STREAM [<db_name>.]<stream_name> { SET | MODIFY } COMMENT '<comment>'
```

## 必須パラメータ

**1. `<stream_name>`**
> 変更するストリーム。

**2. `<comment>`**
> 新しいコメント。`SET COMMENT` と `MODIFY COMMENT` は同じ意味です。

## 任意パラメータ

**1. `<db_name>`**
> ストリームが属するデータベース。省略した場合は現在のデータベースを使用します。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 備考 |
| :-------- | :----- | :---- |
| ALTER_PRIV | Stream | |

## 使用上の注意

新しいコメントは、`SHOW CREATE STREAM` の出力と、`STREAM_COMMENT` 列（`information_schema.table_streams` テーブル）に表示されます。

## 例

```sql
ALTER STREAM orders_stream SET COMMENT 'sync order changes to dwd';
ALTER STREAM orders_stream MODIFY COMMENT 'sync order changes to dwd, hourly';
```
