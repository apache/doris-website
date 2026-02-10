---
{
    "title": "ADMIN-CHECK-TABLET",
    "language": "en"
}
---

## ADMIN-CHECK-TABLET

### Name

ADMIN CHECK TABLET

### Description

This statement is used to perform the specified check operation on a set of tablets.

grammar:

```sql
ADMIN CHECK TABLET (tablet_id1, tablet_id2, ...)
PROPERTIES("type" = "...");
```

illustrate:

1. A list of tablet ids must be specified along with the type property in PROPERTIES.
2. Type only supports:

    * consistency: Check the consistency of the replica of the tablet. This command is an asynchronous command. After sending, Doris will start to execute the consistency check job of the corresponding tablet. The final result will be reflected in the InconsistentTabletNum column in the result of `SHOW PROC "/cluster_health/tablet_health";`.


### Example

1. Perform a replica data consistency check on a specified set of tablets.

    ```
    ADMIN CHECK TABLET (10000, 10001) 
   PROPERTIES("type" = "consistency");
   ```

### Keywords

    ADMIN, CHECK, TABLET

### Best Practice


