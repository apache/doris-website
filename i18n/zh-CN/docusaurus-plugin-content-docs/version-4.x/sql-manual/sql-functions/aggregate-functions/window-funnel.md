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

    - `default`: 标准漏斗计算模式。在时间窗口内，Doris 会按照指定顺序寻找最长的事件链。不匹配任何 condition 的事件会被忽略。

    - `deduplication`: 在 `default` 的基础上，当前事件链中已经匹配过的事件不能再次出现。例如，指定事件链为 [event1='A', event2='B', event3='C', event4='D']，原始事件链为 `A-B-C-B-D`，第二个 `B` 会打断事件链，因此最终匹配结果为 `A-B-C`，最大长度为 `3`。

    - `fixed`: 事件链必须严格按照指定顺序推进，不能跳过中间步骤。如果某个后续步骤对应的事件在其前驱步骤匹配之前就出现，则事件链立即中断。从 Doris 4.1 开始，不匹配任何 condition 的无关事件会被忽略，不再打断事件链。例如，指定事件链为 [event1='A', event2='B', event3='C', event4='D'] 时，`A-B-D-C` 的结果为 `A-B`，最大长度为 `2`；如果原始事件链为 `A-B-X-C-D`（`X` 不匹配任何 condition），则 Doris 4.1 及以后返回 `A-B-C-D`，而 4.1 之前只会返回 `A-B`。

    - `increase`: 在 `default` 的基础上，已匹配事件的时间戳必须严格递增。如果两个已匹配事件的时间戳相同，后一个事件不能推进事件链。

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

对于`user_id=100123`，因为`付款`事件发生的时间超出了时间窗口，所以匹配到的事件链是`登陆-访问-下单`。

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
    (100123, '下单', '2022-05-14 10:04:00', 'HONOR', 4),
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
对于`user_id=100123`，匹配到`访问`事件后，`登录`事件重复出现，所以匹配到的事件链是`登陆-访问`。

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
    (100123, '登录 2', '2022-05-14 10:03:00', 'HONOR', 3),
    (100123, '下单', '2022-05-14 10:04:00', 'HONOR', 4),
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
|  100123 |     4 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```
对于`user_id=100123`，`登录 2`不匹配漏斗中的任何 condition。从 Doris 4.1 开始，这类无关事件不会打断 `fixed` 模式下的事件链，因此最终匹配到的事件链是`登录-访问-下单-付款`。在 4.1 之前，同样的数据会在`登录 2`处中断，只返回`登录-访问`，长度为 `2`。

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
    (100123, '下单', '2022-05-14 10:04:00', 'HONOR', 4),
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
对于`user_id=100123`，`付款`事件的时间戳与`下单`事件的时间戳发生在同一秒，没有递增，所以匹配到的事件链是`登陆-访问-下单`。
