---
{
    "title": "Log",
    "language": "en",
    "description": "This document introduces the storage and analysis practices of Logs, one of the core observability components."
}
---

This document introduces the storage and analysis practices of Logs, one of the core observability components. For an overview of the complete observability solution, please refer to [Overview](overview).

## Step 1: Estimate resources

Before deploying the cluster, you need to estimate the hardware resources required for the servers. Follow the steps below:

1. Estimate the resources for data writing by the following calculation formulas:

- `Average write throughput = Daily data increment / 86400 s`

- `Peak write throughput = Average write throughput \* Ratio of the peak write throughput to the average write throughput`

- `Number of CPU cores for the peak write throughput = Peak write throughput / Write throughput of a single-core CPU`

1. Estimate the resources for data storage by the calculation formula: `Storage space = Daily data increment / Data compression ratio * Number of data copies * Data storage duration`.

2. Estimate the resources for data querying. The resources for data querying depend on the query volume and complexity. It is recommended to reserve 50% of CPU resources for data query initially and then adjust according to the actual test results.

3. Integrate the calculation results as follows:

    1. Divide the number of CPU cores calculated in Step 1 and Step 3 by the number of CPU cores of a BE server, and you can get the number of BE servers.

    2. Based on the number of BE servers and the calculation result of Step 2, estimate the storage space required for each BE server.

    3. Allocate the storage space required for each BE server to 4 to 12 data disks, and you can get the storage capacity required for a single data disk.

For example, suppose that the daily data increment is 100 TB, the data compression ratio is 5, the number of data copies is 2, the storage duration of hot data is 3 days, the storage duration of cold data is 30 days, the ratio of the peak write throughput to the average write throughput is 200%, the write throughput of a single-core CUP is 10 MB/s, and 50% of CPU resources are reserved for data querying, one can estimate that:

**compute-storage-integrated mode**
- 3 FE servers are required, each configured with a 16-core CPU, 64 GB memory, and an 1 100 GB SSD disk.
- 30 BE servers are required, each configured with a 32-core CPU, 256 GB memory, and 8 625 GB SSD disks.
- S3 object storage space 540 TB

**compute-storage-decoupled mode**
- 3 FE servers are required, each configured with a 16-core CPU, 64 GB memory, and an 1 100 GB SSD disk.
- 15 BE servers are required, each configured with a 32-core CPU, 256 GB memory, and 8 680 GB SSD disks.
- S3 object storage space 600 TB

Using the storage-compute separation mode, write operations and hot data storage require only 1 replica, which can significantly reduce costs.


Refer to the following table to learn about the values of indicators in the example above and how they are calculated.

| Indicator (Unit) | compute-storage-decoupled | compute-storage-integrated | Description |
| --- | :---- | --- | --- |
| Daily data increment (TB) | 100 | 100 | Specify the value according to your actual needs. |
| Data compression ratio | 5   | 5 | Specify the value according to your actual needs, which is often between 3 to 10. Note that the data contains index data. |
| Number of data copies | 1   | 2 | Specify the value according to your actual needs, which can be 1, 2, or 3. The default value is 1. |
| Storage duration of hot data (day) | 3   | 3 | Specify the value according to your actual needs. |
| Storage duration of cold data (day) | 30  | 27 | Specify the value according to your actual needs. |
| Data storage duration | 30  | 30 | Calculation formula: `Storage duration of hot data + Storage duration of cold data` |
| Estimated storage space for hot data (TB) | 60 | 120 | Calculation formula: `Daily data increment / Data compression ratios * Number of data copies * Storage duration of hot data` |
| Estimated storage space for cold data (TB) | 600 | 540 | Calculation formula: `Daily data increment / Data compression ratios * Number of data copies * Storage duration of cold data` |
| Ratio of the peak write throughput to the average write throughput | 200% | 200% | Specify the value according to your actual needs. The default value is 200%. |
| Number of CPU cores of a BE server | 32  | 32 | Specify the value according to your actual needs. The default value is 32. |
| Average write throughput (MB/s) | 1214 | 2427 | Calculation formula: `Daily data increment / 86400 s` |
| Peak write throughput (MB/s) | 2427 | 4855 | Calculation formula: `Average write throughput * Ratio of the peak write throughput to the average write throughput` |
| Number of CPU cores for the peak write throughput | 242.7 | 485.5 | Calculation formula: `Peak write throughput / Write throughput of a single-core CPU` |
| Percent of CPU resources reserved for data querying | 50% | 50% | Specify the value according to your actual needs. The default value is 50%. |
| Estimated number of BE servers | 15.2 | 30.3 | Calculation formula: `Number of CPU cores for the peak write throughput / Number of CPU cores of a BE server /(1 - Percent of CPU resources reserved for data querying)` |
| Rounded number of BE servers | 15  | 30 | Calculation formula: `MAX (Number of data copies, Estimated number of BE servers)` |
| Estimated data storage space for each BE server (TB) | 5.33 | 5.33 | Calculation formula: `Estimated storage space for hot data / Estimated number of BE servers /(1 - 30%)`, where 30% represents the percent of reserved storage space.<br /><br />It is recommended to mount 4 to 12 data disks on each BE server to enhance I/O capabilities. |

