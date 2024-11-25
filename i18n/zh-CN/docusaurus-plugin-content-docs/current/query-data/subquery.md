---
{
    "title": "子查询",
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

子查询（Subquery）是嵌套在另一个查询（通常是 SELECT 语句）中的 SQL 查询。它可以用在 SELECT、FROM、WHERE 或 HAVING 子句中，为外部查询提供数据或条件。子查询的使用使得 SQL 查询变得更加灵活和强大，因为它们允许我们在单个查询中解决更复杂的问题。  
  
子查询的一些重要特征如下：  
  
1. **子查询的位置**：子查询可以放在多个 SQL 子句中，如 SELECT、WHERE、HAVING 和 FROM 子句。它们可以与 SELECT、UPDATE、INSERT、DELETE 语句以及表达式运算符（如比较运算符 =、>、<、<=，以及 IN、EXISTS 等）一起使用。  

2. **主查询与子查询的关系**：子查询是嵌套在另一个查询内部的查询。外部查询被称为主查询，而内部查询则被称为子查询。  

3. **执行顺序**：当子查询是独立的（即不依赖于外部查询的结果）时，它通常首先执行。当存在相关性时，解析器会根据需要实时决定先执行哪个查询，并相应地使用子查询的输出。  

4. **括号的使用**：子查询必须用括号括起来，以区分它们是嵌套在另一个查询中。

下面我们分别用 t1 和 t2 表以及相关 SQL，介绍子查询的基本特性和用法。建表语句如下：

```sql
create table t1
(
    c1 bigint, 
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");

create table t2
(
    c1 bigint, 
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

## 子查询的分类

### 按照子查询返回数据的特性分类

按照子查询返回数据的特性，可分为标量和非标量子查询：

**1. 标量子查询**

子查询一定返回一个单一的值（本质上等价于一个一行一列的 Relation）。如果子查询没有任何数据返回，则返回 NULL 值。标量子查询理论上可以出现在任何允许单值表达式出现的地方。

**2. 非标量子查询**

子查询返回一个 Relation（不同于标量子查询的返回值，该 Relation 可包含多行多列）。如果子查询没有任何数据返回，则返回空集（0 行）。非标量子查询理论上可以出现在任何允许关系（集合）出现的地方。

以下分别对标量和非标量子查询举例说明（对于两个括号内的子查询，当 t2 是空表时，两个子查询返回结果不同）。

```sql
-- 标量子查询，当 t2 是空表时，子查询返回标量值 null  
select * from t1 where t1.c1 > (select sum(t2.c1) from t2);  
  
-- 非标量子查询，当 t2 是空表时，子查询返回 empty set (0 rows)  
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

### 按照子查询是否引用了外部查询的列分类

按照子查询是否引用了外部查询的列，可分为关联子查询和非关联子查询

**1. 非关联子查询**

子查询没有引用外部查询的任何列。非关联子查询常常可以独立运算，并一次性返回相应结果供外部查询使用。

**2. 关联子查询**

子查询引用了主查询（又称为外部查询）的一个或多个列（引用的外部列常常在子查询的 WHERE 条件中）。关联子查询常常可以看做是对外部关联的表的一个过滤操作，因为对于外部表的每一行数据，都会对子查询进行运算，并返回相应结果。

以下分别对关联和非关联子查询举例说明：

```sql
-- 关联子查询，子查询内部使用了外部表的列 t1.c2  
select * from t1 where t1.c1 in (select t2.c1 from t2 where t2.c2 = t1.c2);  
  
-- 非关联子查询，子查询内部没有使用任何外部表 t1 的列  
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

## Doris 支持的子查询

Doris 支持所有的非关联子查询，对关联子查询（有部分限制）的支持如下：

- 支持在 `WHERE`和 `HAVING`子句中的关联标量子查询。

- 支持在 `WHERE`和 `HAVING`子句中的关联的 `IN`、`NOT IN`、`EXISTS`、`NOT EXISTS` 非标量子查询。

- 支持在`SELECT`列表中的关联标量子查询。

- 对于嵌套子查询，Doris 只支持子查询关联到自己的直接父查询，不支持跨层级关联到父查询的更外层查询。

## 关联子查询的限制

### 关联的标量子查询的限制

- 关联条件必须是等值条件。

- 子查询的输出必须是单个聚合函数的结果，且没有 `group by` 子句。

  ```sql
  -- 单个聚合函数，且无 group by，支持  
  select * from t1 where t1.c1 < (select max(t2.c1) from t2 where t1.c2 = t2.c2);  
    
  -- 等价改写的 SQL 如下：  
  select t1.* from t1 inner join (select t2.c2 as c2, max(t2.c1) as c1 from t2 group by t2.c2) tx on t1.c1 < tx.c1 and t1.c2 = tx.c2;  
    
  -- 非等值条件，不支持  
  select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 > t2.c2);  
    
  -- 没有聚合函数，不支持  
  select * from t1 where t1.c1 = (select t2.c1 from t2 where t1.c2 = t2.c2);  
    
  -- 有聚合函数，但包含 group by，不支持  
  select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 = t2.c2 group by t2.c2);
  ```

### 关联的 (not) exists 子查询的限制

- 子查询不能同时有`offset`和 `limit`。

  ```sql
  -- 带 limit 但无 offset，支持  
  select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2);  
    
  -- 等价改写 SQL 如下：  
  select * from t1 left semi join t2 on t1.c2 = t2.c2;  
    
  -- 带 offset 和 limit，不支持  
  select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2, 3);
  ```

### 关联的 (not) in 子查询的限制

- 子查询的输出必须是单个列。

- 子查询不能带有`limit`。

- 子查询不能带有聚合函数或`group by`子句。

  ```sql
  -- 支持的子查询  
  select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2);  
    
  -- 改写的等价 SQL 如下：  
  select * from t1 left semi join t2 on t1.c1 = t2.c1 and t1.c2 = t2.c2;  
    
  -- 子查询输出为多列，不支持  
  select * from t1 where (t1.a, t1.c) in (select t2.c1, t2.c from t2 where t1.c2 = t2.c2);  
    
  -- 子查询带 limit，不支持  
  select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 limit 3);  
    
  -- 带有 group by 子句，不支持  
  select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 group by t2.c1);  
    
  -- 带有聚合函数，不支持  
  select * from t1 where t1.c1 in (select sum(t2.c1) from t2 where t1.c2 = t2.c2);
  ```

### 嵌套子查询的限制

目前只支持子查询关联到自己直接的父查询，不支持关联到父查询的更外层查询。

假设还有一个`t3`表，其建表语句如下：

```sql
create table t3  
(  
    c1 bigint,   
    c2 bigint  
)  
DISTRIBUTED BY HASH(c1) BUCKETS 3  
PROPERTIES ("replication_num" = "1");
```

- 可以支持当子查询只使用了自己直接父查询的列

  ```sql
  select   
      t1.c1   
  from   
      t1   
  where not exists (  
      select   
          t2.c1   
      from   
          t2   
      where not exists (  
          select   
              t3.c1   
          from   
              t3   
          where   
              t3.c2 = t2.c2  
      ) and t2.c2 = t1.c2  
  );
  ```

- 不支持当最内层的子查询使用了直接父查询的列`t2.c2`，并使用了最外层查询的列`t1.c1`。

  ```sql
  select   
      t1.c1   
  from   
      t1   
  where not exists (  
      select   
          t2.c1   
      from   
          t2   
      where not exists (  
          select   
              t3.c1   
          from   
              t3   
          where   
              t3.c2 = t2.c2 and t3.c1 = t1.c1  
      )  
  );
  ```

## Mark Join

在 `where` 条件中，一些由 `(not) in` 或 `(not) exists` 的子查询和其他过滤条件组成的 `or` 关系子句，需要特殊处理才能生成正常结果。举例如下：

```sql
select 
    t1.c1, 
    t1.c2 
