---
{
    "title": "STDDEV_SAMP",
    "language": "zh-CN",
    "description": "返回 expr 表达式的样本标准差"
}
---

## 描述

返回 expr 表达式的样本标准差

## 语法

```sql
STDDEV_SAMP(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 需要被计算标准差的值，支持类型为 Double。 |

## 返回值

返回 Double 类型的参数 expr 的样本标准差。
当组内没有合法数据时，返回 NULL。

## 举例
```sql
-- 创建示例表
CREATE TABLE score_table (
    student_id INT,
    score DOUBLE
) DISTRIBUTED BY HASH(student_id)
PROPERTIES (
    "replication_num" = "1"
);

-- 插入测试数据
INSERT INTO score_table VALUES
(1, 85),
(2, 90),
(3, 82),
(4, 88),
(5, 95);

-- 计算所有学生分数的样本标准差
SELECT STDDEV_SAMP(score) as score_stddev
FROM score_table;
```

```text
+-------------------+
| score_stddev      |
+-------------------+
| 4.949747468305831 |
+-------------------+
```
