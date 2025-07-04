---
{
    "title": "ADMIN-SET-CONFIG",
    "language": "en"
}
---

## ADMIN-SET-CONFIG

### Name

ADMIN SET CONFIG

### Description

This statement is used to set the configuration items of the cluster (currently only the configuration items of FE are supported).
The settable configuration items can be viewed through the ADMIN SHOW FRONTEND CONFIG; command.

grammar:

```sql
  ADMIN SET FRONTEND CONFIG ("key" = "value");
```

### Example

1. Set 'disable_balance' to true

        ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");

### Keywords

    ADMIN, SET, CONFIG

### Best Practice

