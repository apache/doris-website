---
{
  "title": "QUANTILE_PERCENT",
  "description": "QUANTILEPERCENT関数は、指定された百分率に対する分位数値を計算するために使用されます。",
  "language": "ja"
}
---
## 説明

`QUANTILE_PERCENT`関数は、指定されたパーセンテージに対する分位数値を計算するために使用されます。この関数は2つのパラメータを取ります：quantile_state列とパーセンテージを表す定数の浮動小数点数です。この関数は、指定されたパーセンテージ位置での分位数値を表す浮動小数点数を返します。

## 構文

```sql
QUANTILE_PERCENT(<quantile_state>, <percent>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<quantile_state>` | 対象列。|
| `<percent>` | 対象のパーセント。|

## Return value

分位数を表す`Double`型。

## Example

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
結果は

```text
+----------+------+--------------------------------------------+
| dt       | id   | quantile_percent(quantile_union(price), 0) |
+----------+------+--------------------------------------------+
| 20220201 |    0 |                                          1 |
| 20220201 |    1 |                                         -1 |
+----------+------+--------------------------------------------+
```
