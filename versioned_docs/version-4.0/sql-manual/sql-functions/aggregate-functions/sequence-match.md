---
{
    "title": "SEQUENCE_MATCH",
    "language": "en"
}
---

## Description

Checks whether the sequence contains an event chain that matches the pattern.

**WARNING!** 

Events that occur at the same second may lay in the sequence in an undefined order affecting the result.


## Syntax

```sql
SEQUENCE_MATCH(<pattern>, <timestamp>, <cond_1> [, <cond_2>, ..., <cond_n>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<pattern>` | Pattern string. See **Pattern syntax** below. Supports type String. |
| `<timestamp>` | Column considered to contain time data. Supports type Date, DateTime. |
| `<cond_n>` | Conditions that describe the chain of events. Supports type Bool. Up to 32 condition arguments can be passed. The function takes only the events described in these conditions into account. If the sequence contains data that isnt described in a condition, the function skips them. |

**Pattern syntax**

- `(?N)` — Matches the condition argument at position N. Conditions are numbered in the `[1, 32]` range. For example, `(?1)` matches the argument passed to the `cond1` parameter.

- `.*` — Matches any number of events. You do not need conditional arguments to match this element of the pattern.

- `(?t operator value)` —  Sets the time in seconds that should separate two events.

- We define `t` as the difference in seconds between two times,  For example, pattern `(?1)(?t>1800)(?2)` matches events that occur more than 1800 seconds from each other. pattern `(?1)(?t>10000)(?2)` matches events that occur more than 10000 seconds from each other. An arbitrary number of any events can lay between these events. You can use the `>=`, `>`, `<`, `<=`, `==` operators.

## Return value

1: if the pattern is matched.

0: if the pattern isnt matched.
If there is no valid data in the group, returns NULL.

## Examples

**Match examples**

```sql
CREATE TABLE sequence_match_test1(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

INSERT INTO sequence_match_test1(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 13:28:02', 2),
(3, '2022-11-02 16:15:01', 1),
(4, '2022-11-02 19:05:04', 2),
(5, '2022-11-02 20:08:44', 3); 


SELECT 
sequence_match('(?1)(?2)', date, number = 1, number = 3) as c1,
sequence_match('(?1)(?2)', date, number = 1, number = 2) as c2,
sequence_match('(?1)(?t>=3600)(?2)', date, number = 1, number = 2) as c3
FROM sequence_match_test1;
```

```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
|    1 |    1 |    1 |
+------+------+------+
```

**Not match examples**

```sql
CREATE TABLE sequence_match_test2(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

INSERT INTO sequence_match_test2(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 11:41:00', 7),
(3, '2022-11-02 16:15:01', 3),
(4, '2022-11-02 19:05:04', 4),
(5, '2022-11-02 21:24:12', 5);

SELECT 
sequence_match('(?1)(?2)', date, number = 1, number = 2) as c1,
sequence_match('(?1)(?2).*', date, number = 1, number = 2) as c2,
sequence_match('(?1)(?t>3600)(?2)', date, number = 1, number = 7) as c3
FROM sequence_match_test2;
```

```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
|    0 |    0 |    0 |
+------+------+------+
```

**Special examples**

```sql
CREATE TABLE sequence_match_test3(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

INSERT INTO sequence_match_test3(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 11:41:00', 7),
(3, '2022-11-02 16:15:01', 3),
(4, '2022-11-02 19:05:04', 4),
(5, '2022-11-02 21:24:12', 5);

SELECT sequence_match('(?1)(?2)', date, number = 1, number = 5)
FROM sequence_match_test3;
```

```text
+----------------------------------------------------------------+
| sequence_match('(?1)(?2)', `date`, `number` = 1, `number` = 5) |
+----------------------------------------------------------------+
|                                                              1 |
+----------------------------------------------------------------+
```

This is a very simple example. The function found the event chain where number 5 follows number 1. It skipped number 7,3,4 between them, because the number is not described as an event. If we want to take this number into account when searching for the event chain given in the example, we should make a condition for it.

Now, perform this query:

```sql
SELECT sequence_match('(?1)(?2)', date, number = 1, number = 5, number = 4)
FROM sequence_match_test3;
```

```text
+------------------------------------------------------------------------------+
| sequence_match('(?1)(?2)', `date`, `number` = 1, `number` = 5, `number` = 4) |
+------------------------------------------------------------------------------+
|                                                                            0 |
+------------------------------------------------------------------------------+
```

The result is kind of confusing. In this case, the function couldn’t find the event chain matching the pattern, because the event for number 4 occurred between 1 and 5. If in the same case we checked the condition for number 6, the sequence would match the pattern.

```sql
SELECT sequence_match('(?1)(?2)', date, number = 1, number = 5, number = 6)
FROM sequence_match_test3;
```

```text
+------------------------------------------------------------------------------+
| sequence_match('(?1)(?2)', `date`, `number` = 1, `number` = 5, `number` = 6) |
+------------------------------------------------------------------------------+
|                                                                            1 |
+------------------------------------------------------------------------------+
```
