---
{
    "title": "FIRST_VALUE",
    "language": "en"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## Description

FIRST_VALUE() is a window function that returns the first value in an ordered set of values within a window partition. The handling of null values can be controlled using the IGNORE NULLS or RESPECT NULLS options.

## Syntax

```sql
FIRST_VALUE( <expr> ) [ { IGNORE | RESPECT } NULLS ]
  OVER ( [ PARTITION BY <partition_expr> ] ORDER BY <order_expr> [ ASC | DESC ] [ window_frame ] )
```

## Parameters
| Parameter           | Description                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| expr                | The expression from which to get the first value                                                                    |
| partition_by_clause | Optional. Specifies the columns for partitioning, formatted as `PARTITION BY column1, column2, ...`                 |
| order_by_clause     | Required. Specifies the columns for ordering, formatted as `ORDER BY column1 [ASC\|DESC], column2 [ASC\|DESC], ...` |
| IGNORE NULLS        | Optional. When set, null values are ignored, returning the first non-null value                                     |
| RESPECT NULLS       | Optional. Default value. If the first value is null, returns null                                                   |

## Return Value

Returns the same data type as the input expression.

## Examples

```sql
SELECT 
    column1,
    column2,
    FIRST_VALUE(column2) OVER (
        PARTITION BY column1 
        ORDER BY column2 NULLS LAST
    ) AS column2_first
FROM VALUES
    (1, 10), (1, 11), (1, null), (1, 12),
    (2, 20), (2, 21), (2, 22)
ORDER BY column1, column2;
```

```text
+---------+---------+---------------+
| COLUMN1 | COLUMN2 | COLUMN2_FIRST |
|---------+---------+---------------|
|       1 |      10 |            10 |
|       1 |      11 |            10 |
|       1 |      12 |            10 |
|       1 |    NULL |            10 |
|       2 |      20 |            20 |
|       2 |      21 |            20 |
|       2 |      22 |            20 |
+---------+---------+---------------+
```