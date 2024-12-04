---
{
    "title": "SHOW STORAGE POLICY",
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

View tables and partitions associated with all/specified storage policies.

## Syntax

```sql
SHOW STORAGE POLICY USING [FOR <storage_policy_name>]
```

## Required Parameters

<storage_policy_name>

> The name of the storage policy to view.

The prerequisite for successfully executing this SQL command is to have ADMIN_PRIV privileges. Please refer to the privilege document.

| Privilege (Privilege) | Object (Object)                      | Notes (Notes)                   |
| --------------------- | ------------------------------------ | ------------------------------- |
| ADMIN_PRIV            | Entire cluster management privileges | All privileges except NODE_PRIV |

## Example

1. View all objects with enabled storage policies.

  ```sql
  mysql> show storage policy using;
  +-----------------------+-----------------------------------------+----------------------------------------+------------+
  | PolicyName            | Database                                | Table                                  | Partitions |
  +-----------------------+-----------------------------------------+----------------------------------------+------------+
  | test_storage_policy   | regression_test_cold_heat_separation_p2 | table_with_storage_policy_1            | ALL        |
  | test_storage_policy   | regression_test_cold_heat_separation_p2 | partition_with_multiple_storage_policy | p201701    |
  | test_storage_policy_2 | regression_test_cold_heat_separation_p2 | partition_with_multiple_storage_policy | p201702    |
  | test_storage_policy_2 | regression_test_cold_heat_separation_p2 | table_with_storage_policy_2            | ALL        |
  | test_policy           | db2                                     | db2_test_1                             | ALL        |
  +-----------------------+-----------------------------------------+----------------------------------------+------------+
  ```

1. View objects using the storage policy test_storage_policy.

  ```sql
  mysql> show storage policy using for test_storage_policy;
  +---------------------+-----------+---------------------------------+------------+
  | PolicyName          | Database  | Table                           | Partitions |
  +---------------------+-----------+---------------------------------+------------+
  | test_storage_policy | db_1      | partition_with_storage_policy_1 | p201701    |
  | test_storage_policy | db_1      | table_with_storage_policy_1     | ALL        |
  +---------------------+-----------+---------------------------------+------------+
  ```
