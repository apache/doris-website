---
{
    "title": "使用 Leading Hint 控制 Join 顺序",
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

## Leading Hint 简介

Leading Hint 是一种强大的查询优化技术，它允许用户指导 Doris 优化器确定查询计划中的表连接顺序。正确使用 Leading Hint 可以显著提升复杂查询的性能。本文将详细介绍如何在 Doris 中使用 Leading Hint 来控制 Join 的顺序。

:::info 备注

详细使用说明，可参考 [Hint](../../../query-acceleration/tuning/join-hint) 文档。

:::

## 语法示例

查询示例如下：

```sql
SELECT * FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

默认情况下，Doris 可能会选择 t1 作为驱动表。如果我们想要交换 join 的顺序，使 t2 成为驱动表，可以使用 Leading Hint：

```sql
SELECT /*+ LEADING(t2 t1) */ * FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

如果需要验证 Hint 是否生效，可以使用 EXPLAIN 命令可以查看查询计划并验证：

```sql
EXPLAIN SELECT /*+ LEADING(t2 t1) */ * FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

其中，在 EXPLAIN 的结果中会有一个 "Hint log" 部分，显示以下内容：

1. Used: 表示成功应用的 `hint`

2. Unused: 表示未使用的 `hint`

3. SyntaxError: 表示存在语法错误的 `hint`

## 调优案例

**1. 左深树（默认行为）**

```sql
SELECT /*+ LEADING(t1 t2 t3) */ *   
FROM t1 JOIN t2 ON t1.c1 = t2.c2 JOIN t3 ON t2.c2 = t3.c3;
```

树形结构：

```sql
      join  
     /    \  
   join    t3  
  /    \  
t1      t2
```

**2. 右深树**

```sql
SELECT /*+ LEADING(t1 {t2 t3}) */ *   
FROM t1 JOIN t2 ON t1.c1 = t2.c2 JOIN t3 ON t2.c2 = t3.c3;
```

树形结构：

```sql
  join  
 /    \  
t1    join  
     /    \  
    t2     t3
```

**3. Bushy 树**

```sql
SELECT /*+ LEADING({t1 t2} {t3 t4}) */ *   
FROM t1 JOIN t2 ON t1.c1 = t2.c2   
JOIN t3 ON t2.c2 = t3.c3   
JOIN t4 ON t3.c3 = t4.c4;
```

树形结构：

```sql
      join  
      /    \  
   join    join  
  /    \  /    \  
 t1    t2 t3    t4
```

**4. Zig-Zag 树**

```sql
SELECT /*+ LEADING(t1 {t2 t3} t4) */ *   
FROM t1 JOIN t2 ON t1.c1 = t2.c2   
JOIN t3 ON t2.c2 = t3.c3   
JOIN t4 ON t3.c3 = t4.c4;
```

树形结构：

```sql
    join  
   /    \  
 join    t4  
/    \  
t1   join  
    /    \  
   t2     t3
```

**5. 特殊情况处理**

对于非内连接（如 Outer Join、Semi/Anti Join），Leading Hint 会根据原始 SQL 语义自动推导各个 Join 的类型。如果指定的 Join 顺序与原 SQL 语义不兼容，Hint 将被忽略。

**6. 视图和子查询**

可以将视图或子查询的别名作为一个完整的子树进行指定。

```sql
SELECT /*+ LEADING(alias t1) */ COUNT(*)   
FROM t1 JOIN (SELECT c2 FROM t2 JOIN t3 ON t2.c2 = t3.c3) AS alias   
ON t1.c1 = alias.c2;
```

树形结构：在这个例子中，`alias` 被视为一个整体，其内部 Join 顺序由子查询本身决定。

```sql
       join  
      /    \  
   alias    t1  
   /    \  
  t2     t3
```

## 与 ORDERED Hint 混用

当 LEADING 和 ORDERED Hint 同时使用时，ORDERED Hint 的优先级更高。

```sql
SELECT /*+ ORDERED */ t1.c1   
FROM t2 JOIN t1 ON t1.c1 = t2.c2 JOIN t3 ON t2.c2 = t3.c3;
```

树形结构：

```sql
      join  
     /    \  
   join    t3  
  /    \  
t2      t1
```

在这里，ORDERED Hint 强制 Join 顺序必须严格按照 FROM 子句中表的出现顺序来执行。因此，在这种情况下，ORDERED Hint 会生效，而 LEADING hint 则会被忽略。

## 总结

通过合理使用 Leading Hint，我们可以更有效地控制 Doris 中的 Join 顺序，进而优化查询性能。然而需谨记，这是一项高级特性，应当在充分理解查询特性及数据分布的基础上谨慎使用。

在使用时，需注意以下几点：

1. 过度依赖 Hint 可能会导致产生次优的执行计划。因此，在使用前请确保已充分理解查询及数据的特性。

2. 当升级 Doris 版本时，应重新评估 Leading Hint 的效果，因为优化器的策略可能会有所调整。

3. 对于复杂的查询，建议使用 EXPLAIN 命令来仔细分析执行计划，以确保 Leading Hint 能达到预期的效果。
