---
{
    "title": "Index Optimization: Tips for Prefix Indexes and Inverted Indexes",
    "sidebar_label": "Index Optimization",
    "language": "en",
    "description": "How can you accelerate queries with Doris prefix indexes and inverted indexes? This article starts from typical scenarios and gives recommendations on Key column ordering, secondary index selection, and optimization.",
    "keywords": ["Doris index optimization", "prefix index", "inverted index", "ZoneMap", "Bloomfilter", "query acceleration", "Key column order"]
}
---

<!-- Knowledge type: concept + operation + case -->
<!-- Applicable scenarios: Doris query performance tuning, index design and selection -->

## Overview

<!-- Knowledge type: concept -->
<!-- Applicable scenarios: understand the full picture of the Doris index system -->

Doris indexes are data structures used to accelerate query filtering. Using indexes appropriately can significantly improve query performance.

Doris currently supports two categories of indexes:

| Index category    | Included types                                                          | Characteristics                                            |
| ----------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| Built-in indexes  | Prefix index, ZoneMap index                                             | Automatically generated at table creation, no extra maintenance |
| Secondary indexes | Inverted index, Bloomfilter index, N-Gram Bloomfilter index, Bitmap index | Created by users on demand, can be managed independently   |

During business optimization, effectively leveraging indexes based on business characteristics can greatly improve query and analysis performance, and is one of the key techniques for performance tuning.

For detailed introductions to each index type, refer to the [Table Index](../../../table-design/index/index-overview.md) chapter. This article starts from real cases and introduces index usage tips and optimization recommendations for several typical scenarios.

### Pre-reading Self-check Checklist

- You understand the current table's Key column definitions and order
- You have identified high-frequency filter fields in the business
- You have evaluated whether you can rebuild the table or only append secondary indexes
- You have grasped the applicable scenarios of different index types

## Case 1: Adjust Key Column Order to Accelerate Queries with Prefix Indexes

<!-- Knowledge type: case + operation -->
<!-- Applicable scenarios: high-frequency filter fields miss the prefix index, leading to slow queries -->

In [Optimizing Table Schema Design](optimizing-table-schema.md), the article introduced how to choose appropriate fields as Key fields and use the Key column sorting feature of Doris to accelerate queries. This case further extends that scenario.

### Background

Doris has a built-in prefix index: at table creation time, the first 36 bytes of the table Key are automatically taken as the prefix index. When the query condition matches the prefix of the prefix index, query speed can be significantly improved.

### Problem: Key Column Order Does Not Match the Query Pattern

The original CREATE TABLE statement is as follows:

```sql
CREATE TABLE `t1` (
  `c1` VARCHAR(10) NULL,
  `c2` VARCHAR(10) NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

The corresponding business SQL patterns are as follows:

```sql
select * from t1 where t1.c2 = '1';
select * from t1 where t1.c2 in ('1', '2', '3');
```

In the schema above, `c1` comes first and `c2` comes after, but the queries filter on the `c2` field. In this case, the prefix index cannot be leveraged for acceleration.

### Optimization: Adjust Column Order

Place the `c2` column in the first field position so that the prefix index covers the business filter condition:

```sql
CREATE TABLE `t1` (
  `c2` VARCHAR(10) NULL,
  `c1` VARCHAR(10) NULL
) ENGINE=OLAP
DUPLICATE KEY(`c2`)
DISTRIBUTED BY HASH(`c1`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

:::tip Optimization tip

When defining the schema column order, refer to the high-frequency, high-priority columns used in business query filters to fully leverage the acceleration capability of the Doris prefix index.

:::

## Case 2: Use Inverted Indexes to Accelerate Queries

<!-- Knowledge type: case + operation -->
<!-- Applicable scenarios: table structure is inconvenient to adjust, text retrieval, equality / range queries -->

### Applicable Scenarios

Doris supports inverted indexes as secondary indexes, used to accelerate the following business scenarios:

- Full-text retrieval on text-type fields;
- Equality queries on string, numeric, or datetime fields;
- Range queries on string, numeric, or datetime fields.

### Advantages

The creation and management of inverted indexes are independent: business performance can be conveniently optimized without affecting the original table schema and without re-importing table data.

For typical use cases, syntax, and examples, refer to [Inverted Index](../../../table-design/index/inverted-index/overview). This section does not repeat them.

:::tip Optimization recommendation

When the original table structure and Key definitions are inconvenient to optimize, or when the cost of re-importing data is high, inverted indexes provide a flexible acceleration option for optimizing business execution performance.

:::

## Index Selection Comparison

<!-- Knowledge type: comparison -->
<!-- Applicable scenarios: quickly select among multiple indexes -->

| Index type            | Applicable queries                | Requires table rebuild | Requires data re-import      | Typical field types          |
| --------------------- | --------------------------------- | ---------------------- | ---------------------------- | ---------------------------- |
| Prefix index          | Equality, range, prefix matching  | Yes (adjust Key)       | Yes                          | Key columns sorted in front  |
| ZoneMap index         | Range filtering                   | No (automatic)         | No                           | All columns                  |
| Inverted index        | Full-text retrieval, equality, range | No                  | No                           | String, numeric, datetime    |
| Bloomfilter index     | High-cardinality equality filter  | No                     | No (takes effect incrementally) | String, numeric            |
| N-Gram Bloomfilter    | LIKE fuzzy matching               | No                     | No (takes effect incrementally) | String                     |
| Bitmap index          | Low-cardinality equality filter   | No                     | No (takes effect incrementally) | Enumeration fields         |

## FAQ and Common Issues

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: common questions and troubleshooting during index usage -->

### Q1: Why are my queries still slow after creating an index?

Possible reasons:

- The query condition does not hit any indexed column;
- The Key column order does not match the filter condition, so the prefix index does not take effect;
- The data volume is small, and the index does not bring noticeable benefit;
- The index has not yet taken effect on historical data (some secondary indexes only take effect immediately on newly written data).

### Q2: Does the prefix index need to be created manually?

No. At table creation, Doris automatically takes the first 36 bytes of the Key columns as the prefix index. To make the prefix index effective, place high-frequency business filter fields at the front of the Key columns.

### Q3: How to choose between an inverted index and a Bloomfilter index?

- Full-text retrieval, fuzzy matching, range queries: prefer inverted indexes;
- Exact equality queries on high-cardinality fields: choose Bloomfilter indexes for lower overhead.

### Q4: Does adjusting the Key column order require rebuilding the table?

Yes. Key column order is part of the table schema definition; after adjustment, you must rebuild the table and re-import the data.

## Summary

<!-- Knowledge type: summary -->
<!-- Applicable scenarios: review key points of index tuning -->

In schema tuning, index optimization is as important as table-level schema optimization. Doris provides multiple index types:

- Built-in indexes: prefix index, ZoneMap index;
- Secondary indexes: inverted index, Bloomfilter, N-Gram Bloomfilter, Bitmap.

Using these indexes appropriately can significantly improve business query and analysis speed across multiple scenarios. It is recommended to first evaluate the high-frequency business filter fields, then choose the appropriate index type based on factors such as whether the table can be rebuilt and the data volume.
