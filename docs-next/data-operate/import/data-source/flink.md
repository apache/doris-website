---
{
    "title": "Flink",
    "language": "en",
    "description": "How to use Flink Doris Connector to import Flink real-time data (Kafka, MySQL, etc.) into Doris? Includes complete steps for table creation, synchronization, and verification.",
    "keywords": [
        "Flink import to Doris",
        "Flink Doris Connector",
        "Flink CDC sync to Doris",
        "FlinkSQL write to Doris",
        "real-time data import to Doris",
        "Kafka MySQL sync to Doris"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Real-time data import / Streaming ETL -->

The **Flink Doris Connector** lets you import data produced by Flink (such as data Flink reads from Kafka or MySQL) into Doris in real time. It is suitable for real-time data ingestion and streaming ETL scenarios.

## Applicable scenarios

| Scenario | Description |
| --- | --- |
| Real-time data ingestion | Write data from message queues such as Kafka or Pulsar into Doris in real time |
| Database synchronization | Synchronize data from databases such as MySQL or Oracle to Doris through Flink CDC |
| Streaming ETL | Perform real-time computation with Flink and write the results to Doris |

## Limitations

- Requires a **Flink cluster** that you have already deployed.
- Requires the corresponding version of the **Flink Doris Connector** to be deployed in Flink.

## Procedure

For complete instructions on importing data with Flink, see [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md). The following minimal example shows how to quickly complete an import through Flink.

The overall workflow consists of the following three steps:

1. Create the target table in Doris
2. Write data through FlinkSQL in Flink
3. Verify in Doris that the data has been imported successfully

### Step 1: Create a table in Doris

Create the target table `students` in Doris to receive data from Flink:

```sql
CREATE TABLE `students` (
    `id` INT NULL,
    `name` VARCHAR(256) NULL,
    `age` INT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Step 2: Import data with Flink

Run `bin/sql-client.sh` to open the FlinkSQL console, and execute the following statements to create a sink table and write data:

```sql
CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
    )
    WITH (
      'connector' = 'doris',
      'fenodes' = '10.16.10.6:28737',
      'table.identifier' = 'test.students',
      'username' = 'root',
      'password' = '',
      'sink.label-prefix' = 'doris_label'
);

INSERT INTO student_sink values(1,'zhangsan',123)
```

The key parameters are described below:

| Parameter | Description |
| --- | --- |
| `connector` | Fixed as `doris`, indicating that the Flink Doris Connector is used |
| `fenodes` | The HTTP address of the Doris FE, in the format `host:http_port` |
| `table.identifier` | The identifier of the target table, in the format `database.table` |
| `username` | The Doris login username |
| `password` | The Doris login password |
| `sink.label-prefix` | The Label prefix for the Stream Load import task. It must be globally unique |

### Step 3: Check the imported data

Query the target table in Doris to confirm that the data has been imported successfully:

```sql
select * from test.students;
+------+----------+------+
| id   | name     | age  |
+------+----------+------+
|  1   | zhangsan |  123 |
+------+----------+------+
```

## FAQ

**Q1: Which data sources does the Flink Doris Connector support?**

In theory, all data sources supported by Flink (Kafka, MySQL CDC, file systems, message queues, etc.) can be used as upstream sources, processed by Flink, and then written to Doris.

**Q2: Why does `sink.label-prefix` need to be unique?**

The Flink Doris Connector implements imports based on Doris Stream Load. Each transaction requires a unique Label to guarantee Exactly-Once semantics. Duplicate Labels cause import conflicts.

**Q3: Which port should `fenodes` use?**

`fenodes` takes the **HTTP port** of the Doris FE (default `8030`), not the MySQL protocol port (default `9030`).

**Q4: How can I synchronize data from databases such as MySQL or Oracle to Doris?**

You can use it together with Flink CDC. For details, see the [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md) documentation.

## Related documents

- [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md)
