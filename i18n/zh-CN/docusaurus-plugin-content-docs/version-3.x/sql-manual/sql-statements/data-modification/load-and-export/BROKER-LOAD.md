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

1. 从 HDFS 导入一批数据，导入文件 `file.txt`，按逗号分隔，导入到表 `my_table`。

    ```sql
    LOAD LABEL example_db.label1
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file.txt")
        INTO TABLE `my_table`
        COLUMNS TERMINATED BY ","
    )
    WITH BROKER hdfs
    (
        "username"="hdfs_user",
        "password"="hdfs_password"
    );
    ```

2. 从 HDFS 导入数据，使用通配符匹配两批文件。分别导入到两个表中。使用通配符匹配导入两批文件 `file-10*` 和 `file-20*`。分别导入到 `my_table1` 和`my_table2` 两张表中。其中 `my_table1` 指定导入到分区 `p1` 中，并且将导入源文件中第列和第三列的值 +1 后导入。

    ```sql
    LOAD LABEL example_db.label2
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-10*")
        INTO TABLE `my_table1`
        PARTITION (p1)
        COLUMNS TERMINATED BY ","
        (k1, tmp_k2, tmp_k3)
        SET (
            k2 = tmp_k2 + 1,
            k3 = tmp_k3 + 1
        ),
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-20*")
        INTO TABLE `my_table2`
        COLUMNS TERMINATED BY ","
        (k1, k2, k3)
    )
    WITH BROKER hdfs
    (
        "username"="hdfs_user",
        "password"="hdfs_password"
    );
    ```

3. 从 HDFS 导入一批数据。指定分隔符为 Hive 的默认分隔符 `\\x01`，并使用通配符 * 指定 `data` 目录下所有目录的所文件。使用简单认证，同时配置 namenode HA。

    ```sql
    LOAD LABEL example_db.label3
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/user/doris/data/*/*")
        INTO TABLE `my_table`
        COLUMNS TERMINATED BY "\\x01"
    )
    WITH BROKER my_hdfs_broker
    (
        "username" = "",
        "password" = "",
        "fs.defaultFS" = "hdfs://my_ha",
        "dfs.nameservices" = "my_ha",
        "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.    namenode.ha.ConfiguredFailoverProxyProvider"
    );
    ```

4. 导入 Parquet 格式数据，指定 FORMAT 为 parquet。默认是通过文件后缀判断

    ```sql
    LOAD LABEL example_db.label4
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file")
        INTO TABLE `my_table`
        FORMAT AS "parquet"
        (k1, k2, k3)
    )
    WITH BROKER hdfs
    (
        "username"="hdfs_user",
        "password"="hdfs_password"
    );
    ```

5. 导入数据，并提取文件路径中的分区字段。`my_table` 表中的列为 `k1, k2, k3, city, utc_date`。其中 `hdfs://hdfs_host:hdfs_port/user/doris/data/input/dir/city=beijing` 目下包括如下文件：
    ```text
    hdfs://hdfs_host:hdfs_port/input/city=beijing/utc_date=2020-10-01/0000.csv
    hdfs://hdfs_host:hdfs_port/input/city=beijing/utc_date=2020-10-02/0000.csv
    hdfs://hdfs_host:hdfs_port/input/city=tianji/utc_date=2020-10-03/0000.csv
    hdfs://hdfs_host:hdfs_port/input/city=tianji/utc_date=2020-10-04/0000.csv
    ```
    文件中只包含 `k1, k2, k3` 三列数据，`city, utc_date` 这两列数据会从文件路径中提取。

    ```sql
    LOAD LABEL example_db.label10
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/city=beijing/*/*")
        INTO TABLE `my_table`
        FORMAT AS "csv"
        (k1, k2, k3)
        COLUMNS FROM PATH AS (city, utc_date)
    )
    WITH BROKER hdfs
    (
        "username"="hdfs_user",
        "password"="hdfs_password"
    );
    ```

6. 对待导入数据进行过滤。只有原始数据中，k1 = 1，并且转换后，k1 > k2 的行才会被导入。

    ```sql
    LOAD LABEL example_db.label6
    (
        DATA INFILE("hdfs://host:port/input/file")
        INTO TABLE `my_table`
        (k1, k2, k3)
        SET (
            k2 = k2 + 1
        )
        PRECEDING FILTER k1 = 1
        WHERE k1 > k2
    )
    WITH BROKER hdfs
    (
        "username"="user",
        "password"="pass"
    );
    ```

   

