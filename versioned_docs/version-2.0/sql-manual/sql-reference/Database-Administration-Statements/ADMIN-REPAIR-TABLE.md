---
{
    "title": "ADMIN-REPAIR-TABLE",
    "language": "en"
}
---

## ADMIN-REPAIR-TABLE

### Name

ADMIN REPAIR TABLE

### Description

statement used to attempt to preferentially repair the specified table or partition

grammar:

```sql
ADMIN REPAIR TABLE table_name[ PARTITION (p1,...)]
```

illustrate:

1. This statement only means to let the system try to repair the shard copy of the specified table or partition with high priority, and does not guarantee that the repair can be successful. Users can view the repair status through the ADMIN SHOW REPLICA STATUS command.
2. The default timeout is 14400 seconds (4 hours). A timeout means that the system will no longer repair shard copies of the specified table or partition with high priority. Need to re-use this command to set

### Example

1. Attempt to repair the specified table

        ADMIN REPAIR TABLE tbl1;

2. Try to repair the specified partition

        ADMIN REPAIR TABLE tbl1 PARTITION (p1, p2);

### Keywords

    ADMIN, REPAIR, TABLE

### Best Practice

