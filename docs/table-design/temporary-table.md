---
{
    "title": "Temporary Table",
    "language": "en"
}
---

When performing complex data processing tasks, breaking down large SQL queries into multiple steps and temporarily saving the results of each step as physical tables is an effective strategy. This method can significantly reduce the complexity of SQL queries and enhance data debuggability. However, it is important to note that these physical tables must be manually cleaned up after they have served their purpose. If non-physical temporary tables are preferred, Doris currently only supports defining them via the `WITH` clause.

To address the above issues, Doris introduces the temporary table feature. Temporary tables are temporarily existing materialized internal tables with the following key characteristics:
1. **Session Binding**: Temporary tables exist only within the session in which they were created. Their lifecycle is tightly bound to the current session, meaning that when the session ends, the temporary tables created within that session are automatically deleted.

2. **Session-specific Visibility**: The visibility of temporary tables is strictly confined to the session in which they were created. Even another session started by the same user at the same time cannot access these temporary tables.

By introducing the temporary table feature, Doris not only simplifies the temporary data storage and management in complex data processing but also further enhances the flexibility and security of data processing.


:::note

Similar to internal tables, temporary tables must be created under a Database within the Internal Catalog. However, since temporary tables are session-based, their naming is not subject to uniqueness constraints. You can create temporary tables with the same name in different sessions or create temporary tables with the same names as other internal tables.

If a temporary table and a non-temporary table with the same name exist simultaneously in the same Database, the temporary table has the highest access priority. Within that session, all queries and operations on the table with the same name will only affect the temporary table (except for creating materialized views).
:::

## Usage

### Creating a Temporay Table

Tables of various models can be defined as temporary tables, whether they are Unique, Aggregate, or Duplicate models. You can create temporary tables by adding the TEMPORARY keyword in the following SQL statements:
-  [CREATE TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)
-  [CREATE TABLE AS SELECT](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)
-  [CREATE TABLE LIKE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)

The other uses of temporary tables are basically the same as regular internal tables. Except for the above-mentioned Create statement, other DDL and DML statements do not require adding the TEMPORARY keyword.

## Notes

- Temporary tables can only be created in the Internal Catalog.
- The ENGINE must be set to OLAP when creating a table.
- Alter statements are not supported for modifying temporary tables.
- Due to their temporary nature, creating views and materialized views based on temporary tables is not supported.
- Temporary tables cannot be backed up and are not supported for synchronization using CCR/Sync Job.
- Export, Stream Load, Broker Load, S3 Load, MySQL Load, Routine Load, and Spark Load are not supported.
- When a temporary table is deleted, it does not go to the recycle bin but is permanently deleted immediately.
