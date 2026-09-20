---
{
    "title": "DATETIME_TO_UUID_V7",
    "language": "en",
    "description": "Generates a native UUID v7 from a date and time; returns `NULL` for `NULL` input."
}
---

## Description

Generates a native UUID v7 from a date and time; returns `NULL` for `NULL` input.

## Alias

`dateTimeToUUIDv7`.

## Usage Notes

This function has a counter separate from `UUID_V7()`. It does not guarantee global order across BEs and is not a deterministic encoding of a date and time. If the counter for consecutive equal inputs overflows, the encoded timestamp advances by one millisecond.

## Syntax

```sql
DATETIME_TO_UUID_V7(<datetime>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<datetime>` | A DATETIME value, optionally with fractional-second precision, interpreted in the session `time_zone`. |

## Return Value

Returns the `UUID` type. Returns `NULL` for `NULL`, an invalid date, or a date and time before the Unix epoch after conversion to UTC. Submillisecond digits are truncated. The function is nondeterministic: repeated calls with the same date and time generate new UUIDs.

## Example

```sql
SET time_zone = 'UTC';
SELECT UUID_VERSION(DATETIME_TO_UUID_V7(CAST('2026-09-10 12:34:56.789123' AS DATETIME(6)))) AS version,
       UUID_V7_TO_DATETIME(DATETIME_TO_UUID_V7(CAST('2026-09-10 12:34:56.789123' AS DATETIME(6))), 'UTC') AS restored;
```

```text
+---------+-------------------------+
| version | restored                |
+---------+-------------------------+
| 7       | 2026-09-10 12:34:56.789 |
+---------+-------------------------+
```

```sql
SET time_zone = 'UTC';
SELECT DATETIME_TO_UUID_V7(CAST(NULL AS DATETIME)) AS null_input,
       DATETIME_TO_UUID_V7(CAST('1969-12-31 23:59:59' AS DATETIME)) AS before_epoch,
       UUID_V7_TO_DATETIME(DATETIME_TO_UUID_V7(CAST('1970-01-01 00:00:00' AS DATETIME)), 'UTC') AS epoch;
```

```text
+------------+--------------+-------------------------+
| null_input | before_epoch | epoch                   |
+------------+--------------+-------------------------+
| NULL       | NULL         | 1970-01-01 00:00:00.000 |
+------------+--------------+-------------------------+
```
