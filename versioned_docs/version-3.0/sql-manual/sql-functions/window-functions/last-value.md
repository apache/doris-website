---
{
    "title": "LAST_VALUE",
    "language": "en"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## Description

LAST_VALUE() is a window function that returns the last value within the window frame. The handling of null values can be controlled using the IGNORE NULLS or RESPECT NULLS options.

## Syntax

```sql
LAST_VALUE( <expr> ) [ { IGNORE | RESPECT } NULLS ]
    OVER ( [ PARTITION BY <partition_expr> ] ORDER BY <order_expr> [ ASC | DESC ] [ window_frame ] )
```

## Parameters
| Parameter           | Description                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| expr                | The expression from which to get the last value                                                             |
| partition_by_clause | Optional. Specifies the columns for partitioning                                                            |
| order_by_clause     | Required. Specifies the columns for ordering                                                                |
| window_frame        | Optional. Specifies the window frame. Default is `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` |
| IGNORE NULLS        | Optional. When set, null values are ignored, returning the last non-null value                              |
| RESPECT NULLS       | Optional. Default value. If the last value is null, returns null                                            |

## Return Value

Returns the same data type as the input expression.

## Examples

```sql
select * , 
last_value(`state`, 1) over(partition by `myday` order by `time_col` DESC rows between 1 preceding and 1 following) as ignore_null,
last_value(`state`, 0) over(partition by `myday` order by `time_col` DESC rows between 1 preceding and 1 following) as not_ignore_null,
last_value(`state`) over(partition by `myday` order by `time_col` DESC rows between 1 preceding and 1 following) as ignore_null_default
from t order by `id`, `myday`, `time_col`;
```

```text
+-----+-------+-------------+-------+-------------+-----------------+---------------------+
| id  | myday | time_col    | state | ignore_null | not_ignore_null | ignore_null_default |
| --- | ----- | ----------- | ----- | ----------- | --------------- | ------------------- |
| 1   | 21    | 04-21-11    | NULL  | 2           | NULL            | NULL                |
| 2   | 21    | 04-21-12    | 2     | 2           | NULL            | NULL                |
| 3   | 21    | 04-21-13    | 3     | 2           | 2               | 2                   |
| 4   | 22    | 04-22-10-21 | NULL  | NULL        | NULL            | NULL                |
| 5   | 22    | 04-22-10-22 | NULL  | 5           | NULL            | NULL                |
| 6   | 22    | 04-22-10-23 | 5     | 5           | NULL            | NULL                |
| 7   | 22    | 04-22-10-24 | NULL  | 5           | 5               | 5                   |
| 8   | 22    | 04-22-10-25 | 9     | 9           | NULL            | NULL                |
| 9   | 23    | 04-23-11    | NULL  | 10          | NULL            | NULL                |
| 10  | 23    | 04-23-12    | 10    | 10          | NULL            | NULL                |
| 11  | 23    | 04-23-13    | NULL  | 10          | 10              | 10                  |
| 12  | 24    | 02-24-10-21 | NULL  | NULL        | NULL            | NULL                |
+-----+-------+-------------+-------+-------------+-----------------+---------------------+
```
