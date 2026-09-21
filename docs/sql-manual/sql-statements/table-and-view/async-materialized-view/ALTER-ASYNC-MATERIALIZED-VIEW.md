---
{
    "title": "ALTER ASYNC MATERIALIZED VIEW",
    "language": "en",
    "description": "This statement is used to modify asynchronous materialized views."
}
---

## Description

This statement is used to modify asynchronous materialized views.

#### syntax

```sql
ALTER MATERIALIZED VIEW mvName=multipartIdentifier ((RENAME newName=identifier)
       | (REFRESH (refreshMethod | refreshTrigger | refreshMethod refreshTrigger))
       | REPLACE WITH MATERIALIZED VIEW newName=identifier propertyClause?
       | (SET  LEFT_PAREN fileProperties=propertyItemList RIGHT_PAREN))
```

#### illustrate

##### RENAME

Used to change the name of the materialized view

For example, changing the name of mv1 to mv2
```sql
ALTER MATERIALIZED VIEW mv1 rename mv2;
```

##### refreshMethod

Same as [creating asynchronous materialized views](./CREATE-ASYNC-MATERIALIZED-VIEW)

You cannot change a regular asynchronous materialized view to `INCREMENTAL` with `ALTER MATERIALIZED VIEW`, nor change an IVM to another default refresh method. To switch, recreate the materialized view.

##### refreshTrigger

Same as [creating asynchronous materialized views](./CREATE-ASYNC-MATERIALIZED-VIEW)

##### SET
Modify properties unique to materialized views

For example, modifying the grace_period of mv1 to 3000ms
```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3000");
```

Among the IVM properties, `ivm_use_full_keys` can only be set at creation time and cannot be modified. `ivm_partition_window_limit` can be modified; after widening the window or removing the limit, the next refresh must run `COMPLETE` to rebuild the baseline. See [Incremental View Maintenance (IVM)](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#ivm-properties).

##### REPLACE
```sql
ALTER MATERIALIZED VIEW [db.]mv1 REPLACE WITH MATERIALIZED VIEW mv2
[PROPERTIES('swap' = 'true')];
```
Replacing atoms with two materialized views

swap default is TRUE
- If the swap parameter is set to TRUE, it is equivalent to renaming the materialized view mv1 to mv2, and renaming mv2 to mv1 at the same time
- If the swap parameter is set to FALSE, it is equivalent to renaming mv2 to mv1 and deleting the original mv1

For example, if you want to swap the names of mv1 and mv2
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2;
```

For example, if you want to rename mv2 to mv1 and delete the original mv1
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2
PROPERTIES('swap' = 'false');
```

## Keywords

    ALTER, ASYNC, MATERIALIZED, VIEW

