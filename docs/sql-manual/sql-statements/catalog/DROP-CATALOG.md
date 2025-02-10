---
{
    "title": "DROP CATALOG",
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

This statement is used to delete the external catalog.

## Syntax

```sql
DROP CATALOG [IF EXISTS] <catalog_name>;
```

## Required Parameters

**1. `<catalog_name>`**
The name of the catalog to be dropped.

## Access Control Requirements
| Privilege | Object  | Notes                                                               |
|:----------|:--------|:--------------------------------------------------------------------|
| DROP_PRIV | Catalog | The DROP_PRIV permission for the corresponding catalog is required. |


## Example

1. Drop catalog hive

   ```sql
   DROP CATALOG hive;
   ```


