---
{
    "title": "SeaTunnel",
    "language": "en",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "Learn how to use the SeaTunnel Doris Sink to synchronize data into Apache Doris, and configure Connector-V2, Flink, Spark, and Stream Load parameters.",
    "keywords": [
        "SeaTunnel Doris Sink",
        "SeaTunnel write to Doris",
        "Doris Stream Load",
        "Doris data synchronization",
        "Connector-V2"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data integration / SeaTunnel writes to Doris -->

SeaTunnel is an easy-to-use, ultra-high-performance distributed data integration platform that supports real-time synchronization of massive data and can stably and efficiently synchronize tens of billions of records every day.

This document is intended for users who need to synchronize data from SeaTunnel into Doris. It introduces, by use case, how to choose a Doris Sink, how to configure its parameters, and how to use it.

## How to Choose a Connector

| Use case | Recommended approach | Applicable version or engine | Description |
| --- | --- | --- | --- |
| Need exactly-once writes or CDC data synchronization | Connector-V2 Doris Sink | SeaTunnel 2.3.1 and above | Supports Doris Sink, exactly-once writes, and CDC data synchronization. |
| Synchronize data into Doris through the Flink engine | Connector-V1 Flink Doris Sink | SeaTunnel 2.1.0, Flink engine | Suitable for SeaTunnel jobs that already run on a Flink engine. |
| Synchronize data into Doris through the Spark engine | Connector-V1 Spark Sink Doris | SeaTunnel 2.1.0, Spark engine | Suitable for jobs that already run on a Spark engine, for example migrating data from Hive into Doris. |

## Scenario 1: Use Connector-V2 to Write to Doris

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Real-time synchronization / exactly-once writes / CDC data synchronization -->

The SeaTunnel 2.3.1 [Apache SeaTunnel Connector-V2](https://seatunnel.apache.org/docs/2.3.1/category/sink-v2) supports Doris Sink, exactly-once writes, and CDC data synchronization.

For the plugin source code, see the [SeaTunnel Doris Sink plugin code](https://github.com/apache/seatunnel/tree/dev/seatunnel-connectors-v2/connector-doris).

### Parameter Configuration

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `fenodes` | string | Yes | - | Doris cluster FE node addresses, in the format `fe_ip:fe_http_port,...`. |
| `username` | string | Yes | - | Doris username. |
| `password` | string | Yes | - | Password for the Doris user. |
| `table.identifier` | string | Yes | - | Doris table name, in the format `DBName.TableName`. |
| `sink.label-prefix` | string | Yes | - | Label prefix used by Stream Load. In a 2PC scenario, this prefix must be globally unique to guarantee SeaTunnel's EOS semantics. |
| `sink.enable-2pc` | bool | No | `true` | Whether to enable two-phase commit (2PC). The default is `true`, which guarantees exactly-once semantics. For two-phase commit, see the [Stream Load manual](../../data-operate/import/import-way/stream-load-manual.md). |
| `sink.enable-delete` | bool | No | `false` | Whether to enable deletes. This option requires the Doris table to have batch delete enabled. Doris 0.15+ enables this feature by default, and only the Unique table model is supported. For more information, see [Batch Delete](../../data-operate/delete/batch-delete-manual.md). |
| `doris.config` | map | Yes | - | Stream Load `data_desc` parameters. For more parameters, see the [Stream Load manual](../../data-operate/import/import-way/stream-load-manual.md). |

### Import Data in JSON Format

```text
sink {
    Doris {
        fenodes = "doris_fe:8030"
        username = root
        password = ""
        table.identifier = "test.table_sink"
        sink.enable-2pc = "true"
        sink.label-prefix = "test_json"
        doris.config = {
            format = "json"
            read_json_by_line = "true"
        }
    }
}
```

### Import Data in CSV Format

```text
sink {
    Doris {
        fenodes = "doris_fe:8030"
        username = root
        password = ""
        table.identifier = "test.table_sink"
        sink.enable-2pc = "true"
        sink.label-prefix = "test_csv"
        doris.config = {
            format = "csv"
            column_separator = ","
            line_delimiter = "\n"
        }
    }
}
```

## Scenario 2: Use Connector-V1 to Write to Doris

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: SeaTunnel 2.1.0 / Flink engine / Spark engine -->

Apache SeaTunnel 2.1.0 supports the Doris connector, which can synchronize data into Doris through either the Flink engine or the Spark engine.

### Use the Flink Engine to Write to Doris

For the plugin source code, see the [SeaTunnel Flink Sink Doris plugin code](https://github.com/apache/seatunnel).

#### Parameter Configuration

| Parameter | Type | Required | Default | Supported engine | Description |
| --- | --- | --- | --- | --- | --- |
| `fenodes` | string | Yes | - | Flink | Doris FE HTTP address, for example `127.0.0.1:8030`. |
| `database` | string | Yes | - | Flink | Name of the database to write to in Doris. |
| `table` | string | Yes | - | Flink | Name of the table to write to in Doris. |
| `user` | string | Yes | - | Flink | Doris access user. |
| `password` | string | Yes | - | Flink | Password for the Doris access user. |
| `batch_size` | int | No | `100` | Flink | Maximum number of rows written to Doris in a single batch. |
| `interval` | int | No | `1000` | Flink | Flush interval, in milliseconds. After this interval elapses, an asynchronous thread writes the buffered data into Doris. Set to `0` to disable periodic writes. |
| `max_retries` | int | No | `1` | Flink | Number of retries after a write to Doris fails. |
| `doris.*` | string | No | - | Flink | Stream Load import parameters, for example `doris.column_separator = ','`. For more parameters, see the [Stream Load manual](../../data-operate/import/import-way/stream-load-manual.md). |

#### Example: Write Socket Data to Doris

```text
env {
    execution.parallelism = 1
}

source {
    SocketStream {
        host = 127.0.0.1
        port = 9999
        result_table_name = "socket"
        field_name = "info"
    }
}

transform {
}

sink {
    DorisSink {
        fenodes = "127.0.0.1:8030"
        user = root
        password = 123456
        database = test
        table = test_tbl
        batch_size = 5
        max_retries = 1
        interval = 5000
    }
}
```

Start the job:

```shell
sh bin/start-seatunnel-flink.sh --config config/flink.streaming.conf
```

### Use the Spark Engine to Write to Doris

For the plugin source code, see the [SeaTunnel Spark Sink Doris plugin code](https://github.com/apache/seatunnel).

#### Parameter Configuration

| Parameter | Type | Required | Default | Supported engine | Description |
| --- | --- | --- | --- | --- | --- |
| `fenodes` | string | Yes | - | Spark | Doris FE node address, for example `127.0.0.1:8030`. |
| `database` | string | Yes | - | Spark | Name of the database to write to in Doris. |
| `table` | string | Yes | - | Spark | Name of the table to write to in Doris. |
| `user` | string | Yes | - | Spark | Doris access user. |
| `password` | string | Yes | - | Spark | Password for the Doris access user. |
| `batch_size` | int | Yes | `100` | Spark | Number of rows submitted per batch when Spark writes to Doris through Stream Load. |
| `doris.*` | string | No | - | Spark | Stream Load HTTP parameters. Add the `doris.` prefix to any Stream Load parameter to use it, for example `doris.column_separator`. For more parameters, see the [Stream Load manual](../../data-operate/import/import-way/stream-load-manual.md). |

#### Example: Migrate Data from Hive to Doris

```text
env {
    spark.app.name = "hive2doris-template"
}

spark {
    spark.sql.catalogImplementation = "hive"
}

source {
    hive {
        preSql = "select * from tmp.test"
        result_table_name = "test"
    }
}

transform {
}

sink {
    Console {
    }

    Doris {
        fenodes = "xxxx:8030"
        database = "tmp"
        table = "test"
        user = "root"
        password = "root"
        batch_size = 1000
        doris.column_separator = "\t"
        doris.columns = "date_key,date_value,day_in_year,day_in_month"
    }
}
```

Start the job:

```shell
sh bin/start-waterdrop-spark.sh --master local[4] --deploy-mode client --config ./config/spark.conf
```
