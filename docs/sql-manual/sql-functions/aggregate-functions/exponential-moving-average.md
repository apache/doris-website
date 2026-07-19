---
{
    "title": "EXPONENTIAL_MOVING_AVERAGE",
    "language": "en",
    "description": "Computes the exponentially smoothed moving average over time-indexed values with a given half-decay period."
}
---

## Description

Computes the exponentially smoothed moving average over time-indexed values. The `half_decay` parameter controls the half-life period: the time after which the exponential weight of a past value decays by a factor of 1/2.

The exponential moving average gives more weight to recent observations, with weights decaying exponentially as time passes. This function is particularly useful for smoothing noisy time-series data and detecting trends.

The algorithm works as follows:

- Each value is assigned a weight of `2^(-dt / half_decay)`, where `dt` is the time difference between that value and the latest time point.
- The result is the weighted sum divided by the sum of weights under the assumption of unit-spaced time points: `1 / (1 - 2^(-1 / half_decay))`.
- The function is commutative and associative, making it suitable for distributed aggregation.

## Syntax

```sql
EXPONENTIAL_MOVING_AVERAGE(<half_decay>, <value>, <timeunit>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<half_decay>` | The half-life period. Must be a constant numeric expression. Supported type is DOUBLE. |
| `<value>` | The numeric column to average. Supported type is DOUBLE. |
| `<timeunit>` | The numeric time index (not a raw timestamp). For timestamp columns, use `intDiv(toUnixTimestamp(ts), interval_seconds)` to convert. Supported type is DOUBLE. |

## Return Value

Returns a DOUBLE value representing the exponentially smoothed moving average. Special cases:

- If `half_decay` is 0, returns 0.
- If `<value>` or `<timeunit>` contains NULL values, those rows are excluded from the calculation.
- If there is no valid data in the group, returns NULL.

## Example

### Basic Usage

Calculate the exponential moving average of temperature readings over time:

```sql
-- setup
create table temparature_data (
    id int,
    temp double,
    ts double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into temparature_data values
    (1, 10, 1),
    (2, 20, 2),
    (3, 30, 3);
```

```sql
select exponential_moving_average(2.0, temp, ts) from temparature_data;
```

```text
+----------------------------------------------------+
| exponential_moving_average(2.0, temp, ts) |
+----------------------------------------------------+
|                                  14.39339828220178 |
+----------------------------------------------------+
```

### Half-decay Impact

A smaller half_decay gives more weight to recent values:

```sql
-- same data as above, but with half_decay=1
select exponential_moving_average(1.0, temp, ts) from temparature_data;
```

```text
+----------------------------------------------------+
| exponential_moving_average(1.0, temp, ts) |
+----------------------------------------------------+
|                                              21.25 |
+----------------------------------------------------+
```

### Use with GROUP BY

```sql
-- setup
create table sensor_data (
    sensor_id int,
    reading double,
    ts double
) distributed by hash (sensor_id) buckets 1
properties ("replication_num"="1");

insert into sensor_data values
    (1, 10, 1),
    (1, 20, 2),
    (2, 100, 1),
    (2, 200, 2);
```

```sql
select sensor_id, exponential_moving_average(1.0, reading, ts)
from sensor_data group by sensor_id order by sensor_id;
```

```text
+-----------+-------------------------------------------------------+
| sensor_id | exponential_moving_average(1.0, reading, ts) |
+-----------+-------------------------------------------------------+
|         1 |                                                  12.5 |
|         2 |                                                   125 |
+-----------+-------------------------------------------------------+
```

### NULL Handling

Rows with NULL values are excluded from the calculation.

```sql
-- setup
create table null_test (
    id int,
    val double,
    ts double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into null_test values
    (1, 10, 1),
    (2, null, 2),
    (3, 20, 3);
```

```sql
select exponential_moving_average(1.0, val, ts) from null_test;
```

```text
+-------------------------------------------------+
| exponential_moving_average(1.0, val, ts) |
+-------------------------------------------------+
|                                            11.25 |
+-------------------------------------------------+
```

### Empty Result Set

When the result set is empty, returns NULL.

```sql
select exponential_moving_average(1.0, val, ts) from null_test where val > 100;
```

```text
+-------------------------------------------------+
| exponential_moving_average(1.0, val, ts) |
+-------------------------------------------------+
|                                            NULL |
+-------------------------------------------------+
```

### Use with Window Function

```sql
-- setup
create table time_series (
    ts double,
    val double
) distributed by hash (ts) buckets 1
properties ("replication_num"="1");

insert into time_series values (0, 10), (1, 10), (2, 10);
```

```sql
select
    ts,
    exponential_moving_average(1.0, val, ts)
        over (order by ts rows between unbounded preceding and current row) as ema
from time_series order by ts;
```

```text
+------+-------+
| ts   | ema   |
+------+-------+
|    0 |     5 |
|    1 |   7.5 |
|    2 |  8.75 |
+------+-------+
```

### Constant Requirement

The `half_decay` parameter must be a constant. Passing a column expression will result in an error:

```sql
-- this will cause an error: half_decay must be a constant
select exponential_moving_average(val, val, ts) from temparature_data;
```
