---
{
    "title": "DROP STREAM",
    "language": "ja",
    "description": "Table Stream を削除します。"
}
---

## 説明 {#description}

Table Stream を削除します。Stream を削除しても、ベーステーブルやその変更ログには影響しません。

## 構文 {#syntax}

```sql
DROP STREAM [IF EXISTS] [<db_name>.]<stream_name> [FORCE]
```

## 必須パラメータ {#required-parameters}

**1. `<stream_name>`**
> 削除する Stream。

## オプションパラメータ {#optional-parameters}

**1. `<db_name>`**
> Stream が属するデータベース。省略した場合は現在のデータベースが使用されます。

**2. `IF EXISTS`**
> Stream が存在しない場合もエラーを報告しません。

**3. `FORCE`**
> ごみ箱を経由せずに直接削除します。ベーステーブルが削除された Stream を削除するには `FORCE` が必要です。コンピュートとストレージを分離したモードでは、`FORCE` の指定が必須です。

## アクセス権限の要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
| :-------- | :----- | :---- |
| DROP_PRIV | Stream | |

## 使用上の注意 {#usage-notes}

- Stream に対して `DROP TABLE` を実行すると失敗し、`DROP STREAM` を使用するよう案内されます。
- コンピュートとストレージを分離したモードで `FORCE` を省略すると、`Cloud Table Stream only supports DROP STREAM ... FORCE` というエラーが発生します。
- Stream とともに消費オフセットも削除されます。同じ名前で Stream を再作成した場合は、再作成した時点から消費を開始します。

## 例 {#examples}

```sql
DROP STREAM IF EXISTS orders_stream;
DROP STREAM orders_stream FORCE;
```
