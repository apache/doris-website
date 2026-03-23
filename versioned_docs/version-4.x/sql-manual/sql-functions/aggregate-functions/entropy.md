---
{
    "title": "ENTROPY",
    "language": "en",
    "description": "Calculate the Shannon entropy of all non-null values in the specified column or expression."
}
---

## Description

Computes the Shannon entropy of all non-null values in the specified column or expression.

Entropy measures the uncertainty or randomness of a distribution. This function builds an empirical frequency map of the input values and computes entropy in bits using the base‑2 logarithm.

The Shannon entropy is defined as:

$
Entropy(X) = -\sum_{i=1}^{k} p_i \log_2(p_i)
$

Where:

- $k$ is the number of distinct non-null values  
- $p_i = \frac{\text{count}(x_i)}{\text{total non-null count}}$

:::info Note
Supported since Apache Doris 4.1.0
:::

## Syntax

```sql
ENTROPY(<expr1> [, <expr2>, ... , <exprN>])
```

## Parameters

| Parameter | Description |
|----------|-------------|
| `<expr1> [, <expr2>, ...]` | One or more expressions or columns. Supported types: TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, String, IPv4/IPv6, Array, Map, Struct. When multiple expressions are provided, their values are serialized together to form a single composite key, and entropy is computed over the frequency distribution of these composite keys. |

## Return Value

Returns a DOUBLE representing the Shannon entropy in bits.

- Returns NULL if all values are NULL or the input is empty.
- Ignores NULL values during computation.

## Examples

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

Distribution: 1 → 3, 2 → 1

$H = -\left(\frac{1}{4}\log_2\frac{1}{4} + \frac{3}{4}\log_2\frac{3}{4}\right)=0.811$

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

Distribution: (1, "a") → 2, (1, "b") → 1, (2, "a") → 1

$H = -\left(\frac{1}{4}\log_2\frac{1}{4} + \frac{2}{4}\log_2\frac{2}{4}+ \frac{1}{4}\log_2\frac{1}{4}\right)=1.5$

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

Only one distinct value → entropy = 0

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

Returns NULL if all values are NULL or the input is empty.

```text
+---------------+
| entropy(NULL) |
+---------------+
|          NULL |
+---------------+
```
