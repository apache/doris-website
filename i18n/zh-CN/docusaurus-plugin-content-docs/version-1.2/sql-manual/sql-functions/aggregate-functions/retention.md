---
{
    "title": "RETENTION",
    "language": "zh-CN"
}
---

## RETENTION

RETENTION

## 描述
## 语法

`retention(event1, event2, ... , eventN);`

留存函数将一组条件作为参数，类型为1到32个`UInt8`类型的参数，用来表示事件是否满足特定条件。 任何条件都可以指定为参数.

除了第一个以外，条件成对适用：如果第一个和第二个是真的，第二个结果将是真的，如果第一个和第三个是真的，第三个结果将是真的，等等。

## 参数

`event` — 返回`UInt8`结果（1或0）的表达式.

## 返回值

由1和0组成的数组。

1 — 条件满足。

0 — 条件不满足

## 举例

```sql
DROP TABLE IF EXISTS retention_test;

CREATE TABLE retention_test(
                `uid` int COMMENT 'user id', 
                `date` datetime COMMENT 'date time' 
                )
DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS 3 
PROPERTIES ( 
    "replication_num" = "1"
); 

INSERT into retention_test (uid, date) values (0, '2022-10-12'),
                                        (0, '2022-10-13'),
                                        (0, '2022-10-14'),
                                        (1, '2022-10-12'),
                                        (1, '2022-10-13'),
                                        (2, '2022-10-12'); 

SELECT * from retention_test;

+------+---------------------+
| uid  | date                |
+------+---------------------+
|    0 | 2022-10-14 00:00:00 |
|    0 | 2022-10-13 00:00:00 |
|    0 | 2022-10-12 00:00:00 |
|    1 | 2022-10-13 00:00:00 |
|    1 | 2022-10-12 00:00:00 |
|    2 | 2022-10-12 00:00:00 |
+------+---------------------+

SELECT 
    uid,     
    retention(date = '2022-10-12')
        AS r 
            FROM retention_test 
            GROUP BY uid 
            ORDER BY uid ASC;

+------+------+
| uid  | r    |
+------+------+
|    0 | [1]  | 
|    1 | [1]  |
|    2 | [1]  |
+------+------+

SELECT 
    uid,     
    retention(date = '2022-10-12', date = '2022-10-13')
        AS r 
            FROM retention_test 
            GROUP BY uid 
            ORDER BY uid ASC;

+------+--------+
| uid  | r      |
+------+--------+
|    0 | [1, 1] |
|    1 | [1, 1] |
|    2 | [1, 0] |
+------+--------+

SELECT 
    uid,     
    retention(date = '2022-10-12', date = '2022-10-13', date = '2022-10-14')
        AS r 
            FROM retention_test 
            GROUP BY uid 
            ORDER BY uid ASC;

+------+-----------+
| uid  | r         |
+------+-----------+
|    0 | [1, 1, 1] |
|    1 | [1, 1, 0] |
|    2 | [1, 0, 0] |
+------+-----------+

```

### keywords

RETENTION
