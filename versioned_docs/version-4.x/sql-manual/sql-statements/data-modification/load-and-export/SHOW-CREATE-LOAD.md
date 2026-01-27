---
{
    "title": "SHOW CREATE LOAD",
    "language": "en",
    "description": "This statement is used to display the creation statement of an import job."
}
---

## Description

This statement is used to display the creation statement of an import job.

## Syntax

```sql
SHOW CREATE LOAD FOR <load_name>;
```

## Required Parameters

**`<load_name>`**

> The name of the routine import job.

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
| :---------------- | :------------- | :---------------------------- |
| ADMIN/NODE_PRIV | Database | Cluster administrator privileges are required. |

## Return Value

Returns the creation statement of the specified import job.

## Examples

- Display the creation statement of the specified import job in the default database.

```sql
SHOW CREATE LOAD for test_load
```