---
{
    "title": "Reordering Join with Leading Hint",
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

## Introduction 

Leading Hint is a powerful query optimization technique that allows users to guide the Doris optimizer in determining the table join order in a query plan. Proper use of Leading Hint can significantly enhance the performance of complex queries. 

This documentation will provide a detailed introduction on how to use Leading Hint in Doris to control the order of joins.

:::info Note

For detailed usage instructions, please refer to the [Hint](../../../query-acceleration/tuning/join-hint) documentation.

:::

## Examples

Here is a query example:

```sql
SELECT * FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

By default, Doris may choose t1 as the driving table. If we want to swap the join order to make t2 the driving table, we can use Leading Hint:

```sql
SELECT /*+ LEADING(t2 t1) */ * FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

To verify whether the Hint is effective, you can use the EXPLAIN command to view the query plan and validate:

```sql
EXPLAIN SELECT /*+ LEADING(t2 t1) */ * FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

In the result of EXPLAIN, there will be a "Hint log" section, showing the following:

1. Used: Indicates successfully applied `hint`

2. Unused: Indicates unused `hint`

3. SyntaxError: Indicates `hint` with syntax errors

## Tuning Cases

**1. Left-Deep Tree (Default Behavior)**

```sql
SELECT /*+ LEADING(t1 t2 t3) */ *   
FROM t1 JOIN t2 ON t1.c1 = t2.c2 JOIN t3 ON t2.c2 = t3.c3;
```

Tree Structure:

```sql
      join  
     /    \  
   join    t3  
  /    \  
t1      t2
```

**2. Right-Deep Tree**

```sql
SELECT /*+ LEADING(t1 {t2 t3}) */ *   
FROM t1 JOIN t2 ON t1.c1 = t2.c2 JOIN t3 ON t2.c2 = t3.c3;
```

Tree Structure:

```sql
  join  
 /    \  
t1    join  
     /    \  
    t2     t3
```

**3. Bushy Tree**

```sql
SELECT /*+ LEADING({t1 t2} {t3 t4}) */ *   
FROM t1 JOIN t2 ON t1.c1 = t2.c2   
JOIN t3 ON t2.c2 = t3.c3   
JOIN t4 ON t3.c3 = t4.c4;
```

Tree Structure:

```sql
      join  
      /    \  
   join    join  
  /    \  /    \  
 t1    t2 t3    t4
```

**4. Zig-Zag Tree**

```sql
SELECT /*+ LEADING(t1 {t2 t3} t4) */ *   
FROM t1 JOIN t2 ON t1.c1 = t2.c2   
JOIN t3 ON t2.c2 = t3.c3   
JOIN t4 ON t3.c3 = t4.c4;
```

Tree Structure:

```sql
    join  
   /    \  
 join    t4  
/    \  
t1   join  
    /    \  
   t2     t3
```

**5. Special Case**

For non-inner joins (such as Outer Join, Semi/Anti Join), Leading Hint will automatically derive the type of each join based on the original SQL semantics. If the specified join order is incompatible with the original SQL semantics, the Hint will be ignored.

**6. Views and Subqueries**

Aliases of views or subqueries can be specified as a complete subtree.

```sql
SELECT /*+ LEADING(alias t1) */ COUNT(*)   
FROM t1 JOIN (SELECT c2 FROM t2 JOIN t3 ON t2.c2 = t3.c3) AS alias   
ON t1.c1 = alias.c2;
```

Tree Structure: In this example, `alias` is treated as a whole, and its internal join order is determined by the subquery itself.

```sql
       join  
      /    \  
   alias    t1  
   /    \  
  t2     t3
```

## Combining with ORDERED Hint

When both LEADING and ORDERED Hints are used, the ORDERED Hint has higher priority.

```sql
SELECT /*+ ORDERED */ t1.c1   
FROM t2 JOIN t1 ON t1.c1 = t2.c2 JOIN t3 ON t2.c2 = t3.c3;
```

Tree Structure:

```sql
      join  
     /    \  
   join    t3  
  /    \  
t2      t1
```

Here, the ORDERED Hint forces the join order to strictly follow the order of table appearance in the FROM clause. Therefore, in this case, the ORDERED Hint will take effect, while the LEADING hint will be ignored.

## Summary

By using Leading Hint appropriately, we can more effectively control the join order in Doris, thereby optimizing query performance. However, it should be remembered that this is an advanced feature and should be used cautiously with a thorough understanding of query characteristics and data distribution.

When using it, please note the following points:

1. Excessive dependence on Hints may lead to suboptimal execution plans. Therefore, please ensure a full understanding of query and data characteristics before use.

2. When upgrading Doris versions, the effect of Leading Hint should be re-evaluated, as optimizer strategies may be adjusted.

3. For complex queries, it is recommended to use the EXPLAIN command to carefully analyze the execution plan to ensure that Leading Hint can achieve the expected effect.