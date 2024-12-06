---
{
    "title": "DROP STORAGE POLICY",
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

Delete a storage policy. For detailed descriptions of storage policies, please refer to the "Storage Policy" chapter.

## Syntax

```sql
DROP STORAGE POLICY <policy_name>
```
## Required Parameters

**<policy_name>**

> Storage policy name

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes |
| ---------- | ------ | ----- |
| ADMIN_PRIV | Global |       |

## Examples

1. Delete a storage policy named policy1

  ```sql
  DROP STORAGE POLICY policy1
  ```