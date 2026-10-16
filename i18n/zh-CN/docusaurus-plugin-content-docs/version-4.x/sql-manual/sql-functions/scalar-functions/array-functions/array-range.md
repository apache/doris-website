---
{
    "title": "ARRAY_RANGE",
    "language": "zh-CN",
    "description": "生成数值或日期时间的等差序列数组。"
}
---

<a id="功能"></a>

## 描述

生成数值或日期时间的等差序列数组。结果包含起点，不包含终点；任一参数为 NULL 时返回 NULL。

Doris 4.1 系列自 4.1.5 起，日期时间序列会保留所有小于终点的有效值，即使最后一个值与终点之间不足一个完整间隔。此前可能遗漏这些尾部值。

## 语法

```sql
ARRAY_RANGE(<end>)
ARRAY_RANGE(<start>, <end> [, <step>])
ARRAY_RANGE(<start_dt>, <end_dt> [, INTERVAL <step> <unit>])
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<start>` | 可选，非负 INT 类型起点，省略时为 0。 |
| `<end>` | 非负 INT 类型终点，结果不包含该值。 |
| `<step>` | 可选，正整数步长，默认值为 1。 |
| `<start_dt>`、`<end_dt>` | DATETIME 类型起点和终点，结果不包含终点。省略 INTERVAL 时，步长为 1 DAY。 |
| `<unit>` | 日期时间步长单位，支持 YEAR、QUARTER、MONTH、WEEK、DAY、HOUR、MINUTE、SECOND。 |

## 返回值

返回 ARRAY 类型，数值序列元素为 INT，日期时间序列元素为 DATETIME。

<a id="使用说明"></a>

- 任一参数为 NULL，或参数非法（如数值起点或终点为负、步长非正）时，返回 NULL。
- 起点不小于终点时，返回空数组 `[]`。
- 每一步以上一步的结果计算下一个值。月份运算可能将日期调整为目标月份的最后一天。
- 序列超过数组大小上限时会报错；达到日期类型上界后不再生成越界的后继值。
- `SEQUENCE` 是 `ARRAY_RANGE` 的别名。

## 示例

数值序列不包含终点：

```sql
SELECT ARRAY_RANGE(5), ARRAY_RANGE(2, 6, 2), ARRAY_RANGE(3, 2);
```

```text
[0, 1, 2, 3, 4]    [2, 4]    []
```

日期时间默认每次递增一天；末尾不足一天仍保留最后一个值：

```sql
SELECT ARRAY_RANGE(
    CAST('2024-01-01 00:00:00.000000' AS DATETIME(6)),
    CAST('2024-01-02 12:00:00.000000' AS DATETIME(6)));
```

```text
["2024-01-01 00:00:00.000000", "2024-01-02 00:00:00.000000"]
```

指定月份步长，每一步都基于上一个日期递增：

```sql
SELECT ARRAY_RANGE(
    CAST('2020-01-31 00:00:00' AS DATETIME(6)),
    CAST('2020-03-30 00:00:00' AS DATETIME(6)), INTERVAL 1 MONTH);
```

```text
["2020-01-31 00:00:00.000000", "2020-02-29 00:00:00.000000", "2020-03-29 00:00:00.000000"]
```

`SEQUENCE` 使用相同规则：

```sql
SELECT SEQUENCE(
    CAST('2024-01-01 00:00:00.000000' AS DATETIME(6)),
    CAST('2024-01-01 00:00:01.500000' AS DATETIME(6)), INTERVAL 1 SECOND);
```

```text
["2024-01-01 00:00:00.000000", "2024-01-01 00:00:01.000000"]
```

NULL 或非法参数：

```sql
SELECT ARRAY_RANGE(NULL), ARRAY_RANGE(-1, 3), ARRAY_RANGE(1, 3, 0);
```

```text
NULL    NULL    NULL
```
