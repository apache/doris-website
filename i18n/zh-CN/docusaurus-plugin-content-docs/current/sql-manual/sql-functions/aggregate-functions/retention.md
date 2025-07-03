---
{
    "title": "RETENTION",
    "language": "zh-CN"
}
---

## 描述

留存函数将一组条件作为参数，类型为 1 到 32 个`UInt8`类型的参数，用来表示事件是否满足特定条件。任何条件都可以指定为参数。

除了第一个以外，条件成对适用：如果第一个和第二个是真的，第二个结果将是真的，如果第一个和第三个是真的，第三个结果将是真的，等等。

简单来讲，返回值数组第 1 位表示`event_1`的真假，第二位表示`event_1`真假与`event_2`真假相与，第三位表示`event_1`真假与`event_3`真假相与，等等。如果`event_1`为假，则返回全是 0 的数组。

## 语法

```sql
RETENTION(<event_1> [, <event_2>, ... , <event_n>]);
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<event_n>` | 第`n`个事件条件，类型为`UInt8`，取值为 1 或 0 |

## 返回值
- 1: 条件满足。
- 0: 条件不满足。
由 1 和 0 组成的最大长度为 32 位的数组，最终输出数组的长度与输入参数长度相同。
如果在没有任何数据参与聚合的情况下，会返回NULL值

## 举例

```sql
-- 创建示例表
CREATE TABLE retention_test(
    `uid` int COMMENT 'user id', 
    `date` datetime COMMENT 'date time' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_allocation" = "tag.location.default: 1"
);

-- 插入示例数据
INSERT into retention_test values 
(0, '2022-10-12'),
(0, '2022-10-13'),
(0, '2022-10-14'),
(1, '2022-10-12'),
(1, '2022-10-13'),
(2, '2022-10-12');

-- 计算用户留存
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

```sql
SELECT RETENTION(date = '2022-10-12') AS r FROM retention_test where uid is NULL;
```

```text
+------+
| r    |
+------+
| NULL |
+------+
```
