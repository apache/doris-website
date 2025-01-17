---
{
    "title": "DENSE_RANK",
    "language": "en"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## Description

DENSE_RANK() is a window function used to calculate rankings within a group. Unlike RANK(), DENSE_RANK() returns consecutive rankings without gaps. The ranking values start from 1 and increment sequentially. When there are identical values, they will receive the same rank.

## Syntax

```sql
DENSE_RANK() OVER([ PARTITION BY <partition_expr> ] ORDER BY <order_expr> [ ASC | DESC ])
```

## Parameters
| Parameter           | Description                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| partition_by_clause | Optional. Specifies the columns for partitioning, formatted as `PARTITION BY column1, column2, ...`. If not specified, all rows are treated as one partition |
| order_by_clause     | Required. Specifies the columns for ordering, formatted as `ORDER BY column1 [ASC\|DESC], column2 [ASC\|DESC], ...`. This determines the ranking order       |

## Return Value

Returns a BIGINT type ranking value, starting from 1.

## Examples

```sql
select x, y, dense_rank() over(partition by x order by y) as rank from int_t;
```

```text
+-----+-----+------+
| x   | y   | rank |
| --- | --- | ---- |
| 1   | 1   | 1    |
| 1   | 2   | 2    |
| 1   | 2   | 2    | -- Same values receive the same rank |
| 2   | 1   | 1    |
| 2   | 2   | 2    |
| 2   | 3   | 3    | -- Rankings are consecutive, no gaps |
| 3   | 1   | 1    |
| 3   | 1   | 1    |
| 3   | 2   | 2    |
+-----+-----+------+
```