---
{
    "title": "Trace",
    "language": "zh-CN",
    "description": "本文介绍可观测性核心数据之一 Trace 的存储分析实践，可观测性整体方案介绍请参考概述，资源评估、集群部署和优化可以参考 Log。"
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

# Trace

本文介绍可观测性核心数据之一 Trace 的存储分析实践，可观测性整体方案介绍请参考[概述](./overview.mdx)，资源评估、集群部署和优化可以参考 [Log](./log.md)。


## 1. 建表

Trace 数据的写入和查询模式有明显的特征，在建表时进行针对性的配置会有更好的性能表现。参考下面的关键说明创建表：

**分区和排序**
- 分区使用时间字段上的 RANGE 分区，开启动态 Partition 按天自动管理分区
- 使用 service_name 和 DATETIME 类型的时间字段作为 Key，在查询指定 service 一段时间的 Trace 时有数倍加速

**分桶**
- 分桶个数大致是集群磁盘总数的 3 倍
- 分桶策略使用 RANDOM，配合写入时的 single tablet 导入可以提升写入 batch 效果

**compaction**
- 使用 time_series compaction 策略减少写放大，对于高吞吐 Trace 写入的资源优化很重要

**VARIANT 数据类型**
- 对于 Trace 扩展字段比如 span_attributes 和 resource_attributes 使用半结构化数据类型 VARIANT，自动将 JSON 数据拆分成子列存储，提升压缩率降低存储空间，提升过滤和分析子列的性能

**索引**
- 对经常查询的字段建索引
- 需要全文检索的字段指定分词器 parser 参数，unicode 分词一般能满足绝大多数需求，开启 support_phrase 选项以支持短语查询，如果不需要可以设置为 false 降低存储空间

**存储**
- 热存数据，如果使用云盘可以配置 1 副本，如果使用物理盘至少配置 2 副本
- 使用冷热分离配置 log_s3 对象存储和 log_policy_3day 超过 3 天转存 s3 策略

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

CREATE TABLE trace_table
(        
    service_name          VARCHAR(200),        
    timestamp             DATETIME(6),
    service_instance_id   VARCHAR(200),
    trace_id              VARCHAR(200),        
    span_id               STRING,        
    trace_state           STRING,        
    parent_span_id        STRING,        
    span_name             STRING,        
    span_kind             STRING,        
    end_time              DATETIME(6),        
    duration              BIGINT,        
    span_attributes       VARIANT,        
    events                ARRAY<STRUCT<timestamp:DATETIME(6), name:STRING, attributes:MAP<STRING, STRING>>>,        
    links                 ARRAY<STRUCT<trace_id:STRING, span_id:STRING, trace_state:STRING, attributes:MAP<STRING, STRING>>>,        
    status_message        STRING,        
    status_code           STRING,        
    resource_attributes   VARIANT,        
    scope_name            STRING,        
    scope_version         STRING,
    INDEX idx_timestamp(timestamp) USING INVERTED,
    INDEX idx_service_instance_id(service_instance_id) USING INVERTED,
    INDEX idx_trace_id(trace_id) USING INVERTED,        
    INDEX idx_span_id(span_id) USING INVERTED,        
    INDEX idx_trace_state(trace_state) USING INVERTED,        
    INDEX idx_parent_span_id(parent_span_id) USING INVERTED,        
    INDEX idx_span_name(span_name) USING INVERTED,        
    INDEX idx_span_kind(span_kind) USING INVERTED,        
    INDEX idx_end_time(end_time) USING INVERTED,        
    INDEX idx_duration(duration) USING INVERTED,        
    INDEX idx_span_attributes(span_attributes) USING INVERTED,        
    INDEX idx_status_message(status_message) USING INVERTED,        
    INDEX idx_status_code(status_code) USING INVERTED,        
    INDEX idx_resource_attributes(resource_attributes) USING INVERTED,        
    INDEX idx_scope_name(scope_name) USING INVERTED,        
    INDEX idx_scope_version(scope_version) USING INVERTED        
)        
ENGINE = OLAP        
DUPLICATE KEY(service_name, timestamp)        
PARTITION BY RANGE(timestamp) ()        
DISTRIBUTED BY RANDOM BUCKETS 250
PROPERTIES (
"compression" = "zstd",
"compaction_policy" = "time_series",
"inverted_index_storage_format" = "V2",
"dynamic_partition.enable" = "true",
"dynamic_partition.create_history_partition" = "true",
"dynamic_partition.time_unit" = "DAY",
"dynamic_partition.start" = "-30",
"dynamic_partition.end" = "1",
"dynamic_partition.prefix" = "p",
"dynamic_partition.buckets" = "250",
"dynamic_partition.replication_num" = "2", -- 存算分离不需要
"replication_num" = "2" -- 存算分离不需要
"storage_policy" = "log_policy_3day" -- 存算分离不需要
);
```

## 2. Trace 采集

Doris 提供开放通用的 Stream HTTP API，可以与 OpenTelemetry 等 Trace 采集系统打通。

### OpenTelemetry 对接

1. 应用侧接入 OpenTelemetry SDK

这里我们使用一个 Spring Boot 示例应用接入 OpenTelemetry Java SDK，示例应用来自官方 [demo](https://docs.spring.io/spring-boot/tutorial/first-application/index.html)，对路径 "/" 返回简单的 "Hello World!" 字符串。
下载 [OpenTelemetry Java Agent](https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases)，使用 Java Agent 的优势在于无需对现有的应用做任何的修改。其他语言及其他接入方式详见 OpenTelemetry 官网：[Language APIs & SDKs](https://opentelemetry.io/docs/languages/) 或 [Zero-code Instrumentation](https://opentelemetry.io/docs/zero-code/)。

2. 部署配置 OpenTelemetry Collector

下载 [OpenTelemetry Collector](https://github.com/open-telemetry/opentelemetry-collector-releases/releases) 并解压。需要下载以 "otelcol-contrib" 为前缀的包，其中的 Doris Exporter 组件能够把 trace 数据导入到 Doris 中。

创建 `otel_demo.yaml` 配置文件如下，更多配置详见 Doris Exporter [文档](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/dorisexporter)。

```yaml
receivers:
  otlp: # otlp 协议，接收 OpenTelemetry Java Agent 发送的数据
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    send_batch_size: 100000 # 每个批次的数据条数，建议 batch 的数据量在 100M-1G 之间
    timeout: 10s

exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP 地址
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      traces: doris_table_name
    create_schema: true # 是否自动创建 schema，如果设置为 false，则需要手动建表
    mysql_endpoint: localhost:9030  # FE MySQL 地址
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # http stream load 客户端超时时间
    log_response: true
    sending_queue:
      enabled: true
      num_consumers: 20
      queue_size: 1000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
    headers:
      load_to_single_tablet: "true"
```

3. 运行 OpenTelemetry Collector

  ```Bash
  ./otelcol-contrib --config otel_demo.yaml
  ```

4. 启动 Spring Boot 示例应用

在启动应用之前只需要添加几个环境变量，无需修改任何代码。

```Bash
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS} -javaagent:/your/path/to/opentelemetry-javaagent.jar" # OpenTelemetry Java Agent 的路径
export OTEL_JAVAAGENT_LOGGING="none" # 禁用 otel log，防止干扰服务本身的日志
export OTEL_SERVICE_NAME="myproject"
export OTEL_TRACES_EXPORTER="otlp" # 使用 otlp 协议发送 trace 数据
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317" # OpenTelemetry Collector 的地址

java -jar myproject-0.0.1-SNAPSHOT.jar
```

5. 访问 Spring Boot 示例应用产生 Trace 数据

`curl loalhost:8080` 会触发 `hello` 服务调用，OpenTelemetry Java Agent 会自动生成 Trace 数据，然后发送给 OpenTelemetry Collector，Collector 再通过配置的 Doris Exporter 将 Trace 数据写入 Doris 的表中（默认是 `otel.otel_traces`）。

## 3. Trace 查询

Trace 查询通常使用可视化的查询界面，比如 Grafana。

- 通过时间段和服务名筛选，展示 Trace 概览，包括延迟分布图和最细的一些 Trace

  ![Trace 列表](/images/observability/trace-list.png)

- 点击链接可以查看 Trace detail

  ![Trace 查询](/images/observability/trace-detail.png)

