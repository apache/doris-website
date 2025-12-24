---
{
    "title": "SHOW VARIABLES",
    "language": "en",
    "description": "This statement is used to display Doris system variables, which can be queried by conditions"
}
---

## Description

This statement is used to display Doris system variables, which can be queried by conditions

## Syntax

```sql
SHOW [<effective_scope>] VARIABLES [<like_pattern> | <where>]
```

## Optional Parameters
**1. `<effective_scope>`**
> Effective scope is one of `GLOBAL` or `SESSION` or `LOCAL`. If there is no effective scope, default value is `SESSION`. `LOCAL` is an alias of `SESSION`.

**2. `<like_pattern>`**
> Use like statement to match and filter result

**3. `<where>`**
> Use where statement to match and filter result

## Access Control Requirements
Users executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| Any_PRIV | Session  | Any privilege can show variables |


## Return Value
| Variable_name | Value   | Default_Value                    | Changed |
|:--------------|:--------|:---------------------------------|:--------|
| variable name1      | value1 | default value1 |   0/1      |
| variable name2      | value2 | default value2 |   0/1      |


## Usage Notes

- Show variables is mainly used to view the values of system variables.
- Executing the SHOW VARIABLES command does not require any privileges, it only requires being able to connect to the server.
- The column `Changed` from `Return Value`, 0 means no changed and 1 means changed.
- There are some restrictions when using the `SHOW` statement:
  - Can not use `or` in where clause
  - Column names are on the left
  - Only supports equivalent comparisons in where clause
  - Use the like statement to match with variable_name.
  - The % percent wildcard can be used anywhere in the matching pattern

## Example


- The default here is to match the Variable_name, here is the exact match

    ```sql
    show variables like 'max_connections';
    ```


- Matching through the percent sign (%) wildcard can match multiple items

    ```sql
    show variables like '%connec%';
    ```


- Use the Where clause for matching queries

    ```sql
    show variables where variable_name = 'version';
    ```
