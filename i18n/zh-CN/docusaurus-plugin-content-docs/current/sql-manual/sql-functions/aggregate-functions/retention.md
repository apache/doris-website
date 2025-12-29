---
{
    "title": "RETENTION",
    "language": "zh-CN",
    "description": "留存函数将一组条件作为参数，类型为 1 到 32 个 Bool 类型的参数，用来表示事件是否满足特定条件。任何条件都可以指定为参数。"
}
---

## 描述

留存函数将一组条件作为参数，类型为 1 到 32 个 Bool 类型的参数，用来表示事件是否满足特定条件。任何条件都可以指定为参数。

除了第一个以外，条件成对适用：如果第一个和第二个是真的，第二个结果将是真的，如果第一个和第三个是真的，第三个结果将是真的，等等。

简单来讲，返回值数组第 1 位表示`event_1`的真假，第二位表示`event_1`真假与`event_2`真假相与，第三位表示`event_1`真假与`event_3`真假相与，等等。如果`event_1`为假，则返回全是 false 的数组。

## 语法

```sql
RETENTION(<event_1> [, <event_2>, ... , <event_n>]);
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<event_n>` | 第`n`个事件条件，支持类型为 Bool。 |

## 返回值
- true: 条件满足。
- false: 条件不满足。
由 Bool 组成的最大长度为 32 位的数组，最终输出数组的长度与输入参数长度相同。
如果在没有任何数据参与聚合的情况下，会返回 NULL 值。
当有多个列参与计算时，如果任意一列出现了 NULL 值，则 NULL 值的当前行不会参与聚合计算，被直接丢弃。
可以在计算列上加 IFNULL 函数处理 NULL值 ，详情见后续示例。

## 举例

1. 创建示例表， 插入示例数据

```sql
CREATE TABLE retention_test(
    `uid` int COMMENT 'user id', 
    `date` datetime COMMENT 'date time' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_allocation" = "tag.location.default: 1"
);

INSERT into retention_test values 
(0, '2022-10-12'),
(0, '2022-10-13'),
(0, '2022-10-14'),
(1, '2022-10-12'),
(1, '2022-10-13'),
(2, '2022-10-12');
```

2. 正常计算用户留存

```sql
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

3. 特殊情况NULL值处理，重新建表以及插入数据

```sql
CREATE TABLE retention_test2(
    `uid` int, 
    `flag` boolean,
    `flag2` boolean
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_allocation" = "tag.location.default: 1"
);

INSERT into retention_test2 values (0, false, false), (1, true,  NULL);

SELECT * from retention_test2;
```

```text
+------+------+-------+
| uid  | flag | flag2 |
+------+------+-------+
|    0 |    1 |  NULL |
|    1 |    0 |     0 |
+------+------+-------+
```


4. 空表计算时，没有任何数据参与聚合，返回 NULL 值

```sql
SELECT RETENTION(date = '2022-10-12') AS r FROM retention_test2 where uid is NULL;
```

```text
+------+
| r    |
+------+
| NULL |
+------+
```

5. 仅flag一列参与计算，由于 uid = 0 时， flag 为真，返回 1

```sql
select retention(flag) from retention_test2;
```

```text
+-----------------+
| retention(flag) |
+-----------------+
| [1]             |
+-----------------+
```

6. 当flag,flag2 两列参与计算时，uid = 0 的行，由于flag2 为NULL值，所以这行未参与聚合计算， 仅uid = 1 参与聚合计算，返回结果为0

```sql
select retention(flag,flag2) from retention_test2;
```

```text
+-----------------------+
| retention(flag,flag2) |
+-----------------------+
| [0, 0]                |
+-----------------------+
```

7. 如果需要解决NULL值问题，可以用IFNULL 函数将NULL转换成false，这样 uid = 0,1 两行都会参与聚合计算

```sql
select retention(flag,IFNULL(flag2,false)) from retention_test2;;
```

```text
+-------------------------------------+
| retention(flag,IFNULL(flag2,false)) |
+-------------------------------------+
| [1, 0]                              |
+-------------------------------------+
```
