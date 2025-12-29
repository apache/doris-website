---
{
    "title": "CREATE TABLE",
    "language": "zh-CN",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "在当前或指定的数据库中创建一个新表。一个表可以有多个列，每个列的定义包括名称、数据类型，以及可选的以下属性："
}
---

## 描述

在当前或指定的数据库中创建一个新表。一个表可以有多个列，每个列的定义包括名称、数据类型，以及可选的以下属性：

- 是否是 key
- 是否有聚合语义
- 是否是生成列
- 是否要求值（NOT NULL）
- 是否是自增列
- 是否有插入时的默认值
- 是否有更新时的默认值

此外，此命令还支持以下变体：

- CREATE TABLE … AS SELECT（创建一个已填充数据的表；也称为 CTAS）
- CREATE TABLE … LIKE（创建一个现有表的空副本）

## 语法

```sql
CREATE [ TEMPORARY | EXTERNAL ] TABLE [ IF NOT EXISTS ] <table_name>
    (<columns_definition> [ <indexes_definition> ])
    [ ENGINE = <table_engine_type> ]
    [ <key_type> KEY (<key_cols>)
        [ CLUSTER BY (<cluster_cols>) ]
    ]
    [ COMMENT '<table_comment>' ]
    [ <partitions_definition> ]
    [ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
        [ BUCKETS { <bucket_count> | AUTO } ]
    ]
    [ <roll_up_definition> ]
    [ PROPERTIES (
          -- 表属性
          <table_property>
          -- 其他表属性
          [ , ... ]) 
    ]
```

其中：

```sql
columns_definition
  : -- 列定义
    <col_name> <col_type>
      [ KEY ]
      [ <col_aggregate_type> ]
      [ [ GENERATED ALWAYS ] AS (<col_generate_expression>) ]
      [ [NOT] NULL ]
      [ AUTO_INCREMENT(<col_auto_increment_start_value>) ]
      [ DEFAULT <col_default_value> ]
      [ ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>) ]
      [ COMMENT '<col_comment>' ]
    -- 其他列定义
    [ , <col_name> <col_type> [ ... ] ]
```

```sql
indexes_definition
  : -- 索引定义
    INDEX [ IF NOT EXISTS ]
      <index_name> (<index_cols>)
      [ USING <index_type> ]
      [ PROPERTIES (
            -- 表属性
            <index_property>
            -- 其他表属性
            [ , ... ]) 
      ]
      [ COMMENT '<index_comment>' ]
    -- 其他索引定义
    [ , <index_name> (<index_cols>) [ ... ] ]
```

```sql
partitions_definition
  : AUTO PARTITION BY RANGE(<auto_partition_function>(<auto_partition_arguments>))
    <origin_partitions_definition>
  | AUTO PARTITION BY LIST(<partition_cols>)
    <origin_partitions_definition>
  | PARTITION BY <partition_type> (<partition_cols>)
    <origin_partitions_definition>
```

- 其中：

    ```sql
    <origin_partitions_definition>
    : (
        -- 分区定义
        <one_partition_definition>
        -- 其他分区定义
        [ , ... ]
      )

    <one_partition_definition>
    : PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES LESS THAN <partition_value_list>
    | PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES [ <partition_lower_bound>, <partition_upper_bound>)
    | FROM <partition_lower_bound> TO <partition_upper_bound>
        INTERVAL <n> [ <datetime_unit> ]
    | PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES IN {
            (<partition_value> [, <partition_value> [ ... ] ])
            | <partition_value>
        }
    ```

```sql
roll_up_definition
  : ROLLUP (
        -- 聚合定义
        <rollup_name> (<rollup_cols>)
        [ DUPLICATE KEY (<duplicate_cols>) ]
        -- 其他聚合定义
        [ , <rollup_name> (<rollup_cols>) [ ... ] ]
    )
```

## 变种语法

### CREATE TABLE … AS SELECT（也称为 CTAS）

创建一个填充 `query` 返回数据的表：

