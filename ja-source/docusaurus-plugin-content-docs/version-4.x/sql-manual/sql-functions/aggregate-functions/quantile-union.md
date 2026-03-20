---
{
  "title": "QUANTILE_UNION",
  "description": "QUANTILEUNION関数は、分位数計算の複数の中間結果をマージするために使用されます。",
  "language": "ja"
}
---
## 説明

`QUANTILE_UNION`関数は、分位数計算の複数の中間結果をマージするために使用されます。この関数は通常`QUANTILE_STATE`と組み合わせて使用され、特に多段階分位数計算を必要とするシナリオに適しています。

## 構文

```sql
QUANTILE_UNION(<query_state>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<query_state>` | 集約対象のデータ。QuantileState型をサポート。 |

## Return Value

さらなる分位数計算のための集約状態を返します。型はQuantileStateです。
グループ内に有効なデータが存在しない場合はNULLを返します。

## Example

```sql
-- setup
CREATE TABLE response_times (
    request_id INT,
    response_time DOUBLE,
    region STRING
) DUPLICATE KEY(request_id)
DISTRIBUTED BY HASH(request_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO response_times VALUES
(1, 10.5, 'east'),
(2, 15.2, 'east'),
(3, 20.1, 'west'),
(4, 25.8, 'east'),
(5, 30.3, 'west'),
(6, 35.7, 'east'),
(7, 40.2, 'west'),
(8, 45.9, 'east'),
(9, 50.4, 'west'),
(10, 100.6, 'east');
```
```sql
SELECT 
    region,
    QUANTILE_PERCENT(
        QUANTILE_UNION(
            TO_QUANTILE_STATE(response_time, 2048)
        ),
        0.5
    ) AS median_response_time
FROM response_times
GROUP BY region;
```
地域別にレスポンス時間の50パーセンタイルを算出します。

```text
+--------+----------------------+
| region | median_response_time |
+--------+----------------------+
| west   |                35.25 |
| east   |                30.75 |
+--------+----------------------+
```
```sql
SELECT QUANTILE_UNION(TO_QUANTILE_STATE(response_time, 2048))
FROM response_times where response_time is null;
```
グループに有効なデータが存在しない場合はNULLを返します。

```text
+--------------------------------------------------------+
| QUANTILE_UNION(TO_QUANTILE_STATE(response_time, 2048)) |
+--------------------------------------------------------+
| NULL                                                   |
+--------------------------------------------------------+
```
