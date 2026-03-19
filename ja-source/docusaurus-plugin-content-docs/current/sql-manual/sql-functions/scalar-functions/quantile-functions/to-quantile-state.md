---
{
  "title": "TO_QUANTILE_STATE",
  "language": "ja",
  "description": "この関数は数値型をQUANTILESTATE型に変換します。compressionパラメータはオプションであり、[2048, 10000]の範囲で設定できます。"
}
---
## 説明

この関数は数値型を`QUANTILE_STATE`型に変換します。compression パラメータはオプションで、[2048, 10000]の範囲で設定できます。値が大きいほど、後続の分位数近似計算の精度が高くなり、メモリ消費量が増加し、計算時間が長くなります。compression パラメータが指定されていない場合、または値が[2048, 10000]の範囲外に設定されている場合は、デフォルト値の2048で実行されます。

## 構文

```sql
TO_QUANTILE_STATE(<raw_data> <compression>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<raw_data>` | 対象列。|
| `<compression>` | 圧縮閾値。|

## 戻り値

`QUANTILE_STATE`型の変換された列。

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
結果は

```text
+----------+------+--------------------------------------------+
| dt       | id   | quantile_percent(quantile_union(price), 0) |
+----------+------+--------------------------------------------+
| 20220201 |    0 |                                          1 |
| 20220201 |    1 |                                         -1 |
+----------+------+--------------------------------------------+
```
