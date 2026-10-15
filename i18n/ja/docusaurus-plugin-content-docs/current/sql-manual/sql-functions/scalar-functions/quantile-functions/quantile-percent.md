---
{
    "title": "QUANTILE_PERCENT",
    "language": "ja",
    "description": "QUANTILEPERCENT 関数は、指定した割合に対応する分位値を計算します。"
}
---

## 説明

`QUANTILE_PERCENT` 関数は、指定した割合に対応する分位値を計算します。quantile_state 列と、割合を表す浮動小数点の定数をパラメータとして受け取ります。戻り値は、指定した割合の位置にある分位値を表す浮動小数点数です。

## 構文

```sql
QUANTILE_PERCENT(<quantile_state>, <percent>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<quantile_state>` | 対象の列。 |
| `<percent>` | 対象の割合。 |

## 戻り値

分位値を表す `Double` 型の値。

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
