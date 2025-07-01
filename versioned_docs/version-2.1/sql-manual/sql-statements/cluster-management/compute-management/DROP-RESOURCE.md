---
{
    "title": "DROP RESOURCE",
    "language": "en"
}
---

## Description

This statement is used to delete an existing resource. Only the root or admin user can delete resources.

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