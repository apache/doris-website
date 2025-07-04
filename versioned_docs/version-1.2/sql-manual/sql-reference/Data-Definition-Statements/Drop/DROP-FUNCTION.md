---
{
    "title": "DROP-FUNCTION",
    "language": "en"
}
---

## DROP-FUNCTION

### Name

DROP FUNCTION

### Description

Delete a custom function. Function names and parameter types are exactly the same to be deleted.

grammar:

```sql
DROP [GLOBAL] FUNCTION function_name
     (arg_type [, ...])
```

Parameter Description:

- `function_name`: the name of the function to delete
- `arg_type`: the argument list of the function to delete

### Example

1. Delete a function

    ```sql
    DROP FUNCTION my_add(INT, INT)
    ```
2. Delete a global function

    ```sql
    DROP GLOBAL FUNCTION my_add(INT, INT)
    ```   

### Keywords

     DROP, FUNCTION

### Best Practice
