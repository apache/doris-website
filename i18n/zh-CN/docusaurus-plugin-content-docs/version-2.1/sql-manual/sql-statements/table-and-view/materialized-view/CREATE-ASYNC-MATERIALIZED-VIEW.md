---
{
"title": "CREATE ASYNC MATERIALIZED VIEW",
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




## 描述

该语句用于创建异步物化视图。

#### 语法

```sql
CREATE MATERIALIZED VIEW (IF NOT EXISTS)? mvName=multipartIdentifier
        (LEFT_PAREN cols=simpleColumnDefs RIGHT_PAREN)? buildMode?
        (REFRESH refreshMethod? refreshTrigger?)?
        ((DUPLICATE)? KEY keys=identifierList)?
        (COMMENT STRING_LITERAL)?
        (PARTITION BY LEFT_PAREN mvPartition RIGHT_PAREN)?
        (DISTRIBUTED BY (HASH hashKeys=identifierList | RANDOM) (BUCKETS (INTEGER_VALUE | AUTO))?)?
        propertyClause?
        AS query
```

#### 说明

##### simpleColumnDefs

用来定义物化视图 column 信息，如果不定义，将自动推导

```sql
simpleColumnDefs
: cols+=simpleColumnDef (COMMA cols+=simpleColumnDef)*
    ;

simpleColumnDef
: colName=identifier (COMMENT comment=STRING_LITERAL)?
    ;
```

例如：定义两列 aa 和 bb，其中 aa 的注释为"name"
```sql
CREATE MATERIALIZED VIEW mv1
(aa comment "name",bb)
```

##### buildMode

用来定义物化视图是否创建完成立即刷新，默认 IMMEDIATE

IMMEDIATE：立即刷新

DEFERRED：延迟刷新

```sql
buildMode
: BUILD (IMMEDIATE | DEFERRED)
;
```

例如：指定物化视图立即刷新

```sql
CREATE MATERIALIZED VIEW mv1
BUILD IMMEDIATE
```

##### refreshMethod

用来定义物化视图刷新方式，默认 AUTO

COMPLETE：全量刷新

AUTO：尽量增量刷新，如果不能分区增量刷新，就全量刷新

物化视图的 SQL 定义和分区字段需要满足如下条件，才可以进行分区增量更新：

- 物化视图使用的 Base Table 中至少有一个是分区表。
- 物化视图使用的 Base Table 分区表，必须使用 List 或者 Range 分区策略。
- 物化视图定义 SQL 中 Partition By 分区列只能有一个分区字段。
- 物化视图的 SQL 中 Partition By 的分区列，要在 Select 后。
- 物化视图定义 SQL，如果使用了 Group By，分区列的字段一定要在 Group By 后。
- 物化视图定义 SQL，如果使用了 Window 函数，分区列的字段一定要在 Partition By 后。
- 数据变更应发生在分区表上，如果发生在非分区表，物化视图需要全量构建。
- 物化视图使用 Join 的 NULL 产生端的字段作为分区字段，不能分区增量更新，例如对于 LEFT OUTER JOIN 分区字段需要在左侧，在右侧则不行。


```sql
refreshMethod
	@@ -125,7 +125,7 @@ REFRESH COMPLETE

##### refreshTrigger

物化视图刷新数据的触发方式，默认 MANUAL

MANUAL：手动刷新

SCHEDULE：定时刷新

COMMIT：触发式刷新，基表数据变更时，自动生成刷新物化视图的任务

```sql
refreshTrigger
: ON MANUAL
| ON SCHEDULE refreshSchedule
| ON COMMIT
;
    
refreshSchedule
: EVERY INTEGER_VALUE mvRefreshUnit (STARTS STRING_LITERAL)?
;
    
mvRefreshUnit
: MINUTE | HOUR | DAY | WEEK
;    
```

例如：每2小时执行一次，从2023-12-13 21:07:09开始
```sql
CREATE MATERIALIZED VIEW mv1
REFRESH ON SCHEDULE EVERY 2 HOUR STARTS "2023-12-13 21:07:09"
```

##### Key
物化视图为 Duplicate Key 模型，因此指定的列为排序列

```sql
identifierList
	@@ -165,36 +165,35 @@ identifierSeq
;
```

例如：指定k1，k2为排序列
```sql
CREATE MATERIALIZED VIEW mv1
KEY(k1,k2)
```

##### Partition
物化视图有两种分区方式，如果不指定分区，默认只有一个分区，如果指定分区字段，会自动推导出字段来自哪个基表并同步基表(当前支持 `OlapTable` 和 `hive`)的所有分区（限制条件：基表如果是 `OlapTable`，那么只能有一个分区字段）。

例如：基表是 Range 分区，分区字段为 `create_time` 并按天分区，创建物化视图时指定 `partition by(ct) as select create_time as ct from t1`，那么物化视图也会是 Range 分区，分区字段为 `ct`，并且按天分区。

物化视图也可以通过分区上卷的方式减少物化视图的分区数量，目前分区上卷函数支持 `date_trunc`,上卷的单位支持 `year`, `month`, `day`

分区字段的选择和物化视图的定义需要满足分区增量更新的条件，物化视图才可以创建成功，否则会报错 `Unable to find a suitable base table for partitioning`

```sql
mvPartition
    : partitionKey = identifier
    | partitionExpr = functionCallExpression
    ;
```

例如基表按天分区，物化视图同样按天分区
```sql
partition by (`k2`)
```

例如基表按天分区，物化视图按月分区
```sql
partition by (date_trunc(`k2`,'month'))
```

#### Property
物化视图既可以指定 Table 的 Property，也可以指定物化视图特有的 Property。

物化视图特有的 Property 包括：

`grace_period`：查询改写时允许物化视图数据的最大延迟时间（单位：秒）。如果分区 A 和基表的数据不一致，物化视图的分区 A 上次刷新时间为 1，系统当前时间为 2，那么该分区不会被透明改写。但是如果 `grace_period` 大于等于1，该分区就会被用于透明改写。

`excluded_trigger_tables`：数据刷新时忽略的表名，逗号分割。例如`table1,table2`

`refresh_partition_num`：单次 insert 语句刷新的分区数量，默认为 1。物化视图刷新时会先计算要刷新的分区列表，然后根据该配置拆分成多个 Insert 语句顺序执行。遇到失败的 Insert 语句，整个任务将停止执行。物化视图保证单个 Insert 语句的事务性，失败的 Insert 语句不会影响到已经刷新成功的分区。

`workload_group`：物化视图执行刷新任务时使用的 `workload_group` 名称。用来限制物化视图刷新数据使用的资源，避免影响到其它业务的运行。关于 `workload_group` 的创建及使用，可参考 [WORKLOAD-GROUP](../../../../admin-manual/workload-group.md) 文档。

`partition_sync_limit`：当基表的分区字段为时间时（如果是字符串类型的时间，可以设置 `partition_date_format`），可以用此属性配置同步基表的分区范围，配合 `partition_sync_time_unit` 一起使用。
例如设置为 2，`partition_sync_time_unit` 设置为 `MONTH`，代表仅同步基表近 2 个月的分区和数据。最小值为 `1`。
随着时间的变化物化视图每次刷新时都会自动增删分区，例如物化视图现在有 2,3 两个月的数据，下个月的时候，会自动删除 2 月的数据，增加 4 月的数据。

`partition_sync_time_unit`：时间单位，支持 DAY/MONTH/YEAR（默认DAY）

`enable_nondeterministic_function`：物化视图定义 SQL 是否允许包含 nondeterministic 函数，比如 current_date(), now(), random()等，如果
是 true, 允许包含，否则不允许包含, 默认不允许包含。

`query`： 创建物化视图的查询语句，其结果即为物化视图中的数据


### 示例

1. 创建一个立即刷新，之后每周刷新一次的物化视图 `mv1`，数据源为 Hive Catalog

   ```sql
   CREATE MATERIALIZED VIEW mv1 BUILD IMMEDIATE REFRESH COMPLETE ON SCHEDULE EVERY 1 WEEK
    DISTRIBUTED BY RANDOM BUCKETS 2
    PROPERTIES (
    "replication_num" = "1"
    )
    AS SELECT * FROM hive_catalog.db1.user;
   ```

2. 创建一个多表 Join 的物化视图

   ```sql
   CREATE MATERIALIZED VIEW mv1 BUILD IMMEDIATE REFRESH COMPLETE ON SCHEDULE EVERY 1 WEEK
    DISTRIBUTED BY RANDOM BUCKETS 2
    PROPERTIES (
    "replication_num" = "1"
    )
    AS select user.k1,user.k3,com.k4 from user join com on user.k1=com.k1;
   ```

## 关键词

    CREATE, ASYNC, MATERIALIZED, VIEW
