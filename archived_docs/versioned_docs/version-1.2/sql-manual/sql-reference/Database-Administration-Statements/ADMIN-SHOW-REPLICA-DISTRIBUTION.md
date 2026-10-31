---
{
    "title": "ADMIN-SHOW-REPLICA-DISTRIBUTION",
    "language": "en"
}
---

## ADMIN-SHOW-REPLICA-DISTRIBUTION

### Name

ADMIN SHOW REPLICA DISTRIBUTION

### Description

This statement is used to display the distribution status of a table or partition replica

grammar:

```sql
ADMIN SHOW REPLICA DISTRIBUTION FROM [db_name.]tbl_name [PARTITION (p1, ...)];
```

illustrate:

1. The Graph column in the result shows the replica distribution ratio in the form of a graph

### Example

1. View the replica distribution of the table

    ```sql
    ADMIN SHOW REPLICA DISTRIBUTION FROM tbl1;
    ```

  2. View the replica distribution of the partitions of the table

      ```sql
     ADMIN SHOW REPLICA DISTRIBUTION FROM db1.tbl1 PARTITION(p1, p2);
      ```

### Keywords

    ADMIN, SHOW, REPLICA, DISTRIBUTION, ADMIN SHOW

### Best Practice

