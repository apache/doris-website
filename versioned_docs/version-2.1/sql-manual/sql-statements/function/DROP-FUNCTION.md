---
{
    "title": "DROP FUNCTION",
    "language": "en"
}
---

## Description

Delete a custom function.

## Syntax

```sql
DROP [ GLOBAL ] <function_name> ( <arg_type> )
```

## Required Parameters

**1. `<function_name>`**

> Specifies the name of the function to delete.
>
> The function name needs to be exactly the same as the function name when the function was created.

**2. `<arg_type>`**

> Specifies the argument list for the function to be deleted.
>
> Parameter List Location You need to enter the data type of the location parameter.

## Optional Parameters

**1.`GLOBAL`**

> GLOBAL is an optional parameter.
>
> If GLOBAL is set, the function is searched for globally and deleted.
>
> If GLOABL is not entered, the function is searched for in the current database and deleted.

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege  | Object         | Notes       |
|:-----------|:---------------|:------------|
| ADMIN_PRIV | Custom function| DROP is an administrative operation |


## Usage Notes

- A function can be deleted only when its name and parameter types are identical

## Examples

```sql
DROP FUNCTION my_add(INT, INT)
```

```sql
DROP GLOBAL FUNCTION my_add(INT, INT)
```


