---
{
    "title": "DROP RESOURCE",
    "language": "en",
    "description": "This statement is used to delete an existing resource. Only the root or admin user can delete resources."
}
---

## Description

This statement is used to delete an existing resource. Only the root or admin user can delete resources.

Since 4.1.5, only root can modify or delete a newly created AI Resource marked as created by root; other `ADMIN` users cannot do so. Resources without this marker from before the upgrade are not retroactively restricted. See [AI Resource permissions](../../../sql-functions/ai-functions/overview.md).

## Syntax

```sql
DROP RESOURCE '<resource_name>'
```

## Usage Notes

ODBC/S3 resources in use cannot be deleted.

## Examples

1. Delete the Spark resource named spark0:
   
     ```sql
     DROP RESOURCE 'spark0';
     ```