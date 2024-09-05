---
{
    "title": "Common Table Expression",
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

Common Table Expression (CTE) define a temporary result set that can be referenced multiple times within the scope of an SQL statement. CTE are primarily used in SELECT statements.

To specify a CTE, use the WITH clause with one or more comma-separated clauses. Each clause provides a subquery that generates a result set and associates a name with the subquery. The following example defines CTE named cte1 and cte2 within the WITH clause and refers to them in the top-level SELECT below the WITH clause:

```sql
WITH
  cte1 AS (SELECT a, b FROM table1),
  cte2 AS (SELECT c, d FROM table2)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

Within the statement that contains the WITH clause, you can reference each CTE name to access the corresponding CTE result set. CTE names can be referenced in other CTE, allowing you to define CTE based on other CTE.

