---
{
    "title": "ALTER-SYSTEM-RENAME-COMPUTE-GROUP",
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

## ALTER-SYSTEM-RENAME-COMPUTE-GROUP


### Name

ALTER SYSTEM RENAME COMPUTE-GROUP

### Description

Used for renaming compute groups (admin use only!)

grammar:

- In a separation of storage and computing cluster, this statement is used to rename an existing compute group. This operation is synchronous, and the command returns once the execution is complete.

```sql
ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>
```


Notes:
1. The naming rules for compute groups are consistent with the naming rules for database and table names in DORIS.
2. All compute groups in the current separation of storage and computing cluster can be viewed using [SHOW COMPUTE GROUPS](../Show-Statements/SHOW-COMPUTE-GROUPS.md)。
3. After the renaming operation is completed, it can also be confirmed by using [SHOW COMPUTE GROUPS](../Show-Statements/SHOW-COMPUTE-GROUPS.md)。
4. If the renaming operation fails, you can check the returned message for reasons, such as the original compute group not existing or the original and target compute group names being the same.

### Example

1. Rename the compute group named old_name to new_name.

```sql
ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>
```

### Keywords

ALTER, SYSTEM, RENAME, ALTER SYSTEM