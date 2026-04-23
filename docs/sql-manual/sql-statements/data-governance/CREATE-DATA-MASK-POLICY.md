---
{
    "title": "CREATE DATA MASK POLICY",
    "language": "en",
    "description": "Explain can view the rewritten execution plan."
}
---

## Description

Explain can view the rewritten execution plan. 

## Syntax

```sql
CREATE DATA MASK POLICY [ IF NOT EXISTS ] <policy_name> 
ON <col_name> 
TO { <user_name> | ROLE <role_name> } 
USING <mask_type> [LEVEL <priority>];
```
## Required Parameters

**<policy_name>**

> column data mask policy name

**<col_name>**

> column name

## Optional Parameters

**<user_name>**

> User name, cannot be created for root and admin users

**<role_name>**

> Role name

**<mask_type>**

> Data mask type. see MASK_TYPE list

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege                | Object | Notes |
| ------------------------ | ------ | ----- |
| ADMIN_PRIV or GRANT_PRIV | Global |       |

## MASK_TYPE

| Name                | Meaning                                                         | Expression                                                                                       |
|:--------------------|:----------------------------------------------------------------|:-------------------------------------------------------------------------------------------------|
| MASK_REDACT         | Replace lowercase with 'x', uppercase with 'X', digits with '0' | regexp_replace(regexp_replace(regexp_replace({col},'([A-Z])', 'X'),'([a-z])','x'),'([0-9])','0') |
| MASK_SHOW_LAST_4    | Show last 4 characters; replace rest with 'X'                   | LPAD(RIGHT({col}, 4), CHAR_LENGTH({col}), 'X')                                                   |
| MASK_SHOW_FIRST_4   | Show first 4 characters; replace rest with 'X'                  | RPAD(LEFT({col}, 4), CHAR_LENGTH({col}), 'X')                                                    |
| MASK_HASH           | Hash the value of a varchar with sha256                         | hex(sha2({col}, 256))                                                                            |
| MASK_NULL           | Replace with NULL                                               | NULL                                                                                             |
| MASK_DATE_SHOW_YEAR | Date: show only year                                            | date_trunc({col}, 'year')                                                                        |
| MASK_DEFAULT        | Replace with data type default                                  |                                                                                                  |
| MASK_NONE           | Keep it as it is                                                |                                                                                                  |


## Examples

1. Create a set of data mask policies

  ```sql
    CREATE DATA MASK POLICY test_policy_1 ON internal.test.t1.c1
    TO jack USING MASK_HASH;
    
    CREATE DATA MASK POLICY test_policy_2 ON internal.test.t1.c2
    TO Role r1 USING MASK_NULL;
    
    CREATE DATA MASK POLICY test_policy_3 ON internal.test.t1.c1
    TO jack USING MASK_NONE LEVEL 1;
  ```
