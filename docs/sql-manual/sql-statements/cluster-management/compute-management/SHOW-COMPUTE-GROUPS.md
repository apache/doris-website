---
{
    "title": "SHOW COMPUTE GROUPS",
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

In the compute storage separation mode, display a list of compute groups that the current user has permissions to use.

## Syntax

```sql
SHOW COMPUTE GROUPS
```

## Return Value

Returns a list of compute groups that the current user has permissions for.

- Name - The name of the compute group
- IsCurrent - Whether the current user is using this compute group
- Users - Usernames that have set this compute group as their default compute group
- BackendNum - The number of backends this compute group has

## Example

Specify the use of the compute group named `compute_cluster`.

```sql
SHOW COMPUTE GROUPS;
```

The result is:

```sql
+-----------------+-----------+-------+------------+
| Name           | IsCurrent  | Users | BackendNum |
+-----------------+-----------+-------+------------+
| compute_cluster | TRUE      |       | 3          |
+-----------------+-----------+-------+------------+
```

## Usage Note

If the current user has no permissions for any compute group, `SHOW COMPUTE GROUPS` will return an empty list.