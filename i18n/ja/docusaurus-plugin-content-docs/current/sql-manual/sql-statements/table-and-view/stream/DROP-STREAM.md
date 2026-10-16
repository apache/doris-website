---
{
    "title": "DROP STREAM",
    "language": "ja",
    "description": "テーブルストリームを削除します。"
}
---

## 説明

テーブルストリームを削除します。ストリームを削除しても、ベーステーブルとその Row Binlog には影響しません。

## 構文

```sql
DROP STREAM [IF EXISTS] [<db_name>.]<stream_name> [FORCE]
```

## 必須パラメータ

**1. `<stream_name>`**
> 削除するストリーム。

## 任意パラメータ

**1. `<db_name>`**
> ストリームが属するデータベース。省略すると現在のデータベースが使用されます。

**2. `IF EXISTS`**
> ストリームが存在しない場合もエラーを報告しません。

**3. `FORCE`**
> ごみ箱を経由せずに直接削除します。ベーステーブルが削除されたストリームを削除するには `FORCE` が必要です。コンピュートとストレージを分離したモードでは `FORCE` の指定が必須です。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 備考 |
| :-------- | :----- | :---- |
| DROP_PRIV | ストリーム | |

## 使用上の注意

- ストリームに対して `DROP TABLE` を実行すると失敗し、`DROP STREAM` を使用するよう案内されます。
- コンピュートとストレージを分離したモードで `FORCE` を省略すると、`Cloud Table Stream only supports DROP STREAM ... FORCE` というエラーが発生します。
- ストリームを削除すると、読み取りオフセットも削除されます。同じ名前でストリームを再作成した場合は、再作成時点から読み取りを開始します。

## 例

```sql
DROP STREAM IF EXISTS orders_stream;
DROP STREAM orders_stream FORCE;
```
