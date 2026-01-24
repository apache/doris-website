---
{
    "title": "SKEW,SKEW_POP,SKEWNESS",
    "language": "zh-CN",
    "description": "返回表达式的 斜度。 用来计算斜度的公式是 3阶中心矩 / ((方差)^{1.5})。"
}
---

## 描述

返回表达式的 [斜度](https://en.wikipedia.org/wiki/Skewness)。
用来计算斜度的公式是 `3阶中心矩 / ((方差)^{1.5})`。

**相关命令**

[kurt](./kurt.md)

## 别名

- SKEW
- SKEW_POP

## 语法

```sql
SKEWNESS(<col>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<col>` | 需要被计算斜度的列，支持类型为 Double。 |

## 返回值

返回 Double 类型的表达式的斜度。
当方差为零时，返回 NULL。
当组内没有合法数据时，返回 NULL。

## 举例
```sql
CREATE TABLE statistic_test(
    tag int, 
    val1 double not null, 
    val2 double null
) DISTRIBUTED BY HASH(tag)
PROPERTIES (
    "replication_num"="1"
);

INSERT INTO statistic_test VALUES
(1, -10, -10),
(2, -20, NULL),
(3, 100, NULL),
(4, 100, NULL),
(5, 1000,1000);

-- NULL 值会被忽略
SELECT 
  skew(val1), 
  skew(val2)
FROM statistic_test;
```

```text
+--------------------+------------+
| skew(val1)         | skew(val2) |
+--------------------+------------+
| 1.4337199628825619 |          0 |
+--------------------+------------+
```

```sql
-- 每组仅包含一行，结果为 NULL。
SELECT 
  skew(val1), 
  skew(val2) 
FROM statistic_test
GROUP BY tag;
```

```text
+------------+------------+
| skew(val1) | skew(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```