---
{
    "title": "TO_QUANTILE_STATE",
    "language": "ja",
    "description": "数値型を QUANTILESTATE 型に変換します。compression パラメータは省略可能で、範囲 [2048, 10000] の値を設定できます。"
}
---

## 説明

数値型を `QUANTILE_STATE` 型に変換します。compression パラメータは省略可能で、範囲 [2048, 10000] の値を設定できます。値を大きくすると、その後の分位値の近似計算の精度が上がる一方、メモリ使用量と計算時間も増えます。パラメータを省略した場合、または [2048, 10000] の範囲外の値を指定した場合は、デフォルト値の 2048 で実行します。

## 構文

```sql
TO_QUANTILE_STATE(<raw_data>, <compression>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<raw_data>` | 対象の列。 |
| `<compression>` | 圧縮のしきい値。 |

## 戻り値

変換後の `QUANTILE_STATE` 型の列。

## 例

```sql
CREATE TABLE IF NOT EXISTS quantile_state_agg_test (
         `dt` int(11) NULL COMMENT "",
         `id` int(11) NULL COMMENT "",
         `price` quantile_state QUANTILE_UNION NOT NULL COMMENT ""
        ) ENGINE=OLAP
        AGGREGATE KEY(`dt`, `id`)
        COMMENT "OLAP"
        DISTRIBUTED BY HASH(`dt`) BUCKETS 1
        PROPERTIES ("replication_num" = "1");

INSERT INTO quantile_state_agg_test VALUES(20220201,0, to_quantile_state(1, 2048));

INSERT INTO quantile_state_agg_test VALUES(20220201,1, to_quantile_state(-1, 2048)),
            (20220201,1, to_quantile_state(0, 2048)),(20220201,1, to_quantile_state(1, 2048)),
            (20220201,1, to_quantile_state(2, 2048)),(20220201,1, to_quantile_state(3, 2048));

SELECT dt, id, quantile_percent(quantile_union(price), 0) FROM quantile_state_agg_test GROUP BY dt, id ORDER BY dt, id
```

結果:

```text
+----------+------+--------------------------------------------+
| dt       | id   | quantile_percent(quantile_union(price), 0) |
+----------+------+--------------------------------------------+
| 20220201 |    0 |                                          1 |
| 20220201 |    1 |                                         -1 |
+----------+------+--------------------------------------------+
```
