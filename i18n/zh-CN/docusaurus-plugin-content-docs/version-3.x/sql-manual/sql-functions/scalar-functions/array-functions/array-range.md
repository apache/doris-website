---
{
    "title": "ARRAY_RANGE",
    "language": "zh-CN",
}
---

## 描述

1. 生成 int 数组
2. 生成日期时间数组

## 别名

- SEQUENCE

## 语法

```sql
ARRAY_RANGE(<end>)
ARRAY_RANGE(<start>, <end>)
ARRAY_RANGE(<start>, <end>, <step>)
ARRAY_RANGE(<start_datetime>, <end_datetime>)
ARRAY_RANGE(<start_datetime>, <end_datetime>, INTERVAL <interval_step> <unit>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<start>` | 起始值，为正整数，默认为 0 |
| `<end>` | 结束值，为正整数 |
| `<step>` | 步长，为正整数，默认为 1 |
| `<start_datetime>` | 起始日期，为 datetimev2 类型 |
| `<end_datetime>` | 结束日期，为 datetimev2 类型 |
| `<interval_step>` | 间隔值，默认为 1 |
| `<unit>` | 间隔单位，支持年(year)/季度(quarter)/月(month)/周(week)/日(day)/小时(hour)/分钟(minute)/秒(second)，默认为日(day) |

:::tip 
quarter 支持从 3.0.8 和 3.1.0 版本开始。
:::

## 返回值

1. 返回一个数组，从 start 到 end - 1, 步长为 step。如果第三个参数 step 为负数或者零，函数结果将为 NULL
2. 返回 start_datetime 和最接近 end_datetime 之间的 datetimev2 数组（按 Interval_step UNIT 计算）。如果第三个参数 interval_step 为负数或者零，函数结果将为 NULL

## 举例

```sql
SELECT ARRAY_RANGE(0,20,2),ARRAY_RANGE(cast('2019-05-15 12:00:00' as datetimev2(0)), cast('2022-05-17 12:00:00' as datetimev2(0)), interval 2 year);
```

```text
+-------------------------------------+----------------------------------------------------------------------------------------------------------------------+
| array_range(0, 20, 2)               | array_range_year_unit(cast('2019-05-15 12:00:00' as DATETIMEV2(0)), cast('2022-05-17 12:00:00' as DATETIMEV2(0)), 2) |
+-------------------------------------+----------------------------------------------------------------------------------------------------------------------+
| [0, 2, 4, 6, 8, 10, 12, 14, 16, 18] | ["2019-05-15 12:00:00", "2021-05-15 12:00:00"]                                                                       |
+-------------------------------------+----------------------------------------------------------------------------------------------------------------------+
```
