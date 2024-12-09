---
{
    "title": "CREATE ROW POLICY",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Description

Explain can view the rewritten execution plan. 

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
  SELECT * FROM (SELECT * FROM table1 WHERE c1 = 'a' AND c2 = 'b' OR c3 = 'c' OR c4 = 'd')
  ```
