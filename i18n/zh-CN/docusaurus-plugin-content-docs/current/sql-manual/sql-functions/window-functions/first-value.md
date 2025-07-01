---
{
    "title": "FIRST_VALUE",
    "language": "zh-CN"
}
---

## 描述

FIRST_VALUE() 是一个窗口函数，用于返回窗口分区中有序数据集的第一个值。可以通过 IGNORE NULLS 选项来控制是否忽略空值。

## 语法

```sql
FIRST_VALUE(<expr>[, <ignore_null>])
```

## 参数
| 参数                | 说明                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- |
| expr                | 需要获取第一个值的表达式                                                                |
| ignore_null         | 可选。参数 ignore_null 默认值为 false, 设置后会忽略空值                                              |

## 返回值

返回与输入表达式相同的数据类型。

## 举例

```sql
WITH example_data AS (
    SELECT 1 as column1, NULL as column2, 'A' as group_name
    UNION ALL
    SELECT 1, 10, 'A'
    UNION ALL
    SELECT 1, NULL, 'A'
    UNION ALL
    SELECT 1, 20, 'A'
    UNION ALL
    SELECT 2, NULL, 'B'
    UNION ALL
    SELECT 2, 30, 'B'
    UNION ALL
    SELECT 2, 40, 'B'
)
SELECT 
    group_name,
    column1,
    column2,
    FIRST_VALUE(column2) OVER (
        PARTITION BY column1 
        ORDER BY column2 NULLS LAST
    ) AS first_value_default,
    FIRST_VALUE(column2, true) OVER (
        PARTITION BY column1 
        ORDER BY column2
    ) AS first_value_ignore_null
FROM example_data
ORDER BY column1, column2;
```

```text
+------------+---------+---------+---------------------+-------------------------+
| group_name | column1 | column2 | first_value_default | first_value_ignore_null |
+------------+---------+---------+---------------------+-------------------------+
| A          |       1 |    NULL |                  10 |                    NULL |
| A          |       1 |    NULL |                  10 |                    NULL |
| A          |       1 |      10 |                  10 |                      10 |
| A          |       1 |      20 |                  10 |                      10 |
| B          |       2 |    NULL |                  30 |                    NULL |
| B          |       2 |      30 |                  30 |                      30 |
| B          |       2 |      40 |                  30 |                      30 |
+------------+---------+---------+---------------------+-------------------------+
```