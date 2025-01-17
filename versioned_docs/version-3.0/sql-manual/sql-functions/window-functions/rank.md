---
{
    "title": "RANK",
    "language": "en"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## Description

RANK() is a window function that returns the rank of values in an ordered dataset. Rankings start at 1 and increment sequentially. When identical values occur, they receive the same rank, but this creates gaps in the ranking sequence. For example, if the first two rows are tied for rank 1, the next different value will be ranked 3 (not 2).

## Syntax

```sql
RANK() OVER ( 
    [ PARTITION BY <expr1> ] 
    ORDER BY <expr2> [ ASC | DESC ] 
)
```

## Parameters
| Parameter | Description                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| expr1     | Optional. Expression used for partitioning. For example, to rank employees by salary within each department, partition by department |
| expr2     | Required. Expression used for ordering. This determines the order of the rankings                                                    |

## Return Value

Returns a BIGINT rank value. Returns the same rank for identical values, but creates gaps in the sequence.

## Examples

```sql
SELECT 
    department,
    employee_name,
    salary,
    RANK() OVER (
        PARTITION BY department 
        ORDER BY salary DESC
    ) as salary_rank
FROM employees;
```

```text
+------------+---------------+--------+-------------+
| department | employee_name | salary | salary_rank |
+------------+---------------+--------+-------------+
| Sales      | Alice        | 10000  | 1           |
| Sales      | Bob          | 10000  | 1           |
| Sales      | Charlie      | 8000   | 3           |  -- Note this is 3, not 2
| IT         | David        | 12000  | 1           |
| IT         | Eve          | 11000  | 2           |
| IT         | Frank        | 11000  | 2           |
| IT         | Grace        | 9000   | 4           |  -- Note this is 4, not 3
+------------+---------------+--------+-------------+
```

In this example, the data is partitioned by department and ranked by salary within each department. When identical salaries occur (like Alice and Bob, Eve and Frank), they receive the same rank, but this creates gaps in subsequent rankings.
