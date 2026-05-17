---
{
    "title": "Data Skew Handling: Locating and Optimizing Single-Point Bottlenecks in Doris MPP Queries",
    "sidebar_label": "Data Skew Handling",
    "language": "en",
    "description": "How to detect data skew in Doris MPP queries and resolve single-thread execution bottlenecks? This article provides locating and tuning methods through Profile metrics, Broadcast, and Leading Hint.",
    "keywords": ["Doris data skew", "MPP query optimization", "Join Shuffle", "Broadcast Join", "Leading Hint", "data skew handling", "Profile tuning"]
}
---

<!-- Knowledge type: concept + operation + case -->
<!-- Applicable scenario: Doris MPP query exhibits single-point slowness, unbalanced Join, or abnormal plan ordering -->

Data skew refers to uneven distribution of data across BE instances after Shuffle, which causes a single thread to become the bottleneck of the entire query. Doris is an MPP database that relies on data Shuffle for parallel computation acceleration. When the Join Key or filter column is skewed, a single-thread execution bottleneck appears and slows down the overall query.

This article explains how to detect such issues and presents common tuning methods.

## Troubleshooting Checklist

<!-- Knowledge type: operation checklist -->
<!-- Applicable scenario: quickly locating skew issues -->

Before starting optimization, follow these steps to investigate:

- Use `EXPLAIN` to view the execution plan and confirm the Join order and Shuffle method.
- Use `PROFILE` to examine the `max / avg / min` of operator metrics such as `ExecTime` and `ProbeRows`.
- Determine whether `max` differs from `avg` by orders of magnitude (a typical skew signal).
- Identify the source of skew: uneven Join Key distribution, or estimation error in the row count after filtering.
- Choose the corresponding tuning method: Broadcast Hint or Leading Hint.

## Skew Scenario Comparison

<!-- Knowledge type: comparison table -->
<!-- Applicable scenario: quickly selecting an optimization method -->

| Scenario | Trigger Cause | Typical Symptoms | Recommended Method |
|---|---|---|---|
| Bucket data skew | Uneven Join Key data distribution causes a single partition to become too large after Shuffle | `ProbeRows.max` is much larger than `avg`, and `ExecTime.max` is abnormal | Broadcast Join Hint |
| Column data skew causes left/right table to be reversed | The optimizer assumes uniform distribution, leading to large filter row-count estimation errors | Unreasonable Join order is chosen, and the left table row count is much larger than the estimate | Leading Hint |

## Case 1: Bucket Data Skew Causes Suboptimal Shuffle Method

<!-- Knowledge type: case + operation -->
<!-- Applicable scenario: uneven Join Key distribution causes single-thread execution time to be significantly higher than the average -->

### Symptoms

When a Table has data skew on its Join Key, data becomes unevenly distributed across BE instances, causing a single-point execution bottleneck and slowing down the overall query time.

### Locating with Profile

Examine the Profile of the Hash Join operator:

```SQL
HASH_JOIN_OPERATOR  (id=27): 
      -  PlanInfo 
            -  join  op: INNER  JOIN(PARTITIONED)[] 
            -  equal  join  conjunct:  (customer_number  =  customer_number) 
            -  runtime  filters:  RF001[bloom]  <-  customer_number(200/256/2048) 
            -  cardinality=200         
            -  vec  output  tuple  id:  28 
            -  output  tuple  id:  28  
            -  vIntermediate  tuple  ids:  27 
            -  hash  output  slot  ids:  192  193  194  195  196  197  198  199  200  201  174  175  240  176  177  178  179  180  181  182  183  184  185  186  187  188  189  190  191 
            -  project  output  tuple  id:  28 
      -  BlocksProduced:  sum  4.883K  (4883),  avg  33,  max  39,  min  29 
      -  CloseTime:  avg  37.28us,  max  132.653us,  min  13.945us  
      -  ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
      -  InitTime:  avg  0ns,  max  0ns,  min  0ns  
      -  MemoryUsage:  sum  ,  avg  ,  max  ,  min 
          -  PeakMemoryUsage:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
          -  ProbeKeyArena:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
      -  OpenTime:  avg  194.970us,  max  497.685us,  min  93.738us  
      -  ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
      -  ProjectionTime:  avg  7.336ms,  max  33.540ms,  min  3.760ms 
      -  RowsProduced:  sum  28.8K  (28800),  avg  200,  max  200,  min  200 
```

Looking at the `max` metric in the Join Profile, the execution time and ProbeRows show clear skew:

```Bash
ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
```

Because data is unevenly distributed after being Shuffled by Join Key, one thread processed 200 million rows while another processed only a few thousand rows.

