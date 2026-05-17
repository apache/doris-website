---
{
    "title": "BOOL_AND",
    "language": "zh-CN",
    "description": "对表达式中所有非 NULL 值执行逻辑与（AND）聚合计算。"
}
---

## 描述

对表达式中所有非 NULL 值执行逻辑与（AND）聚合计算。

## 别名

- BOOLAND_AGG

## 语法

```text
BOOL_AND(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 参与逻辑与（AND）聚合的表达式。支持布尔类型，及可按 0/非 0 规则转换为布尔值的数值类型（0 为 FALSE，非 0 为 TRUE）|

## 返回值

返回值为 BOOLEAN。仅当所有非 NULL 值均为 TRUE 时返回 TRUE, 否则返回 FALSE。

如果表达式中所有的值都为 NULL 或表达式为空，则返回 NULL。


## 举例

初始化表：
```sql
CREATE TABLE IF NOT EXISTS test_boolean_agg (
     id INT,
     c1 BOOLEAN,
     c2 BOOLEAN,
     c3 BOOLEAN,
     c4 BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1"); 

INSERT INTO test_boolean_agg (id, c1, c2, c3, c4) values 
(1, true, true, true, false),
(2, true, false, false, false),
(3, true, true, false, false),
(4, true, false, false, false);
```

### 聚合函数

```sql
SELECT BOOLAND_AGG(c1), BOOLAND_AGG(c2), BOOLAND_AGG(c3), BOOLAND_AGG(c4)
FROM test_boolean_agg;
```
```text
+-----------------+-----------------+-----------------+-----------------+
| BOOLAND_AGG(c1) | BOOLAND_AGG(c2) | BOOLAND_AGG(c3) | BOOLAND_AGG(c4) |
+-----------------+-----------------+-----------------+-----------------+
|               1 |               0 |               0 |               0 |
+-----------------+-----------------+-----------------+-----------------+
```

bool_and也可以接受数值类型的参数，如果数值不为 0，则将其转为 `TRUE`
```sql
CREATE TABLE test_numeric_and_null (
    id INT,
    c_int INT,
    c_float FLOAT,
    c_decimal DECIMAL(10,2),
    c_bool BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_numeric_and_null (id, c_int, c_float, c_decimal, c_bool) VALUES
(1, 1, 1.0, NULL, NULL),
(2, 0, NULL, 0.00, NULL),
(3, 1, 3.14, 1.00, NULL),
(4, 0, 1.0, 0.00, NULL),
(5, NULL, NULL, NULL, NULL);
```

```sql
SELECT
    BOOL_AND(c_int) AS bool_and_int,
    BOOL_AND(c_float) AS bool_and_float,
    BOOL_AND(c_decimal) AS bool_and_decimal,
    BOOL_AND(c_bool) AS bool_and_bool
FROM test_numeric_and_null;
```
```text
+--------------+----------------+------------------+---------------+
| bool_and_int | bool_and_float | bool_and_decimal | bool_and_bool |
+--------------+----------------+------------------+---------------+
|            0 |              1 |                0 |          NULL |
+--------------+----------------+------------------+---------------+
```

### 窗口函数
下例按条件 (id > 2) 对行进行分区，将其划分为两组并展示窗口聚合结果：
```sql
SELECT * FROM test_boolean_agg;
```
```text
+------+------+------+------+------+
| id   | c1   | c2   | c3   | c4   |
+------+------+------+------+------+
|    1 |    1 |    1 |    1 |    0 |
|    2 |    1 |    0 |    0 |    0 |
|    3 |    1 |    1 |    0 |    0 |
|    4 |    1 |    0 |    0 |    0 |
+------+------+------+------+------+
```
```sql
SELECT
    id,
    BOOLAND_AGG(c1) OVER (PARTITION BY (id > 2)) AS a,
    BOOLAND_AGG(c2) OVER (PARTITION BY (id > 2)) AS b,
    BOOLAND_AGG(c3) OVER (PARTITION BY (id > 2)) AS c,
    BOOLAND_AGG(c4) OVER (PARTITION BY (id > 2)) AS d
FROM test_boolean_agg
ORDER BY id;
```
```text
+------+------+------+------+------+
| id   | a    | b    | c    | d    |
+------+------+------+------+------+
|    1 |    1 |    0 |    0 |    0 |
|    2 |    1 |    0 |    0 |    0 |
|    3 |    1 |    0 |    0 |    0 |
|    4 |    1 |    0 |    0 |    0 |
+------+------+------+------+------+
```

### 错误示例:
```sql
SELECT BOOL_AND('invalid type');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = bool_and requires a boolean or numeric argument
```