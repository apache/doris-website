---
{
    "title": "ENTROPY",
    "language": "zh-CN",
    "description": "计算指定列或表达式中所有非 NULL 值的香农熵（Shannon Entropy）。"
}
---

## 描述

计算指定列或表达式中所有非 NULL 值的香农熵（Shannon Entropy）。

熵用于衡量分布的不确定性或随机性。该函数会基于输入值构建经验频率分布，并使用以 2 为底的对数计算熵，单位为 比特（bits）。

香农熵的定义如下：

$
Entropy(X) = -\sum_{i=1}^{k} p_i \log_2(p_i)
$

其中：

- $k$ 为非 NULL 的不同值的数量  
- $p_i = \frac{x_i的数量}{\text{所有非null值数量}}$

:::info 备注
从 Apache Doris 4.1.0 开始支持该函数
:::

## 语法

```sql
ENTROPY(<expr1> [, <expr2>, ... , <exprN>])
```

## 参数

| 参数 | 说明 |
|------|------|
| `<expr1> [, <expr2>, ...]` | 一个或多个表达式或列。支持的类型包括：TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、String、IPv4/IPv6、Array、Map、Struct 等。当提供多列时，每行的多个值会被序列化为一个复合键，并基于复合键的频率分布计算熵。 |

## 返回值

返回一个 DOUBLE，表示以比特为单位的香农熵。

- 如果所有值均为 NULL 或输入为空，则返回 NULL。
- 计算过程中会忽略 NULL 值。

## 举例

```sql
CREATE TABLE t1 (
    id INT,
    c1 INT,
    c2 STRING
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num"="1");

INSERT INTO t1 VALUES
    (1, 1, "a"),
    (2, 1, "a"),
    (3, 1, "b"),
    (4, 2, "a"),
    (5, NULL, "a");
```

```sql
SELECT entropy(c1) FROM t1;
```

频率分布：1 → 3, 2 → 1

熵的计算：$H = -\left(\frac{1}{4}\log_2\frac{1}{4} + \frac{3}{4}\log_2\frac{3}{4}\right)=0.811$

```text
+--------------------+
| entropy(c1)        |
+--------------------+
| 0.8112781244591328 |
+--------------------+
```

```sql
SELECT entropy(c1, c2) FROM t1;
```

频率分布：(1, "a") → 2, (1, "b") → 1, (2, "a") → 1

熵的计算：$H = -\left(\frac{1}{4}\log_2\frac{1}{4} + \frac{2}{4}\log_2\frac{2}{4}+ \frac{1}{4}\log_2\frac{1}{4}\right)=1.5$

```text
+-----------------+
| entropy(c1, c2) |
+-----------------+
|             1.5 |
+-----------------+
```

```sql
SELECT entropy(1);
```

只有一个唯一值 → 熵 = 0

```text
+------------+
| entropy(1) |
+------------+
|          0 |
+------------+
```

```sql
SELECT entropy(NULL) FROM t1;
```

当所有值均为 NULL 或输入为空时返回 NULL。

```text
+---------------+
| entropy(NULL) |
+---------------+
|          NULL |
+---------------+
```