```sql
CREATE
    [ EXTERNAL ]
  TABLE [ IF NOT EXISTS ] <table_name>
    [(<col_name> [ , <col_name> [ ... ] ] )]
    [ <indexesDefinition> ]
    [ ENGINE = <table_engine_type> ]
    [ <key_type> KEY (<key_cols>)
        [ CLUSTER BY (<cluster_cols>) ]
    ]
    [ COMMENT '<table_comment>' ]
    [ <partitionsDefinition> ]
    [ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
        [ BUCKETS { <bucket_count> | AUTO } ]
    ]
    [ <rollUpDefinition> ]
    [ PROPERTIES (
          -- 表属性
          <table_property>
          -- 其他表属性
          [ , ... ]) 
    ]
    [ AS ] <query>
```

### CREATE TABLE … LIKE

创建一个新表，其列定义与现有表相同，但不从现有表中复制数据。列的所有属性将被复制到新的表中。如果指定了 `rollup` 列表，那么原表中对应名字的 `rollup` 也将复制到新的表中：

```sql
CREATE TABLE <table_name> LIKE <source_table>
[ WITH ROLLUP (<rollup_names>) ]
```

## 必选参数

**<name>**

> 指定表的标识符（即名称）；在创建表的数据库（Database）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如``My Object``）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅[标识符要求](../../../basic-element/object-identifiers.md)和[保留关键字](../../../basic-element/reserved-keywords.md)。

**<col_name>**

> 指定列标识符（即名称）。在创建的表中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符），数字或符号`@`开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如``My Object``）。
>
> 有关更多详细信息，请参阅[标识符要求](../../../basic-element/object-identifiers.md)和[保留关键字](../../../basic-element/reserved-keywords.md)。

**<col_type>**

> 指定列的数据类型。
>
> 有关可以为表列指定的数据类型的详细信息，请参阅[数据类型](../../../basic-element/sql-data-types/data-type-overview.md)章节。

**<query>**

> 在 CTAS 中为必选参数。指定填充数据的 SELECT 语句。

**<source_table>**

> 在 CREATE TABLE ... LIKE 中为必选参数。指定被复制的原表。

## 可选参数

### 数据模型相关参数

**<key_type>**

> 表的数据模型。可选值为 DUPLICATE（明细模型）、UNIQUE（主键模型）、AGGREGATE（聚合模型）。有关数据模型的详细信息，请参阅[数据模型](../../../../table-design/data-model/overview.md)章节。

**<key_cols>**

> 表的 key 列。Doris 中 Key 列必须是表的前 K 个列。单个 tablet 中的数据会按照这些列保持有序。关于 Key 的限制，以及如何选择 Key 列，请参阅[数据模型](../../../../table-design/data-model/overview.md)章节中的各个小节。

**<cluster_cols>**

> 数据局部排序列，只能在数据模型为 UNIQUE（主键模型）时使用。当指定 `<cluster_cols>` 后，数据按照`<cluster_cols>`排序，而不再使用`<key_cols>`。

**<col_aggregate_type>**

> 列的聚合方式。只有当表是聚合模型时可以使用。聚合方式的详细信息，请参阅[聚合模型](../../../../table-design/data-model/aggregate.md)章节。

### 分桶相关参数

**<distribute_cols> 和 <bucket_count>**

> 分桶列和分桶数。明细模型的分桶列可以是任意的列，聚合模型和主键模型的分桶列必须和 key 列保持一致。分桶数是任意的正整数。有关分桶的详细信息，请参阅[手动分桶](../../../../table-design/data-partitioning/data-bucketing#手动设置分桶数)和[自动分桶](../../../../table-design/data-partitioning/data-bucketing#自动设置分桶数)章节。

### 列的默认值相关参数

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> 生成列。使用当前列之前的列，通过表达式 <col_generate_expression> ，对当前列生成数据。生成列是一种特殊的数据库表列，其值由其他列的值计算而来，而不是直接由用户插入或更新。该功能支持预先计算表达式的结果，并存储在数据库中，适用于需要频繁查询或进行复杂计算的场景。

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> 在导入数据时，Doris 会为在自增列上没有指定值的数据行分配一个表内唯一的值。<col_auto_increment_start_value> 指定自增列的起始值。自增列的详细信息，请参阅[自增列](../../../../table-design/auto-increment.md)章节。

**DEFAULT <col_default_value>**

> 列的默认值。当写入时不包含此列时，使用此默认值填充。当默认值不显式设置时，使用 NULL 填充。可用的默认值包括：
>
> - NULL：全部类型均可用，用 NULL 作为默认值。
> - 数值字面量：只能是数值类型时使用。
> - 字符串字面量：只能是字符串类型时使用。
> - CURRENT_DATE：只能是 date 类型时使用。用当前日期作为默认值。
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]：只能是 datetime 类型时使用。用当前时间作为默认值。<defaultValuePrecision> 可以指定时间精度。
> - PI：只能是 double 类型时使用。用圆周率作为默认值。
> - E：只能是 double 类型时使用。用数学常数作为默认值。
> - BITMAP_EMPTY：只能当列是 bitmap 类型时使用。填充空的 bitmap。

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> 当数据更新时，如果没有指定此列的值，则使用当前时间戳更新此列数据。只能在 UNIQUE（主键模型）的表上使用。

