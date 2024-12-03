---
{
    "title": "INSERT",
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

该语句是完成数据插入操作。

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

 Parameters

> tablet_name: 导入数据的目的表。可以是 `db_name.table_name` 形式
>
> partitions: 指定待导入的分区，必须是 `table_name` 中存在的分区，多个分区名称用逗号分隔
>
> label: 为 Insert 任务指定一个 label
>
> column_name: 指定的目的列，必须是 `table_name` 中存在的列
>
> expression: 需要赋值给某个列的对应表达式
>
> DEFAULT: 让对应列使用默认值
>
> query: 一个普通查询，查询的结果会写入到目标中
>
> hint: 用于指示 `INSERT` 执行行为的一些指示符。目前 hint 有三个可选值`/*+ STREAMING */`、`/*+ SHUFFLE */`或`/*+ NOSHUFFLE */`
> 1. STREAMING：目前无实际作用，只是为了兼容之前的版本，因此保留。（之前的版本加上这个 hint 会返回 label，现在默认都会返回 label）
> 2. SHUFFLE：当目标表是分区表，开启这个 hint 会进行 repartiiton。
> 3. NOSHUFFLE：即使目标表是分区表，也不会进行 repartiiton，但会做一些其他操作以保证数据正确落到各个分区中。

对于开启了 merge-on-write 的 Unique 表，还可以使用 insert 语句进行部分列更新的操作。要使用 insert 语句进行部分列更新，需要将会话变量 enable_unique_key_partial_update 的值设置为 true(该变量默认值为 false，即默认无法通过 insert 语句进行部分列更新)。进行部分列更新时，插入的列必须至少包含所有的 Key 列，同时指定需要更新的列。如果插入行 Key 列的值在原表中存在，则将更新具有相同 key 列值那一行的数据。如果插入行 Key 列的值在原表中不存在，则将向表中插入一条新的数据，此时 insert 语句中没有指定的列必须有默认值或可以为 null，这些缺失列会首先尝试用默认值填充，如果该列没有默认值，则尝试使用 null 值填充，如果该列不能为 null，则本次插入失败。

需要注意的是，控制 insert 语句是否开启严格模式的会话变量`enable_insert_strict`的默认值为 true，即 insert 语句默认开启严格模式，而在严格模式下进行部分列更新不允许更新不存在的 key。所以，在使用 insert 语句进行部分列更新的时候如果希望能插入不存在的 key，需要在`enable_unique_key_partial_update`设置为 true 的基础上同时将`enable_insert_strict`设置为 false。

注意：

当前执行 `INSERT` 语句时，对于有不符合目标表格式的数据，默认的行为是过滤，比如字符串超长等。但是对于有要求数据不能够被过滤的业务场景，可以通过设置会话变量 `enable_insert_strict` 为 `true` 来确保当有数据被过滤掉的时候，`INSERT` 不会被执行成功。

### Example

`test` 表包含两个列`c1`, `c2`。

1. 向`test`表中导入一行数据

```sql
INSERT INTO test VALUES (1, 2);
INSERT INTO test (c1, c2) VALUES (1, 2);
INSERT INTO test (c1, c2) VALUES (1, DEFAULT);
INSERT INTO test (c1) VALUES (1);
```

其中第一条、第二条语句是一样的效果。在不指定目标列时，使用表中的列顺序来作为默认的目标列。
第三条、第四条语句表达的意思是一样的，使用`c2`列的默认值，来完成数据导入。

2. 向`test`表中一次性导入多行数据

```sql
INSERT INTO test VALUES (1, 2), (3, 2 + 2);
INSERT INTO test (c1, c2) VALUES (1, 2), (3, 2 * 2);
INSERT INTO test (c1) VALUES (1), (3);
INSERT INTO test (c1, c2) VALUES (1, DEFAULT), (3, DEFAULT);
```

其中第一条、第二条语句效果一样，向`test`表中一次性导入两条数据
第三条、第四条语句效果已知，使用`c2`列的默认值向`test`表中导入两条数据

3. 向 `test` 表中导入一个查询语句结果

```sql
INSERT INTO test SELECT * FROM test2;
INSERT INTO test (c1, c2) SELECT * from test2;
```

4. 向 `test` 表中导入一个查询语句结果，并指定 partition 和 label

```sql
INSERT INTO test PARTITION(p1, p2) WITH LABEL `label1` SELECT * FROM test2;
INSERT INTO test WITH LABEL `label1` (c1, c2) SELECT * from test2;
```


## 关键词

    INSERT

### 最佳实践

1. 查看返回结果

   INSERT 操作是一个同步操作，返回结果即表示操作结束。用户需要根据返回结果的不同，进行对应的处理。

   1. 执行成功，结果集为空

      如果 insert 对应 select 语句的结果集为空，则返回如下：

      ```sql
      mysql> insert into tbl1 select * from empty_tbl;
      Query OK, 0 rows affected (0.02 sec)
      ```

      `Query OK` 表示执行成功。`0 rows affected` 表示没有数据被导入。

   2. 执行成功，结果集不为空

      在结果集不为空的情况下。返回结果分为如下几种情况：

      1. Insert 执行成功并可见：

         ```sql
         mysql> insert into tbl1 select * from tbl2;
         Query OK, 4 rows affected (0.38 sec)
         {'label':'insert_8510c568-9eda-4173-9e36-6adc7d35291c', 'status':'visible', 'txnId':'4005'}
         
         mysql> insert into tbl1 with label my_label1 select * from tbl2;
         Query OK, 4 rows affected (0.38 sec)
         {'label':'my_label1', 'status':'visible', 'txnId':'4005'}
         
         mysql> insert into tbl1 select * from tbl2;
         Query OK, 2 rows affected, 2 warnings (0.31 sec)
         {'label':'insert_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'visible', 'txnId':'4005'}
         
         mysql> insert into tbl1 select * from tbl2;
         Query OK, 2 rows affected, 2 warnings (0.31 sec)
         {'label':'insert_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
         ```

         `Query OK` 表示执行成功。`4 rows affected` 表示总共有 4 行数据被导入。`2 warnings` 表示被过滤的行数。

         同时会返回一个 json 串：

         ```json
         {'label':'my_label1', 'status':'visible', 'txnId':'4005'}
         {'label':'insert_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
         {'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
         ```

         `label` 为用户指定的 label 或自动生成的 label。Label 是该 Insert Into 导入作业的标识。每个导入作业，都有一个在单 database 内部唯一的 Label。

         `status` 表示导入数据是否可见。如果可见，显示 `visible`，如果不可见，显示 `committed`。

         `txnId` 为这个 insert 对应的导入事务的 id。

         `err` 字段会显示一些其他非预期错误。

         当需要查看被过滤的行时，用户可以通过如下语句

         ```sql
         show load where label="xxx";
         ```

         返回结果中的 URL 可以用于查询错误的数据，具体见后面 **查看错误行** 小结。

         **数据不可见是一个临时状态，这批数据最终是一定可见的**

         可以通过如下语句查看这批数据的可见状态：

         ```sql
         show transaction where id=4005;
         ```

         返回结果中的 `TransactionStatus` 列如果为 `visible`，则表述数据可见。

   3. 执行失败

      执行失败表示没有任何数据被成功导入，并返回如下：

      ```sql
      mysql> insert into tbl1 select * from tbl2 where k1 = "a";
      ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=__shard_2/error_log_insert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
      ```

      其中 `ERROR 1064 (HY000): all partitions have no load data` 显示失败原因。后面的 url 可以用于查询错误的数据：

      ```sql
      show load warnings on "url";
      ```

      可以查看到具体错误行。

2. 超时时间

    
   INSERT 操作的超时时间由 [会话变量](../../../../advanced/variables.md) `insert_timeout` 控制。默认为 4 小时。超时则作业会被取消。

3. Label 和原子性

   INSERT 操作同样能够保证导入的原子性，可以参阅 [导入事务和原子性](../../../../data-operate/import/import-scenes/load-atomicity.md) 文档。

   当需要使用 `CTE(Common Table Expressions)` 作为 insert 操作中的查询部分时，必须指定 `WITH LABEL` 和 `column` 部分。

4. 过滤阈值

   与其他导入方式不同，INSERT 操作不能指定过滤阈值（`max_filter_ratio`）。默认的过滤阈值为 1，即素有错误行都可以被忽略。

   对于有要求数据不能够被过滤的业务场景，可以通过设置 [会话变量](../../../../advanced/variables.md) `enable_insert_strict` 为 `true` 来确保当有数据被过滤掉的时候，`INSERT` 不会被执行成功。

5. 性能问题

   不建议使用 `VALUES` 方式进行单行的插入。如果必须这样使用，请将多行数据合并到一个 INSERT 语句中进行批量提交。
        "broker.username"="user",
        "broker.password"="passwd",
        "broker.dfs.nameservices" = "my_ha",
        "broker.dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "broker.dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "broker.dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "broker.dfs.client.failover.proxy.provider" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );
    ```

   最终生成文件如如果不大于 1GB，则为：`result_0.csv`。
   如果大于 1GB，则可能为 `result_0.csv, result_1.csv, ...`。

4. 将 UNION 语句的查询结果导出到文件 `bos://bucket/result.txt`。指定导出格式为 PARQUET。使用 `my_broker` 并设置 hdfs 高可用信息。PARQUET 格式无需指定列分割符。
   导出完成后，生成一个标识文件。

    ```sql
    SELECT k1 FROM tbl1 UNION SELECT k2 FROM tbl1
    INTO OUTFILE "bos://bucket/result_"
    FORMAT AS PARQUET
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.bos_endpoint" = "http://bj.bcebos.com",
        "broker.bos_accesskey" = "xxxxxxxxxxxxxxxxxxxxxxxxxx",
        "broker.bos_secret_accesskey" = "yyyyyyyyyyyyyyyyyyyyyyyyyy"
    );
    ```

5. 将 select 语句的查询结果导出到文件 `s3a://${bucket_name}/path/result.txt`。指定导出格式为 csv。
   导出完成后，生成一个标识文件。

    ```sql
    select k1,k2,v1 from tbl1 limit 100000
    into outfile "s3a://my_bucket/export/my_file_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "hdfs_broker",
        "broker.fs.s3a.access.key" = "xxx",
        "broker.fs.s3a.secret.key" = "xxxx",
        "broker.fs.s3a.endpoint" = "https://cos.xxxxxx.myqcloud.com/",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "1024MB",
        "success_file_name" = "SUCCESS"
    )
    ```

   最终生成文件如如果不大于 1GB，则为：`my_file_0.csv`。
   如果大于 1GB，则可能为 `my_file_0.csv, result_1.csv, ...`。
   在 cos 上验证

        1. 不存在的 path 会自动创建
        2. access.key/secret.key/endpoint需要和cos的同学确认。尤其是endpoint的值，不需要填写bucket_name。

6. 使用 s3 协议导出到 bos，并且并发导出开启。

    ```sql
    set enable_parallel_outfile = true;
    select k1 from tb1 limit 1000
    into outfile "s3://my_bucket/export/my_file_"
    format as csv
    properties
    (
        "s3.endpoint" = "http://s3.bd.bcebos.com",
        "s3.access_key" = "xxxx",
        "s3.secret_key" = "xxx",
        "s3.region" = "bd"
    )
    ```

   最终生成的文件前缀为 `my_file_{fragment_instance_id}_`。

7. 使用 s3 协议导出到 bos，并且并发导出 session 变量开启。
   注意：但由于查询语句带了一个顶层的排序节点，所以这个查询即使开启并发导出的 session 变量，也是无法并发导出的。

    ```sql
    set enable_parallel_outfile = true;
    select k1 from tb1 order by k1 limit 1000
    into outfile "s3://my_bucket/export/my_file_"
    format as csv
    properties
    (
        "s3.endpoint" = "http://s3.bd.bcebos.com",
        "s3.access_key" = "xxxx",
        "s3.secret_key" = "xxx",
        "s3.region" = "bd"
    )
    ```

8. 使用 hdfs 方式导出，将简单查询结果导出到文件 `hdfs://${host}:${fileSystem_port}/path/to/result.txt`。指定导出格式为 CSV，用户名为 work。指定列分隔符为 `,`，行分隔符为 `\n`。

    ```sql
    -- fileSystem_port 默认值为 9000
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://${host}:${fileSystem_port}/path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
        "fs.defaultFS" = "hdfs://ip:port",
        "hadoop.username" = "work"
    );
    ```

   如果 Hadoop 集群开启高可用并且启用 Kerberos 认证，可以参考如下 SQL 语句：

    ```sql
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
    'fs.defaultFS'='hdfs://hacluster/',
    'dfs.nameservices'='hacluster',
    'dfs.ha.namenodes.hacluster'='n1,n2',
    'dfs.namenode.rpc-address.hacluster.n1'='192.168.0.1:8020',
    'dfs.namenode.rpc-address.hacluster.n2'='192.168.0.2:8020',
    'dfs.client.failover.proxy.provider.hacluster'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'dfs.namenode.kerberos.principal'='hadoop/_HOST@REALM.COM'
    'hadoop.security.authentication'='kerberos',
    'hadoop.kerberos.principal'='doris_test@REALM.COM',
    'hadoop.kerberos.keytab'='/path/to/doris_test.keytab'
    );
    ```

   最终生成文件如如果不大于 100MB，则为：`result_0.csv`。
   如果大于 100MB，则可能为 `result_0.csv, result_1.csv, ...`。

9. 将 select 语句的查询结果导出到腾讯云 cos 的文件 `cosn://${bucket_name}/path/result.txt`。指定导出格式为 csv。
   导出完成后，生成一个标识文件。

    ```sql
    select k1,k2,v1 from tbl1 limit 100000
    into outfile "cosn://my_bucket/export/my_file_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "broker_name",
        "broker.fs.cosn.userinfo.secretId" = "xxx",
        "broker.fs.cosn.userinfo.secretKey" = "xxxx",
        "broker.fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxx.myqcloud.com",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "1024MB",
        "success_file_name" = "SUCCESS"
    )
    ```

## 关键词
    SELECT, INTO, OUTFILE

### 最佳实践

1. 导出数据量和导出效率

   该功能本质上是执行一个 SQL 查询命令。最终的结果是单线程输出的。所以整个导出的耗时包括查询本身的耗时，和最终结果集写出的耗时。如果查询较大，需要设置会话变量 `query_timeout` 适当的延长查询超时时间。

2. 导出文件的管理

   Doris 不会管理导出的文件。包括导出成功的，或者导出失败后残留的文件，都需要用户自行处理。

3. 导出到本地文件

   导出到本地文件的功能不适用于公有云用户，仅适用于私有化部署的用户。并且默认用户对集群节点有完全的控制权限。Doris 对于用户填写的导出路径不会做合法性检查。如果 Doris 的进程用户对该路径无写权限，或路径不存在，则会报错。同时处于安全性考虑，如果该路径已存在同名的文件，则也会导出失败。

   Doris 不会管理导出到本地的文件，也不会检查磁盘空间等。这些文件需要用户自行管理，如清理等。

4. 结果完整性保证

   该命令是一个同步命令，因此有可能在执行过程中任务连接断开了，从而无法获悉导出的数据是否正常结束，或是否完整。此时可以使用 `success_file_name` 参数要求任务成功后，在目录下生成一个成功文件标识。用户可以通过这个文件，来判断导出是否正常结束。

5. 其他注意事项

    见[导出查询结果集](../../../data-operate/export/outfile.md)
