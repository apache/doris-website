---
{
    "title": "Partition Pruning Optimization: Doris Query Performance Tuning",
    "sidebar_label": "Partition Pruning Optimization",
    "language": "en",
    "description": "How to use Doris partition pruning to reduce the amount of data scanned and accelerate queries? This article explains the principle, SQL patterns, and EXPLAIN verification methods through examples.",
    "keywords": ["Doris partition pruning", "Partition Pruning", "table scan optimization", "query performance tuning", "EXPLAIN partition"]
}
---

<!-- Knowledge type: Tuning guide -->
<!-- Applicable scenario: Slow large-table queries, high I/O overhead, need to filter data by partition columns -->

**Partition Pruning** is a query optimization technique: it intelligently identifies the relevant partitions based on the query conditions, scans only those partitions, and skips the irrelevant ones.

Through partition pruning, Doris can significantly reduce I/O and computation, accelerating queries on large tables.

**Applicability checklist**:

- The table is partitioned by a business column (such as date).
- The query conditions include filters on the partition column (for example, `WHERE date BETWEEN ...`).
- You want to reduce the number of partitions scanned and lower I/O.
- You need to verify with `EXPLAIN` whether pruning takes effect.

## Case: a sales table partitioned by date

<!-- Knowledge type: Operational example -->
<!-- Applicable scenario: Date-range queries, time-series data analysis -->

The following case demonstrates the partition pruning capability of Doris.

### 1. Create a table: range partitioning by date

**Goal**: Create a sales data table `sales` partitioned by date, with one partition per month.

**Command**:

```sql
CREATE TABLE sales (
    date DATE,
    product VARCHAR(50),
    amount DECIMAL(10, 2)
)
PARTITION BY RANGE(date) (
    PARTITION p1 VALUES LESS THAN ('2023-01-01'),
    PARTITION p2 VALUES LESS THAN ('2023-02-01'),
    PARTITION p3 VALUES LESS THAN ('2023-03-01'),
    PARTITION p4 VALUES LESS THAN ('2023-04-01')
)
DISTRIBUTED BY HASH(date) BUCKETS 16
PROPERTIES
(
    "replication_num" = "1"
);
```

**Description**: The partition column is `date`. There are 4 partitions in total, each covering one month of data.

### 2. Query: with a filter on the partition column

**Goal**: Query the total sales amount between January 15, 2023 and February 15, 2023.

**Command**:

```sql
SELECT SUM(amount) AS total_amount
FROM sales
WHERE date BETWEEN '2023-01-15' AND '2023-02-15';
```

**Description**: The `WHERE` clause contains a range filter on the partition column `date`, which is the key to triggering partition pruning.

### 3. Partition pruning execution process

| Step | Doris behavior | Result |
| :--- | :--- | :--- |
| 1 | Analyze the partition column `date` in the query conditions | Identify the date range `2023-01-15` to `2023-02-15` |
| 2 | Compare the query conditions with the partition definitions | Hit partitions `p2` and `p3` |
| 3 | Automatically skip irrelevant partitions | Skip `p1` and `p4` |
| 4 | Run the scan and aggregation only on the hit partitions | Return the result quickly |

### 4. Verify pruning with EXPLAIN

<!-- Knowledge type: Verification method -->
<!-- Applicable scenario: Confirm whether the optimization takes effect -->

**Goal**: Use the `EXPLAIN` command to view the execution plan and confirm the actual number of partitions scanned.

**Command**:

```sql
EXPLAIN SELECT SUM(amount) AS total_amount
FROM sales
WHERE date BETWEEN '2023-01-15' AND '2023-02-15';
```

**Key output**:

```text
|   0:VOlapScanNode(212)                                                     |
|      TABLE: cir.sales(sales), PREAGGREGATION: ON                           |
|      PREDICATES: (date[#0] >= '2023-01-15') AND (date[#0] <= '2023-02-15') |
|      partitions=2/4 (p2,p3)                                                |
```

**Description**: The `partitions=2/4 (p2,p3)` field on the `OlapScanNode` indicates that only 2 out of 4 partitions (`p2` and `p3`) are scanned, which means partition pruning has taken effect.

## Comparison: pruning effective vs not effective

<!-- Knowledge type: Comparison table -->
<!-- Applicable scenario: Quickly determine whether a query can benefit from pruning optimization -->

| Dimension | Partition pruning effective | Partition pruning not effective |
| :--- | :--- | :--- |
| Query conditions | Include a filter on the partition column | Missing partition column conditions, or a function is applied to the partition column |
| Number of partitions scanned | Only the hit partitions are scanned | All partitions are scanned |
| I/O overhead | Low | High |
| EXPLAIN output | `partitions=N/M` (N < M) | `partitions=M/M` |

## FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Troubleshooting when pruning is not effective -->

### Q1: The query is slow and I suspect partition pruning is not effective. How do I confirm this?

Run `EXPLAIN <query>` and check the `partitions=N/M` field on the `OlapScanNode`. If `N == M`, all partitions are scanned and pruning is not effective.

### Q2: Why does the query still scan all partitions even though `WHERE` includes the partition column?

Common reasons:

- A function is applied to the partition column (for example, `DATE_FORMAT(date, ...)`), so the optimizer cannot derive the range.
- Type mismatch (for example, the partition column is `DATE` while the filter value is a string that cannot be implicitly converted).
- An `OR` connects a non-partition-column condition, so the condition cannot be pushed down.

### Q3: What is the difference between partition pruning and bucket pruning?

- **Partition Pruning**: prunes partitions based on the `PARTITION BY` column.
- **Bucket Pruning / Tablet Pruning**: prunes tablets based on equality conditions on the `DISTRIBUTED BY HASH` column.
The two can be combined to further reduce the amount of data scanned.

## Summary

<!-- Knowledge type: Key takeaways -->
<!-- Applicable scenario: Implementation recommendations -->

- Partition pruning automatically identifies the mapping between query conditions and partitions, and scans only the necessary partitions.
- Key prerequisites: the table is partitioned by a business column, and the query includes pushdown-capable filter conditions on the partition column.
- The `partitions=N/M` field in `EXPLAIN` lets you quickly verify whether pruning takes effect.
- Properly leveraging partition pruning can significantly reduce I/O and computation overhead, accelerating queries on massive datasets.
