---
{
    "title": "LTRIM",
    "language": "zh-CN"
}
---

## 描述

MAKE_SET 返回一个字符串集合，其中字符串间以 `,` 分隔。
该集合由在 `bit` 中对应位为 1 的字符串组成：str1 对应位0， str2 对应位1，以此类推。str 中的 NULL 值不参与集合的组成。

## 语法

```sql
MAKE_SET(<bit>, <str1>, <str2>...)
```

## 参数

| 参数             | 说明                                                                      |
|----------------|-----------------------------------------------------------------------------|
| `<bit>`        | 提供的 bit 值，代表要组合字符串的对应位置，大小限制为2^64 ~ 2^64-1(BIGINT)  |
| `<strs>`       | 待组合的字符串                                                              |

## 返回值

返回一个由 bit 中对应位为 1 的字符串集合，字符串之间以`,`分隔。

如果函数中 bit 为 1 位置所代表的 str 为 NULL 或不存在，则跳过该位置。

当 bit 为 NULL 时返回 NULL。

## 举例

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
SELECT id, MAKE_SET(bit_num, vc1, vc2, vc3)  FROM test_make_set;
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

`bit` 参数范围约束为2^64 ~ 2^64-1(BIGINT)，越界行为报错如下：
```text
mysql> SELECT MAKE_SET(184467440737095516156, 'a', 'b', 'c');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: make_set(LARGEINT, VARCHAR(1), VARCHAR(1), VARCHAR(1))
```