7. 导入数据，提取文件路径中的时间分区字段，并且时间包含 %3A (在 hdfs 路径中，不允许有 ':'，所有 ':' 会由 %3A 替换)

   ```sql
   LOAD LABEL example_db.label7
   (
       DATA INFILE("hdfs://host:port/user/data/*/test.txt") 
       INTO TABLE `tbl12`
       COLUMNS TERMINATED BY ","
       (k2,k3)
       COLUMNS FROM PATH AS (data_time)
       SET (
           data_time=str_to_date(data_time, '%Y-%m-%d %H%%3A%i%%3A%s')
       )
   )
   WITH BROKER hdfs
   (
       "username"="user",
       "password"="pass"
   );
   ```

   路径下有如下文件：

   ```text
   /user/data/data_time=2020-02-17 00%3A00%3A00/test.txt
   /user/data/data_time=2020-02-18 00%3A00%3A00/test.txt
   ```

   表结构为：

   ```text
   data_time DATETIME,
   k2        INT,
   k3        INT
   ```

8. 从 HDFS 导入一批数据，指定超时时间和过滤比例。使用明文 my_hdfs_broker 的 broker。简单认证。并且将原有数据中与 导入数据中 v2 大于 100 的列相匹配的列删除，其他列正常导入

   ```sql
   LOAD LABEL example_db.label8
   (
       MERGE DATA INFILE("HDFS://test:802/input/file")
       INTO TABLE `my_table`
       (k1, k2, k3, v2, v1)
       DELETE ON v2 > 100
   )
   WITH HDFS
   (
       "hadoop.username"="user",
       "password"="pass"
   )
   PROPERTIES
   (
       "timeout" = "3600",
       "max_filter_ratio" = "0.1"
   );
   ```

   使用 MERGE 方式导入。`my_table` 必须是一张 Unique Key 的表。当导入数据中的 v2 列的值大于 100 时，该行会被认为是一个删除行。

   导入任务的超时时间是 3600 秒，并且允许错误率在 10% 以内。

9. 导入时指定 source_sequence 列，保证 UNIQUE_KEYS 表中的替换顺序：

   ```sql
   LOAD LABEL example_db.label9
   (
       DATA INFILE("HDFS://test:802/input/file")
       INTO TABLE `my_table`
       COLUMNS TERMINATED BY ","
       (k1,k2,source_sequence,v1,v2)
       ORDER BY source_sequence
   ) 
   WITH HDFS
   (
       "hadoop.username"="user",
       "password"="pass"
   )
   ```

   `my_table` 必须是 Unique Key 模型表，并且指定了 Sequcence Col。数据会按照源数据中 `source_sequence` 列的值来保证顺序性。

10. 从 HDFS 导入一批数据，指定文件格式为 `json` 并指定 `json_root`、`jsonpaths`

    ```sql
    LOAD LABEL example_db.label10
    (
        DATA INFILE("HDFS://test:port/input/file.json")
        INTO TABLE `my_table`
        FORMAT AS "json"
        PROPERTIES(
          "json_root" = "$.item",
          "jsonpaths" = "[$.id, $.city, $.code]"
        )       
    )
    with HDFS (
    "hadoop.username" = "user"
    "password" = ""
    )
    PROPERTIES
    (
    "timeout"="1200",
    "max_filter_ratio"="0.1"
    );
    ```

    `jsonpaths` 可与 `column list` 及 `SET (column_mapping)`配合：

    ```sql
    LOAD LABEL example_db.label10
    (
        DATA INFILE("HDFS://test:port/input/file.json")
        INTO TABLE `my_table`
        FORMAT AS "json"
        (id, code, city)
        SET (id = id * 10)
        PROPERTIES(
          "json_root" = "$.item",
          "jsonpaths" = "[$.id, $.code, $.city]"
        )       
    )
    with HDFS (
    "hadoop.username" = "user"
    "password" = ""
    )
    PROPERTIES
    (
    "timeout"="1200",
    "max_filter_ratio"="0.1"
    );
    ```

11. 从腾讯云 cos 中以 csv 格式导入数据。

    ```sql
    LOAD LABEL example_db.label10
    (
    DATA INFILE("cosn://my_bucket/input/file.csv")
    INTO TABLE `my_table`
    (k1, k2, k3)
    )
    WITH BROKER "broker_name"
    (
        "fs.cosn.userinfo.secretId" = "xxx",
        "fs.cosn.userinfo.secretKey" = "xxxx",
        "fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxxxxx.myqcloud.com"
    )
    ```

12. 导入 CSV 数据时去掉双引号，并跳过前 5 行。

    ```sql 
    LOAD LABEL example_db.label12
    (
    DATA INFILE("cosn://my_bucket/input/file.csv")
    INTO TABLE `my_table`
    (k1, k2, k3)
    PROPERTIES("trim_double_quotes" = "true", "skip_lines" = "5")
    )
    WITH BROKER "broker_name"
    (
        "fs.cosn.userinfo.secretId" = "xxx",
        "fs.cosn.userinfo.secretKey" = "xxxx",
        "fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxxxxx.myqcloud.com"
    )
    ```