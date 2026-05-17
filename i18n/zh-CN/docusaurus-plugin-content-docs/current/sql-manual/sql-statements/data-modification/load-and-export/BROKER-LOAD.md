---
{
    "title": "BROKER LOAD",
    "language": "zh-CN",
    "description": "Broker Load 是 Doris 的数据导入方式，主要用于从远程存储系统（如 HDFS 或 S3）导入大规模数据。它通过 MySQL API 发起，是异步导入方式。导入进度和结果可以通过 SHOW LOAD 查询。"
}
---

## 描述

Broker Load 是 Doris 的数据导入方式，主要用于从远程存储系统（如 HDFS 或 S3）导入大规模数据。它通过 MySQL API 发起，是异步导入方式。导入进度和结果可以通过 SHOW LOAD 查询。

在早期版本中，S3 和 HDFS Load 依赖于 Broker 进程，但随着版本优化，现在直接从数据源读取，不再依赖额外的 Broker 进程。尽管如此，由于语法相似，S3 Load、HDFS Load 和 Broker Load 都被统称为 Broker Load。


## 语法

```sql
LOAD LABEL [<db_name>.]<load_label>
(
[ { MERGE | APPEND | DELETE } ]
DATA INFILE
(
"<file_path>"[, ...]
)
[ NEGATIVE ]
INTO TABLE `<table_name>`
[ PARTITION ( <partition_name> [ , ... ] ) ]
[ COLUMNS TERMINATED BY "<column_separator>" ]
[ LINES TERMINATED BY "<line_delimiter>" ]
[ FORMAT AS "<file_type>" ]
[ COMPRESS_TYPE AS "<compress_type>" ]
[ (<column_list>) ]
[ COLUMNS FROM PATH AS (<column_name> [ , ... ] ) ]
[ SET (<column_mapping>) ]
[ PRECEDING FILTER <predicate> ]
[ WHERE <predicate> ]
[ DELETE ON <expr> ]
[ ORDER BY <source_sequence> ]
[ PROPERTIES ("<key>"="<value>" [, ...] ) ]
)
WITH BROKER "<broker_name>"
(   <broker_properties>
    [ , ... ])
[ PROPERTIES (
    <load_properties>
    [ , ... ]) ]
[COMMENT "<comment>" ];
```

## 必选参数

**1. `<db_name>`**
> 指定导入的数据库名。

**2. `<load_label>`**
> 每个导入任务需要指定一个唯一的 Label，后续可以通过该 Label 查询作业进度。

**3. `<table_name>`**
> 指定导入任务对应的表。

**4.` <file_path> `**
> 指定需要导入的文件路径。可以是多个路径，也可以使用通配符。路径最终必须匹配到文件，若只匹配到目录则导入会失败。

**5. `<broker_name>`**
> 指定需要使用的 Broker 服务名称。比如在公有云 Doris 中。Broker 服务名称为 `bos`。

**6. `<broker_properties>`**
> 指定 broker 所需的信息。这些信息通常被用于 Broker 能够访问远端存储系统。如 BOS 或 HDFS。
>
>```text
>  (
>      "username" = "user",
>      "password" = "pass",
>      ...
>  )
>```

## 可选参数

**1. `merge | append | delete`**  
> 数据合并类型。默认为 `append`，表示本次导入是普通的追加写操作。`merge` 和 `delete` 类型仅适用于 unique key 模型表。`merge` 类型需要配合 `[delete on]` 语句使用，以标注 delete flag 列。而 `delete` 类型则表示本次导入的所有数据皆为删除数据。

**2. `negative`**  
> 表示 "负" 导入，这种方式仅针对具有整型 sum 聚合类型的聚合数据表。将导入数据中的 sum 聚合列对应的整型数值取反，用于冲抵错误数据。

**3. `<partition_name>`**  
> 指定仅导入表的某些分区，比如：partition (p1, p2,...)，其他不在分区范围内的数据会被忽略。

**4. `<column_separator>`**  
> 指定列分隔符，仅在 CSV 格式下有效，且只能指定单字节分隔符。

**5. `<line_delimiter>`**  
> 指定行分隔符，仅在 CSV 格式下有效，且只能指定单字节分隔符。

**6. `<file_type>`**  
> 指定文件格式，支持 `csv`（默认）、`parquet`、`orc` 格式。

