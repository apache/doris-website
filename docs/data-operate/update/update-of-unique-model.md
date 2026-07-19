---
{
    "title": "Load-Based Updates for the Unique Model",
    "language": "en",
    "description": "How to update data in the Doris Unique (primary key) model through load methods such as Stream Load and Routine Load, with support for full-row Upsert and partial column updates."
}
---

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenarios: Data update / Real-time write / Unique model Upsert -->

In real-time data warehouse and operational database synchronization scenarios, users often face the following problems:

- Data in business tables needs to be continuously updated by primary key (such as order status changes or user profile refreshes), and writes should automatically determine whether to "insert" or "update".
- Only some fields change (for example, only updating an order's `status`), and assembling the full record every time is undesirable.

For these scenarios, the Doris Unique (primary key) model supports two load-based update methods: **full-row update** and **partial column update**. This document describes how to use both methods.

## Full-row update

<!-- Knowledge type: Capability definition -->

Loading into the Doris Unique model uses an **Upsert** mode: when new data is written, Doris automatically determines whether to "insert" or "update" based on the primary key.

| Scenario | Behavior |
| --- | --- |
| Primary key does not exist | Insert a new data row |
| Primary key already exists | Overwrite the existing data row with the new data |

Supported load methods include:

- Stream Load
- Broker Load
- Routine Load
- Insert Into

> A full-row update is identical to loading a new record. For detailed usage, see the [Data loading](../import/import-way/stream-load-manual.md) documentation.

## Partial column update

<!-- Knowledge type: Capability definition -->

When only some fields need to be updated, you can use the partial column update capability of the Unique model to avoid assembling the full record. For detailed information (including usage examples, flexible partial column updates, and handling of new rows), see the [Column update](./partial-column-update.md#column-update-on-the-unique-key-model) document.
