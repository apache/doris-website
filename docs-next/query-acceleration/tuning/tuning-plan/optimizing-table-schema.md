---
{
    "title": "Optimizing Table Schema Design: Table Models, Bucketing Columns, Key Columns, and Field Type Tuning",
    "sidebar_label": "Optimizing Table Schema Design",
    "language": "en",
    "description": "How to tune Doris table schemas through table model selection, bucketing column design, Key column optimization, and field type tuning? This article gives actionable tuning advice from typical scenarios.",
    "keywords": ["Doris schema design", "Doris table model", "bucketing column optimization", "Key column optimization", "field type optimization", "data skew", "Doris performance tuning"]
}
---

<!-- Knowledge type: concept + how-to guide -->
<!-- Applicable scenario: schema design before table creation and query performance tuning -->

Table schema design is a critical part of Doris performance tuning. It directly affects data distribution, query parallelism, and sorting efficiency.

An unreasonable schema design often causes the following issues:

- Data skew, which prevents query parallelism from being fully utilized
- Sort properties become ineffective, slowing down equality and range queries
- Inappropriate field types, which raise computation overhead

For more detailed design principles, see the [Table Design](../../../table-design/overview.mdx) chapter. This chapter starts from real-world cases to show typical schema design issues and tuning recommendations.

### Tuning Checklist

When designing or troubleshooting a table schema, check the following items in order:

- Did you choose a table model that matches your business (Duplicate / Unique / Aggregate)?
- Are the bucketing columns evenly hashed, with no skew from null or fixed values?
- Are the columns frequently used in equality and range queries defined as Key columns?
- Do field types follow the principle of "fixed-length first, low-precision first"?

## Case 1: Table Model Selection

<!-- Knowledge type: concept comparison -->
<!-- Applicable scenario: model selection before table creation -->

Doris provides three table models: Duplicate, Unique (MOR/MOW), and Aggregate. Their query performance and feature characteristics differ.

### Comparison of the Three Table Models

| Table Model        | Query Performance | Supports Updates | Typical Scenarios                                |
| ------------------ | ----------------- | ---------------- | ------------------------------------------------ |
| Duplicate          | Highest           | No               | High-performance queries on logs and detail data |
| Unique (MOW)       | High              | Yes              | Primary-key deduplication with high query performance requirements |
| Unique (MOR)       | Average           | Yes              | Primary-key deduplication with frequent writes   |
| Aggregate          | Average           | Aggregated update | Pre-aggregated reports and metric rollups       |

> Performance ranking: Duplicate > MOW > MOR ≈ Aggregate

:::tip Tuning recommendation

When the business has no data update requirements and demands high query performance, prefer the [Duplicate table](../../../table-design/data-model/duplicate.md).

:::

## Case 2: Bucketing Column Selection

<!-- Knowledge type: how-to guide -->
<!-- Applicable scenario: data skew troubleshooting and design before table creation -->

**One-sentence definition**: The bucketing column determines how data is distributed across buckets. A poor choice causes data skew, which becomes a query performance bottleneck.

A reasonable bucketing column design can:

-   Prevent data skew and fully utilize parallelism
-   Maximize the effectiveness of Colocate Join and Bucket Shuffle Join

### Bad Example: c2 Column Contains a Large Number of Nulls

In the following example, the bucketing column is set to `c2`, but `c2` is all null in the imported data. As a result, only 1 of the 64 buckets carries all the data:

```sql
CREATE TABLE `t1` (
  `c1` INT NULL,
  `c2` INT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 64
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
insert into t1 select number, null from numbers ('number'='10000000');
```

### Optimization: Switch to a Column with High Cardinality

Change the bucketing column from `c2` to `c1` so that data is evenly distributed across buckets, improving parallel processing capability.

### Command for Troubleshooting Data Skew

**Purpose**: Confirm whether the bucketing column is skewed.
**Command**:

```sql
select c2, count(*) cnt from t1 group by c2 order by cnt desc limit 10;
```

