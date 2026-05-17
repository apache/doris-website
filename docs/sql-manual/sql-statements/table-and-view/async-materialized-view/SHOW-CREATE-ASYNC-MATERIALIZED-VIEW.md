---
{
    "title": "SHOW CREATE ASYNC MATERIALIZED VIEW",
    "language": "en",
    "description": "View the materialized view creation statement."
}
---

## Description

View the materialized view creation statement.

## Syntax

```sql
SHOW CREATE MATERIALIZED VIEW <materialized_view_name>
```

## Required Parameters

**1. `<materialized_view_name>`**

> The name of the materialized view.

## Return Values

|Column Name | Description   |
| -- |------|
| Materialized View | Name of the materialized view   |
| Create Materialized View | Statement used to create the materialized view |

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes                                                       |
| --------- | ------ | ----------------------------------------------------------- |
| SELECT_PRIV/LOAD_PRIV/ALTER_PRIV/CREATE_PRIV/DROP_PRIV | Table  | |

## Example

1. View the creation statement of an asynchronous materialized view

   ```sql
   SHOW CREATE MATERIALIZED VIEW partition_mv;
   ```