## Step 2: Deploy the cluster

After estimating the resources, you need to deploy the cluster. It is recommended to deploy in both physical and virtual environments manually. For manual deployment, refer to [Manual Deployment](../install/deploy-manually/integrated-storage-compute-deploy-manually.md).


## Step 3: Optimize FE and BE configurations

After completing the cluster deployment, it is necessary to optimize the configuration parameters for both the front-end and back-end separately, so as to better suit the scenario of log storage and analysis.

**Optimize FE configurations**

You can find FE configuration fields in `fe/conf/fe.conf`. Refer to the following table to optimize FE configurations.

| Configuration fields to be optimized                         | Description                                                  |
| :----------------------------------------------------------- | :----------------------------------------------------------- |
| `max_running_txn_num_per_db = 10000`                         | Increase the parameter value to adapt to high-concurrency import transactions. |
| `streaming_label_keep_max_second = 3600` `label_keep_max_second = 7200` | Increase the retention time to handle high-frequency import transactions with high memory usage. |
| `enable_round_robin_create_tablet = true`                    | When creating Tablets, use a Round Robin strategy to distribute evenly. |
| `tablet_rebalancer_type = partition`                         | When balancing Tablets, use a strategy to evenly distribute within each partition. |
| `autobucket_min_buckets = 10`                                | Increase the minimum number of automatically bucketed buckets from 1 to 10 to avoid insufficient buckets when the log volume increases. |
| `max_backend_heartbeat_failure_tolerance_count = 10`         | In log scenarios, the BE server may experience high pressure, leading to short-term timeouts, so increase the tolerance count from 1 to 10. |

For more information, refer to [FE Configuration](../admin-manual/config/fe-config.md).

**Optimize BE configurations**

You can find BE configuration fields in `be/conf/be.conf`. Refer to the following table to optimize BE configurations.

