---
{
    "title": "DROP VIEW",
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

Delete a view in the current or specified database.

## Syntax

```sql
DROP VIEW [ IF EXISTS ] <name>
```
## Required Parameters

The name of the view to be deleted.

## Optional Parameters

**[ IF EXISTS ]**

If this parameter is specified, no error will be thrown when the view does not exist, and the deletion operation will be skipped directly.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| DROP_PRIV | Table  |       |

## Usage Notes

Deleted views cannot be restored and must be recreated.

## Examples

```sql
CREATE VIEW vtest AS SELECT 1, 'test';
DROP VIEW IF EXISTS vtest;
```