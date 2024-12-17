---
{
    "title": "SHOW CREATE VIEW",
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

Display the CREATE VIEW statement used to create the specified view.

## Syntax

```sql
SHOW CREATE VIEW <name>
```

## Required Parameters

`**<name>**`  The name of the view to view.

## Result Description

- View: The name of the queried view.
- Create View: The persisted SQL statement in the database.
- character_set_client: The value of the character_set_client system variable in the session when the view was created.
- collation_connection: The value of the collation_connection system variable in the session when the view was created.

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege        | Object | Notes |
| ---------------- | ------ | ----- |
| SHOW_VIEW_PRIV   | Table  |       |

View information can also be queried via the INFORMATION_SCHEMA.VIEWS table.

## Examples

```sql
CREATE VIEW vtest AS SELECT 1, 'test';
SHOW CREATE VIEW vtest;
```

Query result:

```sql
+-------+------------------------------------------+----------------------+----------------------+
| View  | Create View                              | character_set_client | collation_connection |
+-------+------------------------------------------+----------------------+----------------------+
| vtest | CREATE VIEW `vtest` AS SELECT 1, 'test'; | utf8mb4              | utf8mb4_0900_bin     |
+-------+------------------------------------------+----------------------+----------------------+
```