### 索引相关参数

**<index_name>**

> 指定索引标识符（即名称）。在创建的表中必须唯一。有关标识符的更多详细信息，请参阅[标识符要求](../../../basic-element/object-identifiers.md)和[保留关键字](../../../basic-element/reserved-keywords.md)。

**<index_cols>**

> 添加索引的列列表。必须是表中存在的列。

**<index_type>**

> 索引的类型。当前仅支持 INVERTED

**<index_property>**

> 索引的属性。详细说明请参考[倒排索引](../../../../table-design/index/inverted-index/overview)章节。

### 自动分区相关参数

有关分区的详细介绍，请参阅[自动分区](../../../../table-design/data-partitioning/auto-partitioning.md)章节。

### 手动分区相关参数

有关分区的详细介绍，请参阅“手动分区”章节。

**<partition_type>**

> Doris 支持 RANGE 分区和 LIST 分区。详情请参阅[手动分区](../../../../table-design/data-partitioning/manual-partitioning.md)章节。

**<partition_name>**

> 分区标识符（即名称）。在创建的表中必须唯一。有关标识符的更多详细信息，请参阅[标识符要求](../../../basic-element/object-identifiers.md)和[保留关键字](../../../basic-element/reserved-keywords.md)。

**VALUES LESS THAN <partition_value_list>**

> range 分区。分区数据范围从下界到 <partition_value_list>。
>
> 如果是表示上界，<partition_value_list> 可以用 `MAX_VALUE` 简化书写。
>
> <partition_value_list> 的格式如下：`((col_1_value, ...), (col_1_value, ...), ...)`

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> range 分区。分区数据范围从 <partition_lower_bound> 到 <partition_upper_bound>。只创建一个分区。
>
> <partition_lower_bound> 和 <partition_upper_bound> 格式如下：`(col_1_value, ...)`

**FROM <partition_lower_bound> TO <partition_upper_bound>**

 **INTERVAL <n> [ <datetime_unit> ]**

> range 分区。分区数据范围从 <partition_lower_bound> 到 <partition_value_list>。每建个 <n> 创建一个分区。
>
> <partition_lower_bound> 和 <partition_upper_bound> 格式如下：`(col_1_value, ...)`

**VALUES IN {**

​          **(<partition_value> [, <partition_value> [ ... ] ])**

​          **| <partition_value>**

​      **}**

> list 分区。分区列等于 <partition_value>  的属于此分区。
>
> <partition_value> 格式如下：`(col_1_value, ...)`

### 同步物化视图相关

:::caution 注意
rollup 可以创建的同步物化视图功能有限。已不再推荐使用。推荐使用独立的语句创建同步物化视图。详情请参阅 [CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md) 语句和[同步物化视图](../../../../query-acceleration/materialized-view/sync-materialized-view.md)章节。
:::

**<rollup_name>**

> 同步物化视图的标示符（即名称）。在创建的表中必须唯一。有关标识符的更多详细信息，请参阅[标识符要求](../../../basic-element/object-identifiers.md)和[保留关键字](../../../basic-element/reserved-keywords.md)。

**<rollup_cols>**

> 同步物化视图包含的列。

### 表属性相关参数

**<table_property>**

