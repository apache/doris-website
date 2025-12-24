---
{
    "title": "Updating Data on Unique Key Model",
    "language": "en",
    "description": "This document introduces how to update data in the Doris unique key model using various load methods."
}
---

This document introduces how to update data in the Doris unique key model using various load methods.

## Whole Row Update

When loading data into the unique key model using Doris-supported methods like Stream Load, Broker Load, Routine Load, Insert Into, etc., new data is inserted if there is no existing primary key data row. If there is an existing primary key data row, it is updated. This means the load operation in the Doris unique key model works in an "upsert" mode. The process of updating existing records is the same as loading new records by default, so you can refer to the data load documentation for more details.

## Partial Column Update

For detailed information on partial column updates for Unique Key Model tables, including usage examples, flexible partial column updates, and handling new rows, please refer to [Partial Column Update](./partial-column-update.md#partial-column-update-for-unique-key-model).
