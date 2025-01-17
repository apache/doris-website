---
{
    "title": "DROP REPOSITORY",
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

This statement is used to delete a created repository.

## Syntax

```sql
DROP REPOSITORY <repo_name>;
```

## Required Parameters
**<repo_name>**
> The unique name of the repository.

## Access Control Requirements

| Privilege               | Object                         | Notes                                               |
|:-------------------|:-----------------------------|:----------------------------------------------------|
| ADMIN_PRIV         | Entire cluster management permissions | Only the root or superuser can create repositories  |


## Usage notes
- Deleting the repository only removes its mapping in Doris and does not delete the actual repository data. After deletion, the repository can be mapped again by specifying the same LOCATION.

## Example

Delete the repository named example_repo:

```sql
DROP REPOSITORY `example_repo`;
```