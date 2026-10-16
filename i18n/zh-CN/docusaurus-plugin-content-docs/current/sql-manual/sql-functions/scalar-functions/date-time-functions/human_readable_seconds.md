---
{
    "title": "HUMAN_READABLE_SECONDS",
    "language": "zh-CN",
    "description": "HUMAN_READABLE_SECONDS 候选契约：整秒舍入、格式化规则、NULL 与数值边界；当前 dev 和 4.x 均未支持。"
}
---

:::caution 尚未发布

截至 2026-10-16，当前 dev 以及 4.0、4.1、4.2 源码分支均未实现该函数。本页描述 [候选实现 PR #68524](https://github.com/apache/doris/pull/68524)（提交 `be965688c9a07d7b741a60179e543f38f6555d8d`）的拟定行为，不代表当前版本已支持。首次支持版本尚未确定；4.x 是否回移及对应版本仍需确认。下面的 SQL 与输出只适用于包含该候选实现的环境，合入前还需按最终源码复核。

:::

| 文档范围 | 当前支持状态 |
| --- | --- |
| dev | 待实现 PR 合入，当前 master 不支持。 |
| 4.x | 当前 4.0、4.1、4.2 均不支持；没有已确认的回移或首次支持版本。 |

## 描述

按候选契约，将秒数的绝对值舍入到整数秒，再格式化为包含周、天、小时、分钟和秒的英文时长字符串。输入为 `NULL`、非有限值或转换为 `DOUBLE` 后绝对值大于等于 `2^63` 时返回 `NULL`。

## 语法

```sql
HUMAN_READABLE_SECONDS(<seconds>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<seconds>` | 必需。表示时长秒数的 `DOUBLE` 值。其他可转换的数值类型会先转换为 `DOUBLE`。正常格式化要求该转换后的值为有限值且满足 `-2^63 < seconds < 2^63`；不满足时返回 `NULL`。 |

## 返回值

返回 `VARCHAR` 类型的英文时长字符串；输入为 `NULL`、`NaN`、正负无穷或转换后的绝对值大于等于 `2^63` 时返回 SQL `NULL`。

<a id="特殊情况"></a>

- 先取绝对值，再舍入到最近的整数秒；恰好半秒时向更大的绝对秒数舍入。因此负数结果不带负号，`-0.5` 返回 `1 second`。
- 不输出毫秒或小数秒。例如，`475.33` 返回 `7 minutes, 55 seconds`，`0.9` 返回 `1 second`。
- 按 `weeks`、`days`、`hours`、`minutes`、`seconds` 的顺序输出，用逗号加空格分隔；省略数值为零的单位，数值为 1 时使用单数单位。
- 舍入后的值为零时返回 `0 seconds`。一周固定为 7 天，一天固定为 24 小时；该函数处理时长，不进行时区或日历换算。
- 范围检查在转换为 `DOUBLE` 后执行。较大的整数或高精度小数可能失去精度；例如 `9223372036854775807` 转换为 `DOUBLE` 后等于 `2^63`，因此返回 `NULL`，不会钳制到最大整数。

## 示例

以下均为上述候选提交的预期结果，不表示当前 dev 或 4.x 可直接执行。

### 格式化时长并省略零值单位

```sql
SELECT human_readable_seconds(3661) AS duration,
       human_readable_seconds(3601) AS skipped_zero_units;
```

```text
+----------------------------+--------------------+
| duration                   | skipped_zero_units |
+----------------------------+--------------------+
| 1 hour, 1 minute, 1 second | 1 hour, 1 second   |
+----------------------------+--------------------+
```

### 周与单位单复数

```sql
SELECT human_readable_seconds(604800) AS one_week,
       human_readable_seconds(1209600) AS two_weeks;
```

```text
+----------+-----------+
| one_week | two_weeks |
+----------+-----------+
| 1 week   | 2 weeks   |
+----------+-----------+
```

### 较长时长

```sql
SELECT human_readable_seconds(56363463) AS duration;
```

```text
+-------------------------------------------------+
| duration                                        |
+-------------------------------------------------+
| 93 weeks, 1 day, 8 hours, 31 minutes, 3 seconds |
+-------------------------------------------------+
```

### 小数与负数输入

```sql
SELECT human_readable_seconds(475.33) AS fractional,
       human_readable_seconds(0.9) AS subsecond,
       human_readable_seconds(-0.5) AS negative;
```

```text
+-----------------------+-----------+----------+
| fractional            | subsecond | negative |
+-----------------------+-----------+----------+
| 7 minutes, 55 seconds | 1 second  | 1 second |
+-----------------------+-----------+----------+
```

### 零值与半秒舍入边界

```sql
SELECT human_readable_seconds(0) AS zero_value,
       human_readable_seconds(0.49) AS below_half,
       human_readable_seconds(0.5) AS half_second;
```

```text
+------------+------------+-------------+
| zero_value | below_half | half_second |
+------------+------------+-------------+
| 0 seconds  | 0 seconds  | 1 second    |
+------------+------------+-------------+
```

### 舍入后向更大单位进位

```sql
SELECT human_readable_seconds(59.5) AS minute_boundary,
       human_readable_seconds(604799.5) AS week_boundary;
```

```text
+-----------------+---------------+
| minute_boundary | week_boundary |
+-----------------+---------------+
| 1 minute        | 1 week        |
+-----------------+---------------+
```

### 跨多个单位的小数秒

```sql
SELECT human_readable_seconds(535333.9513888889) AS duration;
```

```text
+-----------------------------------------+
| duration                                |
+-----------------------------------------+
| 6 days, 4 hours, 42 minutes, 14 seconds |
+-----------------------------------------+
```

### NULL 输入

```sql
SELECT human_readable_seconds(NULL) AS duration;
```

```text
+----------+
| duration |
+----------+
| NULL     |
+----------+
```

### 非有限值

```sql
SELECT human_readable_seconds(CAST('nan' AS DOUBLE)) AS nan_value,
       human_readable_seconds(CAST('inf' AS DOUBLE)) AS positive_infinity,
       human_readable_seconds(CAST('-inf' AS DOUBLE)) AS negative_infinity;
```

```text
+-----------+-------------------+-------------------+
| nan_value | positive_infinity | negative_infinity |
+-----------+-------------------+-------------------+
| NULL      | NULL              | NULL              |
+-----------+-------------------+-------------------+
```

### 支持范围内的 DOUBLE 上边界

```sql
SELECT human_readable_seconds(CAST('9223372036854774784' AS DOUBLE)) AS duration;
```

```text
+---------------------------------------------------------------+
| duration                                                      |
+---------------------------------------------------------------+
| 15250284452471 weeks, 3 days, 15 hours, 13 minutes, 4 seconds |
+---------------------------------------------------------------+
```

### 超范围值与 BIGINT_MAX 的转换

```sql
SELECT human_readable_seconds(1e19) AS too_large,
       human_readable_seconds(9223372036854775807) AS bigint_max,
       human_readable_seconds(-9223372036854775808) AS bigint_min;
```

```text
+-----------+------------+------------+
| too_large | bigint_max | bigint_min |
+-----------+------------+------------+
| NULL      | NULL       | NULL       |
+-----------+------------+------------+
```
