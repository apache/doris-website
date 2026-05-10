---
{
    "title": "Table Model Best Practices",
    "language": "en",
    "description": "Doris data model selection recommendations, column type conventions for table creation, count(*) limitations of the Aggregate model, Unique merge-on-write optimization, and detailed differences in Key column semantics."
}
---

<!-- Knowledge type: Architecture selection decision + Configuration parameters + Performance tuning -->
<!-- Applicable scenarios: Model selection before table creation / Understanding data models / count(*) performance optimization -->

This document discusses things to keep in mind when using Doris data models, from the perspectives of model selection, table schema design, and model limitations. It helps you choose the right model and avoid common performance pitfalls.

## Data model selection recommendations

The data model is determined when the table is created and **cannot be modified**. Choosing the right data model is therefore critical.

### Comparison of the three models

| Data model | Applicable scenarios            | Advantages                                                                  | Notes                                                                                                       |
| ---------- | ------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Duplicate  | Ad-hoc queries on any dimension | Not bound by aggregation model constraints; takes full advantage of columnar storage (reads only required columns) | Cannot leverage pre-aggregation (but supported through asynchronous materialized views)                     |
| Unique     | Requires primary key uniqueness and data updates | Guarantees primary key uniqueness; supports flexible updates                | Cannot leverage pre-aggregation (but supported through asynchronous materialized views)                     |
| Aggregate  | Reporting queries with fixed patterns | Pre-aggregation significantly reduces the data scanned and computed at query time | `count(*)` queries are unfriendly; pay attention to semantic correctness when running aggregation queries that differ from the declared aggregation type |

### Partial column update requirements

If your business requires partial column updates, see the following documents for usage recommendations:

- [Partial column update in the Unique model](../../data-operate/update/update-of-unique-model)
- [Partial column update in the Aggregate model](../../data-operate/update/update-of-aggregate-model)

## Recommendations for column types when creating tables

<!-- Knowledge type: Configuration parameters -->

When creating a table, follow these conventions for column types and ordering:

1. **Column order**: Key columns must come before all Value columns.
2. **Prefer integer types**: Use integer types whenever possible, because integer computation and lookup are far more efficient than for strings.
3. **Use the smallest sufficient integer length**: When choosing among integer types of different lengths, follow the principle of "just enough".
4. **Use the smallest sufficient variable-length string**: For VARCHAR and STRING types, follow the same "just enough" principle for length.

## Semantic differences of Key columns across models

<!-- Knowledge type: Architecture selection decision -->

The Duplicate, Aggregate, and Unique models all specify Key columns at table creation time, but their semantics differ:

| Model              | Role of the Key columns                                       |
| ------------------ | ------------------------------------------------------------- |
| Duplicate          | Acts only as "sort columns"; does not provide unique identification |
| Aggregate, Unique  | Acts as both "sort columns" and "unique identification columns"; these are Key columns in the true sense |

## Limitations of the Aggregate model

<!-- Knowledge type: Performance tuning -->
<!-- Applicable scenarios: Performance troubleshooting / count(*) query optimization -->

The Aggregate model exposes the final aggregated data to the outside. In other words, **any data that has not yet been aggregated** (for example, data belonging to two different load batches) must be made consistent through some mechanism before being exposed.

### Example of consistency guarantees

Assume the following table schema:

| ColumnName | Type     | AggregationType | Comment       |
| ---------- | -------- | --------------- | ------------- |
| user_id    | LARGEINT |                 | User ID       |
| date       | DATE     |                 | Data load date |
| cost       | BIGINT   | SUM             | Total user spend |

The storage engine already contains data from two load batches:

**batch 1**

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 50   |
| 10002   | 2017/11/21 | 39   |

**batch 2**

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 1    |
| 10001   | 2017/11/21 | 5    |
| 10003   | 2017/11/22 | 22   |

As you can see, the data for user 10001 across the two load batches has not yet been aggregated. To ensure that users can only see the final aggregated data shown below:

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 51   |
| 10001   | 2017/11/21 | 5    |
| 10002   | 2017/11/21 | 39   |
| 10003   | 2017/11/22 | 22   |

Doris adds an aggregation operator in the query engine to guarantee data consistency to the outside.

### Semantic pitfall of inconsistent aggregation queries

When running an aggregation query on a Value column with an aggregation type **different from the declared one**, pay attention to semantics. For example:

