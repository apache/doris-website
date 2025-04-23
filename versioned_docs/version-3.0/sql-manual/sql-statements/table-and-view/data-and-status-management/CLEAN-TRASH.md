---
{
  "title": "ADMIN CLEAN TRASH",
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

This statement is used to clear garbage data in backend.

## Syntax

```sql
ADMIN CLEAN TRASH [ON ("<be_host>:<be_heartbeat_port>" [, ...])]
```

## Optional Parameters

**1. `[ON ("<be_host>:<be_heartbeat_port>" [, ...])]`**

Specify the backend to be cleaned up. If you do not add ON, all backend is cleared by default.


## Access Control Requirements

Users executing this SQL command must have at least the following privileges:


| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | User or Role  | Only users or roles with the ADMIN_PRIV privilege can perform the CLEAN TRASH  operation. |


## Examples

```sql
-- Clean up the junk data of all be nodes.
ADMIN CLEAN TRASH;
```

```sql
-- Clean up garbage data for '192.168.0.1:9050' and '192.168.0.2:9050'.
ADMIN CLEAN TRASH ON ("192.168.0.1:9050", "192.168.0.2:9050");
```