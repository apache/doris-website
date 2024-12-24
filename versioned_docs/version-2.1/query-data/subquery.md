---
{
    "title": "Subquery",
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

A Subquery is an SQL query nested within another query (usually a SELECT statement). It can be used in the SELECT, FROM, WHERE, or HAVING clauses to provide data or conditions for the outer query. The use of subqueries makes SQL queries more flexible and powerful, as they allow us to solve more complex problems within a single query.

Some important features of subqueries are as follows:

1. Position of Subqueries: Subqueries can be placed in multiple SQL clauses, such as the WHERE clause, HAVING clause, and FROM clause. They can be used with SELECT, UPDATE, INSERT, DELETE statements, and expression operators (such as comparison operators =, >, <, <=, as well as IN, EXISTS, etc.).

2. Relationship between Main Query and Subquery: A subquery is a query nested inside another query. The outer query is referred to as the main query, while the inner query is referred to as the subquery.

3. Execution Order: When there is no correlation between the subquery and the main query, the subquery is usually executed first. When there is a correlation, the parser decides which query to execute first in real-time as needed and uses the output of the subquery accordingly.

4. Use of Parentheses: Subqueries must be enclosed in parentheses to distinguish them as nested within another query.

Below, we will use tables t1 and t2 and related SQL to introduce the basic features and usage of subqueries. The table creation statements are as follows:

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

## Classification of Subqueries

### Classification Based on the Characteristics of Data Returned by Subqueries

Subqueries can be classified into scalar and non-scalar subqueries based on the characteristics of the data they return:

**1. Scalar Subquery**

A subquery that always returns a single value (essentially equivalent to a one-row, one-column Relation). If the subquery does not return any data, it returns a NULL value. Scalar subqueries can theoretically appear anywhere a single-value expression is allowed.

**2. Non-scalar Subquery**

A subquery that returns a Relation (different from the return value of a scalar subquery, this Relation can contain multiple rows and columns). If the subquery does not return any data, it returns an empty set (0 rows). Non-scalar subqueries can theoretically appear anywhere a relation (set) is allowed.

The following examples illustrate scalar and non-scalar subqueries (for the two subqueries in parentheses, when t2 is an empty table, the results returned by the two subqueries are different):

```sql
-- Scalar subquery, when t2 is an empty table, the subquery returns the scalar value null    
select * from t1 where t1.c1 > (select sum(t2.c1) from t2);    
    
-- Non-scalar subquery, when t2 is an empty table, the subquery returns an empty set (0 rows)    
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

### Classification Based on Whether the Subquery References Columns from the Outer Query

Subqueries can be classified into correlated subqueries and non-correlated subqueries based on whether they reference columns from the outer query:

**3. Non-correlated Subquery**

A subquery that does not reference any columns from the outer query. Non-correlated subqueries can often be computed independently and return the corresponding results once for the outer query to use.

**4. Correlated Subquery**

A subquery that references one or more columns from the main query (also known as the outer query) (the referenced outer columns are often in the WHERE condition of the subquery). Correlated subqueries can often be seen as a filtering operation on the externally associated table, as for each row of data in the outer table, the subquery is computed and returns the corresponding result.

The following examples illustrate correlated and non-correlated subqueries:

```sql
-- Correlated subquery, the subquery internally uses the column t1.c2 from the outer table    
select * from t1 where t1.c1 in (select t2.c1 from t2 where t2.c2 = t1.c2);    
    
-- Non-correlated subquery, the subquery internally does not use any columns from the outer table t1    
select * from t1 where t1.c1 in (select t2.c1 from tt2);
```

## Subqueries Supported by Doris

Doris supports all non-correlated subqueries and provides partial support for correlated subqueries as follows:

- Supports correlated scalar subqueries in the `WHERE` and `HAVING` clauses.

- Supports correlated `IN`, `NOT IN`, `EXISTS`,`NOT EXISTS` non-scalar subqueries in the `WHERE` and `HAVING` clauses.

- Supports correlated scalar subqueries in the `SELECT` list.

- For nested subqueries, Doris only supports subqueries correlated to their immediate parent query and does not support cross-level correlation to outer queries beyond the parent.

## Limitations of Correlated Subqueries

### Limitations of Correlated Scalar Subqueries

- The correlation condition must be an equality condition.

- The output of the subquery must be the result of a single aggregate function without a GROUP BY clause.

```sql
-- Single aggregate function without GROUP BY, supported    
select * from t1 where t1.c1 < (select max(t2.c1) from t2 where t1.c2 = t2.c2);    
    
-- Equivalent rewritten SQL as follows:    
select t1.* from t1 inner join (select t2.c2 as c2, max(t2.c1) as c1 from t2 group by t2.c2) tx on t1.c1 < tx.c1 and t1.c2 = tx.c2;    
    
-- Non-equality condition, not supported    
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 > t2.c2);    
    
-- No aggregate function, not supported    
select * from t1 where t1.c1 = (select t2.c1 from t2 where t1.c2 = t2.c2);    
    
