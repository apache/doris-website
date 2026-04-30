---
{
    "title": "Redshift",
    "language": "zh-CN",
    "description": "通过 Redshift UNLOAD 导出至 S3，再使用 Doris S3 Load 完成迁移，含建表、数据类型映射、错误处理与批量导入。",
    "keywords": [
        "Redshift 迁移 Doris",
        "Redshift UNLOAD",
        "S3 Load",
        "Redshift 数据类型映射",
        "Doris 数据导入",
        "Parquet 导入",
        "ETL_QUALITY_UNSATISFIED"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据迁移 / Redshift 到 Doris -->

在迁移 Redshift 数据到 Apache Doris 的过程中，通常需要借助对象存储（如 Amazon S3）作为中间媒介。整体迁移流程如下：

1. 在 Doris 中根据源表结构创建目标表。
2. 通过 Redshift 的 [UNLOAD](https://docs.aws.amazon.com/zh_cn/redshift/latest/dg/r_UNLOAD.html) 语句，将数据导出到对象存储。
3. 利用 Doris 的 S3 Load 功能从对象存储读取数据并导入 Doris，详细可参考 [S3 导入](./amazon-s3.md)。

## 注意事项

在执行迁移前，请关注以下要点：

- **建模与分区策略**：根据 Redshift 源表结构选择合适的 Doris [数据模型](../../../table-design/data-model/intro.mdx)，并制定[分区](../../../table-design/data-partitioning/dynamic-partitioning.md)与[分桶](../../../table-design/data-partitioning/data-bucketing.md)策略。更多建表建议见[导入最佳实践](../load-best-practices/load-best-practices.md)。
- **类型转换**：Redshift 导出 `TIME` 类型时，需要先 `CAST` 成 `VARCHAR` 类型再导出。
- **复杂类型限制**：含有复杂类型（Struct/Array/Map）的 Parquet/ORC 格式文件，目前必须使用 [TVF 导入](./amazon-s3.md#load-with-tvf)。

## 数据类型映射

<!-- 知识类型: 配置参数 -->

迁移前请按下表完成 Redshift 到 Doris 的数据类型对应：

| Redshift         | Doris          | 备注                   |
| ---------------- | -------------- | ---------------------- |
| SMALLINT         | SMALLINT       |                        |
| INTEGER          | INT            |                        |
| BIGINT           | BIGINT         |                        |
| DECIMAL          | DECIMAL        |                        |
| REAL             | FLOAT          |                        |
| DOUBLE PRECISION | DOUBLE         |                        |
| BOOLEAN          | BOOLEAN        |                        |
| CHAR             | CHAR           |                        |
| VARCHAR          | VARCHAR/STRING | VARCHAR 长度最大 65535 |
| DATE             | DATE           |                        |
| TIMESTAMP        | DATETIME       |                        |
| TIME/TIMEZ       | STRING         |                        |
| SUPER            | VARIANT        |                        |
| OTHER            | UNSUPPORTED    |                        |

## 迁移步骤

### 1. 创建 Doris 表

<!-- 知识类型: 操作步骤 -->

在迁移前，需要先在 Doris 中创建对应的目标表。

**目的**：基于 Redshift 源表结构，规划 Doris 的数据模型、分区与分桶策略。

**Redshift 源表示例**：

```SQL
CREATE TABLE sales_data (
    order_id      INTEGER,
    customer_name VARCHAR(128),
    order_date    DATE,
    amount        DECIMAL(10,2),
    country       VARCHAR(48)
)
DISTSTYLE AUTO

INSERT INTO sales_data VALUES
(1, 'Alice', '2025-04-08', 99.99, 'USA'),
(2, 'Bob', '2025-04-08', 149.50, 'Canada'),
(3, 'Charlie', '2025-04-09', 75.00, 'UK'),
(4, 'Diana', '2025-04-10', 200.00, 'Australia');
```

**Doris 目标表示例**：根据上述结构创建主键分区表，以 `order_date` 作为分区字段，按天分区：

```sql
CREATE TABLE `sales_data` (
  order_id      INT,
  order_date    DATE NOT NULL,
  customer_name VARCHAR(128),
  amount        DECIMAL(10,2),
  country       VARCHAR(48)
) ENGINE=OLAP
UNIQUE KEY(`order_id`,`order_date`)
PARTITION BY RANGE(`order_date`) (
PARTITION p20250408 VALUES [('2025-04-08'), ('2025-04-09')),
PARTITION p20250409 VALUES [('2025-04-09'), ('2025-04-10')),
PARTITION p20250410 VALUES [('2025-04-10'), ('2025-04-11'))
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 16
PROPERTIES (
 "dynamic_partition.enable" = "true",
 "dynamic_partition.time_unit" = "DAY",
 "dynamic_partition.end" = "5",
 "dynamic_partition.prefix" = "p",
 "dynamic_partition.buckets" = "16",
 "replication_num" = "1"
);
```

### 2. 从 Redshift 导出数据到 S3

<!-- 知识类型: 操作步骤 -->

#### 2.1 使用 UNLOAD 导出为 Parquet

**目的**：将 Redshift 数据按 Doris 分区字段导出为 Parquet 文件，便于后续按分区导入。

**命令**：

```sql
unload ('select * from sales_data')
to 's3://mybucket/redshift/sales_data/'
iam_role 'arn:aws:iam::0123456789012:role/MyRedshiftRole'
PARQUET
PARTITION BY (order_date) INCLUDE
```

**说明**：建议导出时使用与 Doris 一致的 Partition 字段，便于按分区批量导入。

#### 2.2 验证 S3 上的导出文件

导出后，S3 会按分区生成子目录，每个目录对应一个分区的数据：

![redshift_out](/images/data-operate/redshift_out.png)

![redshift_out2](/images/data-operate/redshift_out2.png)

### 3. 将数据导入到 Doris

<!-- 知识类型: 操作步骤 -->

导入采用 **S3 Load**：这是一种异步的数据导入方式，执行后 Doris 会主动从数据源拉取数据。数据源支持兼容 S3 协议的对象存储，包括 [AWS S3](./amazon-s3.md)、[GCS](./google-cloud-storage.md)、[AZURE](./azure-storage.md) 等。

适用场景对比：

| 场景                                 | 推荐方式                                       |
| ------------------------------------ | ---------------------------------------------- |
| 数据量大、可后台异步处理             | S3 Load                                        |
| 需要同步处理的数据导入               | [TVF 导入](./amazon-s3.md#load-with-tvf)       |
| 含复杂类型（Struct/Array/Map）文件   | 必须使用 [TVF 导入](./amazon-s3.md#load-with-tvf) |

#### 3.1 导入单个分区数据

```sql
LOAD LABEL sales_data_2025_04_08
(
    DATA INFILE("s3://mybucket/redshift/sales_data/order_date=2025-04-08/*")
    INTO TABLE sales_data
    FORMAT AS "parquet"
    (order_id, order_date, customer_name, amount, country)
)
WITH S3
(
    "provider" = "S3",
    "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
    "s3.access_key" = "<ak>",
    "s3.secret_key"="<sk>",
    "s3.region" = "ap-southeast-1"
);
```

#### 3.2 通过 SHOW LOAD 查看任务状态

由于 S3 Load 为异步提交，可通过 `SHOW LOAD` 按 label 查询导入进度：

```yaml
mysql> show load where label = "label_sales_data_2025_04_08"\G
*************************** 1. row ***************************
         JobId: 17956078
         Label: label_sales_data_2025_04_08
         State: FINISHED
      Progress: 100.00% (1/1)
          Type: BROKER
       EtlInfo: unselected.rows=0; dpp.abnorm.ALL=0; dpp.norm.ALL=2
      TaskInfo: cluster:s3.ap-southeast-1.amazonaws.com; timeout(s):3600; max_filter_ratio:0.0; priority:NORMAL
      ErrorMsg: NULL
    CreateTime: 2025-04-10 17:50:53
  EtlStartTime: 2025-04-10 17:50:54
 EtlFinishTime: 2025-04-10 17:50:54
 LoadStartTime: 2025-04-10 17:50:54
LoadFinishTime: 2025-04-10 17:50:54
           URL: NULL
    JobDetails: {"Unfinished backends":{"5eec1be8612d4872-91040ff1e7208a4f":[]},"ScannedRows":2,"TaskNumber":1,"LoadBytes":91,"All backends":{"5eec1be8612d4872-91040ff1e7208a4f":[10022]},"FileNumber":1,"FileSize":1620}
 TransactionId: 766228
  ErrorTablets: {}
          User: root
       Comment: 
1 row in set (0.00 sec)
```

#### 3.3 处理导入过程中的错误

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 故障排查 / 数据质量错误 -->

**步骤 1**：查询失败的导入任务。当批量导入存在多个任务时，可以通过以下语句过滤失败任务的标签和原因：

```SQL
mysql> show load where state='CANCELLED' and label like "label_test%"\G
*************************** 1. row ***************************
         JobId: 18312384
         Label: label_test123
         State: CANCELLED
      Progress: 100.00% (3/3)
          Type: BROKER
       EtlInfo: unselected.rows=0; dpp.abnorm.ALL=4; dpp.norm.ALL=0
      TaskInfo: cluster:s3.ap-southeast-1.amazonaws.com; timeout(s):14400; max_filter_ratio:0.0; priority:NORMAL
      ErrorMsg: type:ETL_QUALITY_UNSATISFIED; msg:quality not good enough to cancel
    CreateTime: 2025-04-15 17:32:59
  EtlStartTime: 2025-04-15 17:33:02
 EtlFinishTime: 2025-04-15 17:33:02
 LoadStartTime: 2025-04-15 17:33:02
LoadFinishTime: 2025-04-15 17:33:02
           URL: http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342
    JobDetails: {"Unfinished backends":{"7602ccd7c3a4854-95307efca7bfe341":[]},"ScannedRows":4,"TaskNumber":1,"LoadBytes":188,"All backends":{"7602ccd7c3a4854-95307efca7bfe341":[10022]},"FileNumber":3,"FileSize":4839}
 TransactionId: 769213
  ErrorTablets: {}
          User: root
       Comment: 
```

**步骤 2**：解读错误类型。上例为**数据质量错误**（`ETL_QUALITY_UNSATISFIED`），需通过返回的 `URL` 链接查看具体错误。例如下方错误说明数据超过了 Schema 中 `country` 列的实际长度：

```python
[root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual length: 3; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual length: 6; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual length: 2; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1; actual length: 9; . src line [];
```

**步骤 3**：设置容错率（可选）。如果允许跳过部分错误数据，可以在 S3 Load 的 `PROPERTIES` 中设置容错率，详见[导入配置参数](https://doris.apache.org/zh-CN/docs/dev/data-operate/import/import-way/broker-load-manual#导入配置参数)。

#### 3.4 批量导入多个分区

迁移大数据量的存量数据时，建议按以下原则分批导入：

- 每批数据对应 Doris 的一个分区或少量几个分区。
- 单批数据量建议不超过 **100 GB**，以减轻系统压力并降低导入失败后的重试成本。
- 可参考脚本 [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh)，该脚本可轮询 S3 上的分区目录，并自动提交 S3 Load 任务到 Doris，实现批量导入。

## 常见问题

<!-- 知识类型: FAQ -->

**Q1：为什么 Redshift 的 TIME 类型不能直接导入 Doris？**

Doris 不支持 `TIME` 类型，因此 Redshift 在导出 `TIME/TIMEZ` 类型时，需要使用 `CAST` 转换为 `VARCHAR` 后再导出，并在 Doris 中使用 `STRING` 类型存储。

**Q2：含有 Struct/Array/Map 等复杂类型的 Parquet/ORC 文件可以用 S3 Load 吗？**

不可以。当前必须使用 [TVF 导入](./amazon-s3.md#load-with-tvf) 处理含复杂类型的文件。

**Q3：S3 Load 是同步还是异步导入？如何查询执行结果？**

S3 Load 是**异步**导入方式，提交后通过 `SHOW LOAD WHERE label = "<your_label>"` 查询执行进度与结果。

**Q4：报错 `ETL_QUALITY_UNSATISFIED` 应如何处理？**

该错误表示数据质量不达标。处理方式：

1. 通过 `SHOW LOAD` 输出中的 `URL` 链接获取详细错误日志；
2. 根据错误日志（如字段长度溢出、类型不匹配）调整 Doris 表结构或源数据；
3. 若可容忍部分错误数据，可在 S3 Load 的 `PROPERTIES` 中调整 `max_filter_ratio` 容错率。

**Q5：迁移大数据量时如何避免一次性导入失败？**

建议按 Doris 分区进行分批导入，每批数据控制在 100 GB 以内，并使用 [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh) 脚本实现自动化批量提交。
