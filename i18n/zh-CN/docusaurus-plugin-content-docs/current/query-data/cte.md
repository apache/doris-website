---
{
    "title": "公用表表达式（CTE）",
    "language": "zh-CN"
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


公用表表达式（Common Table Expression）定义一个临时结果集，你可以在 SQL 语句的范围内多次引用。CTE 主要用于 SELECT 语句中。

要指定公用表表达式，请使用 `WITH` 具有一个或多个逗号分隔子句的子句。每个子条款都提供一个子查询，用于生成结果集，并将名称与子查询相关联。下面的示例定义名为的 CTE `cte1` 和 `cte2` 中 `WITH` 子句，并且是指在它们的顶层 `SELECT` 下面的 `WITH` 子句：

```sql
WITH
  cte1 AS（SELECT a，b FROM table1），
  cte2 AS（SELECT c，d FROM table2）
SELECT b，d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

在包含该 `WITH`子句 的语句中，可以引用每个 CTE 名称以访问相应的 CTE 结果集。

CTE 名称可以在其他 CTE 中引用，从而可以基于其他 CTE 定义 CTE。

