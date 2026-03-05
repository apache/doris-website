---
{
    "title": "WINDOW_FUNNEL",
    "language": "zh-CN",
    "description": "WINDOWFUNNEL 函数用于分析用户行为序列，它在指定的时间窗口内搜索事件链，并计算事件链中完成的最大步骤数。这个函数特别适用于转化漏斗分析，比如分析用户从访问网站到最终购买的转化过程。"
}
---

## 描述

WINDOW_FUNNEL 函数用于分析用户行为序列，它在指定的时间窗口内搜索事件链，并计算事件链中完成的最大步骤数。这个函数特别适用于转化漏斗分析，比如分析用户从访问网站到最终购买的转化过程。

漏斗分析函数按照如下算法工作：

- 搜索到满足满足条件的第一个事件，设置事件长度为 1，此时开始滑动时间窗口计时。
- 如果事件在时间窗口内按照指定的顺序发生，事件长度累计增加。如果事件没有按照指定的顺序发生，事件长度不增加。
- 如果搜索到多个事件链，漏斗分析函数返回最大的长度。

## 语法

```sql
WINDOW_FUNNEL(<window>, <mode>, <timestamp>, <event_1>[, event_2, ... , event_n])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<window>` | 滑动时间窗口大小，单位为秒，支持类型为Bigint。 |
| `<mode>` | 模式，共有四种模式，分别为`default`, `deduplication`, `fixed`, `increase`，详细请参见下面的**模式**，支持类型为String。 |
| `<timestamp>` | 指定时间列，支持类型为 DATETIME, 滑动窗口沿着此列工作。 |
| `<event_n>` | 表示事件的布尔表达式，支持类型为 Bool。 |

**模式**

    - `default`: 默认模式。

    - `deduplication`: 当某个事件重复发生时，这个重复发生的事件会阻止后续的处理过程。如，指定事件链为[event1='A', event2='B', event3='C', event4='D']，原始事件链为"A-B-C-B-D"。由于 B 事件重复，最终的结果事件链为 A-B-C，最大长度为 3。

    - `fixed`: 不允许事件的顺序发生交错，即事件发生的顺序必须和指定的事件链顺序一致。如，指定事件链为[event1='A', event2='B', event3='C', event4='D']，原始事件链为"A-B-D-C"，则结果事件链为 A-B，最大长度为 2

    - `increase`: 选中的事件的时间戳必须按照指定事件链严格递增。

## 返回值

返回一个整数，表示在指定时间窗口内完成的最大连续步骤数，类型为Integer。

## 举例

### 举例 1: default 模式

使用默认模式，筛选出不同`user_id`对应的最大连续事件数，时间窗口为`5`分钟：

```sql
CREATE TABLE events(
    user_id BIGINT,
    event_name VARCHAR(64),
    event_timestamp datetime,
    phone_brand varchar(64),
    tab_num int
) distributed by hash(user_id) buckets 3 properties("replication_num" = "1");

INSERT INTO
    events
VALUES
    (100123, '登录', '2022-05-14 10:01:00', 'HONOR', 1),
    (100123, '访问', '2022-05-14 10:02:00', 'HONOR', 2),
    (100123, '下单', '2022-05-14 10:04:00', 'HONOR', 3),
    (100123, '付款', '2022-05-14 10:10:00', 'HONOR', 4),
    (100125, '登录', '2022-05-15 11:00:00', 'XIAOMI', 1),
    (100125, '访问', '2022-05-15 11:01:00', 'XIAOMI', 2),
    (100125, '下单', '2022-05-15 11:02:00', 'XIAOMI', 6),
    (100126, '登录', '2022-05-15 12:00:00', 'IPHONE', 1),
    (100126, '访问', '2022-05-15 12:01:00', 'HONOR', 2),
    (100127, '登录', '2022-05-15 11:30:00', 'VIVO', 1),
    (100127, '访问', '2022-05-15 11:31:00', 'VIVO', 5);

SELECT
    user_id,
    window_funnel(
        300,
        "default",
        event_timestamp,
        event_name = '登录',
        event_name = '访问',
        event_name = '下单',
        event_name = '付款'
    ) AS level
FROM
    events
GROUP BY
    user_id
order BY
    user_id;
```

```text
+---------+-------+
| user_id | level |
+---------+-------+
|  100123 |     3 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```

对于`uesr_id=100123`，因为`付款`事件发生的时间超出了时间窗口，所以匹配到的事件链是`登陆-访问-下单`。

### 举例 2: deduplication 模式

使用`deduplication`模式，筛选出不同`user_id`对应的最大连续事件数，时间窗口为`1`小时：