from t1 
where exists (
    select 
        t2.c1 
    from t2 
    where 
        t1.c2 = t2.c2
    ) or t1.c1 > 0;
```

这个 SQL 中的 `exists` 子句部分如果直接使用 `left semi join`，根据 `left semi join` 的语义，将会只输出 `t1` 中满足 `t1.c2 = t2.c2` 的行。然而，实际满足 `t1.c1 > 0` 这个条件的行也应该输出。为了达到这个目的，引入了 `Mark Join` 的机制。

:::info 备注
`right semi join` 类似，只是左右表不同。在这里，我们用 `left semi join` 作为示例。
:::

示例 SQL 如下：

```sql
-- 此 SQL 不能实际执行，只作为演示使用  
select   
    tx.c1,   
    tx.c2   
from   
    (  
        select   
            t1.c1,   
            t1.c2,   
            mark_join_flag   
        from   
            t1 left (mark) semi join t2 on t1.c2 = t2.c2  
    ) tx  
where   
    tx.mark_join_flag or tx.c1 > 0;
```

`Mark Join` 相较于普通的 `left semi join`，区别在于普通的 `left semi join` 会直接输出左表满足条件的行，而 `Mark Join` 则输出原始的左表加上一个值为 `true`、`false`或 `null` 的标志位列（示例中的 `mark_join_flag` 标志）。标志位的值通过 `join` 条件表达式 `t1.c2 = t2.c2` 决定，每一行都对应一个标志位值。标志位值的计算参见下表：

| t1.c2 | t2.c2 | mark_join_flag |
| ----- | ----- | -------------- |
| 1     | 1     | TRUE           |
| 1     | 2     | FALSE          |
| 1     | NULL  | NULL           |
| NULL  | 1     | NULL           |
| NULL  | NULL  | NULL           |

有了这个标志位之后，`where` 过滤条件就可以改写为 `where mark_join_flag or t1.c1 > 0`，从而得到正确结果。

## 常见问题

由于标量子查询的输出必须是一个单值，Doris 对于关联和非关联的标量子查询采取了不同的处理方式。

### 对于关联的标量子查询

目前 Doris 暂时只能以静态的方式确保子查询输出为单值（即没有 `group by` 的单个聚合函数）。因此，在使用关联标量子查询时，需要根据需求添加没有 `group by` 的聚合函数，如`any_value`，以便优化器能顺利识别单值语义。用户需要保证子查询一定只返回一个值，如果子查询实际返回多个值（其他数据库系统会在运行时报错），由于添加了聚合函数，它始终只返回一个值，虽然能得到结果，但可能和预期不符。

请参考以下 SQL 示例：

```sql
-- 关联的标量子查询，缺少单个无 group by 的聚合函数，目前不支持  
select t1.*, (select t2.c1 from t2 where t1.c2 = t2.c2) from t1;  

-- 添加单个聚合函数，让优化器顺利识别  
select t1.*, (select any_value(t2.c1) from t2 where t1.c2 = t2.c2) from t1;
```

### 对于非关联的标量子查询

Doris 会在运行时添加一个`assert num rows`算子，如果子查询返回的数据大于一条，则会报一个运行时错误。

请参考以下 SQL 示例：

```sql
-- 非关联的标量子查询，如果 t2 表有多于 1 条的数据，则可能报运行时错误  
select t1.*, (select t2.c1 from t2) from t1;  

-- 报错信息样例如下  
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]Expected EQ 1 to be returned by expression
```