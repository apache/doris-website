---
{
    "title": "CLEAN ALL QUERY STATS",
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

This statement is used to clear query statistics

## Syntax

```sql
CLEAN [ { ALL| DATABASE | TABLE } ] QUERY STATS [ { [ FOR <db_name>] | [ { FROM | IN } ] <table_name>]];
```

## Required Parameters

**1. `ALL`**

> ALL Clears all statistics

**2. `DATABASE`**

> DATABASE clears statistics of a database

**3. `TABLE`**

> TABLE Indicates that statistics of a table are cleared

## Optional Parameters

**1. `<db_name>`**

> If this parameter is set, the statistics of the corresponding database are cleared

**2. `<table_name>`**

> If this parameter is set, the statistics of the corresponding table are cleared


## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege    | Object   | Notes                 |
|:-------------|:---------|:--------------------------|
| ADMIN        | ALL      | If ALL is specified, the ADMIN permission is required     |
| ALTER        | DATABASE | If the database is specified, the ALTER permission for the corresponding database is required |
| ADMIN        | TABLE    | If you specify a table, you need alter permission for that table     |


## Examples

```sql
clean all query stats
```

```sql
clean database query stats for test_query_db
```

```sql
clean table query stats from test_query_db.baseall
```