| Module      | Configuration fields to be optimized                         | Description                                                  |
| :--------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| Storage    | `storage_root_path = /path/to/dir1;/path/to/dir2;...;/path/to/dir12` | Configure the storage path for hot data on disk directories. |
| -          | `enable_file_cache = true`                                   | Enable file caching.                                         |
| -          | `file_cache_path = [{"path": "/mnt/datadisk0/file_cache", "total_size":53687091200, "query_limit": "10737418240"},{"path": "/mnt/datadisk1/file_cache", "total_size":53687091200,"query_limit": "10737418240"}]` | Configure the cache path and related settings for cold data with the following specific configurations:<br/>`path`: cache path<br/>`total_size`: total size of the cache path in bytes, where 53687091200 bytes equals 50 GB<br/>`query_limit`: maximum amount of data that can be queried from the cache path in one query in bytes, where 10737418240 bytes equals 10 GB |
| Write      | `write_buffer_size = 1073741824`                             | Increase the file size of the write buffer to reduce small files and random I/O operations, improving performance. |
| -          | `max_tablet_version_num = 20000`                             | In coordination with the time_series compaction strategy for table creation, allow more versions to remain temporarily unmerged |
| Compaction | `max_cumu_compaction_threads = 8`                            | Set to CPU core count / 4, indicating that 1/4 of CPU resources are used for writing, 1/4 for background compaction, and 2/1 for queries and other operations. |
| -          | `inverted_index_compaction_enable = true`                    | Enable inverted index compaction to reduce CPU consumption during compaction. |
| -          | `enable_segcompaction = false` `enable_ordered_data_compaction = false` | Disable two compaction features that are unnecessary for log scenarios. |
| -          | `enable_compaction_priority_scheduling = false` | Low-priority compaction is limited to 2 tasks on a single disk, which can affect the speed of compaction. |
| -          | `total_permits_for_compaction_score = 200000 ` | The parameter is used to control memory, under the memory time series strategy, the parameter itself can control memory. |
| Cache      | `disable_storage_page_cache = true` `inverted_index_searcher_cache_limit = 30%` | Due to the large volume of log data and limited caching effect, switch from data caching to index caching. |
| -          | `inverted_index_cache_stale_sweep_time_sec = 3600` `index_cache_entry_stay_time_after_lookup_s = 3600` | Maintain index caching in memory for up to 1 hour.           |
| -          | `enable_inverted_index_cache_on_cooldown = true`<br />`enable_write_index_searcher_cache = false` | Enable automatic caching of cold data storage during index uploading. |
| -          | `tablet_schema_cache_recycle_interval = 3600` `segment_cache_capacity = 20000` | Reduce memory usage by other caches.                         |
| -          | `inverted_index_ram_dir_enable = true` | Reduce the IO overhead caused by writing to index files temporarily. |
| Thread     | `pipeline_executor_size = 24` `doris_scanner_thread_pool_thread_num = 48` | Configure computing threads and I/O threads for a 32-core CPU in proportion to core count. |
| -          | `scan_thread_nice_value = 5`                                 | Lower the priority of query I/O threads to ensure writing performance and timeliness. |
| Other      | `string_type_length_soft_limit_bytes = 10485760`             | Increase the length limit of string-type data to 10 MB.      |
| -          | `trash_file_expire_time_sec = 300` `path_gc_check_interval_second  = 900` `path_scan_interval_second = 900` | Accelerate the recycling of trash files.                     |


For more information, refer to [BE Configuration](../admin-manual/config/be-config).

## Step 4: Create tables

Due to the distinct characteristics of both writing and querying log data, it is recommended to configure tables with targeted settings to enhance performance.

**Configure data partitioning and bucketing**

