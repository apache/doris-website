---
{
    "title": "RETENTION",
    "language": "en",
    "description": "The retention function takes as arguments a set of conditions from 1 to 32 arguments of type UInt8 that indicate whether a certain condition was met "
}
---

## Description

The `retention` function takes as arguments a set of conditions from 1 to 32 arguments of type `UInt8` that indicate whether a certain condition was met for the event. Any condition can be specified as an argument.

The conditions, except the first, apply in pairs: the result of the second will be true if the first and second are true, of the third if the first and third are true, etc.

To put it simply, the first digit of the return value array indicates whether `event_1` is true or false, the second digit represents the truth and falseness of `event_1` and `event_2`, and the third digit represents whether `event_1` is true or false and `event_3` is true False and, and so on. If `event_1` is false, return an array full of zeros.

## Syntax

```sql
RETENTION(<event_1> [, <event_2>, ... , <event_n>]);
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<event_n>` | The `n`th event condition, of type `UInt8` and value 1 or 0. |

## Returned value

An array of 1 and 0 with a maximum length of 32, where the final output array length matches the input parameter length.

- 1: Condition is met.
- 0: Condition is not met.

## Examples

```sql
-- Create sample table
CREATE TABLE retention_test(
    `uid` int COMMENT 'user id', 
    `date` datetime COMMENT 'date time' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_allocation" = "tag.location.default: 1"
);

-- Insert sample data
INSERT into retention_test values 
(0, '2022-10-12'),
(0, '2022-10-13'),
(0, '2022-10-14'),
(1, '2022-10-12'),
(1, '2022-10-13'),
(2, '2022-10-12');

-- Calculate user retention
SELECT 
    uid,     
    RETENTION(date = '2022-10-12') AS r,
    RETENTION(date = '2022-10-12', date = '2022-10-13') AS r2,
    RETENTION(date = '2022-10-12', date = '2022-10-13', date = '2022-10-14') AS r3 
FROM retention_test 
GROUP BY uid 
ORDER BY uid ASC;
```

```text
+------+------+--------+-----------+
| uid  | r    | r2     | r3        |
+------+------+--------+-----------+
|    0 | [1]  | [1, 1] | [1, 1, 1] |
|    1 | [1]  | [1, 1] | [1, 1, 0] |
|    2 | [1]  | [1, 0] | [1, 0, 0] |
+------+------+--------+-----------+
```