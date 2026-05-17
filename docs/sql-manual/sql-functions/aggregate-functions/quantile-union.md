---
{
    "title": "QUANTILE_UNION",
    "language": "en",
    "description": "The QUANTILEUNION function is used to merge multiple intermediate results of quantile calculations."
}
---

## Description

The `QUANTILE_UNION` function is used to merge multiple intermediate results of quantile calculations. This function is usually used together with `QUANTILE_STATE`, especially suitable for scenarios requiring multi-stage quantile calculation.

## Syntax

```sql
QUANTILE_UNION(<query_state>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<query_state>` | The data to be aggregated, type QuantileState supported. |

## Return Value

Returns an aggregation state for further quantile calculation, type QuantileState.
Returns NULL if there is no valid data in the group.

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

Calculate the 50th percentile of response times by region.

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

Returns NULL if there is no valid data in the group.

```text
+--------------------------------------------------------+
| QUANTILE_UNION(TO_QUANTILE_STATE(response_time, 2048)) |
+--------------------------------------------------------+
| NULL                                                   |
+--------------------------------------------------------+
```
