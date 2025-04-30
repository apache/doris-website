---
{
    "title": "NTH_VALUE",
    "language": "en"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## Description

NTH_VALUE() is a window function used to return the Nth value in an ordered dataset within a window partition. When N exceeds the valid size of the window, it returns NULL as the result.

## Syntax

```sql
NTH_VALUE(<expr>, <offset>)
```

## Parameters
| Parameter           | Description                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| expr                | The expression from which will get the value value                                                                    |
| offset         | The parameter offset must be a positive integer greater than 0, indicating the Nth element value to retrieve, with the starting index at 1.                                    |

## Return Value

Returns the same data type as the input expression.

## Examples

```sql
WITH example_data AS (
    SELECT 1 as column1, 66 as column2, 'A' as group_name
    UNION ALL
    SELECT 1, 10, 'A'
    UNION ALL
    SELECT 1, 66, 'A'
    UNION ALL
    SELECT 1, 20, 'A'
    UNION ALL
    SELECT 2, 66, 'B'
    UNION ALL
    SELECT 2, 30, 'B'
    UNION ALL
    SELECT 2, 40, 'B'
)
SELECT 
    group_name,
    column1,
    column2,
    NTH_VALUE(column2, 2) OVER (
        PARTITION BY column1 
        ORDER BY column2
        ROWS BETWEEN 1 preceding and 1 following
    ) as nth
FROM example_data
ORDER BY column1, column2;
```

```text
+------------+---------+---------+------+
| group_name | column1 | column2 | nth  |
+------------+---------+---------+------+
| A          |       1 |      10 |   20 |
| A          |       1 |      20 |   20 |
| A          |       1 |      66 |   66 |
| A          |       1 |      66 |   66 |
| B          |       2 |      30 |   40 |
| B          |       2 |      40 |   40 |
| B          |       2 |      66 |   66 |
+------------+---------+---------+------+
```