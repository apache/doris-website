---
{
    "title": "Updating Overview",
    "language": "en"
}
---

Data update refers to modifying the value columns in data records with the same key. The approach to handling data updates varies depending on the data model:

- **Primary Key (Unique) Model**: This model is designed specifically for data updates. Doris supports two storage implementations: Merge-on-Read (MoR) and Merge-on-Write (MoW). MoR optimizes write performance, while MoW enhances analytical performance. From Doris version 2.1, MoW is the default storage implementation. The primary key model supports the `UPDATE` statement for small data updates and batch updates through data loading methods such as Stream Load, Broker Load, Routine Load, and Insert Into, all following "UPSERT" semantics. This means if the record does not exist, it is inserted; if it exists, it is updated. Both whole row updates (default) and partial column updates are supported.

- **Aggregate Model**: In this model, data updates are a special use case. When the aggregate function is set to REPLACE or REPLACE_IF_NOT_NULL, data updates can be performed. The aggregate model supports updates only through data loading and does not support the `UPDATE` statement. By setting the aggregate function to REPLACE_IF_NOT_NULL, partial column updates can be achieved.

Understanding the data update methods for different models helps in selecting the appropriate update strategy to meet specific business needs.

## Comparison of Update Capabilities for Different Models/Implementations

### Performance Comparison
|                | Unique Key MoW                                                                                                                                                                   | Unique Key MoR                                                                                                                                                                   | Aggregate Key |
|----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| Loading Speed   | Deduplication during data loading, small batch real-time writes have about 10%-20% performance loss compared to MoR, large batch data loading (e.g., tens of millions/billions of data) have about 30%-50% performance loss compared to MoR | Similar to Duplicate Key                                                                                                                                                         | Similar to Duplicate Key  |
| Query Speed    | Similar to Duplicate Key                                                                                                                                                         | Deduplication during query, query time is about 3-10 times that of MoW                                                                                                                                                   | If the aggregate function is REPLACE/REPLACE_IF_NOT_NULL, query speed is similar to MoR |
| Predicate Pushdown | Supported                                                                                                                                                                      | Not supported                                                                                                                                                                    | Not supported        |
| Resource Consumption | - **Loading Resource Consumption**: Compared to Duplicate Key/Unique Key MoR, about 10%-30% additional CPU consumption.<br /><br /> - **Query Resource Consumption**: Similar to Duplicate Key, no additional resource consumption.<br /><br /> - **Compaction Resource Consumption**: Consumes more memory and CPU compared to Duplicate Key, depending on data characteristics and volume. | - **Loading Resource Consumption**: Similar to Duplicate Key, no additional resource consumption.<br /><br /> - **Query Resource Consumption**: Consumes more CPU and memory during query compared to Duplicate Key/Unique Key MoW.<br /><br /> - **Compaction Resource Consumption**: Consumes more memory and CPU compared to Duplicate Key, depending on data characteristics and volume. | Similar to Unique Key MoR |

### Supported Feature Comparison
|                | Unique Key MoW | Unique Key MoR | Aggregate Key  |
|----------------|----------------|----------------|----------------|
| UPDATE         | Supported      | Supported      | Not supported  |
| DELETE         | Supported      | Supported      | Not supported  |
| Sequence Column| Supported      | Supported      | Not supported  |
| Delete Sign    | Supported      | Supported      | Not supported  |
| Partial Column Update | Supported      | Not supported  | Supported (but cannot update null values) |
| Inverted Index | Supported      | Not supported  | Not supported  |

## Updates in the Primary Key (Unique) Model

Starting from Doris 2.0, the primary key (unique) model introduces the Merge-on-Write (MoW) storage implementation in addition to the original Merge-on-Read (MoR). MoR is optimized for write performance, while MoW is optimized for faster analytical performance. In practical tests, the analytical performance of typical tables using the MoW storage implementation can be 5-10 times that of the MoR implementation.