-- With aggregate function but includes GROUP BY, not supported    
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 = t2.c2 group by t2.c2);
```

### Limitations of Correlated (NOT) EXISTS Subqueries

- The subquery cannot have both OFFSET and LIMIT.

```sql
-- With LIMIT but no OFFSET, supported    
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2);    
    
-- Equivalent rewritten SQL as follows:    
select * from t1 left semi join t2 on t1.c2 = t2.c2;    
    
-- With OFFSET and LIMIT, not supported    
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2, 3);
```

### Limitations of Correlated (NOT) IN Subqueries

- The output of the subquery must be a single column.

- The subquery cannot have LIMIT.

- The subquery cannot have aggregate functions or GROUP BY clauses.

```sql
-- Supported subquery    
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2);    
    
-- Equivalent rewritten SQL as follows:    
select * from t1 left semi join t2 on t1.c1 = t2.c1 and t1.c2 = t2.c2;    
    
-- Subquery output is multiple columns, not supported    
select * from t1 where (t1.a, t1.c) in (select t2.c1, t2.c from t2 where t1.c2 = t2.c2);    
    
-- Subquery with LIMIT, not supported    
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 limit 3);    
    
-- With GROUP BY clause, not supported    
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 group by t2.c1);    
    
-- With aggregate function, not supported    
select * from t1 where t1.c1 in (select sum(t2.c1) from t2 where t1.c2 = t2.c2);
```

### Limitations of Nested Subqueries

Currently, only subqueries that correlate directly with their immediate parent queries are supported. Correlation with outer layers of the parent query is not supported.

Assume there is another table `t3` with the following creation statement:

```sql
create table t3  
(  
    c1 bigint,   
    c2 bigint  
)  
DISTRIBUTED BY HASH(c1) BUCKETS 3  
PROPERTIES ("replication_num" = "1");
```

- Supported when the subquery only uses columns from its immediate parent query:

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

- Not supported when the innermost subquery uses columns from its immediate parent query `t2.c2` and also columns from the outermost query `t1.c1`:

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

In `where` conditions, clauses with `or` relationships composed of subqueries using `(not) in` or `(not) exists` and other filtering conditions require special handling to produce correct results. An example is given below:

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

If the `exists` clause in this SQL is directly implemented using `left semi join`, according to the semantics of `left semi join`, only rows from `t1` that satisfy `t1.c2 = t2.c2` will be output. However, rows that actually satisfy the condition `t1.c1 > 0` should also be output. To achieve this, the mechanism of `Mark Join` is introduced.

:::info Note

`right semi join` is similar but differs in the left and right tables. Here, we use `left semi join` as an example.

:::

Example SQL is as follows:

```sql
-- This SQL cannot be executed and is only for demonstration purposes    
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

The difference between `Mark Join` and a regular `left semi join` is that a regular `left semi join` directly outputs rows from the left table that meet the condition, while `Mark Join` outputs the original left table with an additional flag column (the `mark_join_flag` in the example) that can be `true`, `false`, or `null`. The value of the flag is determined by the `join` condition expression `t1.c2 = t2.c2`, with each row corresponding to a flag value. The calculation of flag values is shown in the table below:

| t1.c1 | t2.c1 | mark_join_flag |
| ----- | ----- | -------------- |
| 1     | 1     | TRUE           |
| 1     | 2     | FALSE          |
| 1     | NULL  | NULL           |
| NULL  | 1     | NULL           |
| NULL  | NULL  | NULL           |

With this flag, the `where` filtering condition can be rewritten as `where mark_join_flag or t1.c1 > 0` to obtain the correct results.

## Common Issues

Since the output of a scalar subquery must be a single value, Doris adopts different processing methods for correlated and non-correlated scalar subqueries.

### For Correlated Scalar Subqueries

Currently, Doris can only statically ensure that the subquery outputs a single value (i.e., a single aggregate function without `group by`). Therefore, when using correlated scalar subqueries, a `group by`-less aggregate function such as `any_value` needs to be added according to requirements, so that the optimizer can recognize the single-value semantics smoothly. Users need to ensure that the subquery always returns only one value. If the subquery actually returns multiple values (other database systems would report an error at runtime), due to the added aggregate function, it will always return one value, although the result may not match expectations.

Please refer to the following SQL example:

```sql
-- Correlated scalar subquery lacking a single aggregate function without group by, currently not supported    
select t1.*, (select t2.c1 from t2 where t1.c2 = t2.c2) from t1;    
  
-- Add a single aggregate function for the optimizer to recognize smoothly    
select t1.*, (select any_value(t2.c1) from t2 where t1.c2 = t2.c2) from t1;
```

### For Non-Correlated Scalar Subqueries

Doris will add an `assert num rows` operator at runtime. If the subquery returns more than one row of data, a runtime error will be reported.

Please refer to the following SQL example:

```sql
-- Non-correlated scalar subquery, will report an error if table t2 has more than 1 row of data    
select t1.*, (select t2.c1 from t2) from t1;    
  
-- Example error message    
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]Expected EQ 1 to be returned by expression
```