---
{
    "title": "SHOW-VARIABLES",
    "language": "en"
}
---

## SHOW-VARIABLES

### Name

SHOW VARIABLES

### Description

This statement is used to display Doris system variables, which can be queried by conditions

grammar:

```sql
SHOW [GLOBAL | SESSION] VARIABLES
     [LIKE 'pattern' | WHERE expr]
```

illustrate:

- show variables is mainly used to view the values of system variables.
- Executing the SHOW VARIABLES command does not require any privileges, it only requires being able to connect to the server.
- Use the like statement to match with variable_name.
- The % percent wildcard can be used anywhere in the matching pattern

### Example

1. The default here is to match the Variable_name, here is the exact match

    ```sql
    show variables like 'max_connections';
    ```

2. Matching through the percent sign (%) wildcard can match multiple items

    ```sql
    show variables like '%connec%';
    ```

3. Use the Where clause for matching queries

    ```sql
    show variables where variable_name = 'version';
    ```

### Keywords

    SHOW, VARIABLES

### Best Practice

