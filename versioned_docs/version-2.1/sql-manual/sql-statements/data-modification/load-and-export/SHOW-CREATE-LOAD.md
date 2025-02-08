---
{
    "title": "SHOW CREATE LOAD",
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

This statement is used to display the creation statement of an import job.

## Syntax

```sql
SHOW CREATE LOAD FOR <load_name>;
```

## Required Parameters

**`<load_name>`**

> The name of the routine import job.

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
| :---------------- | :------------- | :---------------------------- |
| ADMIN/NODE_PRIV | Database | Cluster administrator privileges are required. |

## Return Value

Returns the creation statement of the specified import job.

## Examples

- Display the creation statement of the specified import job in the default database.

```sql
SHOW CREATE LOAD for test_load
```