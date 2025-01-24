---
{
    "title": "ALTER ASYNC MATERIALIZED VIEW",
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

This statement is used to modify asynchronous materialized views.

#### syntax

```sql
ALTER MATERIALIZED VIEW mvName=multipartIdentifier ((RENAME newName=identifier)
       | (REFRESH (refreshMethod | refreshTrigger | refreshMethod refreshTrigger))
       | REPLACE WITH MATERIALIZED VIEW newName=identifier propertyClause?
       | (SET  LEFT_PAREN fileProperties=propertyItemList RIGHT_PAREN))
```

#### illustrate

##### RENAME

Used to change the name of the materialized view

For example, changing the name of mv1 to mv2
```sql
ALTER MATERIALIZED VIEW mv1 rename mv2;
```

##### refreshMethod

Same as [creating asynchronous materialized views](../Create/CREATE-ASYNC-MATERIALIZED-VIEW.md)

##### refreshTrigger

Same as [creating asynchronous materialized views](../Create/CREATE-ASYNC-MATERIALIZED-VIEW.md)

##### SET
Modify properties unique to materialized views

For example, modifying the grace_period of mv1 to 3000ms
```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3000");
```

##### REPLACE
```sql
ALTER MATERIALIZED VIEW [db.]mv1 REPLACE WITH MATERIALIZED VIEW mv2
[PROPERTIES('swap' = 'true')];
```
Replacing atoms with two materialized views

swap default is TRUE
- If the swap parameter is set to TRUE, it is equivalent to renaming the materialized view mv1 to mv2, and renaming mv2 to mv1 at the same time
- If the swap parameter is set to FALSE, it is equivalent to renaming mv2 to mv1 and deleting the original mv1

For example, if you want to swap the names of mv1 and mv2
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2;
```

For example, if you want to rename mv2 to mv1 and delete the original mv1
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2
PROPERTIES('swap' = 'false');
```

## Keywords

    ALTER, ASYNC, MATERIALIZED, VIEW

