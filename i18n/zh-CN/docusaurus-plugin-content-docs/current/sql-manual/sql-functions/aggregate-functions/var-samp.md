---
{
    "title": "VAR_SAMP,VARIANCE_SAMP",
    "language": "zh-CN",
    "description": "VARSAMP 函数计算指定表达式的样本方差。与 VARIANCE（总体方差）不同，VARSAMP 使用 n-1 作为除数，这在统计学上被认为是对总体方差的无偏估计。"
}
---

## 描述

VAR_SAMP 函数计算指定表达式的样本方差。与 VARIANCE（总体方差）不同，VAR_SAMP 使用 n-1 作为除数，这在统计学上被认为是对总体方差的无偏估计。

## 别名

- VARIANCE_SAMP

## 语法

```sql
VAR_SAMP(<expr>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<expr>` | 要计算样本方差的列或表达式，支持类型为 Double。 |

## 返回值
返回一个 Double 类型的值，表示计算得到的样本方差。
组内没有合法数据时，返回 NULL。

## 举例
```sql
-- 创建示例表
CREATE TABLE student_scores (
    student_id INT,
    score DECIMAL(4,1)
) DISTRIBUTED BY HASH(student_id)
PROPERTIES (
    "replication_num" = "1"
);

-- 插入测试数据
INSERT INTO student_scores VALUES
(1, 85.5),
(2, 92.0),
(3, 78.5),
(4, 88.0),
(5, 95.5),
(6, 82.0),
(7, 90.0),
(8, 87.5);

-- 计算学生成绩的样本方差
SELECT 
    VAR_SAMP(score) as sample_variance,
    VARIANCE(score) as population_variance
FROM student_scores;
```

```text
+------------------+---------------------+
| sample_variance  | population_variance |
+------------------+---------------------+
| 29.4107142857143 |   25.73437500000001 |
+------------------+---------------------+
```
