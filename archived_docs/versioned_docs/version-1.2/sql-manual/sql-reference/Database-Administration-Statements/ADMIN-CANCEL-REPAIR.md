---
{
    "title": "ADMIN-CANCEL-REPAIR",
    "language": "en"
}
---

## ADMIN-CANCEL-REPAIR

### Name

ADMIN CANCEL REPAIR

### Description

This statement is used to cancel the repair of the specified table or partition with high priority

grammar:

```sql
ADMIN CANCEL REPAIR TABLE table_name[ PARTITION (p1,...)];
```

illustrate:

1. This statement simply means that the system will no longer repair shard copies of the specified table or partition with high priority. Replicas are still repaired with the default schedule.

### Example

  1. Cancel high priority repair

     ```sql
      ADMIN CANCEL REPAIR TABLE tbl PARTITION(p1);
     ```

### Keywords

    ADMIN, CANCEL, REPAIR

### Best Practice

