---
{
    "title": "CREATE STREAM",
    "language": "en",
    "description": "Creates a Table Stream on an internal table with Row Binlog enabled, for incremental consumption of the table's changes."
}
---

## Description

Creates a Table Stream on an internal table with Row Binlog enabled. A Table Stream records a consumption offset for each partition of the base table; `SELECT ... FROM <stream>` reads the changes since the last consumption, and `INSERT INTO ... SELECT ... FROM <stream>` consumes them and advances the offsets. See [Table Stream Basics](../../../../data-operate/incremental/table-stream) for the feature description.

This feature is available since version 5.0.0 and is experimental. It requires `enable_feature_binlog = true` and `enable_table_stream = true` in the FE configuration.

## Syntax

```sql
CREATE STREAM [IF NOT EXISTS] [<db_name>.]<stream_name>
ON TABLE [<db_name>.]<table_name>
[COMMENT '<comment>']
[PROPERTIES ("<key>" = "<value>" [, ...])]
```

## Required Parameters

**1. `<stream_name>`**
> The identifier (name) of the Stream. It must be unique within its database and cannot collide with a table or view name. The identifier rules are the same as for table names.

**2. `<table_name>`**
> The base table. It must be an internal table with Row Binlog enabled (`"binlog.enable" = "true"`, `"binlog.format" = "ROW"`), and may live in a different database than the Stream.

## Optional Parameters

**1. `<db_name>`**
> The database of the Stream or of the base table; defaults to the current database.

**2. `IF NOT EXISTS`**
> Do not report an error if a Stream with the same name already exists.

**3. `<comment>`**
> The comment of the Stream; it can be changed later with `ALTER STREAM ... SET COMMENT`.

**4. `PROPERTIES`**

| Property | Values / default | Description |
|---|---|---|
| `type` | `append_only` / `min_delta` / `detail`<br />default `min_delta` | Consumption type. `append_only` emits only inserted rows; `min_delta` emits the net change of each key between two consumptions; `detail` emits every change row by row. `min_delta` and `detail` require the base table to be a Unique Key Merge-on-Write table with `binlog.need_historical_value` enabled; on Duplicate Key tables `min_delta` is handled as `append_only` |
| `show_initial_rows` | `true` / `false`<br />default `false` | Whether the data that already exists when the Stream is created is emitted as changes. When `true`, the first read returns the full current data of the base table (change type `APPEND`) and the Stream switches to incremental after that consumption |

Neither property can be changed after creation.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| CREATE_PRIV | The database of the Stream | |
| SELECT_PRIV | The base table | |

## Usage Notes

- If Row Binlog is not enabled on the base table, the statement fails with `Base Olap table ... need to enable row binlog for table stream`.
- If `type` is `min_delta` (or omitted) and the base table does not meet the requirements, it fails with `MIN_DELTA table stream requires base mow table to enable binlog.need_historical_value=true`.
- An invalid `type` fails with `not supported type: <value>`.
- `CREATE OR REPLACE STREAM` is not supported yet.
- The columns of a Stream are the current visible columns of the base table and are synchronized automatically after `ADD COLUMN` / `DROP COLUMN` on the base table.

## Examples

1. Create a Stream of the default type (`min_delta`) on the `orders` table that only consumes changes after creation:

    ```sql
    CREATE STREAM orders_stream ON TABLE orders;
    ```

2. Create an `append_only` Stream and emit the existing data of the base table as initial changes:

    ```sql
    CREATE STREAM IF NOT EXISTS events_stream ON TABLE events
    COMMENT 'append-only events'
    PROPERTIES (
        "type" = "append_only",
        "show_initial_rows" = "true"
    );
    ```

3. Create a Stream in database `etl` whose base table lives in database `ods`:

    ```sql
    CREATE STREAM etl.orders_stream ON TABLE ods.orders
    PROPERTIES ("type" = "detail");
    ```
