---
{
    "title": "DROP-RESOURCE",
    "language": "en"
}
---

## DROP-RESOURCE

### Name

DROP RESOURCE

### Description

This statement is used to delete an existing resource. Only the root or admin user can delete resources.
grammar:

```sql
DROP RESOURCE 'resource_name'
```

Note: ODBC/S3 resources in use cannot be deleted.

### Example

1. Delete the Spark resource named spark0:
   
     ```sql
     DROP RESOURCE 'spark0';
     ```

### Keywords

     DROP, RESOURCE

### Best Practice
