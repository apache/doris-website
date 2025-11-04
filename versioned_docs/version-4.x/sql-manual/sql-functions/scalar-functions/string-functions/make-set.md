---
{
    "title": "MAKE_SET",
    "language": "en"
}
---

## Description

MAKE_SET returns a comma-separated set of strings.
The set is composed of the strings whose corresponding bits in `bit` are 1: str1 corresponds to bit 0, str2 to bit 1, and so on. NULL values in the strs are not included in the set.

Aligns with the behavior of [MAKE_SET](https://dev.mysql.com/doc/refman/8.4/en/string-functions.html#function-make-set) in MySQL.

## Syntax

```sql
MAKE_SET(<bit>, <str1>, <str2>...)
```

## Arguments

| Argument       | Description                                                              |
|----------------|--------------------------------------------------------------------------|
| `<bit>`        | The provided integer bit value, indicating which positions' strings to include. Size limit: 2^64 ~ 2^64-1(BIGINT) |
| `<strs>`       | The strings to be combined                                                |

## Return Value

Return a string type, which is a collection of strings formed by the bits where the corresponding bit is 1, and the strings in the collection are separated by ','.

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
(5, 5, NULL, 'warm', 'hot'),
(6, 6, 'monday', 'tuesday', 'wednesday'),
(7, 7, 'one', 'two', 'three'),
(8, 0, 'hello', 'world', NULL),
(9, -2, 'test1', 'test2', 'test3'),
(10, -3, '汽车', '自行车', '火车'),
(11, NULL, 'a', 'b', 'c'),
(12, 7, NULL, NULL, NULL),
(13, 3, '', 'should after ,', 'useless');
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
|   10 | 汽车,火车                        |
|   11 | NULL                             |
|   12 |                                  |
|   13 | ,should after ,                  |
+------+----------------------------------+
```
Explanation:

1. When id == 3, its bit_num == 3, which is represented as 011 in binary. The 0th and 1st bits are 1, representing the parameters str1 and str2 respectively. Therefore, str1 and str2 are used to construct the final result, with str1 and str2 separated by a comma. The final answer can be represented as `${str1},${str2}`, which is `dog,cat`.

2. When id == 5, its bit_num == 5, which is represented as 101 in binary. The 0th and 2nd bits are 1, representing the parameters str1 and str3 respectively. Since str1 is NULL and does not participate in the final result, the final result can be represented as `${str3}`, which is `hot`.

3. When id == 13, its bit_num == 3, which is represented as 011 in binary. Therefore, str1 and str2 are used to construct the final result, represented as `${str1},${str2}`. Since str1 is an empty string, the final result can be simplified to `,${str2}` which is `,should after ,`.

The `bit` parameter is constrained to integers from 2^64 to 2^64-1 (BIGINT), and out-of-bound behavior is reported as follows:
```text
mysql> SELECT MAKE_SET(184467440737095516156, 'a', 'b', 'c');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: make_set(LARGEINT, VARCHAR(1), VARCHAR(1), VARCHAR(1))
```