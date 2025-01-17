---
{
    "title": "ROW_NUMBER",
    "language": "en"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## Description

ROW_NUMBER() is a window function that assigns a unique sequential number to each row within a partition. Numbers start at 1 and increment continuously. Unlike RANK() and DENSE_RANK(), ROW_NUMBER() assigns different numbers even for identical values, ensuring each row has a unique number.

## Syntax

```sql
ROW_NUMBER() OVER ( 
    [ PARTITION BY <expr1> [, <expr2> ... ] ]
    ORDER BY <expr3> [ , <expr4> ... ] [ ASC | DESC ]
)
```

## Parameters
| Parameter    | Description                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| expr1, expr2 | Optional. One or more expressions used for partitioning. For example, to number employees within each department, partition by department |
| expr3, expr4 | Required. One or more expressions used for ordering. This determines the order in which row numbers are assigned                          |

## Return Value

Returns a BIGINT sequence number, starting from 1 and incrementing continuously. Numbers are unique within each partition.

## Examples

```sql
select x, y, row_number() over(partition by x order by y) as rank from int_t;
```

```text
+-----+-----+------+
| x   | y   | rank |
| --- | --- | ---- |
| 1   | 1   | 1    |
| 1   | 2   | 2    |
| 1   | 2   | 3    |
| 2   | 1   | 1    |
| 2   | 2   | 2    |
| 2   | 3   | 3    |
| 3   | 1   | 1    |
| 3   | 1   | 2    |
| 3   | 2   | 3    |
+-----+-----+------+
```