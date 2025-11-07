---
{
    "title": "SHOW PARTITION ID",
    "language": "en"
}
---

## Description

This statement is used to find the corresponding database name, table name, and partition name based on the partition ID.

## Syntax

```sql
SHOW PARTITION <partition_id>
```

## Required Parameters

**1. `<partition_id>`**

> partition id

## Access Control Requirements

The user who executes this SQL must have at least the following permissions:

| Privilege                  | Object | Notes |
|---------------------|----|----|
| ADMIN_PRIV |    |    |

## Examples

1. To find the corresponding database name, table name, and partition name based on the partition ID.

    ```sql
    SHOW PARTITION 10002;
    ```

