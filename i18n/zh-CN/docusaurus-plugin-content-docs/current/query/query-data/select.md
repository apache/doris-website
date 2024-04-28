---
{
    "title": "Select 查询",
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


## Select 语法

```sql
SELECT
    [hint_statement, ...]
    [ALL | DISTINCT | DISTINCTROW | ALL EXCEPT ( col_name1 [, col_name2, col_name3, ...] )]
    select_expr [, select_expr ...]
    [FROM table_references
      [PARTITION partition_list]
      [TABLET tabletid_list]
      [TABLESAMPLE sample_value [ROWS | PERCENT]
        [REPEATABLE pos_seek]]
    [WHERE where_condition]
    [GROUP BY [GROUPING SETS | ROLLUP | CUBE] {col_name | expr | position}]
    [HAVING where_condition]
    [ORDER BY {col_name | expr | position}
      [ASC | DESC], ...]
    [LIMIT {[offset,] row_count | row_count OFFSET offset}]
    [INTO OUTFILE 'file_name']
```

## 语法说明

- select_expr, ... 

    检索并在结果中显示的列，使用别名时，as 为自选。

- table_references 

    检索的目标表，一个或者多个表（包括子查询产生的临时表）

- where_definition 

    检索条件（表达式），如果存在 WHERE 子句，其中的条件对行数据进行筛选。where_condition 是一个表达式，对于要选择的每一行，其计算结果为 true。如果没有 WHERE 子句，该语句将选择所有行。在 WHERE 表达式中，您可以使用除聚合函数之外的任何 MySQL 支持的函数和运算符

- ALL | DISTINCT 

    对结果集进行刷选，all 为全部，distinct/distinctrow 将刷选出重复列，默认为 all

- ALL EXCEPT

    对全部（all）结果集进行筛选，except 指定要从全部结果集中排除的一个或多个列的名称。输出中将忽略所有匹配的列名称。 

- INTO OUTFILE 'file_name' 

    保存结果至新文件（之前不存在）中，区别在于保存的格式。

- Group by having

    对结果集进行分组，having 出现则对 group by 的结果进行刷选。`Grouping Sets`、`Rollup`、`Cube` 为 group by 的扩展，详细可参考 [GROUPING SETS 设计文档](https://doris.apache.org/zh-CN/community/design/grouping_sets_design)。
   

- Order by 

    对最后的结果进行排序，Order by 通过比较一列或者多列的大小来对结果集进行排序。

    Order by 是比较耗时耗资源的操作，因为所有数据都需要发送到 1 个节点后才能排序，排序操作相比不排序操作需要更多的内存。

    如果需要返回前 N 个排序结果，需要使用 LIMIT 从句；为了限制内存的使用，如果用户没有指定 LIMIT 从句，则默认返回前 65535 个排序结果。

- Limit n

    限制输出结果中的行数，`limit m,n` 表示从第 m 行开始输出 n 条记录，使用 limit m,n 的时候要加上 order by 才有意义，否则每次执行的数据可能会不一致

- Having 

    Having 从句不是过滤表中的行数据，而是过滤聚合函数产出的结果。

    通常来说 `having` 要和聚合函数（例如 :`COUNT(), SUM(), AVG(), MIN(), MAX()`）以及 `group by` 从句一起使用。

- SELECT 支持使用 PARTITION 显式分区选择，其中包含 `table_reference` 中表的名称后面的分区或子分区（或两者）列表

- [TABLET tids] TABLESAMPLE n [ROWS | PERCENT] [REPEATABLE seek]

    在 FROM 子句中限制表的读取行数，根据指定的行数或百分比从表中伪随机的选择数个 Tablet，REPEATABLE 指定种子数可使选择的样本再次返回，此外也可手动指定 TableID，注意这只能用于 OLAP 表。

- hint_statement

    在 selectlist 前面使用 hint 表示可以通过 hint 去影响优化器的行为以期得到想要的执行计划，详情可参考 [joinHint 使用文档](../join-optimization/join-hint)

## 语法约束

- SELECT 也可用于检索计算的行而不引用任何表。

- 所有的字句必须严格地按照上面格式排序，一个 HAVING 子句必须位于 GROUP BY 子句之后，并位于 ORDER BY 子句之前。

- 别名关键词 AS 自选。别名可用于 group by，order by 和 having

- Where 子句：执行 WHERE 语句以确定哪些行应被包含在 GROUP BY 部分中，而 HAVING 用于确定应使用结果集中的哪些行。

- HAVING 子句可以引用总计函数，而 WHERE 子句不能引用，如 count,sum,max,min,avg，同时，where 子句可以引用除总计函数外的其他函数。Where 子句中不能使用列别名来定义条件。

- Group by 后跟 with rollup 可以对结果进行一次或者多次统计。

## 联接查询

Doris 支持以下 JOIN 语法

```sql
JOIN
table_references:
    table_reference [, table_reference] …
table_reference:
    table_factor
  | join_table
table_factor:
    tbl_name [[AS] alias]
        [{USE|IGNORE|FORCE} INDEX (key_list)]
  | ( table_references )
  | { OJ table_reference LEFT OUTER JOIN table_reference
        ON conditional_expr }
join_table:
    table_reference [INNER | CROSS] JOIN table_factor [join_condition]
  | table_reference LEFT [OUTER] JOIN table_reference join_condition
  | table_reference NATURAL [LEFT [OUTER]] JOIN table_factor
  | table_reference RIGHT [OUTER] JOIN table_reference join_condition
  | table_reference NATURAL [RIGHT [OUTER]] JOIN table_factor
join_condition:
    ON conditional_expr
```

UNION 语法：

```sql
SELECT ...
UNION [ALL| DISTINCT] SELECT ......
[UNION [ALL| DISTINCT] SELECT ...]
```

`UNION` 用于将多个 `SELECT` 语句 的结果组合 到单个结果集中。

第一个 `SELECT` 语句中的列名称用作返回结果的列名称。在每个 `SELECT`语句的 相应位置列出的选定列 应具有相同的数据类型。 （例如，第一个语句选择的第一列应该与其他语句选择的第一列具有相同的类型。）

默认行为 `UNION`是从结果中删除重复的行。可选 `DISTINCT` 关键字除了默认值之外没有任何效果，因为它还指定了重复行删除。使用可选 `ALL` 关键字，不会发生重复行删除，结果包括所有 `SELECT` 语句中的 所有匹配行 

WITH 语句：

要指定公用表表达式，请使用 `WITH` 具有一个或多个逗号分隔子句的子句。每个子条款都提供一个子查询，用于生成结果集，并将名称与子查询相关联。下面的示例定义名为的 CTE `cte1` 和 `cte2` 中 `WITH` 子句，并且是指在它们的顶层 `SELECT` 下面的 `WITH` 子句：

```sql
WITH
  cte1 AS (SELECT a，b FROM table1),
  cte2 AS (SELECT c，d FROM table2)
SELECT b，d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

在包含该 `WITH`子句 的语句中，可以引用每个 CTE 名称以访问相应的 CTE 结果集。

CTE 名称可以在其他 CTE 中引用，从而可以基于其他 CTE 定义 CTE。

目前不支持递归的 CTE。

## 使用举例

- 查询年龄分别是 18,20,25 的学生姓名

```sql
select Name from student where age in (18,20,25);
```

- ALL EXCEPT 示例

```sql
-- 查询除了学生年龄的所有信息
select * except(age) from student; 
```

- GROUP BY 示例

```sql
--查询 tb_book 表，按照 type 分组，求每类图书的平均价格，
select type,avg(price) from tb_book group by type;
```

- DISTINCT 使用

```Plain
--查询tb_book表，除去重复的type数据
select distinct type from tb_book;
```

- ORDER BY 示例

对查询结果进行升序（默认）或降序（DESC）排列。升序 NULL 在最前面，降序 NULL 在最后面

```sql
--查询 tb_book 表中的所有记录，按照 id 降序排列，显示三条记录
select * from tb_book order by id desc limit 3;
```

- LIKE 模糊查询

可实现模糊查询，它有两种通配符：`%`和`_`，`%`可以匹配一个或多个字符，`_`可以匹配一个字符

```Plain
--查找所有第二个字符是h的图书
select * from tb_book where name like('_h%');
```

- LIMIT 限定结果行数

```sql
--1.降序显示 3 条记录
select * from tb_book order by price desc limit 3;

--2.从 id=1 显示 4 条记录
select * from tb_book where id limit 1,4;
```

- CONCAT 联合多列

```sql
--把 name 和 price 合并成一个新的字符串输出
select id,concat(name,":",price) as info,type from tb_book;
```

- 使用函数和表达式

```sql
--计算 tb_book 表中各类图书的总价格
select sum(price) as total,type from tb_book group by type;
--price 打八折
select *,(price * 0.8) as "八折" from tb_book;
```

- UNION 示例

```sql
SELECT a FROM t1 WHERE a = 10 AND B = 1 ORDER by a LIMIT 10
UNION
SELECT a FROM t2 WHERE a = 11 AND B = 2 ORDER by a LIMIT 10;
```

- WITH 子句示例

```sql
WITH cte AS
(
  SELECT 1 AS col1, 2 AS col2
  UNION ALL
  SELECT 3, 4
)
SELECT col1, col2 FROM cte;
```

- JOIN 示例

```sql
SELECT * FROM t1 LEFT JOIN (t2, t3, t4)
                 ON (t2.a = t1.a AND t3.b = t1.b AND t4.c = t1.c)
```

- 等同于

```sql
SELECT * FROM t1 LEFT JOIN (t2 CROSS JOIN t3 CROSS JOIN t4)
                 ON (t2.a = t1.a AND t3.b = t1.b AND t4.c = t1.c)
```

- INNER JOIN

```sql
SELECT t1.name, t2.salary
  FROM employee AS t1 INNER JOIN info AS t2 ON t1.name = t2.name;

SELECT t1.name, t2.salary
  FROM employee t1 INNER JOIN info t2 ON t1.name = t2.name;
```

- LEFT JOIN

```sql
SELECT left_tbl.*
  FROM left_tbl LEFT JOIN right_tbl ON left_tbl.id = right_tbl.id
  WHERE right_tbl.id IS NULL;
```

- RIGHT JOIN

```sql
mysql SELECT * FROM t1 RIGHT JOIN t2 ON (t1.a = t2.a);
+------+------+------+------+
| a    | b    | a    | c    |
+------+------+------+------+
|    2 | y    |    2 | z    |
| NULL | NULL |    3 | w    |
+------+------+------+------+
```

- TABLESAMPLE

```sql
--在 t1 中伪随机的抽样 1000 行。注意实际是根据表的统计信息选择若干 Tablet，被选择的 Tablet 总行数可能大于 1000，所以若想明确返回 1000 行需要加上 Limit。
SELECT * FROM t1 TABLET(10001) TABLESAMPLE(1000 ROWS) REPEATABLE 2 limit 1000;
```

## 最佳实践

- 关于 SELECT 子句的一些附加知识
  
  - 可以使用 AS alias_name 为 select_expr 指定别名。别名用作表达式的列名，可用于 GROUP BY，ORDER BY 或 HAVING 子句。
  
  - FROM 后的 table_references 指示参与查询的一个或者多个表。如果列出了多个表，就会执行 JOIN 操作。而对于每一个指定表，都可以为其定义别名
  
  - SELECT 后被选择的列，可以在 ORDER BY 和 GROUP BY 中，通过列名、列别名或者代表列位置的整数（从 1 开始）来引用
  
    ```Plain
    SELECT college, region, seed FROM tournament
      ORDER BY region, seed;
    
    SELECT college, region AS r, seed AS s FROM tournament
      ORDER BY r, s;
    
    SELECT college, region, seed FROM tournament
      ORDER BY 2, 3;
    ```

  - 如果 ORDER BY 出现在子查询中，并且也应用于外部查询，则最外层的 ORDER BY 优先。
  
  - 如果使用了 GROUP BY，被分组的列会自动按升序排列（就好像有一个 ORDER BY 语句后面跟了同样的列）。如果要避免 GROUP BY 因为自动排序生成的开销，添加 ORDER BY NULL 可以解决：
  
  - *SELECT* a, COUNT(b) *FROM* test_table *GROUP* *BY* a *ORDER* *BY* NULL;
- 当使用 ORDER BY 或 GROUP BY 对 SELECT 中的列进行排序时，服务器仅使用 max_sort_length 系统变量指示的初始字节数对值进行排序。

- Having 子句一般应用在最后，恰好在结果集被返回给客户端前，且没有进行优化。（而 LIMIT 应用在 HAVING 后）

- SQL 标准要求：HAVING 必须引用在 GROUP BY 列表中或者聚合函数使用的列。然而，MySQL 对此进行了扩展，它允许 HAVING 引用 Select 子句列表中的列，还有外部子查询的列。

- 如果 HAVING 引用的列具有歧义，会有警告产生。下面的语句中，col2 具有歧义：

```sql
SELECT COUNT(col1) AS col2 FROM t GROUP BY col2 HAVING col2 = 2;
```

- 切记不要在该使用 WHERE 的地方使用 HAVING。HAVING 是和 GROUP BY 搭配的。

- HAVING 子句可以引用聚合函数，而 WHERE 不能。

```sql
SELECT user, MAX(salary) FROM users
  GROUP BY user HAVING MAX(salary)  10;
```

- LIMIT 子句可用于约束 SELECT 语句返回的行数。LIMIT 可以有一个或者两个参数，都必须为非负整数。

```sql
/*取回结果集中的 6~15 行*/
SELECT * FROM tbl LIMIT 5,10;
/*那如果要取回一个设定某个偏移量之后的所有行，可以为第二参数设定一个非常大的常量。以下查询取回从第 96 行起的所有数据*/
SELECT * FROM tbl LIMIT 95,18446744073709551615;
/*若 LIMIT 只有一个参数，则参数指定应该取回的行数，偏移量默认为 0，即从第一行起*/
```

- SELECT...INTO 可以让查询结果写入到文件中

- SELECT 关键字的修饰符

  - 主要是用来去重

  - ALL 和 DISTINCT 修饰符指定是否对结果集中的行（应该不是某个列）去重。

  - ALL 是默认修饰符，即满足要求的所有行都要被取回来。

  - DISTINCT 删除重复的行。

- 子查询的主要优势

  - 子查询允许结构化的查询，这样就可以把一个语句的每个部分隔离开。

  - 有些操作需要复杂的联合和关联。子查询提供了其它的方法来执行这些操作

- 加速查询

  - 尽可能利用 Doris 的分区分桶作为数据过滤条件，减少数据扫描范围

  - 充分利用 Doris 的前缀索引字段作为数据过滤条件加速查询速度

- UNION

只使用 union 关键词和使用 union disitnct 的效果是相同的。由于去重工作是比较耗费内存的，因此使用 union all 操作查询速度会快些，耗费内存会少些。如果用户想对返回结果集进行 order by 和 limit 操作，需要将 union 操作放在子查询中，然后 select from subquery，最后把 subquery 和 order by 放在子查询外面。

```sql
select * from (select age from student_01 union all select age from student_02) as t1 
order by age limit 4;

+-------------+
|     age     |
+-------------+
|      18     |
|      19     |
|      20     |
|      21     |
+-------------+
4 rows in set (0.01 sec)
```

- JOIN
  
  - 在 inner join 条件里除了支持等值 join，还支持不等值 join，为了性能考虑，推荐使用等值 join。
  
  - 其它 join 只支持等值 join