---
{
    "title": "SHOW CREATE STREAM",
    "language": "ja",
    "description": "Table Stream の CREATE 文を表示します。"
}
---

## 説明

Table Stream の CREATE 文を表示します。この文には、ベーステーブル、コメント、プロパティが含まれます。

## 構文

```sql
SHOW CREATE STREAM [<db_name>.]<stream_name>
```

## 必須パラメータ

**1. `<stream_name>`**
> Stream 名。

## 任意パラメータ

**1. `<db_name>`**
> Stream が属するデータベース。省略した場合は現在のデータベースを使用します。

## 戻り値

| 列名 | 説明 |
|---|---|
| `Stream` | Stream 名 |
| `Create Stream` | CREATE 文 |

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 備考 |
| :-------- | :----- | :---- |
| SHOW_PRIV | Stream | |

## 使用上の注意

通常のテーブルに対してこの文を実行すると失敗し、`SHOW CREATE TABLE` を使用するよう案内されます。ベーステーブルが削除されている場合、`ON TABLE` には `UNKNOWN` と表示されます。

## 例

```sql
SHOW CREATE STREAM orders_stream\G
```

```text
*************************** 1. row ***************************
       Stream: orders_stream
Create Stream: CREATE STREAM `orders_stream`
ON TABLE internal.demo.orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
"type" = "MIN_DELTA",
"show_initial_rows" = "false"
);
```
