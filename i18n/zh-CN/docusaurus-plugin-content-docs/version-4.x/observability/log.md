---
{
    "title": "Log",
    "language": "zh-CN",
    "description": "本文介绍可观测性核心数据之一 Log 的存储和分析实践，可观测性整体方案介绍请参考概述。"
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

本文介绍可观测性核心数据之一 Log 的存储和分析实践，可观测性整体方案介绍请参考[概述](overview)。

## 第 1 步：评估资源

在部署集群之前，首先应评估所需服务器硬件资源，包括以下几个关键步骤：

1.  **评估写入资源**：计算公式如下：

  - `平均写入吞吐 = 日增数据量 / 86400 s`
  - `峰值写入吞吐 = 平均写入吞吐 * 写入吞吐峰值 / 均值比`
  - `峰值写入所需 CPU 核数 = 峰值写入吞吐 / 单核写入吞吐`

2. **评估存储资源**：计算公式为 `所需存储空间 = 日增数据量 / 压缩率 * 副本数 * 数据存储周期`

3. **评估查询资源**：查询的资源消耗随查询量和复杂度而异，建议初始预留 50% 的 CPU 资源用于查询，再根据实际测试情况进行调整。

4. **汇总整合资源**：由第 1 步和第 3 步估算出所需 CPU 核数后，除以单机 CPU 核数，估算出 BE 服务器数量，再根据 BE 服务器数量和第 2 步的结果，估算出每台 BE 服务器所需存储空间，然后分摊到 4～12 块数据盘，计算出单盘存储容量。

以每天新增 100 TB 数据量（压缩前）、5 倍压缩率、2 副本、热数据存储 3 天、冷数据存储 30 天、写入吞吐峰值 / 均值比 200%、单核写入吞吐 10 MB/s、查询预留 50% CPU 资源为例，可估算出：

**存算一体模式**
- FE：3 台服务器，每台配置 16 核 CPU、64 GB 内存、1 块 100 GB SSD 盘
- BE：30 台服务器，每台配置 32 核 CPU、256 GB 内存、8 块 625 GB SSD 盘
- S3 对象存储空间：即为预估冷数据存储空间，540 TB

**存算分离模式**
- FE：3 台服务器，每台配置 16 核 CPU、64 GB 内存、1 块 100 GB SSD 盘
- BE：15 台服务器，每台配置 32 核 CPU、256 GB 内存、8 块 680 GB SSD 盘
- S3 对象存储空间：即为预估冷数据存储空间，600 TB

使用存算分离模式，写入和热数据存储只需要 1 副本，能够显著降低成本。

该例子中，各关键指标的值及具体计算方法可见下表：

| 关键指标（单位）                 | 存算分离模式 | 存算一体模式    | 说明                                                         |
| :------------------------------- | :---- | :---- | :----------------------------------------------------------- |
| 日增数据量（TB）                 | 100   | 100 | 根据实际需求填写                                             |
| 压缩率                           | 5     | 5 | 一般为 5～10 倍（含索引），默认为 5，根据实际需求填写                  |
| 副本数                        | 1     | 2 | 根据实际需求填写，默认 1 副本，可选值：1，2，3               |
| 热数据存储周期（天）            | 3     | 3 | 根据实际需求填写                                             |
| 冷数据存储周期（天）            | 30    | 27 | 根据实际需求填写                                             |
| 总存储周期（天）                | 30    | 30 | 算法：`热数据存储周期 + 冷数据存储周期`                      |
| 预估热数据存储空间（TB）         | 60  | 120 | 算法：`日增数据量 / 压缩率 * 副本数 * 热数据存储周期`        |
| 预估冷数据存储空间（TB）         | 600 | 540 | 算法：`日增数据量 / 压缩率 * 副本数 * 冷数据存储周期`        |
| 写入吞吐峰值 / 均值比           | 200%  | 200% | 根据实际需求填写，默认 200%                                  |
| 单机 CPU 核数                 | 32    | 32 | 根据实际需求填写，默认 32 核                                 |
| 平均写入吞吐（MB/s）           | 1214  | 2427 | 算法：`日增数据量 / 86400 s`                                 |
| 峰值写入吞吐（MB/s）           | 2427  | 4855 | 算法：`平均写入吞吐 * 写入吞吐峰值 / 均值比`                 |
| 峰值写入所需 CPU 核数          | 242.7 | 485.5 | 算法：`峰值写入吞吐 / 单核写入吞吐`                          |
| 查询预留 CPU 百分比            | 50%   | 50% | 根据实际需求填写，默认 50%                                   |
| 预估 BE 服务器数              | 15.2  | 30.3 | 算法：`峰值写入所需 CPU 核数 / 单机 CPU 核数 /（1 - 查询预留 CPU 百分比）` |
| 预估 BE 服务器数取整           | 15    | 30 | 算法：`MAX (副本数，预估 BE 服务器数取整)`                   |
| 预估每台 BE 服务器存储空间（TB） | 5.33  | 5.33 | 算法：`预估热数据存储空间 / 预估 BE 服务器数 /（1 - 30%）`，其中，30% 是存储空间预留值。建议每台 BE 服务器挂载 4～12 块数据盘，以提高 I/O 能力。 |

## 第 2 步：部署集群

完成资源评估后，可以开始部署 Apache Doris 集群，推荐在物理机及虚拟机环境中进行部署。手动部署集群，可参考 [手动部署](../install/deploy-manually/integrated-storage-compute-deploy-manually)。

## 第 3 步：优化 FE 和 BE 配置

完成集群部署后，需分别优化 FE 和 BE 配置参数，以更加契合日志存储与分析的场景。

**优化 FE 配置**

在 `fe/conf/fe.conf` 目录下找到 FE 的相关配置项，并按照以下表格，调整 FE 配置。

| 需调整参数                                                   | 说明                                                         |
| :----------------------------------------------------------- | :----------------------------------------------------------- |
| `max_running_txn_num_per_db = 10000`                         | 高并发导入运行事务数较多，需调高参数。                       |
| `streaming_label_keep_max_second = 3600` `label_keep_max_second = 7200` | 高频导入事务标签内存占用多，保留时间调短。                   |
| `enable_round_robin_create_tablet = true`                    | 创建 Tablet 时，采用 Round Robin 策略，尽量均匀。            |
| `tablet_rebalancer_type = partition`                         | 均衡 Tablet 时，采用每个分区内尽量均匀的策略。               |
| `autobucket_min_buckets = 10`                                | 将自动分桶的最小分桶数从 1 调大到 10，避免日志量增加时分桶不够。 |
| `max_backend_heartbeat_failure_tolerance_count = 10`         | 日志场景下 BE 服务器压力较大，可能短时间心跳超时，因此将容忍次数从 1 调大到 10。 |

更多关于 FE 配置项的信息，可参考 [FE 配置项](../admin-manual/config/fe-config)。

**优化 BE 配置**

在 `be/conf/be.conf` 目录下找到 BE 的相关配置项，并按照以下表格，调整 BE 配置。

| 模块       | 需调整参数                                                   | 说明                                                         |
| :--------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| 存储       | `storage_root_path = /path/to/dir1;/path/to/dir2;...;/path/to/dir12` | 配置热数据在磁盘目录上的存储路径。                           |
| -          | `enable_file_cache = true`                                   | 开启文件缓存。                                               |
| -          | `file_cache_path = [{"path": "/mnt/datadisk0/file_cache", "total_size":53687091200, "query_limit": "10737418240"},{"path": "/mnt/datadisk1/file_cache", "total_size":53687091200,"query_limit": "10737418240"}]` | 配置冷数据的缓存路径和相关设置，具体配置说明如下：<br />`path`：缓存路径<br />`total_size`：该缓存路径的总大小，单位为字节，53687091200 字节等于 50 GB<br />`query_limit`：单次查询可以从缓存路径中查询的最大数据量，单位为字节，10737418240 字节等于 10 GB |
| 写入       | `write_buffer_size = 1073741824`                             | 增加写入缓冲区（buffer）的文件大小，减少小文件和随机 I/O 操作，提升性能。 |
| -          | `max_tablet_version_num = 20000`                             | 配合建表的 time_series compaction 策略，允许更多版本暂时未合并。 |
| Compaction | `max_cumu_compaction_threads = 8`                            | 设置为 CPU 核数 / 4，意味着 CPU 资源的 1/4 用于写入，1/4 用于后台 Compaction，2/1 留给查询和其他操作。 |
| -          | `inverted_index_compaction_enable = true`                    | 开启索引合并（index compaction），减少 Compaction 时的 CPU 消耗。 |
| -          | `enable_segcompaction = false` `enable_ordered_data_compaction = false` | 关闭日志场景不需要的两个 Compaction 功能。                   |
| -          | `enable_compaction_priority_scheduling = false` | 低优先级 compaction 在一块盘上限制 2 个任务，会影响 compaction 速度。 |
| -          | `total_permits_for_compaction_score = 200000 ` | 该参数用来控制内存，time series 策略下本身可以控制内存。 |
| 缓存       | `disable_storage_page_cache = true` `inverted_index_searcher_cache_limit = 30%` | 因为日志数据量较大，缓存（cache）作用有限，因此关闭数据缓存，调换为索引缓存（index cache）的方式。 |
| -          | `inverted_index_cache_stale_sweep_time_sec = 3600` `index_cache_entry_stay_time_after_lookup_s = 3600` | 让索引缓存在内存中尽量保留 1 小时。                          |
| -          | `enable_inverted_index_cache_on_cooldown = true` <br />`enable_write_index_searcher_cache = false` | 开启索引上传冷数据存储时自动缓存的功能。                     |
| -          | `tablet_schema_cache_recycle_interval = 3600` `segment_cache_capacity = 20000` | 减少其他缓存对内存的占用。                                   |
| -          | `inverted_index_ram_dir_enable = true` | 减少写入时索引临时文件带来的 IO 开销。|
| 线程       | `pipeline_executor_size = 24` `doris_scanner_thread_pool_thread_num = 48` | 32 核 CPU 的计算线程和 I/O 线程配置，根据核数等比扩缩。      |
| -          | `scan_thread_nice_value = 5`                                 | 降低查询 I/O 线程的优先级，保证写入性能和时效性。            |
| 其他       | `string_type_length_soft_limit_bytes = 10485760`             | 将 String 类型数据的长度限制调高至 10 MB。                   |
| -          | `trash_file_expire_time_sec = 300` `path_gc_check_interval_second  = 900` `path_scan_interval_second = 900` | 调快垃圾文件的回收时间。                                     |

更多关于 BE 配置项的信息，可参考 [BE 配置项](../admin-manual/config/be-config)。

## 第 4 步：建表

由于日志数据的写入和查询都具备明显的特征，因此，在建表时按照本节说明进行针对性配置，以提升性能表现。

**配置分区分桶参数**

分区按照以下说明配置：
- 使用时间字段上的 [Range 分区](../table-design/data-partitioning/manual-partitioning.md#range-分区) (`PARTITION BY RANGE(`ts`)`)，并开启 [动态分区](../table-design/data-partitioning/dynamic-partitioning) (`"dynamic_partition.enable" = "true"`)，按天自动管理分区。
- 使用 Datetime 类型的时间字段作为排序 Key (`DUPLICATE KEY(ts)`)，在查询最新 N 条日志时有数倍加速。

分桶按照以下说明配置：
- 分桶数量大致为集群磁盘总数的 3 倍，每个桶的数据量压缩后 5GB 左右。
- 使用 Random 策略 (`DISTRIBUTED BY RANDOM BUCKETS 60`)，配合写入时的 Single Tablet 导入，可以提升批量（Batch）写入的效率。

更多关于分区分桶的信息，可参考 [数据划分](../table-design/data-partitioning/data-distribution)。

**配置压缩参数**
- 使用 zstd 压缩算法 (`"compression" = "zstd"`), 提高数据压缩率。

**配置 Compaction 参数**

按照以下说明配置 Compaction 参数：

- 使用 time_series 策略 (`"compaction_policy" = "time_series"`)，以减轻写放大效应，对于高吞吐日志写入的资源写入很重要。

**配置索引参数**

按照以下说明操作：
- 对经常查询的字段建索引 (`USING INVERTED`)。
- 对需要全文检索的字段，将分词器（parser）参数赋值为 unicode，一般能满足大部分需求。如有支持短语查询的需求，将 support_phrase 参数赋值为 true；如不需要，则设置为 false，以降低存储空间。

**配置存储策略**

按照以下说明操作：

- 对于热存储数据，如果使用云盘，可配置 1 副本；如果使用物理盘，则至少配置 2 副本 (`"replication_num" = "2"`)。
- 配置 `log_s3` 的存储位置 (`CREATE RESOURCE "log_s3"`)，并设置 `log_policy_3day` 冷热数据分层策略 (`CREATE STORAGE POLICY log_policy_3day`)，即在超过 3 天后将数据冷却至 `log_s3` 指定的存储位置。可参考以下 SQL：

```sql
CREATE DATABASE log_db;
USE log_db;

-- 存算分离模式不需要
CREATE RESOURCE "log_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "your_endpoint_url",
    "s3.region" = "your_region",
    "s3.bucket" = "your_bucket",
    "s3.root.path" = "your_path",
    "s3.access_key" = "your_ak",
    "s3.secret_key" = "your_sk"
);

-- 存算分离模式不需要
CREATE STORAGE POLICY log_policy_3day
PROPERTIES(
    "storage_resource" = "log_s3",
    "cooldown_ttl" = "259200"
);

CREATE TABLE log_table
(
  `ts` DATETIME,
  `host` TEXT,
  `path` TEXT,
  `message` TEXT,
  INDEX idx_host (`host`) USING INVERTED,
  INDEX idx_path (`path`) USING INVERTED,
  INDEX idx_message (`message`) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true")
)
ENGINE = OLAP
DUPLICATE KEY(`ts`)
PARTITION BY RANGE(`ts`) ()
DISTRIBUTED BY RANDOM BUCKETS 60
PROPERTIES (
  "compression" = "zstd",
  "compaction_policy" = "time_series",
  "dynamic_partition.enable" = "true",
  "dynamic_partition.create_history_partition" = "true",
  "dynamic_partition.time_unit" = "DAY",
  "dynamic_partition.start" = "-30",
  "dynamic_partition.end" = "1",
  "dynamic_partition.prefix" = "p",
  "dynamic_partition.buckets" = "60",
  "dynamic_partition.replication_num" = "2", -- 存算分离不需要
  "replication_num" = "2", -- 存算分离不需要
  "storage_policy" = "log_policy_3day" -- 存算分离不需要
);
```

## 第 5 步：采集日志

完成建表后，可进行日志采集。

Apache Doris 提供开放、通用的 Stream HTTP APIs，通过这些 APIs，你可与常用的日志采集器打通，包括 Logstash、Filebeat、Kafka 等，从而开展日志采集工作。本节介绍了如何使用 Stream HTTP APIs 对接日志采集器。

**对接 Logstash**

按照以下步骤操作：

1. 下载并安装 Logstash Doris Output 插件。你可选择以下两种方式之一：

- 直接下载：[点此下载](https://apache-doris-releases.oss-accelerate.aliyuncs.com/extension/logstash-output-doris-1.2.0.gem)。
  
- 从源码编译，并运行下方命令安装：

```sql
./bin/logstash-plugin install logstash-output-doris-1.2.0.gem
```

2. 配置 Logstash。需配置以下参数：

- `logstash.yml`：配置 Logstash 批处理日志的条数和时间，用于提升数据写入性能。

```sql
pipeline.batch.size: 1000000  
pipeline.batch.delay: 10000
```


- `logstash_demo.conf`：配置所采集日志的具体输入路径和输出到 Apache Doris 的设置。

```sql
input {  
    file {  
    path => "/path/to/your/log"  
  }  
}  

output {  
  doris {  
    http_hosts => [ "<http://fehost1:http_port>", "<http://fehost2:http_port>", "<http://fehost3:http_port">]  
    user => "your_username"  
    password => "your_password"  
    db => "your_db"  
    table => "your_table"  
    
    # doris stream load http headers  
    headers => {  
    "format" => "json"  
    "read_json_by_line" => "true"  
    "load_to_single_tablet" => "true"  
    }  
    
    # field mapping: doris fileld name => logstash field name  
    # %{} to get a logstash field, [] for nested field such as [host][name] for host.name  
    mapping => {  
    "ts" => "%{@timestamp}"  
    "host" => "%{[host][name]}"  
    "path" => "%{[log][file][path]}"  
    "message" => "%{message}"  
    }  
    log_request => true  
    log_speed_interval => 10  
  }  
}
```

3. 按照下方命令运行 Logstash，采集日志并输出至 Apache Doris。

```shell  
./bin/logstash -f logstash_demo.conf
```

更多关于 Logstash 配置和使用的说明，可参考 [Logstash Doris Output Plugin](../ecosystem/observability/logstash)。

**对接 Filebeat**

按照以下步骤操作：

1. 获取支持输出至 Apache Doris 的 Filebeat 二进制文件。可 [点此下载](https://apache-doris-releases.oss-accelerate.aliyuncs.com/extension/filebeat-doris-2.1.1) 或者从 Apache Doris 源码编译。
2. 配置 Filebeat。需配置以下参数：

- `filebeat_demo.yml`：配置所采集日志的具体输入路径和输出到 Apache Doris 的设置。

  ```yaml  
  # input
  filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /path/to/your/log
    # multiline 可以将跨行的日志（比如 Java stacktrace）拼接起来
    multiline:
      type: pattern
      # 效果：以 yyyy-mm-dd HH:MM:SS 开头的行认为是一条新的日志，其他都拼接到上一条日志
      pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}'
      negate: true
      match: after
      skip_newline: true

  processors:
  # 用 js script 插件将日志中的 \t 替换成空格，避免 JSON 解析报错
  - script:
      lang: javascript
      source: >
          function process(event) {
              var msg = event.Get("message");
              msg = msg.replace(/\t/g, "  ");
              event.Put("message", msg);
          }
  # 用 dissect 插件做简单的日志解析
  - dissect:
      # 2024-06-08 18:26:25,481 INFO (report-thread|199) [ReportHandler.cpuReport():617] begin to handle
      tokenizer: "%{day} %{time} %{log_level} (%{thread}) [%{position}] %{content}"
      target_prefix: ""
      ignore_failure: true
      overwrite_keys: true

  # queue and batch
  queue.mem:
    events: 1000000
    flush.min_events: 100000
    flush.timeout: 10s

  # output
  output.doris:
    fenodes: [ "http://fehost1:http_port", "http://fehost2:http_port", "http://fehost3:http_port" ]
    user: "your_username"
    password: "your_password"
    database: "your_db"
    table: "your_table"
    # output string format
    ## %{[agent][hostname]} %{[log][file][path]} 是filebeat自带的metadata
    ## 常用的 filebeat metadata 还是有采集时间戳 %{[@timestamp]}
    ## %{[day]} %{[time]} 是上面 dissect 解析得到字段
    codec_format_string: '{"ts": "%{[day]} %{[time]}", "host": "%{[agent][hostname]}", "path": "%{[log][file][path]}", "message": "%{[message]}"}'
    headers:
      format: "json"
      read_json_by_line: "true"
      load_to_single_tablet: "true"
  ```

3. 按照下方命令运行 Filebeat，采集日志并输出至 Apache Doris。

```shell  
chmod +x filebeat-doris-2.1.1
./filebeat-doris-2.1.1 -c filebeat_demo.yml
```

更多关于 Filebeat 配置和使用的说明，可参考 [Beats Doris Output Plugin](../ecosystem/observability/beats)。

**对接 Kafka**

将 JSON 格式的日志写入 Kafka 的消息队列，创建 Kafka Routine Load，即可让 Apache Doris 从 Kafka 主动拉取数据。

可参考如下示例。其中，`property.*` 是 Librdkafka 客户端相关配置，根据实际 Kafka 集群情况配置。

```sql  
-- 准备好 kafka 集群和 topic log__topic_  
-- 创建 routine load，从 kafka log__topic_将数据导入 log_table 表  
CREATE ROUTINE LOAD load_log_kafka ON log_db.log_table  
COLUMNS(ts, clientip, request, status, size)  
PROPERTIES (
"max_batch_interval" = "60",
"max_batch_rows" = "20000000",
"max_batch_size" = "1073741824", 
"load_to_single_tablet" = "true",
"format" = "json"
) 
FROM KAFKA (  
"kafka_broker_list" = "host:port",  
"kafka_topic" = "log__topic_",  
"property.group.id" = "your_group_id",  
"property.security.protocol"="SASL_PLAINTEXT",  
"property.sasl.mechanism"="GSSAPI",  
"property.sasl.kerberos.service.name"="kafka",  
"property.sasl.kerberos.keytab"="/path/to/xxx.keytab",  
"property.sasl.kerberos.principal"="<xxx@yyy.com>"  
);  
-- 查看 routine 的状态  
SHOW ROUTINE LOAD;
```

更多关于 Kafka 配置和使用的说明，可参考 [Routine Load](../data-operate/import/import-way/routine-load-manual.md)。

**使用自定义程序采集日志**

除了对接常用的日志采集器以外，你也可以自定义程序，通过 HTTP API Stream Load 将日志数据导入 Apache Doris。参考以下代码：

```shell
curl   
--location-trusted   
-u username:password   
-H "format:json"   
-H "read_json_by_line:true"   
-H "load_to_single_tablet:true"   
-H "timeout:600"   
-T logfile.json   
http://fe_host:fe_http_port/api/log_db/log_table/_stream_load
```

在使用自定义程序时，需注意以下关键点：

- 使用 Basic Auth 进行 HTTP 鉴权，用命令 `echo -n 'username:password' | base64` 进行计算。
- 设置 HTTP header "format:json"，指定数据格式为 JSON。
- 设置 HTTP header "read_json_by_line:true"，指定每行一个 JSON。
- 设置 HTTP header "load_to_single_tablet:true"，指定一次导入写入一个分桶减少导入的小文件。
- 建议写入客户端一个 Batch 的大小为 100MB ～ 1GB。如果你使用的是 Apache Doris 2.1 及更高版本，需通过服务端 Group Commit 功能，降低客户端 Batch 大小。

## 第 6 步：查询和分析日志

**日志查询**

Apache Doris 支持标准 SQL，因此，你可以通过 MySQL 客户端或者 JDBC 等方式连接到集群，执行 SQL 进行日志查询。参考以下命令：

```
mysql -h fe_host -P fe_mysql_port -u your_username -Dyour_db_name
```

下方列出常见的 5 条 SQL 查询命令，以供参考：

- 查看最新的 10 条数据

```SQL  
SELECT * FROM your_table_name ORDER BY ts DESC LIMIT 10;
```

- 查询 `host` 为 `8.8.8.8` 的最新 10 条数据

```SQL  
SELECT * FROM your_table_name WHERE host = '8.8.8.8' ORDER BY ts DESC LIMIT 10;
```

- 检索请求字段中有 `error` 或者 `404` 的最新 10 条数据。其中，`MATCH_ANY` 是 Apache Doris 全文检索的 SQL 语法，用于匹配参数中任一关键字。

```SQL  
SELECT * FROM your_table_name WHERE message MATCH_ANY 'error 404'  
ORDER BY ts DESC LIMIT 10;
```

- 检索请求字段中有 `image` 和 `faq` 的最新 10 条数据。其中，`MATCH_ALL` 是 Apache Doris 全文检索的 SQL 语法，用于匹配参数中所有关键字。

```SQL  
SELECT * FROM your_table_name WHERE message MATCH_ALL 'image faq'  
ORDER BY ts DESC LIMIT 10;
```

- 检索请求字段中有 `image` 和 `faq` 的最新 10 条数据。其中，`MATCH_PHRASE` 是 Apache Doris 全文检索的 SQL 语法，用于匹配参数中所有关键字，并且要求顺序一致。在下方例子中，`a image faq b` 能匹配，但是 `a faq image b` 不能匹配，因为 `image` 和 `faq` 的顺序与查询不一致。

```SQL
SELECT * FROM your_table_name WHERE message MATCH_PHRASE 'image faq'  
ORDER BY ts DESC LIMIT 10;
```

**可视化日志分析**

一些第三方厂商提供了基于 Apache Doris 的可视化日志分析开发平台，包含类 Kibana Discover 的日志检索分析界面，提供直观、易用的探索式日志分析交互。

![WebUI](/images/WebUI-CN.jpeg)

- 支持全文检索和 SQL 两种模式
- 支持时间框和直方图上选择查询日志的时间段
- 支持信息丰富的日志明细展示，还可以展开成 JSON 或表格
- 在日志数据上下文交互式点击增加和删除筛选条件
- 搜索结果的字段 Top 值展示，便于发现异常值和进一步下钻分析

您可以联系 dev@doris.apache.org 获得更多帮助。