### Skew Signal Quick Reference

| Metric | Healthy Behavior | Skewed Behavior |
|---|---|---|
| `ExecTime` | `max` is close to `avg` | `max` is much larger than `avg` (such as 10s vs 166ms) |
| `ProbeRows` | All threads are within the same order of magnitude | `max` is several orders of magnitude larger than `avg` |
| `RowsProduced` | Evenly distributed | Concentrated on a few threads |

### Optimization: Use Broadcast Join Hint

Ideally, the volume of data processed by each thread should be similar. Refer to the "Using Hints to Control Join Shuffle Method" section, and specify a broadcast join hint so the left table does not undergo data Shuffle, thus avoiding the performance bottleneck caused by Join column data skew.

- **Purpose**: avoid Shuffling a large table by Join Key and prevent a single partition from becoming too large.
- **Command**:

  ```SQL
  SELECT COUNT(*) FROM orders o JOIN [broadcast] customer c ON o.customer_number = c.customer_number;
  ```

- **Description**: with `[broadcast]`, the right table `customer` is broadcast to all nodes, and the left table `orders` is no longer Shuffled, eliminating the single-point pressure caused by Join Key skew.

## Case 2: Column Data Skew Causes Left and Right Tables of Join to Be Reversed

<!-- Knowledge type: case + operation -->
<!-- Applicable scenario: inaccurate filter row-count estimation leads to an unreasonable Join order -->

### Symptoms

The Doris optimizer estimates selectivity based on a uniform distribution assumption. Large errors in filter row-count estimation affect operator plan selection. Take the following SQL as an example:

```SQL
select count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02';
```

### Cause Analysis

Under the uniform distribution assumption, the optimizer may believe that the number of rows output after the filter `o_orderdate < '1920-01-02'` is smaller than the row count of the `customer` table, and therefore may choose the join order `customer` join `orders`.

However, if the actual data is skewed and the number of `orders` rows that satisfy the condition exceeds that of `customer`, the more reasonable join order should be `orders` join `customer`.

### Optimization: Use Leading Hint

- **Purpose**: force a more reasonable Join order to bypass row-count estimation errors.
- **Command**:

  ```SQL
  select /*+leading(orders customer)*/ count(*) 
  from orders, customer 
  where o_custkey = c_custkey
  and o_orderdate < '1920-01-02'
  ```

- **Description**: refer to the "Using Leading Hint to Control Join Order" section. The leading hint forces the join order `customer` join `orders` to be generated.

## FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: common questions and misconceptions -->

**Q1: How do you quickly determine whether a query has data skew?**

Inspect the `ExecTime` and `ProbeRows` of key operators in the Profile. If `max` is significantly larger than `avg` (an order-of-magnitude difference), skew is present.

**Q2: Does Broadcast Join always resolve skew?**

Not necessarily. Broadcast applies when the right table (the broadcast table) is small enough. If the right table is large, broadcasting brings significant memory and network overhead and may degrade performance instead.

**Q3: Can Leading Hint and Broadcast Hint be used together?**

Yes. They serve different purposes: Leading Hint controls Join order, while Broadcast Hint controls the Shuffle method. They can be combined to handle complex scenarios.

**Q4: Why does the optimizer not automatically choose the optimal plan?**

The optimizer estimates based on statistics and the uniform distribution assumption. When column data is severely skewed, the estimation becomes inaccurate. In this case, intervention through Hints is required.

## Troubleshooting

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: issue persists after tuning -->

| Issue | Possible Cause | Suggested Action |
|---|---|---|
| OOM after adding Broadcast Hint | The right table is too large and the broadcast exceeds the memory limit | Switch to another Shuffle method or reduce the size of the right table |
| No effect after adding Leading Hint | Hint syntax error or the Hint is ignored by the optimizer | Use `EXPLAIN` to confirm whether the Hint is in effect |
| `max` in Profile is still much larger than `avg` | The skew source is not in Join but in aggregation or scan | Check the metrics of the Aggregate / Scan operators |
| Unstable results across multiple executions | Stale statistics | Run `ANALYZE TABLE` to refresh the statistics |

## Summary

<!-- Knowledge type: summary -->
<!-- Applicable scenario: methodology recap -->

Data skew is a common performance issue in production scenarios. The handling approach can be summarized in three steps:

1. **Observe**: use the output of `EXPLAIN` and `PROFILE` to observe the plan and execution bottlenecks.
2. **Locate**: identify the source of skew based on the differences in the `max / avg / min` metrics.
3. **Adjust**: use Broadcast Hint or Leading Hint to adjust the plan and avoid the impact of data skew on performance.
