---
{
    "title": "DROP WORKLOAD POLICY",
    "language": "en",
    "description": "Delete a Workload Policy"
}
---

## Description

Delete a Workload Policy

## Syntax

```sql
DROP WORKLOAD POLICY [ IF EXISTS ] <workload_policy_name>
```
## Required Parameters

**<workload_policy_name>**

The name of the Workload Policy

## Access Control Requirements

Must have at least `ADMIN_PRIV` permissions

## Examples

1. Delete a Workload Policy named cancel_big_query

  ```sql
  drop workload policy if exists cancel_big_query
  ```