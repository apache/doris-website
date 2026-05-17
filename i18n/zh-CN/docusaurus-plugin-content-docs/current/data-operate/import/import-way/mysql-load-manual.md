---
{
    "title": "MySQL Load",
    "language": "zh-CN",
    "description": "使用 MySQL 标准的 LOAD DATA 语法将本地 CSV 文件同步导入 Doris，适用于 10GB 以下文件，保证批次原子性。",
    "keywords": [
        "MySQL Load",
        "LOAD DATA",
        "本地文件导入",
        "CSV 导入",
        "Doris 同步导入",
        "local-infile",
        "allowLoadLocalInfile",
        "Stream Load"
    ]
}
---

<!-- 知识类型: 操作步骤 + 配置参数 -->
<!-- 适用场景: 客户端本地 CSV 文件导入 / 程序数据流导入 -->

Doris 兼容 MySQL 协议，可以使用 MySQL 标准的 [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) 语法导入本地文件。MySQL Load 是一种**同步导入方式**，执行导入后即返回导入结果，可以通过 LOAD DATA 语句的返回结果判断导入是否成功。

一般来说，可以使用 MySQL Load 导入 10GB 以下的文件。如果文件过大，建议先将文件进行切分后再使用 MySQL Load 进行导入。MySQL Load 可以保证一批导入任务的**原子性**，要么全部导入成功，要么全部导入失败。

## 使用场景

### 适用场景

MySQL Load 主要适用于以下场景：

- 导入客户端**本地 CSV 文件**到 Doris；
- 通过程序导入**数据流**中的数据。

### 使用限制

在导入 CSV 文件时，需要明确区分**空值（null）** 与**空字符串（''）**：

| 数据类型     | 表示方式 | 示例数据   | 说明                       |
| ------------ | -------- | ---------- | -------------------------- |
| 空值（null） | `\N`     | `a,\N,b`   | 中间列是一个空值（null）   |
| 空字符串     | 直接置空 | `a, ,b`    | 中间列是一个空字符串       |

## 基本原理

MySQL Load 与 Stream Load 功能相似，都是导入本地文件到 Doris 集群中。因此 MySQL Load 的实现复用了 Stream Load 的基本导入能力。

MySQL Load 的主要执行流程如下：

1. 用户向 FE 提交 LOAD DATA 请求，FE 完成解析工作，并将请求封装成 Stream Load；
2. FE 选择一个 BE 节点发送 Stream Load 请求；
3. 发送请求的同时，FE 异步且流式地从 MySQL 客户端读取本地文件数据，并实时发送到 Stream Load 的 HTTP 请求中；
4. MySQL 客户端数据传输完毕后，FE 等待 Stream Load 完成，并将导入成功或者失败的信息展示给客户端。

## 快速上手

### 前置检查

执行 MySQL Load 前，请确认满足以下条件：

- 当前用户对目标表具有 **INSERT 权限**。如果没有 INSERT 权限，可以通过 `GRANT` 命令给用户授权。

### 创建导入作业

按以下 4 步即可完成一次完整的 MySQL Load 导入。

#### 1. 准备测试数据

创建名为 `client_local.csv` 的文件，样例数据如下：

```sql
1,10
2,20
3,30
4,40
5,50
6,60
```

#### 2. 连接客户端

在执行 LOAD DATA 命令前，需要先连接 MySQL 客户端：

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```

:::caution
执行 MySQL Load 时，连接客户端必须使用指定参数选项：

1. 连接 MySQL 客户端时，必须使用 `--local-infile` 选项，否则可能会报错；
2. 通过 JDBC 连接时，需要在 URL 中指定配置 `allowLoadLocalInfile=true`。
:::

#### 3. 创建测试用表

在 Doris 中创建以下表：

```sql
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```

#### 4. 运行 LOAD DATA 导入命令

连接 MySQL Client 后，创建导入作业，命令如下：

```sql
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### 查看导入作业结果

MySQL Load 是一种同步导入方式，导入结果会在命令行中直接返回给用户。如果导入执行失败，会展示具体的报错信息。

**导入成功**时返回导入的行数：

```sql
Query OK, 6 row affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```

