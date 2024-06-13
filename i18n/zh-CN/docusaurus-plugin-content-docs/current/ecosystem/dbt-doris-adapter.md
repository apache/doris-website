---
{
"title": "DBT Doris Adapter",
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


[DBT(Data Build Tool)](https://docs.getdbt.com/docs/introduction) 是专注于做 ELT（提取、加载、转换）中的 T（Transform）—— “转换数据”环节的组件
`dbt-doris` adapter 是基于`dbt-core` 1.5.0 开发，依赖于`mysql-connector-python`驱动对 doris 进行数据转换。

代码仓库：https://github.com/apache/doris/tree/master/extension/dbt-doris

## 版本支持

| doris   | python       | dbt-core |
|---------|--------------|----------|
| >=1.2.5 | >=3.8,<=3.10 | >=1.5.0  |


## dbt-doris adapter 使用

### dbt-doris adapter 安装
使用 pip 安装：
```shell
pip install dbt-doris
```
安装行为会默认安装所有 dbt 运行的依赖，可以使用如下命令查看验证：
```shell
dbt --version
```
如果系统未识别 dbt 这个命令，可以创建一条软连接：
```shell
ln -s /usr/local/python3/bin/dbt /usr/bin/dbt
```

### dbt-doris adapter 初始化

```shell
dbt init 
```
会出现询问式命令行，输入相应配置如下即可初始化一个 dbt 项目：

| 名称       | 默认值  | 含义                                                   |  
|----------|------|------------------------------------------------------|
| project  |      | 项目名                                                  | 
| database |      | 输入对应编号选择适配器（选择 doris）                                | 
| host     |      | doris 的 host                                         | 
| port     | 9030 | doris 的 MySQL Protocol Port                          |
| schema   |      | 在 dbt-doris 中，等同于 database，库名                        |
| username |      | doris 的 username |
| password |      | doris 的 password                                  |
| threads  | 1    | dbt-doris 中并行度（设置与集群能力不匹配的并行度会增加 dbt 运行失败风险）        |


### dbt-doris adapter 运行

相关 dbt 运行文档，可参考[此处](https://docs.getdbt.com/docs/get-started/run-your-dbt-projects)。
进入到刚刚创建的项目目录下面，执行默认的 dbt 模型：
```shell
dbt run 
```
可以看到运行了两个 model：my_first_dbt_model 和 my_second_dbt_model

他们分别是物化表 table 和视图 view。

可以登陆 doris，查看 my_first_dbt_model 和 my_second_dbt_model 的数据结果及建表语句。

### dbt-doris adapter 物化方式
dbt-doris 的 物化方式（Materialization）支持一下三种：

1. view

2. table

3. incremental

**View** 

使用`view`作为物化模式，在 Models 每次运行时都会通过 create view as 语句重新构建为视图。(默认情况下，dbt 的物化方式为 view)
``` 
优点：没有存储额外的数据，源数据之上的视图将始终包含最新的记录。
缺点：执行较大转换或嵌套在其他view之上的view查询速度很慢。
建议：通常从模型的视图开始，只有当存在性能问题时才更改为另一个物化方式。view最适合不进行重大转换的模型，例如重命名，列变更。
```

配置项：
```yaml
models:
  <resource-path>:
    +materialized: view
```
或者在 model 文件里面写
```jinja
{{ config(materialized = "view") }}
```

**Table**

使用 `table` 物化模式时，您的模型在每次运行时都会通过 `create table as select` 语句重建为表。
对于 dbt 的 tablet 物化，dbt-doris 采用以下步骤保证数据更迭时候的原子性：

1. `create table this_table_temp as {{ model sql}}`，首先创建临时表。

2. 判断 `this_table` 是否不存在，即是首次创建，执行`rename`，将临时表变更为最终表。

3. 若已经存在，则 `alter table this_table REPLACE WITH TABLE this_table_temp PROPERTIES('swap' = 'False')`，此操作可以交换表名并且删除`this_table_temp`临时表，[此过程](../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-REPLACE)通过 Doris 内核的事务机制保证本次操作原子性。
``` 
优点：table查询速度会比view快。
缺点：table需要较长时间才能构建或重建，会额外存储数据，而且不能够做增量数据同步。
建议：建议对 BI 工具查询的model或下游查询、转换等操作较慢的model使用table物化方式。
```

配置项：

```yaml
models:
  <resource-path>:
    +materialized: table
    +duplicate_key: [ <column-name>, ... ],
    +replication_num: int,
    +partition_by: [ <column-name>, ... ],
    +partition_type: <engine-type>,
    +partition_by_init: [<pertition-init>, ... ]
    +distributed_by: [ <column-name>, ... ],
    +buckets: int | 'auto',
    +properties: {<key>:<value>,...}
```
或者在 model 文件里面写

```jinja
{{ config(
    materialized = "table",
    duplicate_key = [ "<column-name>", ... ],
    replication_num = "<int>"
    partition_by = [ "<column-name>", ... ],
    partition_type = "<engine-type>",
    partition_by_init = ["<pertition-init>", ... ]
    distributed_by = [ "<column-name>", ... ],
    buckets = "<int>" | "auto",
    properties = {"<key>":"<value>",...}
      ...
    ]
) }}
```

上述配置项详情如下：

| 配置项                 | 描述                                   | Required? |
|---------------------|--------------------------------------|-----------|
| `materialized`      | 该表的物化形式（对应创建表模型为明细模型（Duplicate））    | Required  |
| `duplicate_key`     | 明细模型的排序列                             | Optional  |
| `replication_num`   | 表副本数                                 | Optional  |
| `partition_by`      | 表分区列                                 | Optional  |
| `partition_type`    | 表分区类型，range 或 list .(default: `RANGE`) | Optional  |
| `partition_by_init` | 初始化的表分区                              | Optional  |
| `distributed_by`    | 表桶区列                                 | Optional  |
| `buckets`           | 分桶数量                                 | Optional  |
| `properties`        | 建表的其他配置                              | Optional  |




**Incremental**

以上次运行 dbt 的 incremental model 结果为基准，增量的将记录插入或更新到表中。
doris 的增量实现有两种方式，此项设计两种增量（incremental_strategy 设置）的策略：

* `insert_overwrite`：依赖于 unique 模型，如果有增量需求，在初始化该模型的数据时就指定物化为 incremental，通过指定聚合列进行聚合，实现增量数据的覆盖。

* `append`：依赖于`duplicate`模型，仅仅对增量数据做追加，不涉及修改任何历史数据。因此不需要指定 unique_key。

``` 
优点：只需转换新记录，可显著减少构建时间。
缺点：incremental模式需要额外的配置，是 dbt 的高级用法，需要复杂场景的支持和对应组件的适配。
建议：增量模型最适合基于事件相关的场景或 dbt 运行变得太慢时使用增量模型
```

配置项：

```yaml
models:
  <resource-path>:
    +materialized: incremental
    +incremental_strategy: <strategy>
    +unique_key: [ <column-name>, ... ],
    +replication_num: int,
    +partition_by: [ <column-name>, ... ],
    +partition_type: <engine-type>,
    +partition_by_init: [<pertition-init>, ... ]
    +distributed_by: [ <column-name>, ... ],
    +buckets: int | 'auto',
    +properties: {<key>:<value>,...}
```
或者在 model 文件里面写

```jinja
{{ config(
    materialized = "incremental",
    incremental_strategy = "<strategy>"
    unique_key = [ "<column-name>", ... ],
    replication_num = "<int>"
    partition_by = [ "<column-name>", ... ],
    partition_type = "<engine-type>",
    partition_by_init = ["<pertition-init>", ... ]
    distributed_by = [ "<column-name>", ... ],
    buckets = "<int>" | "auto",
    properties = {"<key>":"<value>",...}
      ...
    )
}}
```

上述配置项详情如下：

| 配置项                        | 描述                                   | Required? |
|----------------------------|--------------------------------------|-----------|
| `materialized`             | 该表的物化形式                              | Required  |
| `incremental_strategy`     | 增量策略                                 | Optional  |
| `unique_key`               | unique 表的 key 列                         | Optional  |
| `replication_num`          | 表副本数                                 | Optional  |
| `partition_by`             | 表分区列                                 | Optional  |
| `partition_type`           | 表分区类型，range 或 list .(default: `RANGE`) | Optional  |
| `partition_by_init`        | 初始化的表分区                              | Optional  |
| `distributed_by`           | 表桶区列                                 | Optional  |
| `buckets`                  | 分桶数量                                 | Optional  |
| `properties`               | 建表的其他配置                              | Optional  |

### dbt-doris adapter seed

[`seed`](https://docs.getdbt.com/faqs/seeds/build-one-seed) 是用于加载 csv 等数据文件时的功能模块，它是一种加载文件入库参与模型构建的一种方式，但有以下注意事项：

1. seed 不应用于加载原始数据（例如，从生产数据库导出大型 CSV 文件）。 

2. 由于 seed 是受版本控制的，因此它们最适合包含特定于业务的逻辑的文件，例如国家/地区代码列表或员工的用户 ID。 

3. 对于大文件，使用 dbt 的 seed 功能加载 CSV 的性能不佳。应该考虑使用 streamload 等方式将这些 CSV 加载到 doris 中。

用户可以在 dbt project 的目录下面看到 seeds 的目录，在里面上传 csv 文件和 seed 配置文件并运行

```shell
 dbt seed --select seed_name
```

常见 seed 配置文件写法，支持对列类型的定义：

```yaml
seeds:
  seed_name: # 种子名称，在 seed 构建后，会作为表名
    config: 
      schema: demo_seed # 在 seed 构建后，会作为 database 的一部分
      full_refresh: true
      replication_num: 1
      column_types:
        id: bigint
        phone: varchar(32)
        ip: varchar(15)
        name: varchar(20)
        cost: DecimalV3(19,10)
```