| 属性名                                        | 作用                                                         |
| :-------------------------------------------- | :----------------------------------------------------------- |
| replication_num                               | 副本数。默认副本数为 3。如果 BE 节点数量小于 3，则需指定副本数小于等于 BE 节点数量。在 0.15 版本后，该属性将自动转换成 `replication_allocation` 属性，如：`"replication_num" = "3"` 会自动转换成 `"replication_allocation" = "tag.location.default:3"`。 |
| replication_allocation                        | 根据 Tag 设置副本分布情况。该属性可以完全覆盖 `replication_num` 属性的功能。 |
| min_load_replica_num                          | 设定数据导入成功所需的最小副本数，默认值为 -1。当该属性小于等于 0 时，表示导入数据仍需多数派副本成功。 |
| is_being_synced                               | 用于标识此表是否是被 CCR 复制而来并且正在被 syncer 同步，默认为 `false`。如果设置为 `true`，`colocate_with`和`storage_policy`属性将被擦除。`dynamic partition`和`auto bucket`功能将会失效。即在`show create table`中显示开启状态，但不会实际生效。当`is_being_synced`被设置为 `false` 时，这些功能将会恢复生效。这个属性仅供 CCR 外围模块使用，在 CCR 同步的过程中不要手动设置。 |
| storage_medium                                | 声明表数据的初始存储介质                                     |
| storage_cooldown_time                         | 设定表数据的初始存储介质的到期时间。超过此时间后，会自动降级到第一级别的存储介质上。 |
| colocate_with                                 | 当需要使用 Colocation Join 功能时，使用这个参数设置 Colocation Group。 |
| bloom_filter_columns                          | 用户指定需要添加 Bloom Filter 索引的列名称列表。各个列的 Bloom Filter 索引是独立的，并不是组合索引。列如：`"bloom_filter_columns" = "k1, k2, k3"` |
| compression                                   | Doris 表的默认压缩方式是 LZ4。1.1 版本后，支持将压缩方式指定为 ZSTD 以获得更高的压缩比。 |
| function_column.sequence_col                  | 当使用 Unique Key 模型时，可以指定一个 Sequence 列，当 Key 列相同时，将按照 Sequence 列进行 REPLACE(较大值替换较小值，否则无法替换) 。`function_column.sequence_col`用来指定 sequence 列到表中某一列的映射，该列可以为整型和时间类型（DATE、DATETIME），创建后不能更改该列的类型。如果设置了`function_column.sequence_col`, `function_column.sequence_type`将被忽略。 |
| function_column.sequence_type                 | 当使用 Unique Key 模型时，可以指定一个 Sequence 列，当 Key 列相同时，将按照 Sequence 列进行 REPLACE(较大值替换较小值，否则无法替换) 这里我们仅需指定顺序列的类型，支持时间类型或整型。Doris 会创建一个隐藏的顺序列。 |
| enable_unique_key_merge_on_write              | Unique 表是否使用 Merge-on-Write 实现。该属性在 2.1 版本之前默认关闭，从 2.1 版本开始默认开启。 |
| light_schema_change                           | 是否使用 Light Schema Change 优化。如果设置成 `true`, 对于值列的加减操作，可以更快地，同步地完成。该功能在 2.0.0 及之后版本默认开启。 |
| disable_auto_compaction                       | 是否对这个表禁用自动 Compaction。如果这个属性设置成 `true`, 后台的自动 Compaction 进程会跳过这个表的所有 Tablet。 |
| enable_single_replica_compaction              | 是否对这个表开启单副本 Compaction。如果这个属性设置成 `true`, 这个表的 Tablet 的所有副本只有一个进行实际的 compaction 动作，其他副本的从该副本拉取完成 compaction 的 rowset。 |
| enable_duplicate_without_keys_by_default      | 当配置为`true`时，如果创建表的时候没有指定 Unique、Aggregate 或 Duplicate 时，会默认创建一个没有排序列和前缀索引的 Duplicate 模型的表。 |
| skip_write_index_on_load                      | 是否对这个表开启数据导入时不写索引。如果这个属性设置成 `true`, 数据导入的时候不写索引（目前仅对倒排索引生效），而是在 Compaction 的时候延迟写索引。这样可以避免首次写入和 Compaction 重复写索引的 CPU 和 IO 资源消耗，提升高吞吐导入的性能。 |
| compaction_policy                             | 配置这个表的 Compaction 的合并策略，仅支持配置为 time_series 或者 size_basedtime_series: 当 rowset 的磁盘体积积攒到一定大小时进行版本合并。合并后的 rowset 直接晋升到 base compaction 阶段。在时序场景持续导入的情况下有效降低 compact 的写入放大率。此策略将使用 time_series_compaction 为前缀的参数调整 Compaction 的执行 |
| time_series_compaction_goal_size_mbytes       | Compaction 的合并策略为 time_series 时，将使用此参数来调整每次 Compaction 输入的文件的大小，输出的文件大小和输入相当 |
| time_series_compaction_file_count_threshold   | Compaction 的合并策略为 time_series 时，将使用此参数来调整每次 Compaction 输入的文件数量的最小值。一个 Tablet 中，文件数超过该配置，就会触发 Compaction |
| time_series_compaction_time_threshold_seconds | Compaction 的合并策略为 time_series 时，将使用此参数来调整 Compaction 的最长时间间隔，即长时间未执行过 Compaction 时，就会触发一次 Compaction，单位为秒 |
| time_series_compaction_level_threshold        | Compaction 的合并策略为 time_series 时，此参数默认为 1，当设置为 2 时用来控住对于合并过一次的段再合并一层，保证段大小达到 time_series_compaction_goal_size_mbytes，能达到段数量减少的效果。 |
| group_commit_interval_ms                      | 配置这个表的 Group Commit 攒批间隔。单位为 ms，默认值为 10000ms，即 10s。Group Commit 的下刷时机取决于 `group_commit_interval_ms`以及`group_commit_data_bytes`哪个先到设置的值。 |
| group_commit_data_bytes                       | 配置这个表的 Group Commit 攒批数据大小。单位为 bytes，默认值为 134217728，即 128MB。Group Commit 的下刷时机取决于 `group_commit_interval_ms`以及`group_commit_data_bytes` 哪个先到设置的值。 |
| enable_mow_light_delete                       | 是否在 Unique 表 Mow 上开启 Delete 语句写 Delete predicate。若开启，会提升 Delete 语句的性能，但 Delete 后进行部分列更新可能会出现部分数据错误的情况。若关闭，会降低 Delete 语句的性能来保证正确性。此属性的默认值为 `false`。此属性只能在 Unique Merge-on-Write 表上开启。 |
| 动态分区相关属性                              | 动态分区相关参考[数据划分 - 动态分区](../../../../table-design/data-partitioning/dynamic-partitioning) |
| enable_unique_key_skip_bitmap_column | 是否在 Unique Merge-on-Write 表上开启[灵活列更新功能](../../../../data-operate/update/update-of-unique-model.md#灵活部分列更新)。此属性只能在 Unique Merge-on-Write 表上开启。 |
## 权限控制

执行此 SQL 命令的[用户](../../../../admin-manual/auth/authentication-and-authorization.md)必须至少具有以下[权限](../../../../admin-manual/auth/authentication-and-authorization.md)：

| 权限  | 对象            | 说明                                             |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV       | 数据库（Database）        |                                                              |
| SELECT_PRIV       | 表（Table）, 视图（View） | 当执行 CTAS 时，需要拥有被查询的表，视图或物化视图的 SELECT_PRIV 权限 |

## 注意事项

- 数据库（Database）中不能包含具有相同名称的表（Table），视图（View）。
- 表名，列名，rollup 名，不能使用[保留关键字（Reserved Keywords）](../../../basic-element/reserved-keywords.md)
- CREATE TABLE … LIKE：
  - 只能对 Doris 内表使用此命令
  - 显示指定的 rollup 才会被复制
  - 所有的同步物化视图都不会被复制
- CREATE TABLE … AS SELECT (CTAS)：
  - 如果 SELECT 列表中列名的别名是有效的列，则在 CTAS 语句中不需要列定义；如果省略，列名和数据类型将从基础查询中推断出来：
      
      ```sql
      CREATE TABLE <table_name> AS SELECT ...
      ```
  - 或者，可以使用以下语法明确指定名称：
    
      ```sql
      CREATE TABLE <table_name> ( <col1_name> , <col2_name> , ... ) AS SELECT ...
      ```

- 分区和分桶
  - 一个表必须指定分桶列，但可以不指定分区。关于分区和分桶的具体介绍，可参阅 [数据划分](../../../../table-design/data-partitioning/auto-partitioning.md) 文档。
  - Doris 中的表可以分为分区表和无分区的表。这个属性在建表时确定，之后不可更改。即对于分区表，可以在之后的使用过程中对分区进行增删操作，而对于无分区的表，之后不能再进行增加分区等操作。
  - 分区列和分桶列在表创建之后不可更改，既不能更改分区和分桶列的类型，也不能对这些列进行任何增删操作。
- 动态分区
  - 动态分区功能主要用于帮助用户自动的管理分区。通过设定一定的规则，Doris 系统定期增加新的分区或删除历史分区。可参阅 [动态分区](../../../../table-design/data-partitioning/dynamic-partitioning.md) 文档查看更多帮助。
- 自动分区
  - 自动分区功能文档参见 [自动分区](../../../../table-design/data-partitioning/auto-partitioning.md)。
- 同步物化视图
  - 用户可以在建表的同时创建多个同步物化视图（ROLLUP）。同步物化视图也可以在建表之后添加。写在建表语句中可以方便用户一次性创建所有同步物化视图。
  - 如果在建表时创建好同步物化视图，则后续的所有数据导入操作都会同步生成同步物化视图的数据。同步物化视图的数量可能会影响数据导入的效率。
  - 关于物化视图的介绍，请参阅文档 [同步物化视图](../../../../query-acceleration/materialized-view/sync-materialized-view.md)。
- 索引
  - 用户可以在建表的同时创建多个列的索引。索引也可以在建表之后再添加。
  - 如果在之后的使用过程中添加索引，如果表中已有数据，则需要重写所有数据，因此索引的创建时间取决于当前数据量。

## 示例

### 基础示例

**明细模型**

```sql
CREATE TABLE t1
(
  c1 INT,
  c2 STRING
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
)
```

**聚合模型**

```sql
CREATE TABLE t2
(
  c1 INT,
  c2 INT MAX
)
AGGREGATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
)
```

**主键模型**

```sql
CREATE TABLE t3
(
  c1 INT,
  c2 INT
)
UNIQUE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
)
```

**使用生成列**

```sql
CREATE TABLE t4
(
  c1 INT,
  c2 INT GENERATED ALWAYS AS (c1 + 1)
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
)
```

**指定列的默认值**

```sql
CREATE TABLE t5
(
  c1 INT,
  c2 INT DEFAULT 10
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
)
```

**分桶方式**

```sql
CREATE TABLE t6
(
  c1 INT,
  c2 INT
)
DUPLICATE KEY(c1)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
)
```

**自动分区**

```sql
CREATE TABLE t7
(
  c1 INT,
  c2 DATETIME NOT NULL
)
DUPLICATE KEY(c1)
AUTO PARTITION BY RANGE(date_trunc(c2, 'day')) ()
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
)
```

**range 分区**

```sql
CREATE TABLE t8
(
  c1 INT,
  c2 DATETIME NOT NULL
)
DUPLICATE KEY(c1)
PARTITION BY RANGE(c2) (
  FROM ('2020-01-01') TO ('2020-01-10') INTERVAL 1 DAY
)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
)
```

**list 分区**

```sql
CREATE TABLE t9
(
  c1 INT,
  c2 DATE NOT NULL
)
DUPLICATE KEY(c1)
PARTITION BY LIST(c2) (
  PARTITION p1 VALUES IN (('2020-01-01'),('2020-01-02'))
)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
)
```

**存储介质和冷却时间**

```sql
CREATE TABLE example_db.table_hash
(
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048),
    v2 SMALLINT DEFAULT "10"
)
UNIQUE KEY(k1, k2)
DISTRIBUTED BY HASH (k1, k2) BUCKETS 32
PROPERTIES(
    "storage_medium" = "SSD",
    "storage_cooldown_time" = "2015-06-04 00:00:00"
);
```

**通过 `storage_policy` 属性设置表的冷热分层数据迁移策略**

1. 需要先创建 s3 resource 和 storage policy，表才能关联迁移策略成功

    ```sql
    -- 非分区表
    CREATE TABLE IF NOT EXISTS create_table_use_created_policy 
    (
        k1 BIGINT,
        k2 LARGEINT,
        v1 VARCHAR(2048)
    )
    UNIQUE KEY(k1)
    DISTRIBUTED BY HASH (k1) BUCKETS 3
    PROPERTIES(
        "storage_policy" = "test_create_table_use_policy",
        "replication_num" = "1"
    );

    -- 分区表
    CREATE TABLE create_table_partion_use_created_policy
    (
        k1 DATE,
        k2 INT,
        V1 VARCHAR(2048) REPLACE
    ) PARTITION BY RANGE (k1) (
        PARTITION p1 VALUES LESS THAN ("2022-01-01") ("storage_policy" = "test_create_table_partition_use_policy_1" ,"replication_num"="1"),
        PARTITION p2 VALUES LESS THAN ("2022-02-01") ("storage_policy" = "test_create_table_partition_use_policy_2" ,"replication_num"="1")
    ) DISTRIBUTED BY HASH(k2) BUCKETS 1;
    ```

**Colocation Group**

```sql
CREATE TABLE t1 (
    id int(11) COMMENT "",
    value varchar(8) COMMENT ""
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "colocate_with" = "group1"
);

CREATE TABLE t2 (
    id int(11) COMMENT "",
    value1 varchar(8) COMMENT "",
    value2 varchar(8) COMMENT ""
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "colocate_with" = "group1"
);
```

**索引**

```sql
CREATE TABLE example_db.table_hash
(
    k1 TINYINT,
    k2 DECIMAL(10, 2) DEFAULT "10.5",
    v1 CHAR(10) REPLACE,
    v2 INT SUM,
    INDEX k1_idx (k1) USING INVERTED COMMENT 'my first index'
)
AGGREGATE KEY(k1, k2)
DISTRIBUTED BY HASH(k1) BUCKETS 32
PROPERTIES (
    "bloom_filter_columns" = "k2"
);
```

**设置表的副本属性**

```sql
CREATE TABLE example_db.table_hash
(
    k1 TINYINT,
    k2 DECIMAL(10, 2) DEFAULT "10.5"
)
DISTRIBUTED BY HASH(k1) BUCKETS 32
PROPERTIES (
    "replication_allocation"="tag.location.group_a:1, tag.location.group_b:2"
);
```

**动态分区**

该表每天提前创建 3 天的分区，并删除 3 天前的分区。例如今天为`2020-01-08`，则会创建分区名为`p20200108`, `p20200109`, `p20200110`, `p20200111`的分区。分区范围分别为：

```Plain
[types: [DATE]; keys: [2020-01-08]; ‥types: [DATE]; keys: [2020-01-09]; )
[types: [DATE]; keys: [2020-01-09]; ‥types: [DATE]; keys: [2020-01-10]; )
[types: [DATE]; keys: [2020-01-10]; ‥types: [DATE]; keys: [2020-01-11]; )
[types: [DATE]; keys: [2020-01-11]; ‥types: [DATE]; keys: [2020-01-12]; )
CREATE TABLE example_db.dynamic_partition
(
    k1 DATE,
    k2 INT,
    k3 SMALLINT,
    v1 VARCHAR(2048),
    v2 DATETIME DEFAULT "2014-02-04 15:36:00"
)
DUPLICATE KEY(k1, k2, k3)
PARTITION BY RANGE (k1) ()
DISTRIBUTED BY HASH(k2) BUCKETS 32
PROPERTIES(
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-3",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32" 
);
```

**设置动态分区的副本属性**

```sql
CREATE TABLE example_db.dynamic_partition
(
    k1 DATE,
    k2 INT,
    k3 SMALLINT,
    v1 VARCHAR(2048),
    v2 DATETIME DEFAULT "2014-02-04 15:36:00"
)
PARTITION BY RANGE (k1) ()
DISTRIBUTED BY HASH(k2) BUCKETS 32
PROPERTIES(
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-3",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32",
    "dynamic_partition.replication_allocation" = "tag.location.group_a:3"
 );
```

### CTAS 示例

```sql
CREATE TABLE t10
PROPERTIES (
  'replication_num' = '1'
)
AS SELECT * FROM t1
```

### CREATE TABLE ... LIKE 示例

```sql
CREATE TABLE t11 LIKE t10
```