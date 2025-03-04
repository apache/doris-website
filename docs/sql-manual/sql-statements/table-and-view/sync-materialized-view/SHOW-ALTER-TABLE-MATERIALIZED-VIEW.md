---
{
    "title": "SHOW ALTER TABLE MATERIALIZED VIEW",
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

Check the status of the synchronized materialized view build task.

Since creating a synchronized materialized view is an asynchronous operation, after submitting the materialized view creation task, users need to asynchronously check the status of the synchronized materialized view build through a command.

## Syntax


```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM <database>
```

## Required Parameters

**1. `<database>`**

> The database to which the base table of the synchronized materialized view belongs.

## Permissions

The user executing this SQL command must have at least the following permissions:

| Privilege  | Object | Notes                                                        |
| ---------- | ------ | ------------------------------------------------------------ |
| ALTER_PRIV | Table  | Requires ALTER_PRIV permission on the table to which the current materialized view belongs |

## Example

```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM doc_db;
```