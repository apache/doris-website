---
{
    "title": "Trace",
    "language": "en"
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

This article introduces the storage and analysis practices of Trace, one of the core observability data. For an overview of the complete observability solution, please refer to [Overview](./overview.mdx). For resource evaluation, cluster deployment, and optimization, please refer to [Log](./log.md).

## 1. Table Creation

Trace data has distinct characteristics in terms of writing and querying patterns. Targeted configurations during table creation can significantly improve performance. Create your table based on the key guidelines below:

**Partitioning and Sorting**
- Use RANGE partitioning on the time field, enable dynamic partitioning to manage partitions automatically by day.
- Use `service_name` and a time field of type DATETIME as keys; this provides multiple times acceleration when querying traces for a specific service over a certain period.

**Bucketing**
- The number of buckets should be approximately three times the total number of disks in the cluster.
- Use the RANDOM bucketing strategy. Combined with single-tablet ingestion during writes, it improves batch write efficiency.

**Compaction**
- Use the time_series compaction strategy to reduce write amplification, which is crucial for optimizing resources under high-throughput ingestion.

**VARIANT Data Type**
- Use the semi-structured VARIANT data type for extended Trace fields like `span_attributes` and `resource_attributes`. This automatically splits JSON data into sub-columns for storage, improving compression rates and reducing storage space while also enhancing filtering and sub-column analysis performance.

**Indexing**
- Build indexes on frequently queried fields.
- For fields requiring full-text search, specify the parser parameter. Unicode tokenization generally meets most needs. Enable the `support_phrase` option to support phrase queries. If not needed, set it to false to reduce storage usage.

**Storage**
- For hot data, configure 1 replica if using cloud disks or at least 2 replicas if using physical disks.
- Use hot-cold tiered storage configuration with `log_s3` object storage and `log_policy_3day` policy to move data older than 3 days to S3.

```sql
CREATE DATABASE log_db;
USE log_db;

-- Not required for compute-storage separation mode
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

-- Not required for compute-storage separation mode
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
"dynamic_partition.replication_num" = "2", -- Not required for compute-storage separation
"replication_num" = "2", -- Not required for compute-storage separation
"storage_policy" = "log_policy_3day" -- Not required for compute-storage separation
);
```

## 2. Trace Collection

Doris provides open and general-purpose Stream HTTP APIs that can integrate with Trace collection systems like OpenTelemetry.

### OpenTelemetry Integration

1. **Application-side Integration with OpenTelemetry SDK**

Here we use a Spring Boot example application integrated with the OpenTelemetry Java SDK. The example application comes from the official [demo](https://docs.spring.io/spring-boot/tutorial/first-application/index.html), which returns a simple "Hello World!" string for requests to the path "/".  
Download the [OpenTelemetry Java Agent](https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases). The advantage of using the Java Agent is that no modifications are needed to existing application. For other languages and integration methods, see the OpenTelemetry official website [Language APIs & SDKs](https://opentelemetry.io/docs/languages/) or [Zero-code Instrumentation](https://opentelemetry.io/docs/zero-code/).

1. **Deploy and Configure OpenTelemetry Collector**

Download and extract [OpenTelemetry Collector](https://github.com/open-telemetry/opentelemetry-collector-releases/releases). You need to download the package starting with "otelcol-contrib", which includes the Doris Exporter.

Create the `otel_demo.yaml` configuration file as follows. For more details, refer to the Doris Exporter [documentation](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/dorisexporter).

```yaml
receivers:
  otlp: # OTLP protocol, receiving data sent by the OpenTelemetry Java Agent
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    send_batch_size: 100000 # Number of records per batch; recommended batch size between 100MB-1GB
    timeout: 10s

exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP address
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      traces: doris_table_name
    create_schema: true # Whether to auto-create schema; manual table creation is needed if set to false
    mysql_endpoint: localhost:9030  # FE MySQL address
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # Timeout for HTTP stream load client
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

1. **Run OpenTelemetry Collector**

```bash
./otelcol-contrib --config otel_demo.yaml
```

4. **Start the Spring Boot Example Application**

Before starting the application, simply add a few environment variables without modifying any code.

```bash
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS} -javaagent:/your/path/to/opentelemetry-javaagent.jar" # Path to OpenTelemetry Java Agent
export OTEL_JAVAAGENT_LOGGING="none" # Disable Otel logs to prevent interference with application logs
export OTEL_SERVICE_NAME="myproject"
export OTEL_TRACES_EXPORTER="otlp" # Send trace data using OTLP protocol
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317" # Address of the OpenTelemetry Collector

java -jar myproject-0.0.1-SNAPSHOT.jar
```

5. **Access the Spring Boot Example Service to Generate Trace Data**

Running `curl localhost:8080` will trigger a call to the `hello` service. The OpenTelemetry Java Agent will automatically generate Trace data and send it to the OpenTelemetry Collector, which then writes the Trace data to the Doris table (default is `otel.otel_traces`) via the configured Doris Exporter.

## 3. Trace Querying

Trace querying typically uses visual query interfaces such as Grafana.

- Filter by time range and service name to display Trace summaries, including latency distribution charts and detailed individual Traces.

  ![Trace List](/images/observability/trace-list.png)

- Click on the link to view the Trace detail.

  ![Trace Detail](/images/observability/trace-detail.png)