```sql
SELECT MIN(cost) FROM table;
```

The result is `5`, not `1`.

### count(*) query overhead

The consistency mechanism of the Aggregate model significantly reduces query efficiency in certain queries. The most typical case is the `count(*)` query:

```sql
SELECT COUNT(*) FROM table;
```

In other databases, this kind of query returns very quickly. Implementations such as "counting rows during loading and storing the count statistic" or "scanning only one column at query time to obtain the count" can produce the result with very small overhead. In the Doris Aggregate model, however, this query is very expensive.

Using the data above as an example, the final aggregated result is:

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 51   |
| 10001   | 2017/11/21 | 5    |
| 10002   | 2017/11/21 | 39   |
| 10003   | 2017/11/22 | 22   |

The correct result of `SELECT COUNT(*) FROM table;` should be `4`. However:

- Scanning only the `user_id` column with query-time aggregation yields `3` (10001, 10002, 10003), which is incorrect.
- Scanning only the `user_id` column without query-time aggregation yields `5` (5 rows total across both batches), which is incorrect.

To get the correct result, **both `user_id` and `date` columns must be read**, plus query-time aggregation, in order to return the correct result of `4`. That is, for a `count(*)` query, *Doris must scan all AGGREGATE KEY columns (`user_id` and `date` here) and aggregate them to get a semantically correct result*. When there are many aggregate columns, the `count(*)` query has to scan a large amount of data.

### count(*) performance optimization

When the workload contains frequent `count(*)` queries, add an extra column whose **value is always 1 and aggregation type is SUM** to simulate `count(*)`. Modify the table schema in the previous example as follows:

| ColumnName | Type   | AggregateType | Comment              |
| ---------- | ------ | ------------- | -------------------- |
| user_id    | BIGINT |               | User ID              |
| date       | DATE   |               | Data load date       |
| cost       | BIGINT | SUM           | Total user spend     |
| count      | BIGINT | SUM           | Used to compute count |

When loading data, set the `count` column value to a constant 1. Then:

```sql
SELECT COUNT(*) FROM table;
-- equivalent to
SELECT SUM(count) FROM table;
```

The latter is much more efficient than the former.

**Usage restriction**: You must ensure that no rows with identical AGGREGATE KEY columns are loaded multiple times. Otherwise, `SELECT SUM(count) FROM table;` only represents the number of originally loaded rows, and is no longer equivalent to `SELECT COUNT(*) FROM table;`.

**Alternative**: Change the aggregation type of the `count` column above to `REPLACE`, while still keeping the value as a constant 1. In this case, `SELECT SUM(count) FROM table;` and `SELECT COUNT(*) FROM table;` produce the same result, and there is no restriction on loading duplicate rows.

## Merge-on-write implementation of the Unique model

<!-- Knowledge type: Performance tuning -->

The merge-on-write implementation of the Unique model does not have the limitations of the Aggregate model described above. Using the same data as before, merge-on-write adds a corresponding delete bitmap to the rowset of each load to mark which data has been overwritten.

**After the first batch is loaded**:

batch 1

| user_id | date       | cost | delete bit |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017/11/20 | 50   | FALSE      |
| 10002   | 2017/11/21 | 39   | FALSE      |

**After the second batch is loaded**, the duplicate rows in the first batch are marked as deleted:

batch 1

| user_id | date       | cost | delete bit |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017/11/20 | 50   | TRUE       |
| 10002   | 2017/11/21 | 39   | FALSE      |

batch 2

| user_id | date       | cost | delete bit |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017/11/20 | 1    | FALSE      |
| 10001   | 2017/11/21 | 5    | FALSE      |
| 10003   | 2017/11/22 | 22   | FALSE      |

At query time, all rows marked as deleted in the delete bitmap are filtered out and **no data aggregation is required**. The data above contains 4 valid rows, and the query result is also 4 rows. The query can therefore use the lowest-overhead approach mentioned earlier: "scan only one column to obtain the count".

**Performance data**: In test environments, `count(*)` queries on the merge-on-write implementation of the Unique model perform **more than 10 times** better than on the Aggregate model.

## Duplicate model

<!-- Knowledge type: Architecture selection decision -->

The Duplicate model does not have the limitations of the Aggregate model described above. Because this model does not involve aggregation semantics, a `count(*)` query can scan **any single column** to obtain a semantically correct result.