```sql
CREATE TABLE events(
    user_id BIGINT,
    event_name VARCHAR(64),
    event_timestamp datetime,
    phone_brand varchar(64),
    tab_num int
) distributed by hash(user_id) buckets 3 properties("replication_num" = "1");

INSERT INTO
    events
VALUES
    (100123, '登录', '2022-05-14 10:01:00', 'HONOR', 1),
    (100123, '访问', '2022-05-14 10:02:00', 'HONOR', 2),
    (100123, '登录', '2022-05-14 10:03:00', 'HONOR', 3),
    (100123, '下单', '2022-05-14 10:04:00', "HONOR", 4),
    (100123, '付款', '2022-05-14 10:10:00', 'HONOR', 4),
    (100125, '登录', '2022-05-15 11:00:00', 'XIAOMI', 1),
    (100125, '访问', '2022-05-15 11:01:00', 'XIAOMI', 2),
    (100125, '下单', '2022-05-15 11:02:00', 'XIAOMI', 6),
    (100126, '登录', '2022-05-15 12:00:00', 'IPHONE', 1),
    (100126, '访问', '2022-05-15 12:01:00', 'HONOR', 2),
    (100127, '登录', '2022-05-15 11:30:00', 'VIVO', 1),
    (100127, '访问', '2022-05-15 11:31:00', 'VIVO', 5);

SELECT
    user_id,
    window_funnel(
        3600,
        "deduplication",
        event_timestamp,
        event_name = '登录',
        event_name = '访问',
        event_name = '下单',
        event_name = '付款'
    ) AS level
FROM
    events
GROUP BY
    user_id
order BY
    user_id;
```

```text
+---------+-------+
| user_id | level |
+---------+-------+
|  100123 |     2 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```
对于`uesr_id=100123`，匹配到`访问`事件后，`登录`事件重复出现，所以匹配到的事件链是`登陆-访问`。

### 举例 3: fixed 模式

使用`fixed`模式，筛选出不同`user_id`对应的最大连续事件数，时间窗口为`1`小时：

```sql
CREATE TABLE events(
    user_id BIGINT,
    event_name VARCHAR(64),
    event_timestamp datetime,
    phone_brand varchar(64),
    tab_num int
) distributed by hash(user_id) buckets 3 properties("replication_num" = "1");

INSERT INTO
    events
VALUES
    (100123, '登录', '2022-05-14 10:01:00', 'HONOR', 1),
    (100123, '访问', '2022-05-14 10:02:00', 'HONOR', 2),
    (100123, '下单', '2022-05-14 10:03:00', "HONOR", 4),
    (100123, '登录 2', '2022-05-14 10:04:00', 'HONOR', 3),
    (100123, '付款', '2022-05-14 10:10:00', 'HONOR', 4),
    (100125, '登录', '2022-05-15 11:00:00', 'XIAOMI', 1),
    (100125, '访问', '2022-05-15 11:01:00', 'XIAOMI', 2),
    (100125, '下单', '2022-05-15 11:02:00', 'XIAOMI', 6),
    (100126, '登录', '2022-05-15 12:00:00', 'IPHONE', 1),
    (100126, '访问', '2022-05-15 12:01:00', 'HONOR', 2),
    (100127, '登录', '2022-05-15 11:30:00', 'VIVO', 1),
    (100127, '访问', '2022-05-15 11:31:00', 'VIVO', 5);

SELECT
    user_id,
    window_funnel(
        3600,
        "fixed",
        event_timestamp,
        event_name = '登录',
        event_name = '访问',
        event_name = '下单',
        event_name = '付款'
    ) AS level
FROM
    events
GROUP BY
    user_id
order BY
    user_id;
```

```text
+---------+-------+
| user_id | level |
+---------+-------+
|  100123 |     3 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```
对于`uesr_id=100123`，匹配到`下单`事件后，事件链被`登录2`事件打断，所以匹配到的事件链是`登陆-访问-下单`。

### 举例 4: increase 模式

使用`increase`模式，筛选出不同`user_id`对应的最大连续事件数，时间窗口为`1`小时：

```sql
CREATE TABLE events(
    user_id BIGINT,
    event_name VARCHAR(64),
    event_timestamp datetime,
    phone_brand varchar(64),
    tab_num int
) distributed by hash(user_id) buckets 3 properties("replication_num" = "1");

INSERT INTO
    events
VALUES
    (100123, '登录', '2022-05-14 10:01:00', 'HONOR', 1),
    (100123, '访问', '2022-05-14 10:02:00', 'HONOR', 2),
    (100123, '下单', '2022-05-14 10:04:00', "HONOR", 4),
    (100123, '付款', '2022-05-14 10:04:00', 'HONOR', 4),
    (100125, '登录', '2022-05-15 11:00:00', 'XIAOMI', 1),
    (100125, '访问', '2022-05-15 11:01:00', 'XIAOMI', 2),
    (100125, '下单', '2022-05-15 11:02:00', 'XIAOMI', 6),
    (100126, '登录', '2022-05-15 12:00:00', 'IPHONE', 1),
    (100126, '访问', '2022-05-15 12:01:00', 'HONOR', 2),
    (100127, '登录', '2022-05-15 11:30:00', 'VIVO', 1),
    (100127, '访问', '2022-05-15 11:31:00', 'VIVO', 5);

SELECT
    user_id,
    window_funnel(
        3600,
        "increase",
        event_timestamp,
        event_name = '登录',
        event_name = '访问',
        event_name = '下单',
        event_name = '付款'
    ) AS level
FROM
    events
GROUP BY
    user_id
order BY
    user_id;
```

```text
+---------+-------+
| user_id | level |
+---------+-------+
|  100123 |     3 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```
对于`uesr_id=100123`，`付款`事件的时间戳与`下单`事件的时间戳发生在同一秒，没有递增，所以匹配到的事件链是`登陆-访问-下单`。

