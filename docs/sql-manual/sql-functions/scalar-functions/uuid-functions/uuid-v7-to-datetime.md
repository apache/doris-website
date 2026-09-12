---
{
    "title": "UUID_V7_TO_DATETIME",
    "language": "en",
    "description": "Extracts the Unix millisecond timestamp from a UUID v7 and converts it to a date and time in the selected time zone; returns `NULL` for `NULL` input."
}
---

## Description

Extracts the Unix millisecond timestamp from a UUID v7 and converts it to a date and time in the selected time zone; returns `NULL` for `NULL` input.

## Alias

`UUIDv7ToDateTime`.

## Syntax

```sql
UUID_V7_TO_DATETIME(<uuid> [, <time_zone>])
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<uuid>` | A value of type UUID. |
| `<time_zone>` | Optional constant string, such as `UTC`, `Asia/Shanghai`, or `+08:00`. Defaults to the session `time_zone`. A varying time-zone column is not allowed; an invalid zone raises an error. |

## Return Value

Returns the `DATETIME(3)` type. Returns `NULL` if the UUID or explicit time zone is `NULL`, or if the converted date and time is outside the DATETIME range. If the version field is not 7, returns the Unix epoch (1970-01-01 00:00:00 UTC) in the selected time zone, rather than `NULL`. It does not validate UUID variant bits.

## Example

```sql
SET time_zone = 'UTC';
SELECT UUID_V7_TO_DATETIME(CAST('00000000-0001-7000-8000-000000000000' AS UUID)) AS session_time,
       UUID_V7_TO_DATETIME(CAST('00000000-0001-7000-8000-000000000000' AS UUID), 'Asia/Shanghai') AS shanghai_time;
```

```text
+-------------------------+-------------------------+
| session_time            | shanghai_time           |
+-------------------------+-------------------------+
| 1970-01-01 00:00:00.001 | 1970-01-01 08:00:00.001 |
+-------------------------+-------------------------+
```

```sql
SELECT UUID_V7_TO_DATETIME(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID), 'UTC') AS non_v7,
       UUID_V7_TO_DATETIME(CAST(NULL AS UUID), 'UTC') AS null_input,
       UUID_V7_TO_DATETIME(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID), NULL) AS null_zone,
       UUID_V7_TO_DATETIME(CAST('ffffffff-ffff-7000-8000-000000000000' AS UUID), 'UTC') AS out_of_range;
```

```text
+-------------------------+------------+-----------+--------------+
| non_v7                  | null_input | null_zone | out_of_range |
+-------------------------+------------+-----------+--------------+
| 1970-01-01 00:00:00.000 | NULL       | NULL      | NULL         |
+-------------------------+------------+-----------+--------------+
```
