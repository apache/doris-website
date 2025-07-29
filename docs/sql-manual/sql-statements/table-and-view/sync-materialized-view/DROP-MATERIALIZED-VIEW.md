---
{
    "title": "DROP MATERIALIZED VIEW",
    "language": "en"
}
---

## Description

Drop a synchronized materialized view.

## Syntax


```sql
DROP MATERIALIZED VIEW 
[ IF EXISTS ] <materialized_view_name>
ON <table_name>
```

## Required Parameters

**1. `<materialized_view_name>`**

> The name of the materialized view to be dropped.

**2. `<table_name>`**

> The table to which the materialized view belongs.

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege  | Object | Notes                                                        |
| ---------- | ------ | ------------------------------------------------------------ |
| ALTER_PRIV | Table  | Requires ALTER_PRIV permission on the table to which the materialized view to be deleted belongs |

## Example

Drop the synchronized materialized view `sync_agg_mv` on the `lineitem` table


```sql
DROP MATERIALIZED VIEW sync_agg_mv on lineitem;
```
