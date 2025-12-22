---
{
    "title": "CROSS_PRODUCT",
    "language": "zh-CN"
}
---

## 描述

计算两个三维向量的叉积

## 语法

```sql
CROSS_PRODUCT(<array1>, <array2>)
```

## 参数

| 参数 | 说明 |
| -- |--|
| `<array1>` | 第一个向量，输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE，元素数量需与 array2 保持一致，数组本身与数组元素均不允许为NULL|
| `<array2>` | 第二个向量，输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE，元素数量需与 array1 保持一致，数组本身与数组元素均不允许为NULL|

## 返回值

返回两个三维向量的叉积。

## 举例

### 正常情况
简单查询
```sql
SELECT CROSS_PRODUCT([1, 2, 3], [2, 3, 4]);
+-------------------------------------+
| CROSS_PRODUCT([1, 2, 3], [2, 3, 4]) |
+-------------------------------------+
| [-1, 2, -1]                         |
+-------------------------------------+
SELECT CROSS_PRODUCT([1, 2, 3], [0, 0, 0]);
+-------------------------------------+
| CROSS_PRODUCT([1, 2, 3], [0, 0, 0]) |
+-------------------------------------+
| [0, 0, 0]                           |
+-------------------------------------+
SELECT CROSS_PRODUCT([1, 0, 0], [0, 1, 0]);
+-------------------------------------+
| CROSS_PRODUCT([1, 0, 0], [0, 1, 0]) |
+-------------------------------------+
| [0, 0, 1]                           |
+-------------------------------------+
SELECT CROSS_PRODUCT([0, 1, 0], [1, 0, 0]);
+-------------------------------------+
| CROSS_PRODUCT([0, 1, 0], [1, 0, 0]) |
+-------------------------------------+
| [0, 0, -1]                          |
+-------------------------------------+
SELECT CROSS_PRODUCT(NULL, [1, 2, 3]);
+--------------------------------+
| CROSS_PRODUCT(NULL, [1, 2, 3]) |
+--------------------------------+
| NULL                           |
+--------------------------------+
SELECT CROSS_PRODUCT([1, 2, 3], NULL);
+--------------------------------+
| CROSS_PRODUCT([1, 2, 3], NULL) |
+--------------------------------+
| NULL                           |
+--------------------------------+
```
表查询
```sql
CREATE TABLE array_cross_product_test (
    id INT,
    vec1 ARRAY<DOUBLE>,
    vec2 ARRAY<DOUBLE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);
INSERT INTO array_cross_product_test VALUES
(1, [1, 2, 3], [2, 3, 4]),
(2, [1, 2, 3], [0, 0, 0]),
(3, [1, 0, 0], [0, 1, 0]),
(4, [0, 1, 0], [1, 0, 0]),
(5, NULL, [1, 0, 0]);

SELECT id, CROSS_PRODUCT(vec1, vec2) from array_cross_product_test order by id;
+------+---------------------------+
| id   | CROSS_PRODUCT(vec1, vec2) |
+------+---------------------------+
|    1 | [-1, 2, -1]               |
|    2 | [0, 0, 0]                 |
|    3 | [0, 0, 1]                 |
|    4 | [0, 0, -1]                |
|    5 | NULL                      |
+------+---------------------------+
```

### 异常情况
参数数组中某一元素为NULL
```sql
SELECT CROSS_PRODUCT([1, NULL, 3], [1, 2, 3])
First argument for function cross_product cannot have null elements
```
```sql
SELECT CROSS_PRODUCT([1, 2, 3], [NULL, 2, 3]);
Second argument for function cross_product cannot have null elements
```
两个参数数组长度不一致
```sql
SELECT CROSS_PRODUCT([1, 2, 3], [1, 2]);
function cross_product have different input element sizes of array: 3 and 2
```
参数数组长度不为3
```sql
SELECT CROSS_PRODUCT([1, 2, 3, 4], [1, 2, 3, 4]);
function cross_product requires arrays of size 3
```
```sql
SELECT CROSS_PRODUCT([1, 2], [3, 4]);
function cross_product requires arrays of size 3
```