- For data partitioning:

    - Enable [range partitioning](../table-design/data-partitioning/manual-partitioning.md#range-partitioning) (`PARTITION BY RANGE(`ts`)`) with [dynamic partitions](../table-design/data-partitioning/dynamic-partitioning.md) (`"dynamic_partition.enable" = "true"`) managed automatically by day.

    - Use a field in the DATETIME type as the sort key (`DUPLICATE KEY(ts)`) for accelerated retrieval of the latest N log entries.

- For data bucketing:

    - Configure the number of buckets to be roughly three times the total number of disks in the cluster, with each bucket containing approximately 5GB of data after compression.

    - Use the Random strategy (`DISTRIBUTED BY RANDOM BUCKETS 60`) to optimize batch writing efficiency when paired with single tablet imports.

For more information, refer to [Data Partitioning](../table-design/data-partitioning/auto-partitioning).

**Configure compression parameters**

Use the zstd compression algorithm ("compression" = "zstd") to improve data compression efficiency.

**Configure compaction parameters**

Configure compaction fields as follows:

- Use the time_series strategy (`"compaction_policy" = "time_series"`) to reduce write amplification, which is crucial for high-throughput log writes.

**Configure index parameters**

Configuring index fields as follows:

- Create indexes for fields that are frequently queried (`USING INVERTED`).

- For fields that require full-text search, specify the parser field as unicode, which satisfies most requirements. If there is a need to support phrase queries, set the support_phrase field to true; if not needed, set it to false to reduce storage space.

**Configure storage parameters**

Configure storage policies as follows:

- For storage of hot data, if using cloud storage, configure the number of data copies as 1; if using physical disks, configure the number of data copies as at least 2 (`"replication_num" = "2"`).

- Configure the storage location for log_s3 (`CREATE RESOURCE "log_s3"`) and set the log_policy_3day policy (`CREATE STORAGE POLICY log_policy_3day`), where the data is cooled and moved to the specified storage location of log_s3 after 3 days. Refer to the SQL below.

```SQL
CREATE DATABASE log_db;
USE log_db;

-- unneccessary for the compute-storage-decoupled mode
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

-- unneccessary for the compute-storage-decoupled mode
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
  "dynamic_partition.replication_num" = "2", -- unneccessary for the compute-storage-decoupled mode
  "replication_num" = "2", -- unneccessary for the compute-storage-decoupled mode
  "storage_policy" = "log_policy_3day" -- unneccessary for the compute-storage-decoupled mode
);
```

## Step 5: Collect logs

After completing table creation, you can proceed with log collection.

Apache Doris provides open and versatile Stream HTTP APIs, through which you can connect with popular log collectors such as Logstash, Filebeat, Kafka, and others to carry out log collection work. This section explains how to integrate these log collectors using the Stream HTTP APIs.

**Integrating Logstash**

Follow these steps:

1. Download and install the Logstash Doris Output plugin. You can choose one of the following two methods:

   - [Click to download](https://download.velodb.io/extension/logstash-output-doris-1.2.0.gem) and install.

   - Compile from the source code and run the following command to install:

```markdown  
./bin/logstash-plugin install logstash-output-doris-1.2.0.gem
```

2. Configure Logstash. Specify the following fields:

- `logstash.yml`: Used to configure Logstash batch processing log sizes and timings for improved data writing performance.

```Plain Text  
pipeline.batch.size: 1000000  
pipeline.batch.delay: 10000
```

- `logstash_demo.conf`: Used to configure the specific input path of the collected logs and the settings for output to Apache Doris.

```  
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

3. Run Logstash according to the command below, collect logs, and output to Apache Doris.

```shell  
./bin/logstash -f logstash_demo.conf
```

For more information about the Logstash Doris Output plugin, see [Logstash Doris Output Plugin](../ecosystem/observability/logstash.md).

**Integrating Filebeat**

Follow these steps:

1. Obtain the Filebeat binary file that supports output to Apache Doris. You can [click to download](https://download.velodb.io/extension/filebeat-doris-2.1.1) or compile it from the Apache Doris source code.

2. Configure Filebeat. Specify the filebeat_demo.yml field that is used to configure the specific input path of the collected logs and the settings for output to Apache Doris.

```YAML  
# input
filebeat.inputs:
- type: log
enabled: true
paths:
    - /path/to/your/log
multiline:
    type: pattern
    pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}'
    negate: true
    match: after
    skip_newline: true

processors:
- script:
    lang: javascript
    source: >
        function process(event) {
            var msg = event.Get("message");
            msg = msg.replace(/\t/g, "  ");
            event.Put("message", msg);
        }
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
codec_format_string: '{"ts": "%{[day]} %{[time]}", "host": "%{[agent][hostname]}", "path": "%{[log][file][path]}", "message": "%{[message]}"}'
headers:
    format: "json"
    read_json_by_line: "true"
    load_to_single_tablet: "true"
```

3. Run Filebeat according to the command below, collect logs, and output to Apache Doris.

    ```shell  
    chmod +x filebeat-doris-2.1.1
    ./filebeat-doris-2.1.1 -c filebeat_demo.yml
    ```

For more information about Filebeat, refer to [Beats Doris Output Plugin](../ecosystem/observability/beats.md).

**Integrating Kafka**

Write JSON formatted logs to Kafka's message queue, create a Kafka Routine Load, and allow Apache Doris to actively pull data from Kafka.

You can refer to the example below, where `property.*` represents Librdkafka client-related configurations and needs to be adjusted according to the actual Kafka cluster situation.

```SQL  
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
<br />SHOW ROUTINE LOAD;
```

For more information about Kafka, see [Routine Load](../data-operate/import/import-way/routine-load-manual.md).

**Using customized programs to collect logs**

In addition to integrating common log collectors, you can also customize programs to import log data into Apache Doris using the Stream Load HTTP API. Refer to the following code:

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

When using custom programs, pay attention to the following key points:

- Use Basic Auth for HTTP authentication, calculate using the command echo -n 'username:password' | base64.

- Set HTTP header "format:json" to specify the data format as JSON.

- Set HTTP header "read_json_by_line:true" to specify one JSON per line.

- Set HTTP header "load_to_single_tablet:true" to import data into one bucket at a time to reduce small file imports.

- It is recommended to write batches whose sizes are between 100MB to 1GB on the client side. For Apache Doris version 2.1 and higher, you need to reduce batch sizes on the client side through the Group Commit function.

## Step 6: Query and analyze logs

**Query logs**

Apache Doris supports standard SQL, so you can connect to the cluster through MySQL client or JDBC to execute SQL for log queries.

```Plain Text  
mysql -h fe_host -P fe_mysql_port -u your_username -Dyour_db_name
```

Here are 5 common SQL query commands for reference:

- View the latest 10 log entries

```SQL  
SELECT * FROM your_table_name ORDER BY ts DESC LIMIT 10;
```

- Query the latest 10 log entries with the host as 8.8.8.8

```SQL  
SELECT * FROM your_table_name WHERE host = '8.8.8.8' ORDER BY ts DESC LIMIT 10;
```

- Retrieve the latest 10 log entries with error or 404 in the request field. In the command below, MATCH_ANY is a full-text search SQL syntax used by Apache Doris for matching any keyword in the fields.

```SQL  
SELECT * FROM your_table_name WHERE message **MATCH_ANY** 'error 404'  
ORDER BY ts DESC LIMIT 10;
```

- Retrieve the latest 10 log entries with image and faq in the request field. In the command below, MATCH_ALL is a full-text search SQL syntax used by Apache Doris for matching all keywords in the fields.

```SQL  
SELECT * FROM your_table_name WHERE message **MATCH_ALL** 'image faq'  
ORDER BY ts DESC LIMIT 10;
```

- Retrieve the latest 10 entries with image and faq in the request field. In the following command, MATCH_PHRASE is a full-text search SQL syntax used by Apache Doris for matching all keywords in the fields and requiring consistent order. In the example below, a image faq b can match, but a faq image b cannot match because the order of image and faq does not match the syntax.

```SQL  
SELECT * FROM your_table_name WHERE message **MATCH_PHRASE** 'image faq'  
ORDER BY ts DESC LIMIT 10;
```

**Analyze logs visually**

Some third-party vendors offer visual log analysis development platforms based on Apache Doris, which include a log search and analysis interface similar to Kibana Discover. These platforms provide an intuitive and user-friendly exploratory log analysis interaction.

![WebUI-a log search and analysis interface similar to Kibana](/images/WebUI-EN.jpeg)

- Support for full-text search and SQL modes

- Support for selecting query log timeframes with time boxes and histograms

- Display of detailed log information, expandable into JSON or tables

- Interactive clicking to add and remove filter conditions in the log data context

- Display of top field values in search results for finding anomalies and further drilling down for analysis

Please contact dev@doris.apache.org to find more.
