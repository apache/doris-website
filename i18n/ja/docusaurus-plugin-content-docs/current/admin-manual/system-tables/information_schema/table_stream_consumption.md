---
{
    "title": "table_stream_consumption",
    "language": "ja",
    "description": "ベーステーブルの各パーティションについて、各 Table Stream の消費オフセット、未消費分、最終消費時刻を記録します。"
}
---

## 概要

ベーステーブルの各パーティションについて、各 Table Stream の消費オフセット、未消費分、最終消費時刻を記録します。各行は、一つの Stream の一つの消費単位（ベーステーブルのパーティション）に対応します。使い方については、[Table Stream の詳細](../../../data-operate/incremental/table-stream-advanced#partition-level-consumption-offsets) を参照してください。

## データベース

`information_schema`

## テーブル情報

| カラム | 型 | 説明 |
| :--- | :--- | :--- |
| DB_NAME | varchar(64) | Stream が属するデータベース |
| STREAM_NAME | varchar(64) | Stream の名前 |
| STREAM_ID | bigint | Stream の ID |
| UNIT | varchar(64) | 消費単位。ベーステーブルのパーティション名を指します。明示的なパーティションがないテーブルには、テーブルと同じ名前のパーティションが一つあります |
| CONSUMPTION_STATUS | varchar(64) | そのパーティションで消費済みの位置を示すコミットタイムスタンプ（TSO）。`N/A` は、そのパーティションが一度も消費されていないことを意味します |
| LAG | varchar(64) | パーティションの最新のコミット済み TSO と消費済み TSO の差。`0` は未消費分がないこと、`N/A` はパーティションにデータがあるものの一度も消費されていないことを意味します。TSO の下位 18 ビットは論理カウンターであるため、`LAG` を 262144 で割ると、滞留時間をミリ秒単位で概算できます |
| LAST_CONSUMPTION_TIME | bigint | パーティションが最後に消費された時刻（ミリ秒単位のタイムスタンプ）。`-1` は一度も消費されていないことを意味します |

## 例

```sql
SELECT UNIT, CONSUMPTION_STATUS, LAG, LAST_CONSUMPTION_TIME
FROM information_schema.table_stream_consumption
WHERE DB_NAME = 'demo' AND STREAM_NAME = 'orders_stream'
ORDER BY UNIT;
```

```text
+-----------+--------------------+-----------+-----------------------+
| UNIT      | CONSUMPTION_STATUS | LAG       | LAST_CONSUMPTION_TIME |
+-----------+--------------------+-----------+-----------------------+
| p20260913 | 469041123123200000 | 0         |         1789267206000 |
| p20260914 | 469067681628160003 | 262144000 |         1789351206000 |
| p20260915 | N/A                | 0         |                    -1 |
+-----------+--------------------+-----------+-----------------------+
```
