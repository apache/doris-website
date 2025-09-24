---
{
    "title": "MAKE_SET",
    "language": "en-US"
}
---

## Description

MAKE_SET returns a comma-separated set of strings.
The set is composed of the strings whose corresponding bits in `bit` are 1: str1 corresponds to bit 0, str2 to bit 1, and so on. NULL values in the strs are not included in the set.

## Syntax

```sql
MAKE_SET(<bit>, <str1>, <str2>...)
```

## Arguments

| Argument       | Description                                                              |
|----------------|--------------------------------------------------------------------------|
| `<bit>`        | The provided bit value, indicating which positions' strings to include. Size limit: 2^64 ~ 2^64-1 |
| `<strs>`       | The strings to be combined                                                |

## Return Value

Returns a comma-separated set of strings for which the corresponding bits in `bit` are 1.

If a str corresponding to a bit set to 1 is NULL or does not exist, that position is skipped.

Returns NULL when `bit` is NULL.

## Example

```sql
CREATE TABLE test_make_set (
    id int,
    bit_num BIGINT,
    vc1 VARCHAR(50),
    vc2 VARCHAR(50),
    vc3 VARCHAR(50)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ( 'replication_num' = '1' );

INSERT INTO test_make_set (id, bit_num, vc1, vc2, vc3) VALUES
(1, 1, 'apple', 'orange', NULL),
(2, 2, 'red', 'blue', NULL),
(3, 3, 'dog', 'cat', 'bird'),
(4, 4, 'small', 'medium', 'large'),
(5, 5, 'hot', 'warm', NULL),
(6, 6, 'monday', 'tuesday', 'wednesday'),
(7, 7, 'one', 'two', 'three'),
(8, 0, 'hello', 'world', NULL),
(9, -2, 'test1', 'test2', 'test3'),
(10, -3, 'car', 'bike', 'train'),
(11, NULL, 'a', 'b', 'c'),
(12, 7, NULL, NULL, NULL);
```

```sql
SELECT id, MAKE_SET(bit_num, vc1, vc2, vc3) FROM test_make_set;
```
```text
+------+----------------------------------+
| id   | MAKE_SET(bit_num, vc1, vc2, vc3) |
+------+----------------------------------+
|    1 | apple                            |
|    2 | blue                             |
|    3 | dog,cat                          |
|    4 | large                            |
|    5 | hot                              |
|    6 | tuesday,wednesday                |
|    7 | one,two,three                    |
|    8 |                                  |
|    9 | test2,test3                      |
|   10 | car,train                        |
|   11 | NULL                             |
|   12 |                                  |
+------+----------------------------------+
```

The `bit` parameter range constraint is 2^64 ~ 2^64-1 (BIGINT), and out-of-bound behavior is reported as follows:
```text
mysql> SELECT MAKE_SET(184467440737095516156, 'a', 'b', 'c');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: make_set(LARGEINT, VARCHAR(1), VARCHAR(1), VARCHAR(1))
```