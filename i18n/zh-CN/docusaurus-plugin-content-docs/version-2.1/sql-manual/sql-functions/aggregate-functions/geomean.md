---
{
    "title": "GEOMEAN",
    "language": "zh-CN"
}
---

## Description

计算指定列中一组值的几何平均值。几何平均值定义为 n 个值的乘积的 n 次方根，即 $(x_1 \cdot x_2 \cdot \ldots \cdot x_n)^{1/n}$，其中 n 是输入值的数量。Doirs中的GEOMEAN实现将更加契合数学直觉，具体表现在允许列中有负值和0的存在，具体的计算规则可以参考下返回值。对于NULL，直接跳过。

## 语法

```sql
GEOMEAN(<col>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<col>` | 一个表达式（通常是列名），指定用于计算几何平均值的值。值必须为非负的DOUBLE（允许零和 NULL）。 |

## 返回值

- 如果输入列存在0， 返回0。
- 如果输入列为空， 返回NULL。
- 如果输入列存在偶数个负数，或者存在奇数个负数且参与计算元素为奇数，返回正常DOUBLE类型的值。
- 如果输入列存在奇数个负数，但参与计算元素为偶数，抛出异常。

## 示例

```sql
-- 创建测试表
CREATE TABLE test_geomean_new (
    id INT,
    value DOUBLE
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

-- 示例 1：包含 NULL，忽略 NULL 后正常计算
INSERT INTO test_geomean_new VALUES (1, 2.0), (1, NULL), (1, 8.0);
SELECT id, GEOMEAN(value) AS geometric_mean FROM test_geomean_new WHERE id = 1 GROUP BY id;
+------+----------------+
| id   | geometric_mean |
+------+----------------+
|    1 |              4 |
+------+----------------+

-- 示例 2：仅包含 NULL，返回 NULL
INSERT INTO test_geomean_new VALUES (2, NULL);
SELECT id, GEOMEAN(value) AS geometric_mean FROM test_geomean_new WHERE id = 2 GROUP BY id;
+------+----------------+
| id   | geometric_mean |
+------+----------------+
|    2 |           NULL |
+------+----------------+


-- 示例 3：包含 0，返回 0
INSERT INTO test_geomean_new VALUES (3, 5.0), (3, 0.0);
SELECT id, GEOMEAN(value) AS geometric_mean FROM test_geomean_new WHERE id = 3 GROUP BY id;
+------+----------------+
| id   | geometric_mean |
+------+----------------+
|    3 |              0 |
+------+----------------+

-- 示例 4：偶数个负数，正常计算
INSERT INTO test_geomean_new VALUES (4, -2.0), (4, -8.0);
SELECT id, GEOMEAN(value) AS geometric_mean FROM test_geomean_new WHERE id = 4 GROUP BY id;
+------+----------------+
| id   | geometric_mean |
+------+----------------+
|    4 |              4 |
+------+----------------+


-- 示例 5：奇数个负数，参与计算元素为奇数，正常计算
INSERT INTO test_geomean_new VALUES (5, -2.0), (5, 4.0), (5, 8.0);
SELECT id, GEOMEAN(value) AS geometric_mean FROM test_geomean_new WHERE id = 5 GROUP BY id;
+------+----------------+
| id   | geometric_mean |
+------+----------------+
|    5 |             -4 |
+------+----------------+


-- 示例 6：奇数个负数，参与计算元素为偶数，抛出异常
INSERT INTO test_geomean_new VALUES (6, -2.0), (6, 4.0);
SELECT id, GEOMEAN(value) AS geometric_mean FROM test_geomean_new WHERE id = 6 GROUP BY id;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Geometric mean is undefined for odd number of negatives with even n
```