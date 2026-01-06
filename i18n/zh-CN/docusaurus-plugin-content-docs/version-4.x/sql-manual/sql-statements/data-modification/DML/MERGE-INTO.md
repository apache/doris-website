---
{
    "title": "MERGE-INTO",
    "language": "zh-CN",
    "description": "根据第二张表或子查询中的值，对目标表执行插入、更新和删除操作。当第二张表是一个变更日志（包含需要插入的新行、需要更新的已修改行，或需要删除的已标记行）时，合并操作非常有用。"
}
---

## 描述

根据第二张表或子查询中的值，对目标表执行插入、更新和删除操作。当第二张表是一个变更日志（包含需要插入的新行、需要更新的已修改行，或需要删除的已标记行）时，合并操作非常有用。

该命令支持以下情况的处理语义：

- 匹配的值（用于更新和删除）。
- 不匹配的值（用于插入）。

该命令的目标表必须是 UNIQUE KEY 模型表。

## 语法

```sql
MERGE INTO <target_table>
    USING <source>
    ON <join_expr>
    { matchedClause | notMatchedClause } [ ... ]
```

其中

```sql
matchedClause ::=
    WHEN MATCHED
        [ AND <case_predicate> ]
        THEN { UPDATE SET <col_name> = <expr> [ , <col_name> = <expr> ... ] | DELETE } 
```

```sql
notMatchedClause ::=
    WHEN NOT MATCHED
        [ AND <case_predicate> ]
        THEN INSERT [ ( <col_name> [ , ... ] ) ] VALUES ( <expr> [ , ... ] )
```

## 参数

**\<target_table\>**

> 指定 merge 的目标表

**\<source\>**

> 指定 merge 的数据源

**\<join_expr\>**

> 指定目标表和数据源连接的条件

### matchedClause (用于更新和删除数据)

**WHEN MATCHED ... AND \<case_predicate\>**

> 可选地指定一个表达式，当该表达式为真时，将执行匹配的情况。  
> 默认值：无（始终执行匹配的情况）

**WHEN MATCHED ... THEN { UPDATE SET ... | DELETE }**

> 指定匹配时需要执行的动作。

**SET col_name = expr [ , col_name = expr ... ]**

> 使用对应表达式更新目标表中指定的列（该表达式可引用目标表和源表中的关系）以设置新的列值。  
> 在单个 SET 子句中，可以指定多个要更新的列。

**DELETE**

> 删除目标表中匹配数据源的行

### notMatchedClause (用于插入数据)

**WHEN NOT MATCHED ... AND \<case_predicate\>**

> 可选地指定一个表达式，当该表达式为真时，将执行不匹配的情况。  
> 默认值：无（始终执行不匹配的情况）

**WHEN NOT MATCHED ... THEN INSERT [ ( col_name [ , ... ] ) ] VALUES ( expr [ , ... ] )**

> 指定不匹配时需要执行的动作。

**( col_name [ , ... ] )**

> 可选地指定目标表中一个或多个要从源表插入值的列。  
> 默认值：无（插入目标表中的所有列）

**VALUES ( expr [ , ... ] )**

> 指定用于插入列值的对应表达式（必须引用数据源）。

## 权限控制


执行此 SQL 命令的[用户](../../../../admin-manual/auth/authentication-and-authorization.md)必须至少具有以下[权限](../../../../admin-manual/auth/authentication-and-authorization.md)：

| 权限  | 对象            | 说明                                             |
| :---------------- | :------------ | :- |
| SELECT_PRIV       | 数据源和目标表 |  |
| LOAD_PRIV       | 目标表 |  |

## 注意事项

- 该命令的目标表必须是 UNIQUE KEY 模型表。
- 一条 MERGE 语句可以包含多个匹配和不匹配子句（即 WHEN MATCHED ... 和 WHEN NOT MATCHED ...）。
- 任何省略了 AND 子句的匹配或不匹配子句（即采用默认行为的子句）必须是该类型子句在语句中的最后一个（例如，一个 WHEN MATCHED ... 子句之后不能跟另一个 WHEN MATCHED AND ... 子句）。否则会导致出现不可达的情况，从而引发错误。

### 重复连接行的行为

当前 Doris 不检测是否会出现重复的连接行。如果出现，则会产生未定义行为。  
如果连接后出现对同一目标表行同时执行更新、删除或写入操作，则和 INSERT 类似。如果存在 Sequence 列，则根据 Sequence 列的大小决定最终写入的数据，否则随机写入其中一行数据。  

## 示例

以下示例执行一个基本的合并操作，使用源表中的值来更新目标表中的数据。请先创建并加载两个表：

```sql
CREATE TABLE `merge_into_source_table` (
      `c1` int NULL,
      `c2` varchar(255) NULL
    ) ENGINE=OLAP
    PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
    );

CREATE TABLE `merge_into_target_base_table` (
      `c1` int NULL,
      `c2` varchar(255) NULL
    ) ENGINE=OLAP
    UNIQUE KEY(`c1`)
    DISTRIBUTED BY HASH(`c1`)
    PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
    );

INSERT INTO merge_into_source_table VALUES (1, 12), (2, 22), (3, 33);
INSERT INTO merge_into_target_base_table VALUES (1, 1), (2, 10);
```

查看表中的数据

```sql
SELECT * FROM merge_into_source_table;
```

```
+----+----+
| c1 | c2 |
+----+----+
| 1  | 12 |
| 2  | 22 |
| 3  | 33 |
+----+----+
```

```sql
SELECT * FROM merge_into_target_base_table;
```

```
+----+----+
| c1 | c2 |
+----+----+
| 2  | 10 |
| 1  | 1  |
+----+----+
```

执行 merge 语句

```sql
WITH tmp AS (SELECT * FROM merge_into_source_table)
MERGE INTO merge_into_target_base_table t1
    USING tmp t2
    ON t1.c1 = t2.c1
    WHEN MATCHED AND t1.c2 = 10 THEN DELETE
    WHEN MATCHED THEN UPDATE SET c2 = 10
    WHEN NOT MATCHED THEN INSERT VALUES(t2.c1, t2.c2)
```

查看目标表现在的数据：


```sql
SELECT * FROM merge_into_target_base_table;
```

```
+----+----+
| c1 | c2 |
+----+----+
| 3  | 33 |
| 1  | 10 |
+----+----+
```