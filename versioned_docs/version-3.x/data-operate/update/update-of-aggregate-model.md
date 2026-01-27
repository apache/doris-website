---
{
    "title": "Updating Data on Aggregate Key Model",
    "language": "en",
    "description": "This document primarily introduces how to update the Doris Aggregate model based on data load."
}
---

This document primarily introduces how to update the Doris Aggregate model based on data load.

## Whole Row Update

When loading data into the Aggregate model table using Doris-supported methods such as Stream Load, Broker Load, Routine Load, Insert Into, etc., the new values will be aggregated with the old values according to the column's aggregation function to produce new aggregated values.  This value may be generated at the time of insertion or during asynchronous compaction, but users will get the same return value when querying.

## Partial Column Update

For detailed information on partial column updates for Aggregate Key Model tables, including table creation, data insertion examples, and usage notes, please refer to [Partial Column Update](./partial-column-update.md#partial-column-update-for-aggregate-key-model).
