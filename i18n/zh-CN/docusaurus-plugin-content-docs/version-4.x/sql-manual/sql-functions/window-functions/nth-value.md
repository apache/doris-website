---
{
    "title": "NTH_VALUE",
    "language": "zh-CN",
    "description": "NTHVALUE() 是一个窗口函数，用于返回窗口分区中有序数据集的第 N 个值，当 N 超出窗口有效大小时，返回结果 NULL。"
}
---

## 描述

NTH_VALUE() 是一个窗口函数，用于返回窗口分区中有序数据集的第 N 个值，当 N 超出窗口有效大小时，返回结果 NULL。

## 语法

```sql
NTH_VALUE(<expr>, <offset>)
```

## 参数
| 参数                | 说明                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- |
| expr                | 需要获取值的表达式，支持类型：tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/array/struct/map/bitmap                                                                |
| offset         | 类型: bigint， 参数 offset 的值为大于0的正整数，用于表示获取的第N的元素值，起始值从1开始                                              |

## 返回值

返回与输入表达式相同的数据类型。

## 举例

```sql
WITH example_data AS (
    SELECT 1 as column1, 66 as column2, 'A' as group_name
    UNION ALL
    SELECT 1, 10, 'A'
    UNION ALL
    SELECT 1, 66, 'A'
    UNION ALL
    SELECT 1, 20, 'A'
    UNION ALL
    SELECT 2, 66, 'B'
    UNION ALL
    SELECT 2, 30, 'B'
    UNION ALL
    SELECT 2, 40, 'B'
)
SELECT 
    group_name,
    column1,
    column2,
    NTH_VALUE(column2, 2) OVER (
        PARTITION BY column1 
        ORDER BY column2
        ROWS BETWEEN 1 preceding and 1 following
    ) as nth
FROM example_data
ORDER BY column1, column2;
```

```text
+------------+---------+---------+------+
| group_name | column1 | column2 | nth  |
+------------+---------+---------+------+
| A          |       1 |      10 |   20 |
| A          |       1 |      20 |   20 |
| A          |       1 |      66 |   66 |
| A          |       1 |      66 |   66 |
| B          |       2 |      30 |   40 |
| B          |       2 |      40 |   40 |
| B          |       2 |      66 |   66 |
+------------+---------+---------+------+
```