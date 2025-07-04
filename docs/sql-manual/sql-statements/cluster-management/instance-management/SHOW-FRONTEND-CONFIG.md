---
{
    "title": "SHOW FRONTEND CONFIG",
    "language": "en"
}
---

## Description

This statement is used to display the configuration of the current cluster (currently only the configuration items of FE are supported)

## Syntax

```sql
SHOW FRONTEND CONFIG [LIKE "<pattern>"];
```

## Optional Parameters
**`<pattern>`**
> A string that can contain ordinary characters and wildcards.


## Return Values
| Column name | Describe                                            |
|-------------|-----------------------------------------------------|
| Value       | Configuration item value                            |
| Type        | Configuration item type                             |
| IsMutable   | Whether it can be set by `ADMIN SET CONFIG` command |
| MasterOnly  | Is it only applicable to Master FE                  |
| Comment     | Configuration item description                      |


## Example

1. View the configuration of the current FE node

   ```sql
   SHOW FRONTEND CONFIG;
   ```

2. Use the like predicate to search the configuration of the current Fe node

   ```sql
    SHOW FRONTEND CONFIG LIKE '%check_java_version%';
    ```
    ```text
    +--------------------+-------+---------+-----------+------------+---------+
    | Key                | Value | Type    | IsMutable | MasterOnly | Comment |
    +--------------------+-------+---------+-----------+------------+---------+
    | check_java_version | true  | boolean | false     | false      |         |
    +--------------------+-------+---------+-----------+------------+---------+
    ```

