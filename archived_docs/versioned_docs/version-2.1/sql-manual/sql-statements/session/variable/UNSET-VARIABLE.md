---
{
    "title": "UNSET VARIABLE",
    "language": "en",
    "description": "This statement is used to restore Doris system variables. These system variables can be modified at global or session level."
}
---

## Description

This statement is used to restore Doris system variables. These system variables can be modified at global or session level.

## Syntax

```sql
UNSET [<effective_scope>] VARIABLE (<variable_name>)
```

## Required Parameters
**1. `<variable_name>`**
> Specifies the variable name, or if you want to unset all variables, this parameter you can give a keyword `ALL`.

## Optional Parameters
**1. `<effective_scope>`**
> Effective scope is one of `GLOBAL` or `SESSION` or `LOCAL`. If there is no effective scope, default value is `SESSION`. `LOCAL` is an alias of `SESSION`.

## Access Control Requirements
Users executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | Session  | unset global variables need admin privilege |

## Usage Notes

- Only ADMIN users can unset variables to take effect globally
- When restore a variable with `GLOBAL`,  it only affects your current using session and new open sessions. It does not affect other current open sessions.



## Example

- Restore value of the time zone

   ```
   UNSET VARIABLE time_zone;
   ```


- Restore the global execution memory size

   ```
   UNSET GLOBAL VARIABLE exec_mem_limit;
   ```


- Restore all variables globally

   ```
   UNSET GLOBAL VARIABLE ALL;
   ```
