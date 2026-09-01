---
{
    "title": "TIMESTAMP_NS",
    "language": "en",
    "description": "TIMESTAMP_NS stores a time-zone-naive date and time with fixed nanosecond precision."
}
---

## Description

`TIMESTAMP_NS` stores a time-zone-naive date and time with fixed nanosecond precision. It is intended for event times, traces, and other data for which the microsecond precision of `DATETIME(6)` is insufficient.

Internally, Doris stores the value as a signed 64-bit count of nanoseconds relative to the Unix epoch. Therefore, a `TIMESTAMP_NS` column occupies 8 bytes and has the following exact range:

```text
[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]
```

The output format is `yyyy-MM-dd HH:mm:ss.SSSSSSSSS`. All nine fractional-second digits are always displayed, including trailing zeros.

Unlike `DATETIME(p)`, `TIMESTAMP_NS` has no configurable precision. Declarations such as `TIMESTAMP_NS(9)` are invalid.

`TIMESTAMP_NS` can be used as a key column, partition column, bucket column, sequence column, and value column. It is also supported in `ARRAY`, `MAP`, `STRUCT`, and typed `VARIANT` values.

## Syntax

```sql
TIMESTAMP_NS
```

## Time Zone Semantics

`TIMESTAMP_NS` does not store a time zone. Changing the session variable `time_zone` does not change a value after it has been stored.

When an input string contains a time zone offset or name, Doris converts the input to the session or ingestion time zone while parsing it, and then stores the resulting local date and time without a time zone. When the input has no time zone, Doris stores its fields directly.

Use [`TIMESTAMPTZ`](./TIMESTAMPTZ.md) instead when a value represents an instant that must be displayed in different session time zones.

## Conversion and Operations

Strings can contain up to nine fractional-second digits. If more digits are provided, Doris rounds to nanoseconds; a carry can propagate to the next second or date. Values outside the supported range are invalid.

`TIMESTAMP_NS` supports conversions to and from numeric, character, `DATE`, `DATETIME`, `TIME`, `TIMESTAMPTZ`, and `VARIANT` types. Converting to a lower-precision temporal type rounds the value to the target precision. For complete rules, see [Cast to TIMESTAMP_NS](../conversion/timestamp-ns-conversion.md).

Date-time extraction, formatting, arithmetic, comparison, aggregate, conditional, and window functions support `TIMESTAMP_NS`. Operations whose result remains `TIMESTAMP_NS` preserve all nine fractional-second digits. Operations that would leave the supported range report an error instead of wrapping.

For nanosecond-specific operations, see [`NANOSECOND`](../../../sql-functions/scalar-functions/date-time-functions/nanosecond.md), [`NANOSECONDS_ADD`](../../../sql-functions/scalar-functions/date-time-functions/nanoseconds-add.md), [`NANOSECONDS_SUB`](../../../sql-functions/scalar-functions/date-time-functions/nanoseconds-sub.md), and [`NANOSECONDS_DIFF`](../../../sql-functions/scalar-functions/date-time-functions/nanoseconds-diff.md).

## Examples

Create a table and store nanosecond values:

```sql
CREATE TABLE events (
    id BIGINT,
    event_time TIMESTAMP_NS
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO events VALUES
    (1, '1970-01-01 00:00:00.000000001'),
    (2, '2024-02-29 12:34:56.123456789'),
    (3, NULL);

SELECT * FROM events ORDER BY id;
```

```text
+------+-------------------------------+
| id   | event_time                    |
+------+-------------------------------+
|    1 | 1970-01-01 00:00:00.000000001 |
|    2 | 2024-02-29 12:34:56.123456789 |
|    3 | NULL                          |
+------+-------------------------------+
```

The tenth fractional digit is rounded to nanoseconds:

```sql
SELECT CAST('1970-01-01 00:00:00.1234567895' AS TIMESTAMP_NS) AS ts;
```

```text
+-------------------------------+
| ts                            |
+-------------------------------+
| 1970-01-01 00:00:00.123456790 |
+-------------------------------+
```

A time zone suffix is applied only while the input is parsed. The stored value remains unchanged after the session time zone changes:

```sql
SET time_zone = '+08:00';
CREATE TABLE timezone_example (
    id INT,
    ts TIMESTAMP_NS
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO timezone_example VALUES
    (1, '2023-08-17T01:41:18.123456789Z');

SET time_zone = '+00:00';
SELECT ts FROM timezone_example;
```

```text
+-------------------------------+
| ts                            |
+-------------------------------+
| 2023-08-17 09:41:18.123456789 |
+-------------------------------+
```

`NULL` input returns `NULL`:

```sql
SELECT CAST(NULL AS TIMESTAMP_NS) AS ts;
```

```text
+------+
| ts   |
+------+
| NULL |
+------+
```
