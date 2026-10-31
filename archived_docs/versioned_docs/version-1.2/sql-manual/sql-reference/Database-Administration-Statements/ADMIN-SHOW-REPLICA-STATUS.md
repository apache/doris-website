---
{
    "title": "ADMIN-SHOW-REPLICA-STATUS",
    "language": "en"
}
---

## ADMIN-SHOW-REPLICA-STATUS

### Name

ADMIN SHOW REPLICA STATUS

### Description

This statement is used to display replica status information for a table or partition.

grammar:

```sql
 ADMIN SHOW REPLICA STATUS FROM [db_name.]tbl_name [PARTITION (p1, ...)]
[where_clause];
```

illustrate

1. where_clause:
       WHERE STATUS [!]= "replica_status"

2. replica_status:
       OK: replica is healthy
       DEAD: The Backend where the replica is located is unavailable
       VERSION_ERROR: replica data version is missing
       SCHEMA_ERROR: The schema hash of the replica is incorrect
       MISSING: replica does not exist

### Example

1. View the status of all replicas of the table

   ```sql
   ADMIN SHOW REPLICA STATUS FROM db1.tbl1;
   ```

2. View a copy of a table with a partition status of VERSION_ERROR

   ```sql
   ADMIN SHOW REPLICA STATUS FROM tbl1 PARTITION (p1, p2)
   WHERE STATUS = "VERSION_ERROR";
   ```

3. View all unhealthy replicas of the table

   ```sql
   ADMIN SHOW REPLICA STATUS FROM tbl1
   WHERE STATUS != "OK";
   ```

### Keywords

    ADMIN, SHOW, REPLICA, STATUS, ADMIN SHOW

### Best Practice

