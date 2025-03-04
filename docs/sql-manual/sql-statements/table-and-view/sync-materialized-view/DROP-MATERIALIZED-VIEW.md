---
{
    "title": "DROP MATERIALIZED VIEW",
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

Drop a synchronized materialized view.

## Syntax


```sql
DROP MATERIALIZED VIEW 
[ IF EXISTS ] <materialized_view_name>
ON <table_name>
```

## Required Parameters

**1. `<materialized_view_name>`**

> The name of the materialized view to be dropped.

**2. `<table_name>`**

> The table to which the materialized view belongs.

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege  | Object | Notes                                                        |
| ---------- | ------ | ------------------------------------------------------------ |
| ALTER_PRIV | Table  | Requires ALTER_PRIV permission on the table to which the materialized view to be deleted belongs |

## Example

Drop the synchronized materialized view `sync_agg_mv` on the `lineitem` table


```sql
DROP MATERIALIZED VIEW sync_agg_mv on lineitem;
```
