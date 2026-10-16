---
{
    "title": "table_streams",
    "language": "ja",
    "description": "クラスター内のすべての Table Stream の定義と状態を記録します。"
}
---

## 概要

クラスター内のすべての Table Stream の定義と状態を記録します。各行はひとつの Stream に対応します。使い方については、[Table Stream の基本](../../../data-operate/incremental/table-stream)を参照してください。

## データベース

`information_schema`

## テーブル情報

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| DB_NAME | varchar(64) | Stream が属するデータベース |
| STREAM_NAME | varchar(64) | Stream 名 |
| STREAM_ID | bigint | Stream の ID |
| STREAM_TYPE | varchar(64) | Stream の種類。内部テーブルの Stream は `OLAP_TABLE_STREAM` |
| CONSUME_TYPE | varchar(64) | 消費タイプ：`APPEND_ONLY`、`MIN_DELTA`、`DETAIL` |
| STREAM_COMMENT | string | Stream のコメント |
| BASE_TABLE_NAME | varchar(64) | ベーステーブル名 |
| BASE_TABLE_DB | varchar(64) | ベーステーブルが属するデータベース |
| BASE_TABLE_CTL | varchar(64) | ベーステーブルが属するカタログ |
| BASE_TABLE_TYPE | varchar(64) | ベーステーブルの種類 |
| ENABLED | boolean | Stream を利用できるかどうか |
| IS_STALE | boolean | Stream が失効しているかどうか（たとえば、変更レコードが削除され、消費オフセットから読み取れなくなった場合） |
| STALE_REASON | string | 失効した理由。失効していない場合は `N/A` |

## 例

```sql
SELECT STREAM_NAME, CONSUME_TYPE, BASE_TABLE_DB, BASE_TABLE_NAME, ENABLED, IS_STALE, STALE_REASON
FROM information_schema.table_streams
WHERE DB_NAME = 'demo';
```

```text
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| STREAM_NAME   | CONSUME_TYPE | BASE_TABLE_DB | BASE_TABLE_NAME | ENABLED | IS_STALE | STALE_REASON |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| orders_stream | MIN_DELTA    | demo          | orders          |       1 |        0 | N/A          |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
```
