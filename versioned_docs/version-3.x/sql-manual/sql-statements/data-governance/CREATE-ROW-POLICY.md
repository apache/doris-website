---
{
    "title": "CREATE ROW POLICY",
    "language": "en",
    "description": "Creates a row-level security policy on a table to restrict the rows returned to specified users or roles."
}
---

## Description

Creates a row-level security policy on a table. The policy restricts the rows that specified users or roles can see by attaching a filter predicate that is applied to queries against the table. 

## Syntax

```sql
CREATE ROW POLICY [ IF NOT EXISTS ] <policy_name> 
ON <table_name> 
AS { RESTRICTIVE | PERMISSIVE } 
TO { <user_name> | ROLE <role_name> } 
USING (<filter>);
```
## Required Parameters

**<policy_name>**

> Row security policy name

**<table_name>**

> Table name

**<filter_type>**

> RESTRICTIVE combines a set of policies with AND, PERMISSIVE combines a set of policies with OR



> Equivalent to the filter condition of a query statement, for example: id=1

## Optional Parameters

**<user_name>**

> User name, cannot be created for root and admin users

**<role_name>**

> Role name

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege                | Object | Notes |
| ------------------------ | ------ | ----- |
| ADMIN_PRIV or GRANT_PRIV | Global |       |

## Examples

1. Create a set of row security policies

  ```sql
  CREATE ROW POLICY test_row_policy_1 ON test.table1 
  AS RESTRICTIVE TO test USING (c1 = 'a');
  CREATE ROW POLICY test_row_policy_2 ON test.table1 
  AS RESTRICTIVE TO test USING (c2 = 'b');
  CREATE ROW POLICY test_row_policy_3 ON test.table1 
  AS PERMISSIVE TO test USING (c3 = 'c');
  CREATE ROW POLICY test_row_policy_3 ON test.table1 
  AS PERMISSIVE TO test USING (c4 = 'd');
  ```

  When we execute a query on table1, the rewritten SQL is:

  ```sql
  SELECT * FROM (SELECT * FROM table1 WHERE (c1 = 'a' AND c2 = 'b') AND (c3 = 'c' OR c4 = 'd'))
  ```
