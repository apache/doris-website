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
  ADMIN SET FRONTEND CONFIG ("key" = "value") [ALL];
  ADMIN SET ALL FRONTENDS CONFIG ("key" = "value");
```

illustrate:

1. If `ALL` keyword is used, this config will be applied to all FE(except master_only configuration)

### Example

1. Set 'disable_balance' to true

        ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");

### Keywords

    ADMIN, SET, CONFIG

### Best Practice

