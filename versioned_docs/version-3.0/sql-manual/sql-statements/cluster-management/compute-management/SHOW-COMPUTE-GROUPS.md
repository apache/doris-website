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

The SHOW COMPUTE GROUPS command is used to display information about all configured compute groups in the system. Compute groups are logical units used to manage and organize computational resources, helping users allocate and utilize system resources more effectively.

This command assists administrators and users in quickly understanding the existing compute group configurations in the system, including the name, attributes, and other relevant information for each compute group. This is particularly useful for resource management, performance optimization, and system monitoring.

## Syntax

```sql
SHOW COMPUTE GROUPS
```


## Return Values

This command returns a result set containing the following columns:

- `Name`: The name of the compute group.
- `IsCurrent`: Indicates whether it is the current working compute group.
- `Users`: Displays the list of users who have permission to use this compute group.
- `BackendNum`: Shows the number of backends (compute nodes) currently allocated to this compute group.

## Related Commands

- [ALTER SYSTEM ADD BACKEND](../Administration-Statements/ALTER-SYSTEM-ADD-BACKEND.md)
- [GRANT](../account-management/GRANT-TO.md)
- [REVOKE](../account-management/REVOKE-FROM.md)
- [SET DEFAULT COMPUTE GROUP](../Administration-Statements/SET-DEFAULT-COMPUTE-GROUP.md)

## Keywords

SHOW, COMPUTE GROUPS
