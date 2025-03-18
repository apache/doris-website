---
{
"title": "SHOW CREATE ASYNC MATERIALIZED VIEW",
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

View the materialized view creation statement.

## Syntax

```sql
SHOW CREATE MATERIALIZED VIEW <materialized_view_name>
```

## Required Parameters

**1. `<materialized_view_name>`**

> The name of the materialized view.

## Return Values

|Column Name | Description   |
| -- |------|
| Materialized View | Name of the materialized view   |
| Create Materialized View | Statement used to create the materialized view |

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes                                                       |
| --------- | ------ | ----------------------------------------------------------- |
| SELECT_PRIV/LOAD_PRIV/ALTER_PRIV/CREATE_PRIV/DROP_PRIV | Table  | |

## Example

1. View the creation statement of an asynchronous materialized view

   ```sql
   SHOW CREATE MATERIALIZED VIEW partition_mv;
   ```
