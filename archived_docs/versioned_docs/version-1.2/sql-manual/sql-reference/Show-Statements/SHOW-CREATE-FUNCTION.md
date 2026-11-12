---
{
    "title": "SHOW-CREATE-FUNCTION",
    "language": "en"
}
---

## SHOW-CREATE-FUNCTION

### Name

SHOW CREATE FUNCTION

### Description

This statement is used to display the creation statement of the user-defined function

grammar:

```sql
SHOW CREATE [GLOBAL] FUNCTION function_name(arg_type [, ...]) [FROM db_name]];
```

illustrate:
1. `global`: The show function is global 
2. `function_name`: The name of the function to display
3. `arg_type`: The parameter list of the function to display
4. If db_name is not specified, the current default db is used

**Note: the "global" keyword is only available after v2.0**

### Example

1. Show the creation statement of the specified function under the default db

    ```sql
    SHOW CREATE FUNCTION my_add(INT, INT)
    ```
2. Show the creation statement of the specified global function

    ```sql
    SHOW CREATE GLOBAL FUNCTION my_add(INT, INT)
    ```

### Keywords

    SHOW, CREATE, FUNCTION

### Best Practice

