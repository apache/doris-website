---
{
    "title": "ADMIN-SHOW-CONFIG",
    "language": "en"
}
---

## ADMIN-SHOW-CONFIG

### Name

ADMIN SHOW CONFIG

### Description

This statement is used to display the configuration of the current cluster (currently only the configuration items of FE are supported)

grammar:

```sql
 ADMIN SHOW FRONTEND CONFIG [LIKE "pattern"];
```

The columns in the results have the following meanings:

1. Key: Configuration item name
2. Value: Configuration item value
3. Type: Configuration item type
4. IsMutable: Whether it can be set by ADMIN SET CONFIG command
5. MasterOnly: Is it only applicable to Master FE
6. Comment: Configuration item description

### Example

1. View the configuration of the current FE node

   ```sql
   ADMIN SHOW FRONTEND CONFIG;
   ```

2. Use the like predicate to search the configuration of the current Fe node

   ```
   mysql> ADMIN SHOW FRONTEND CONFIG LIKE '%check_java_version%';
   +--------------------+-------+---------+---------- -+------------+---------+
   | Key | Value | Type | IsMutable | MasterOnly | Comment |
   +--------------------+-------+---------+---------- -+------------+---------+
   | check_java_version | true | boolean | false | false | |
   +--------------------+-------+---------+---------- -+------------+---------+
   1 row in set (0.01 sec)
   ```

### Keywords

    ADMIN, SHOW, CONFIG, ADMIN SHOW

### Best Practice

