---
{
  "title": "QUANTILE_UNION",
  "language": "ja",
  "description": "QUANTILEUNION関数は、複数の分位数計算からの中間結果をマージするために使用されます。"
}
---
## 説明

`QUANTILE_UNION`関数は、複数の分位数計算からの中間結果をマージするために使用されます。この関数は通常`QUANTILE_STATE`と組み合わせて動作し、多段階の分位数計算が必要なシナリオで特に有用です。

## 構文

```sql
QUANTILE_UNION(<query_state>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<query_state>` | `TO_QUANTILE_STATE`関数によって生成された中間状態。 |

## 戻り値

さらなる分位数計算に使用できる集約状態を返します。この関数の結果は`QUANTILE_STATE`のままです。

## 例

```sql
-- Create sample table
CREATE TABLE response_times (
    request_id INT,
    response_time DOUBLE,
    region STRING
) DUPLICATE KEY(request_id)
DISTRIBUTED BY HASH(request_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- Insert sample data
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

-- Calculate 50th percentile of response times by region
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
```text
+--------+----------------------+
| region | median_response_time |
+--------+----------------------+
| west   |                35.25 |
| east   |                30.75 |
+--------+----------------------+
```
