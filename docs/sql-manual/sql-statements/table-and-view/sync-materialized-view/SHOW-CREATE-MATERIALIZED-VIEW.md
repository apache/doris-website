---
{
    "title": "SHOW CREATE SYNC MATERIALIZED VIEW",
    "language": "en"
}
---

## Description

View the materialized view creation statement.

## Syntax

```sql
SHOW CREATE MATERIALIZED VIEW <materialized_view_name> ON <table_name>
```

## Required Parameters

**1. `<materialized_view_name>`**

> The name of the materialized view.

**2. `<table_name>`**

> The table to which the materialized view belongs.

## Return Values

|Column Name | Description   |
| -- |------|
| TableName | Name of the table   |
| ViewName | Name of the materialized view |
| CreateStmt | Statement used to create the materialized view |

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes                                                        |
| --------- | ------ | ------------------------------------------------------------ |
| SELECT_PRIV/LOAD_PRIV/ALTER_PRIV/CREATE_PRIV/DROP_PRIV | Table  | You need to have permissions for the table to which the current materialized view belongs |

## Examples

1. View the creation statement of a synchronized materialized view

   ```sql
   SHOW CREATE MATERIALIZED VIEW sync_agg_mv on lineitem;
   ```
   