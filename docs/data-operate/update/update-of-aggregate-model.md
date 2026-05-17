---
{
    "title": "Load-Based Updates in the Aggregate Model",
    "language": "en",
    "description": "How to perform whole-row updates and partial-column updates through data loading in the Doris Aggregate Key Model, and how to understand aggregate write semantics."
}
---

<!-- Knowledge type: Operational guide -->
<!-- Applicable scenario: Data writes into the Aggregate model / Incremental data merging -->

When using the Doris Aggregate Key Model, you typically encounter the following scenarios:

- You need to keep writing new data into an aggregate table, and you want the new values to be merged with the historical values according to the aggregation rules.
- You need to update only some columns while keeping the historical aggregate results of the other columns.

This document describes the two update methods that the Doris Aggregate model supports for these scenarios: **whole-row updates** and **partial-column updates**.

## Overview of Update Methods

| Update method | Applicable scenario | Supported load methods | Behavior |
| --- | --- | --- | --- |
| Whole-row update | Write a complete row, and merge the new and old values according to each column's aggregate function | Stream Load, Broker Load, Routine Load, Insert Into, and others | The new value and the old value are combined by the aggregate function to produce a new aggregate value |
| Partial-column update | Update only some columns while the other columns retain their existing aggregate results | See [Partial Column Update](./partial-column-update.md#聚合模型的列更新) | Only the specified columns participate in aggregate merging |

## Whole-Row Update

<!-- Knowledge type: Behavior description -->

When you write data into the Aggregate model (Agg model) through any of the load methods that Doris supports, such as Stream Load, Broker Load, Routine Load, or Insert Into, the engine combines each new value with the existing aggregate value using the aggregate function defined on that column, and produces a new aggregate value.

The aggregate value can be produced at the following points in time:

1. **At load time**: merged in real time during the data write.
2. **During asynchronous Compaction**: the aggregation is finalized in the background merge process.

No matter at which stage the aggregate value is produced, the result returned to the user at query time is the same.

## Partial-Column Update

<!-- Knowledge type: Capability index -->

The Aggregate Key Model supports updating only some columns in the table while the other columns retain their existing aggregate results. For details on table creation, data write examples, and usage notes, see the [Partial Column Update](./partial-column-update.md#聚合模型的列更新) document.
