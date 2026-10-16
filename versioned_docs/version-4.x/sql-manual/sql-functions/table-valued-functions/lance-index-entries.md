---
{
    "title": "LANCE_INDEX_ENTRIES",
    "language": "en",
    "description": "lance_index_entries table-valued function (TVF). Lists the physical index entries recorded in the latest snapshot of a Lance table in a Filesystem Catalog."
}
---

## Description

:::note
`lance_index_entries` is supported starting from Apache Doris 4.1.5.
:::

The `lance_index_entries` table-valued function (TVF) lists the physical index entries recorded in the latest snapshot of a Lance table. It returns one row per physical index entry and complements `SHOW INDEX`, which displays the logical index view (index name, indexed columns, index type, and properties) in the fixed MySQL-style result set. The UUID and dataset version of a physical index entry do not fit into that fixed schema and are exposed only through this TVF. One logical index name can appear on multiple rows when it has several physical entries with different UUIDs.

The TVF is read-only. It reads index metadata only through `Dataset.getIndexes()` and does not read row counts or statistics. The result can be filtered with ordinary predicates. Rows are sorted by `(IndexName, IndexUuid)`. The read is fully validated and all-or-error: a blank or overlong name, a missing UUID, a non-positive `DatasetVersion`, a duplicate UUID, or a raw entry count above 16,384 fails the entire query instead of returning a truncated result. The reserved system indexes that Lance maintains internally, `__lance_frag_reuse` and `__lance_mem_wal`, are validated but not displayed.

The TVF requires the `SHOW` privilege on the table and is only supported for Lance Filesystem Catalogs. For a REST Catalog, it is rejected with the error `lance_index_entries is not supported for Lance REST catalogs`.

## Syntax

```sql
LANCE_INDEX_ENTRIES(
    "table" = "<table>"
  );
```

## Parameters

`lance_index_entries` accepts exactly one `"key"="value"` pair.

| Parameter | Description |
|---|---|
| `<table>` | The fully qualified, three-part `catalog.database.table` name of the Lance table to inspect. Identifiers support backtick quoting. If a multilevel Lance Namespace maps to a database name containing `.`, quote the database part with backticks, for example `` lance_catalog.`doris.analytics`.items ``. |

## Return Value

The TVF returns a result set rather than a scalar NULL. A table without user indexes produces zero rows. A missing or invalid `table` argument raises an error. The `table` argument must be a nonempty string and does not accept SQL NULL.

The TVF returns the following fixed columns:

| Column | Type | Description |
|---|---|---|
| `CatalogName` | STRING | Catalog name. |
| `DatabaseName` | STRING | Database name. |
| `TableName` | STRING | Table name. |
| `IndexName` | STRING | Name of the Lance logical index. |
| `IndexUuid` | STRING | UUID of the physical index entry. |
| `DatasetVersion` | BIGINT | Dataset version recorded on the physical index entry, that is, the dataset version at which the entry was written. Physical entries of the same logical index can carry different dataset versions. It is always `1` or greater. |

## Example

First configure a Filesystem Catalog as described in [Lance Catalog](../../../lakehouse/catalogs/lance-catalog.mdx), and create a dataset and index using external Lance tooling. Replace the example names with a table you can access. The `SHOW` privilege on that table is required.

- List the physical index entries of table `vs_ivf_pq_f32` in catalog `lance_catalog`:

    ```sql
    select * from lance_index_entries("table" = "lance_catalog.default.vs_ivf_pq_f32");
    ```
    ```text
    +---------------+--------------+---------------+----------------------+--------------------------------------+----------------+
    | CatalogName   | DatabaseName | TableName     | IndexName            | IndexUuid                            | DatasetVersion |
    +---------------+--------------+---------------+----------------------+--------------------------------------+----------------+
    | lance_catalog | default      | vs_ivf_pq_f32 | embedding_ivf_pq_f32 | 3f9c2a1e-7b4d-4e6f-9a1c-2d5e8f0b3a47 | 12             |
    +---------------+--------------+---------------+----------------------+--------------------------------------+----------------+
    ```

    `IndexUuid` and `DatasetVersion` in this output are illustrative values.

- Filter the result with an ordinary predicate:

    ```sql
    select IndexName, IndexUuid
    from lance_index_entries("table" = "lance_catalog.default.vs_ivf_pq_f32")
    where DatasetVersion >= 12
    order by IndexName, IndexUuid;
    ```

    ```text
    IndexName             IndexUuid
    embedding_ivf_pq_f32  3f9c2a1e-7b4d-4e6f-9a1c-2d5e8f0b3a47
    ```

## Related

For more information about Lance index inspection, including the logical view provided by `SHOW INDEX`, refer to [Lance Catalog](../../../lakehouse/catalogs/lance-catalog.mdx#inspect-lance-indexes).