**导入异常**时，客户端显示相应异常：

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = [DATA_QUALITY_ERROR]too many filtered rows with load id b612907c-ccf4-4ac2-82fe-107ece655f0f
```

异常信息中包含本次导入的 `loadId`，可通过 `show load warnings` 命令查看具体信息：

```sql
show load warnings where label='b612907c-ccf4-4ac2-82fe-107ece655f0f';
```

### 取消导入作业

用户**无法手动取消** MySQL Load。MySQL Load 在超时或者导入错误后会被系统自动取消。

## 参考手册

### 导入语法

LOAD DATA 完整语法如下：

```SQL
LOAD DATA LOCAL
INFILE '<load_data_file>'
INTO TABLE [<db_name>.]<table_name>
[PARTITION (partition_name [, partition_name] ...)]
[COLUMNS TERMINATED BY '<column_terminated_operator>']
[LINES TERMINATED BY '<line_terminated_operator>']
[IGNORE <ignore_lines> LINES]
[(col_name_or_user_var[, col_name_or_user_var] ...)]
[SET col_name={expr | DEFAULT}[, col_name={expr | DEFAULT}] ...]
[PROPERTIES (key1 = value1 [, key2=value2]) ]
```

各模块说明如下：

| 模块                  | 说明                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| INFILE                | 指定本地文件路径，可以是相对路径，也可以是绝对路径。目前 `load_data_file` 只支持单个文件导入。                |
| INTO TABLE            | 指定数据库名与表名，可以省略数据库名。                                                                        |
| PARTITION             | 指定导入的分区。如果用户能够确定数据对应的 partition，推荐指定该项。不满足这些分区的数据将被过滤掉。          |
| COLUMNS TERMINATED BY | 指定导入的列分隔符。                                                                                          |
| LINE TERMINATED BY    | 指定导入的行分隔符。                                                                                          |
| IGNORE num LINES      | 指定导入的 CSV 跳过行数，通常指定 1 来跳过表头。                                                              |
| col_name_or_user_var  | 指定列映射语法，数据转换详见 [列映射](../../../data-operate/import/load-data-convert#列映射) 章节。           |
| PROPERTIES            | 导入参数。                                                                                                    |

### 导入参数

通过 `PROPERTIES (key1 = value1 [, key2=value2])` 语法可以指定导入的参数配置：

| 参数               | 说明                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| max_filter_ratio   | 允许的最大过滤率。必须在大于等于 0 到小于等于 1 之间。默认值是 0，表示不容忍任何错误行。                                                                                                                      |
| timeout            | 指定导入的超时时间，单位秒。默认是 600 秒。可设置范围为 1s ~ 259200s。                                                                                                                                        |
| strict_mode        | 用户指定此次导入是否开启严格模式，默认为关闭。                                                                                                                                                                |
| timezone           | 指定本次导入所使用的时区。默认为集群当前时区。该参数会影响所有导入涉及的和时区有关的函数结果。                                                                                                                |
| exec_mem_limit     | 导入内存限制。默认为 2GB。单位为字节。                                                                                                                                                                        |
| trim_double_quotes | 布尔类型，默认值为 false，为 true 时表示裁剪掉导入文件每个字段最外层的双引号。                                                                                                                                |
| enclose            | 指定包围符。当 CSV 数据字段中含有行分隔符或列分隔符时，为防止意外截断，可指定单字节字符作为包围符起到保护作用。例如列分隔符为 `,`，包围符为 `'`，数据为 `a,'b,c'`，则 `b,c` 会被解析为一个字段。              |
| escape             | 指定转义符。用于转义在字段中出现的与包围符相同的字符。例如数据为 `a,'b,'c'`，包围符为 `'`，希望 `b,'c` 被作为一个字段解析，则需要指定单字节转义符，例如 `\`，将数据修改为 `a,'b,\'c'`。                       |

## 导入举例

下文按典型场景给出常用导入示例。

### 指定导入超时时间

通过 PROPERTIES 参数 `timeout` 可以调整导入超时时间。以下案例将超时时间设置为 100s：

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timeout"="100");
```

### 指定导入允许误差率

通过 PROPERTIES 参数 `max_filter_ratio` 可以调整导入容错率。以下案例将错误容忍率设置为 20%：

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("max_filter_ratio"="0.2");
```

### 映射导入列

以下案例调整了 CSV 中列的顺序：

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
(k2, k1, v1);
```

### 指定导入列分隔符与行分隔符

通过 `COLUMNS TERMINATED BY` 与 `LINES TERMINATED BY` 子句可以指定导入的列与行分隔符。以下案例使用逗号（`,`）与换行符（`\n`）作为列与行分隔符：

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### 指定导入分区

通过 `PARTITION` 子句可以指定导入分区。以下案例将数据导入指定分区 `p1` 与 `p2`，如果数据不属于 `p1` 与 `p2` 分区，会被过滤掉：

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PARTITION (p1, p2);
```

### 指定导入时区

通过 PROPERTIES 参数 `timezone` 可以指定时区。以下案例设置时区为 `Africa/Abidjan`：

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timezone"="Africa/Abidjan");
```

### 限制导入内存

通过 PROPERTIES 参数 `exec_mem_limit` 可以指定导入的内存限制。以下案例设置导入的内存限制为 10G：

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("exec_mem_limit"="10737418240");
```

## 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->

### Q1：执行 LOAD DATA 时报错 `The used command is not allowed with this MySQL version`，怎么办？

该错误通常是因为客户端未启用 `local-infile` 选项。请按以下方式处理：

- 命令行连接：连接时显式添加 `--local-infile` 参数；
- JDBC 连接：在 URL 中追加 `allowLoadLocalInfile=true` 参数。

### Q2：MySQL Load 支持导入多大的文件？

建议导入 **10GB 以下**的文件。如果文件过大，建议先将文件进行切分后再使用 MySQL Load 进行导入。

### Q3：MySQL Load 是否支持手动取消？

**不支持**。MySQL Load 在超时或者导入错误后会被系统自动取消。

### Q4：导入失败后如何查看具体错误原因？

从异常信息中获取 `loadId`，再执行以下命令查看详细错误信息：

```sql
show load warnings where label='<loadId>';
```

### Q5：CSV 中如何区分空值与空字符串？

- 空值（null）：使用 `\N` 表示，例如 `a,\N,b`；
- 空字符串：直接置空，例如 `a, ,b`。

### Q6：导入是否保证原子性？

是。MySQL Load 可以保证一批导入任务的原子性，要么全部导入成功，要么全部导入失败。

## 更多帮助

关于 MySQL Load 使用的更多详细语法及最佳实践，请参阅 [MySQL Load](../../../sql-manual/sql-statements/data-modification/load-and-export/MYSQL-LOAD) 命令手册。
