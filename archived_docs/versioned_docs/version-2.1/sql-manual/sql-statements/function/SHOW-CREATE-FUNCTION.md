---
{
    "title": "SHOW CREATE FUNCTION",
    "language": "en",
    "description": "This statement is used to show the creation statement of a user-defined function"
}
---

## Description

This statement is used to show the creation statement of a user-defined function

## Syntax

```sql
SHOW CREATE [ GLOBAL ] FUNCTION <function_name>( <arg_type> ) [ FROM <db_name> ];
```

## Required Parameters

**1. `<function_name>`**

> The name of the custom function that you want to query for the creation statement.

**2. `<arg_type>`**

> The parameter list of the custom function that needs to be queried for the creation statement.
>
> Parameter list location you need to enter the data type of the location parameter

## Optional Parameters

**1.`GLOBAL`**

> GLOBAL is an optional parameter.
>
> If GLOBAL is set, the function is searched for globally and deleted.
>
> If GLOABL is not entered, the function is searched for in the current database and deleted.

**2.`<db_name>`**

> FROM db_name indicates that the custom function is queried from the specified database

## Return Value

| Column          | Description          |
|-----------------|-------------|
| SYMBOL          | Function package name        |
| FILE            | jar package path     |
| ALWAYS_NULLABLE | Whether the result can be NULL |
| TYPE            | Function type        |

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege | Object   | Notes       |
|:----------|:---------|:--------------|
| SHOW_PRIV | Function | You need to have the show permission on this function |

## Examples

```sql
SHOW CREATE FUNCTION add_one(INT)
```

```text
| Function Signature | Create Function
+--------------------+-------------------------------------------------------
| add_one(INT)       | CREATE FUNCTION add_one(INT) RETURNS INT PROPERTIES (
  "SYMBOL"="org.apache.doris.udf.AddOne",
  "FILE"="file:///xxx.jar",
  "ALWAYS_NULLABLE"="true",
  "TYPE"="JAVA_UDF"
  ); |
+--------------------+-------------------------------------------------------
```
