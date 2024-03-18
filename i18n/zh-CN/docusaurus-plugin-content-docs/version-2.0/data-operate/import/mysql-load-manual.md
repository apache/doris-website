---
{
    "title": "MySQL Load",
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

# MySql load
<version since="dev">

该语句兼容 MySQL 标准的 [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) 语法，方便用户导入本地数据，并降低学习成本。

MySql load 同步执行导入并返回导入结果。用户可直接通过 SQL 返回信息判断本次导入是否成功。

MySql load 主要适用于导入客户端本地文件，或通过程序导入数据流中的数据。

</version>

## 基本原理

MySql Load 和 Stream Load 功能相似，都是导入本地文件到 Doris 集群中，因此 MySQL Load 实现复用了 StreamLoad 的基础导入能力：

1. FE 接收到客户端执行的 MySQL Load 请求，完成 SQL 解析工作

2. FE 将 Load 请求拆解，并封装为 StreamLoad 的请求。

3. FE 选择一个 BE 节点发送 StreamLoad 请求

4. 发送请求的同时，FE 会异步且流式的从 MySQL 客户端读取本地文件数据，并实时的发送到 StreamLoad 的 HTTP 请求中。

5. MySQL 客户端数据传输完毕，FE 等待 StreamLoad 完成，并展示导入成功或者失败的信息给客户端。


## 支持数据格式

MySQL Load 支持数据格式：CSV（文本）。

## 基本操作举例

### 客户端连接
```bash
mysql --local-infile  -h 127.0.0.1 -P 9030 -u root -D testdb
```

注意：执行 MySQL Load 语句的时候，客户端命令必须带有`--local-infile`, 否则执行可能会出现错误。如果是通过 JDBC 方式连接的话，需要在 URL 中需要加入配置`allowLoadLocalInfile=true`


### 创建测试表
```sql
CREATE TABLE testdb.t1 (pk INT, v1 INT SUM) AGGREGATE KEY (pk) DISTRIBUTED BY hash (pk) PROPERTIES ('replication_num' = '1');
```

### 导入客户端文件
假设在客户端本地当前路径上有一个 CSV 文件，名为`client_local.csv`, 使用 MySQL LOAD 语法将表导入到测试表`testdb.t1`中。

```sql
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
PARTITION (partition_a, partition_b, partition_c, partition_d)
COLUMNS TERMINATED BY '\t'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(k1, k2, v2, v10, v11)
set (c1=k1,c2=k2,c3=v10,c4=v11)
PROPERTIES ("strict_mode"="true")
```
1. MySQL Load 以语法`LOAD DATA`开头，指定`LOCAL`表示读取客户端文件。
2. `INFILE`内填写本地文件路径，可以是相对路径，也可以是绝对路径。目前只支持单个文件，不支持多个文件
3. `INTO TABLE`的表名可以指定数据库名，如案例所示。也可以省略，则会使用当前用户所在的数据库。
4. `PARTITION`语法支持指定分区导入
5. `COLUMNS TERMINATED BY`指定列分隔符
6. `LINES TERMINATED BY`指定行分隔符
7. `IGNORE num LINES`用户跳过 CSV 的 num 表头。
8. 列映射语法，具体参数详见[导入的数据转换](../import-scenes/load-data-convert.md) 的列映射章节
9. `PROPERTIES`导入参数，具体参数详见[MySQL Load](../../../sql-manual/sql-reference/Data-Manipulation-Statements/Load/MYSQL-LOAD.md) 命令手册。

### 导入服务端文件
假设在 FE 节点上的`/root/server_local.csv`路径为一个 CSV 文件，使用 MySQL 客户端连接对应的 FE 节点，然后执行一下命令将数据导入到测试表中。

```sql
LOAD DATA
INFILE '/root/server_local.csv'
INTO TABLE testdb.t1
PARTITION (partition_a, partition_b, partition_c, partition_d)
COLUMNS TERMINATED BY '\t'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(k1, k2, v2, v10, v11)
set (c1=k1,c2=k2,c3=v10,c4=v11)
PROPERTIES ("strict_mode"="true")
```
1. 导入服务端本地文件的语法和导入客户端语法的唯一区别是`LOAD DATA`关键词后面是否加入`LOCAL`关键字。
2. FE 为多节点部署，导入服务端文件功能只能够导入客户端连接的 FE 节点，无法导入其他 FE 节点本地的文件。
3. 服务端导入默认是关闭，通过设置 FE 的配置`mysql_load_server_secure_path`开启，导入文件的必须在该目录下。

### 返回结果

由于 MySQL load 是一种同步的导入方式，所以导入的结果会通过 SQL 语法返回给用户。
如果导入执行失败，会展示具体的报错信息。如果导入成功，则会显示导入的行数。

```text
Query OK, 1 row affected (0.17 sec)
Records: 1  Deleted: 0  Skipped: 0  Warnings: 0
```

### 异常结果
如果执行出现异常，会在客户端中出现如下异常显示
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = [DATA_QUALITY_ERROR]too many filtered rows with load id b612907c-ccf4-4ac2-82fe-107ece655f0f
```

当遇到这类异常错误，可以找到其中的`loadId`, 可以通过`show load warnings`命令在客户端中展示详细的异常信息。
```sql
show load warnings where label='b612907c-ccf4-4ac2-82fe-107ece655f0f';
```

异常信息中的 LoadId 即为 Warning 命令中的 label 字段。


### 配置项
1. `mysql_load_thread_pool`控制单个 FE 中 MySQL Load 并发执行线程个数，默认为 4. 线程池的排队队列大小为`mysql_load_thread_pool`的 5 倍，因此默认情况下，可以并发提交的任务为 4 + 4\*5 = 24 个。如果并发个数超过 24 时，可以调大该配置项。
2. `mysql_load_server_secure_path`服务端导入的安全路径，默认为空，即不允许服务端导入。如需开启这个功能，建议在`DORIS_HOME`目录下创建一个`local_import_data`目录，用于导入数据。
3. `mysql_load_in_memory_record`失败的任务记录个数，该记录会保留在内存中，默认只会保留最近的 20. 如果有需要可以调大该配置。在内存中的记录，有效期为 1 天，异步清理线程会固定一天清理一次过期数据。


## 注意事项

1. 如果客户端出现`LOAD DATA LOCAL INFILE file request rejected due to restrictions on access`错误，需要用`mysql  --local-infile=1`命令来打开客户端的导入功能。

2. MySQL Load 的导入会受到 StreamLoad 的配置项限制，例如 BE 支持的 StreamLoad 最大文件量受`streaming_load_max_mb`控制，默认为 10GB.

## 更多帮助

1. 关于 MySQL Load 使用的更多详细语法及最佳实践，请参阅 [MySQL Load](../../../sql-manual/sql-reference/Data-Manipulation-Statements/Load/MYSQL-LOAD.md) 命令手册。