In Doris 2.0, the default unique model created is still MoR. To create a MoW table, you need to manually specify it with the parameter "enable_unique_key_merge_on_write" = "true", as shown in the example below:

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique_merge_on_write
(
  `user_id` LARGEINT NOT NULL,
  `username` VARCHAR(50) NOT NULL ,
  `city` VARCHAR(20),
  `age` SMALLINT,
  `sex` TINYINT,
  `phone` LARGEINT,
  `address` VARCHAR(500),
  `register_time` DATETIME
)
UNIQUE KEY(`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"enable_unique_key_merge_on_write" = "true"
);
```

:::caution
From Doris version 2.1, MoW is the default implementation for the primary key model. Therefore, if using Doris version 2.1 and above, be sure to read the relevant table creation documentation.
:::

### Two Update Methods for the Primary Key Model

#### Updating with the `UPDATE` Statement

Whether using MoR or MoW, the semantics are to complete the update of the specified columns. The time taken for a single UPDATE increases with the amount of data being updated.

#### Update during Data Loading

Doris supports multiple data loading methods, including Stream Load, Broker Load, Routine Load, and Insert Into. For primary key tables, all loading operations use the "UPSERT" semantics by default: if the record with the same primary key does not exist, an insert operation is performed; if the record exists, an update operation is performed. Update methods include whole row updates and partial column updates:

- **Whole Row Update**: The default update method for Unique Key tables is whole row update. When loading data, users can choose to provide all fields or only some fields. If users only provide some fields, Doris will fill in the missing fields with default values, generate a complete record, and perform the update.

- **Partial Column Update**: Unique Key MoW supports partial column updates. Users can enable this feature by setting the session variable `enable_unique_key_partial_update = true` or specifying `partial_columns:true` in the HTTP Header. Once enabled, if the primary key of the loaded data already exists, only the specified fields will be updated; if the primary key does not exist, the missing fields will be filled with default values.

We will introduce the two update methods in detail in the documents [Update of Primary Key Model](../update/unique-update) and [Load Update of Primary Key Model](../update/update-of-unique-model).

### Concurrency Control for Updates in the Primary Key Model

#### Updating Data with the `UPDATE` Statement

By default, Doris does not allow multiple `UPDATE` operations on the same table at the same time. The `UPDATE` statement ensures isolation through table-level locks.

Users can adjust the concurrency limit by modifying the FE configuration `enable_concurrent_update=true`. When the concurrency limit is relaxed, if multiple `UPDATE` statements update the same row of data, the result will be undefined.

#### Batch Updates Based on Data Loading

Doris provides atomicity guarantees for all loading update operations, meaning that each load job is either fully applied or fully rolled back.

For concurrent load updates, Doris uses internal version control (assigned in the order of load completion) and the MVCC mechanism to determine the order of concurrent updates.

Since the submission order of multiple concurrent loading may be unpredictable, if these concurrent loading involve updates to the same primary key, the effective order will also be unpredictable, resulting in uncertainty in the final visible result. To solve this problem, Doris provides a sequence column mechanism, allowing users to specify a version for each row of data during concurrent load updates to clearly control the order of concurrent updates and achieve determinism.

We will introduce the concurrency control mechanism for updates in detail in the document [Concurrency Control for Updates in the Primary Key Model](../update/unique-update-concurrent-control.md).

## Updates in the Aggregate Model

Updates in the aggregate model mainly refer to producing new aggregate values using new column values and old aggregate values according to the requirements of the aggregate function.

New Agg Value = Agg Func (Old Agg Value, New Column Value)

The aggregate model only supports updates based on load methods and does not support updates using the `UPDATE` statement. When defining an aggregate model table, if the aggregate function of the value column is defined as REPLACE_IF_NOT_NULL, it can indirectly achieve the ability to update partial columns similar to the primary key table. For more information, please refer to [Load Update of Aggregate Model](../update/update-of-aggregate-model).

## Recommendations for Choosing Between Primary Key and Aggregate Models
- For most scenarios with data update requirements, it is recommended to **prefer the primary key model**. For example, synchronizing from TP databases to Doris, user profiling, audience selection, etc.
- The following two scenarios are recommended to use the aggregate model:
  - Some fields need to be aggregated as metrics, and some fields need to be updated.
  - For scenarios with partial column update requirements, high sensitivity to write performance, and low query latency requirements, it is recommended to use the aggregate table + REPLACE_IF_NOT_NULL aggregate function.