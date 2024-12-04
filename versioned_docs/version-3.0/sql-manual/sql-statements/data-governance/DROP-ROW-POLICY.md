---
{
    "title": "DROP ROW POLICY",
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

Delete row security policy. For details about row security policies, please refer to the "Security Policies" chapter


## Syntax

```sql
DROP ROW POLICY <policy_name> on <table_name>
  [ FOR { <user_name> | ROLE <role_name> } ];
```

## Required Parameters
**<policy_name>**

> Row security policy name

**<table_name>**

> Table name

# Optional Parameters (Optional Parameters)

**<user_name>**

> User name

**<role_name>**

> Role name

# Access Control Requirements (Access Control Requirements)

The user executing this SQL command must have at least the following privileges:

| Privilege                  | Object | Notes |
| :------------------------- | :----- | :---- |
| ADMIN_PRIV or *GRANT_PRIV* | Global |       |

# Examples (Examples)

1. Delete the *policy1 row security policy* for *db1.table1*

  ```sql
  DROP ROW POLICY policy1 ON db1.table1
  ```

1. Delete the policy1 row security policy for db1.table1 that applies to user1

  ```sql
  DROP ROW POLICY policy1 ON db1.table1 FOR user1
  ```

1. Delete the policy1 row security policy for db1.table1 that applies to role1

  ```sql
  DROP ROW POLICY policy1 ON db1.table1 FOR role role1
  ```