**Explanation**: If the cnt of the top values is much larger than the others, the column has serious skew and is not suitable as a bucketing column.

### Principles for Bucketing Column Selection

-   Avoid columns that tend to have null or fixed values in the business
-   Prefer fields with high business cardinality, such as user ID or order ID
-   Estimate field value distribution before creating the table, and sample to verify when necessary

:::tip Tuning recommendation

Check whether the bucketing column has data skew. If so, replace it with a field with higher cardinality. Up-front design significantly reduces the cost of later diagnosis and correction.

:::

## Case 3: Key Column Optimization

<!-- Knowledge type: how-to guide -->
<!-- Applicable scenario: equality and range query performance tuning -->

**One-sentence definition**: Doris sorts data by Key columns at the storage layer. Defining frequently queried columns as Key columns can significantly accelerate equality and range queries.

### Business Query Examples

```sql
select * from t1 where t1.c1 = 1;
select * from t1 where t1.c1 > 1 and t1.c1 < 10;
select * from t1 where t1.c1 in (1, 2, 3);
```

### Optimization: Define c1 as a Key Column

```sql
CREATE TABLE `t1` (
  `c1` INT NULL,
  `c2` INT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

:::tip Tuning recommendation

Define columns frequently used in business equality or range queries as Key columns to accelerate query processing.

:::

## Case 4: Field Type Optimization

<!-- Knowledge type: principles and best practices -->
<!-- Applicable scenario: table creation and field type refactoring -->

**One-sentence definition**: Field types directly affect computation complexity. Fixed-length and low-precision types are more efficient to process than variable-length and high-precision types.

### Type Selection Principles

| Principle             | Recommended                                | Avoid                              |
| --------------------- | ------------------------------------------ | ---------------------------------- |
| Fixed-length first    | INT, BIGINT, DATE, DATETIME                | VARCHAR, STRING                    |
| Low-precision first   | INT, BIGINT, FLOAT                         | DECIMAL (in high-precision scenarios) |

### Common Replacement Scenarios

-   Use BIGINT to replace VARCHAR / STRING fields used to store numeric values
-   Use FLOAT / INT / BIGINT to replace unnecessary DECIMAL fields
-   Use DATETIME to replace string-form time fields

:::tip Tuning recommendation

When defining schema types, follow the principle of "fixed-length first, low-precision first" to improve computation efficiency and system performance.

:::

## Frequently Asked Questions

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: common questions during tuning -->

### Q1: What if I find the bucketing column is unreasonable after creating the table?

The bucketing column cannot be modified directly after the table is created. You need to create a new table and re-import the data, or use `ALTER TABLE` to create a new Rollup or partitioning scheme. It is recommended to thoroughly evaluate field cardinality before creating the table.

### Q2: Are more Key columns always better?

No. Too many Key columns increase storage sorting overhead and write costs. Only set columns that are truly frequently used for equality or range filtering as Key columns.

### Q3: When must I use the Unique or Aggregate model?

-   Need to deduplicate or update data by primary key, use Unique
-   Need pre-aggregation (SUM, MAX, MIN, etc.), use Aggregate
-   Append-only detail data with extreme query performance requirements, use Duplicate

### Q4: How do I determine whether the current table has data skew?

Run the following SQL to check the bucketing column distribution:

```sql
select <bucket_col>, count(*) cnt from <table> group by <bucket_col> order by cnt desc limit 10;
```

If the count of the top values far exceeds the others, skew exists.

## Summary

A carefully designed schema maximizes the use of Doris features and significantly improves query performance. A poor schema may cause global issues such as data skew.

Key tuning points:

-   Prefer the Duplicate table model (in scenarios with no update requirements)
-   Choose bucketing columns with high cardinality, avoiding null or fixed values
-   Define frequently queried columns as Key columns
-   Follow the principle of "fixed-length first, low-precision first" for field types

Up-front design is always cheaper than after-the-fact tuning. It is recommended to strictly follow the above principles during the schema design phase.
