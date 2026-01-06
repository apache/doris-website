---
{
    "title": "SEQUENCE_COUNT",
    "language": "zh-CN",
    "description": "计算与模式匹配的事件链的数量。该函数搜索不重叠的事件链。当前链匹配后，它开始搜索下一个链。"
}
---

## 描述

计算与模式匹配的事件链的数量。该函数搜索不重叠的事件链。当前链匹配后，它开始搜索下一个链。

**警告！** 

在同一秒钟发生的事件可能以未定义的顺序排列在序列中，会影响最终结果。

## 语法

```sql
SEQUENCE_COUNT(<pattern>, <timestamp>, <cond_1> [, <cond_2>, ..., <cond_n>]);
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<pattern>` | 模式字符串，可参考下面的**模式语法**。支持类型为 String。 |
| `<timestamp>` | 包含时间的列。支持类型为Date，DateTime。|
| `<cond_n>` | 事件链的约束条件。支持类型为 Bool。最多可以传递 32 个条件参数。该函数只考虑这些条件中描述的事件。如果序列包含未在条件中描述的数据，则函数将跳过这些数据。 |

**模式语法**

- `(?N)` — 在位置 N 匹配条件参数。条件在编号 `[1, 32]` 范围。例如，`(?1)` 匹配传递给 `cond_1` 参数。

- `.*` — 匹配任何事件的数字。不需要条件参数来匹配这个模式。

- `(?t operator value)` — 分开两个事件的时间。单位为秒。

- `t`表示为两个时间的差值，单位为秒。例如： `(?1)(?t>1800)(?2)` 匹配彼此发生超过 1800 秒的事件， `(?1)(?t>10000)(?2)`匹配彼此发生超过 10000 秒的事件。这些事件之间可以存在任意数量的任何事件。您可以使用 `>=`, `>`, `<`, `<=`, `==` 运算符。

## 返回值

匹配的非重叠事件链数。

如果组内没有合法数据，则返回0。

## 举例

**匹配例子**

```sql
-- 创建示例表
CREATE TABLE sequence_count_test1(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

-- 插入示例数据
INSERT INTO sequence_count_test1(uid, date, number) values 
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 13:28:02', 2),
(3, '2022-11-02 16:15:01', 1),
(4, '2022-11-02 19:05:04', 2),
(5, '2022-11-02 20:08:44', 3); 

-- 查询示例
SELECT
    SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 3) as c1,
    SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 2) as c2,
    SEQUENCE_COUNT('(?1)(?t>=3600)(?2)', date, number = 1, number = 2) as c3
FROM sequence_count_test1;
```

```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
|    1 |    2 |    2 |
+------+------+------+
```

**不匹配例子**

```sql
-- 创建示例表
CREATE TABLE sequence_count_test2(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

-- 插入示例数据
INSERT INTO sequence_count_test2(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 11:41:00', 7),
(3, '2022-11-02 16:15:01', 3),
(4, '2022-11-02 19:05:04', 4),
(5, '2022-11-02 21:24:12', 5);

-- 查询示例
SELECT
    SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 2) as c1,
    SEQUENCE_COUNT('(?1)(?2).*', date, number = 1, number = 2) as c2,
    SEQUENCE_COUNT('(?1)(?t>3600)(?2)', date, number = 1, number = 7) as c3
FROM sequence_count_test2;
```

```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
|    0 |    0 |    0 |
+------+------+------+
```

**特殊例子**

```sql
-- 创建示例表
CREATE TABLE sequence_count_test3(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

-- 插入示例数据
INSERT INTO sequence_count_test3(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 11:41:00', 7),
(3, '2022-11-02 16:15:01', 3),
(4, '2022-11-02 19:05:04', 4),
(5, '2022-11-02 21:24:12', 5);

-- 查询示例
SELECT SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 5) FROM sequence_count_test3;
```

```text
+----------------------------------------------------------------+
| sequence_count('(?1)(?2)', `date`, `number` = 1, `number` = 5) |
+----------------------------------------------------------------+
|                                                              1 |
+----------------------------------------------------------------+
```

上面为一个非常简单的匹配例子，该函数找到了数字 5 跟随数字 1 的事件链。它跳过了它们之间的数字 7，3，4，因为该数字没有被描述为事件。如果我们想在搜索示例中给出的事件链时考虑这个数字，我们应该为它创建一个条件。

现在，考虑如下执行语句：

```sql
SELECT SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 5, number = 4) FROM sequence_count_test3;
```

```text
+------------------------------------------------------------------------------+
| sequence_count('(?1)(?2)', `date`, `number` = 1, `number` = 5, `number` = 4) |
+------------------------------------------------------------------------------+
|                                                                            0 |
+------------------------------------------------------------------------------+
```

您可能对这个结果有些许疑惑，在这种情况下，函数找不到与模式匹配的事件链，因为数字 4 的事件发生在 1 和 5 之间。如果在相同的情况下，我们检查了数字 6 的条件，则序列将与模式匹配。

```sql
SELECT SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 5, number = 6) FROM sequence_count_test3;
```

```text
+------------------------------------------------------------------------------+
| sequence_count('(?1)(?2)', `date`, `number` = 1, `number` = 5, `number` = 6) |
+------------------------------------------------------------------------------+
|                                                                            1 |
+------------------------------------------------------------------------------+
```