**7. `<compress_type>`**  
> 指定文件压缩类型，支持 `gz`、`bz2`、`lz4frame`。

**8. `<column_list>`**  
> 指定原始文件中的列顺序。

**9. `columns from path as (<c1>, <c2>,...)`**  
> 指定从导入文件路径中抽取的列。

**10. `<column_mapping>`**  
> 指定列的转换函数。

**11. `preceding filter <predicate>`**  
> 数据先根据 `column list` 和 `columns from path as` 拼接为原始数据行，再根据前置过滤条件进行过滤。

**12. `where <predicate>`**  
> 根据条件对导入数据进行过滤。

**13. `delete on <expr>`**  
> 配合 `merge` 导入模式使用，仅适用于 unique key 模型的表。用于指定导入数据中表示删除标志（delete flag）的列及计算关系。

**14. `<source_sequence>`**  
> 仅适用于 unique key 模型的表。用于指定导入数据中表示 sequence col 的列，主要用于导入时保证数据顺序。

**15. `properties ("<key>"="<value>",...)`**  
> 指定导入文件格式的参数。适用于 CSV、JSON 等格式。例如，可以指定 `json_root`、`jsonpaths`、`fuzzy_parse` 等参数。  
> `enclose`: 包围符；当 CSV 数据字段中含有行分隔符或列分隔符时，为防止意外截断，可指定单字节字符作为包围符起到保护作用。例如列分隔符为 ","，包围符为 "'"，数据为 "a,'b,c'"，则 "b,c" 会被解析为一个字段。  
> 注意：当 `enclose` 设置为 `"` 时，`trim_double_quotes` 一定要设置为 `true`。  
> `escape`: 转义符。用于转义在字段中出现的与包围符相同的字符。例如数据为 "a,'b,'c'"，包围符为 "'"，希望 "b,'c" 被作为一个字段解析，则需要指定单字节转义符，例如 ""，然后将数据修改为 "a,'b,'c'"。

**16. `< load_properties >`** 可选参数如下，并可根据实际环境情况添加。

| 参数                   | 参数说明                                                     |
| ---------------------- | ------------------------------------------------------------ |
| timeout                | 导入超时时间，默认为 4 小时，单位秒。                        |
| max_filter_ratio       | 最大容忍可过滤（数据不规范等原因）的数据比例，默认零容忍，取值范围为 0 到 1。 |
| exec_mem_limit         | 导入内存限制，默认为 2GB，单位为字节。                       |
| strict_mode            | 是否对数据进行严格限制，默认为 false。                       |
| partial_columns        | 布尔类型，为 true 时表示使用部分列更新，默认值为 false，仅在表模型为 Unique 且采用 Merge on Write 时设置。 |
| timezone               | 指定时区，影响一些受时区影响的函数，如 `strftime`、`alignment_timestamp`、`from_unixtime` 等，具体请查阅 [时区](https://chatgpt.com/advanced/time-zone.md) 文档。如果不指定，则使用 "Asia/Shanghai"。 |
| load_parallelism       | 导入并发度，默认为 1，调大导入并发度会启动多个执行计划同时执行导入任务，加快导入速度。 |
| send_batch_parallelism | 设置发送批处理数据的并行度。如果并行度的值超过 BE 配置中的 `max_send_batch_parallelism_per_job`，则会使用 `max_send_batch_parallelism_per_job` 的值。 |
| load_to_single_tablet  | 布尔类型，为 true 时表示支持将数据导入到对应分区的单个 tablet，默认值为 false，作业的任务数取决于整体并发度，仅在导入带有 random 分桶的 OLAP 表时设置。 |
| priority               | 设置导入任务的优先级，可选 `HIGH/NORMAL/LOW`，默认为 `NORMAL`。对于处于 `PENDING` 状态的导入任务，更高优先级的任务将优先进入 `LOADING` 状态。 |
| comment                | 指定导入任务的备注信息。                                     |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV        | 表（Table）    | 对指定的库表的导入权限 |

## 举例

完整示例（包括 S3、HDFS、JSON 格式、Merge 模式、路径分区提取等）请参考数据导入指南中的 [Broker Load](../../../../data-operate/import/import-way/broker-load-manual.md)。