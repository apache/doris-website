---
{
    "title": "Reading Data from Doris",
    "language": "en",
    "description": "Read Doris data in parallel with Flink Doris Connector through the Thrift or Arrow Flight SQL protocol, with the Source options."
}
---

# Reading Data from Doris

Flink Doris Connector can use a Doris table as the source of a Flink job. By default it reads a bounded snapshot of the table; to continuously read row-level changes, see [Incremental Reading with Doris Binlog](./incremental-read.md).

## Read Principle {#how-it-works}

![FlinkConnectorPrinciples-JDBC-Doris](/images/next/connection-integration/data-integration/flink-doris-connector.jpg)

Compared to Flink JDBC Connector, Flink Doris Connector offers higher performance when reading data and is recommended:

- **Flink JDBC Connector**: Although Doris is compatible with the MySQL protocol, reading and writing through JDBC causes data to be read and written serially on a single FE node, creating a bottleneck that affects performance. It is not recommended.
- **Flink Doris Connector**: Starting from Doris 2.1, the ADBC protocol is used as the default read protocol. The read process is as follows:
    1. Flink Doris Connector obtains the Tablet ID information in the query plan from FE.
    2. Generates the query statement `SELECT * FROM tbs TABLET(id1, id2, id3)`.
    3. Executes the query through FE's ADBC port.
    4. BE returns data directly, avoiding data flow through FE and eliminating the FE single-point bottleneck.

## Read Protocols {#protocols}

The following two read protocols are supported:

| Protocol       | Description                                                  | Recommended Version |
| -------------- | ------------------------------------------------------------ | ------------------- |
| Thrift         | Reads data by calling BE's thrift interface                  | Compatible with all versions |
| ArrowFlightSQL | Reads large batches of data at high speed via the Arrow Flight SQL protocol, based on Doris 2.1 | Connector 24.0.0+   |

- For details on the Thrift flow, see [Reading data through the Thrift interface](https://github.com/apache/doris/blob/master/samples/doris-demo/doris-source-demo/README.md).
- For details on ArrowFlightSQL usage, see [High-speed data transmission link based on Arrow Flight SQL](https://doris.apache.org/docs/dev/db-connect/arrow-flight-sql-connect/). After Doris 2.1, the ArrowFlightSQL method is recommended.

## FlinkSQL Read {#flink-sql}

### Thrift Method

```sql
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',  -- FE host:HttpPort
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = ''
);

SELECT * FROM student;
```

### Arrow Flight SQL Method

```sql
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '{fe.conf:http_port}',
    'table.identifier' = 'test.student',
    'source.use-flight-sql' = 'true',
    'source.flight-sql-port' = '{fe.conf:arrow_flight_sql_port}',
    'username' = 'root',
    'password' = ''
);

SELECT * FROM student;
```

## DataStream API Read

For reading with `DorisSource`, see [DataStream API](./datastream-api.md#source).

## Options {#options}

The general connection options are listed in [Connection Options and TLS](./connection.md#common-options); the options for incremental reading are listed in [Incremental Reading with Doris Binlog](./incremental-read.md#options).

| Key                         | Default Value | Required | Comment                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| doris.request.query.timeout | 21600s        | N        | Timeout for querying Doris. The default value is 6 hours.                                                                                              |
| doris.request.tablet.size   | 1             | N        | The number of Doris Tablets corresponding to one Partition. The smaller this value is set, the more Partitions will be generated, increasing parallelism on the Flink side, but also placing more pressure on Doris. |
| doris.batch.size            | 4064          | N        | The maximum number of rows read from BE at a time. Increasing this value can reduce the number of connections established between Flink and Doris, thereby reducing the additional time overhead caused by network latency. |
| doris.exec.mem.limit        | 8192mb        | N        | Memory limit for a single query. The default is 8GB, in bytes.                                                                                         |
| source.use-flight-sql       | TRUE          | N        | Whether to use Arrow Flight SQL for reading                                                                                                            |
| source.flight-sql-port      | -             | N        | When using Arrow Flight SQL for reading, the FE's `arrow_flight_sql_port`                                                                              |

**DataStream-Specific Configuration**

| Key                | Default Value | Required | Comment                                                                                       |
| ------------------ | ------------- | -------- | --------------------------------------------------------------------------------------------- |
| doris.read.field   | --            | N        | List of column names to read from the Doris table, separated by commas                        |
| doris.filter.query | --            | N        | An expression to filter the data being read; this expression is passed through to Doris, which uses it to filter data at the source. For example, `age=18`. |
