---
{
    "title": "读取 Doris 数据",
    "language": "zh-CN",
    "description": "使用 Flink Doris Connector 通过 Thrift 或 Arrow Flight SQL 协议从 Doris 并行读取数据，以及 Source 相关配置项。"
}
---

# 读取 Doris 数据

Flink Doris Connector 可以把 Doris 表作为 Flink 作业的数据源。默认读取表当前的有界快照；如需持续读取表的行级变更，见 [增量读取 Doris Binlog](./incremental-read.md)。

## 读取原理 {#how-it-works}

![FlinkConnectorPrinciples-JDBC-Doris](/images/next/connection-integration/data-integration/flink-doris-connector.jpg)

相较于 Flink JDBC Connector，Flink Doris Connector 在读取数据时具备更高的性能，推荐优先使用：

- **Flink JDBC Connector**：虽然 Doris 兼容 MySQL 协议，但通过 JDBC 读写会导致数据在单个 FE 节点上串行读写，形成瓶颈，影响性能，不建议使用。
- **Flink Doris Connector**：自 Doris 2.1 版本起，默认使用 ADBC 协议作为读取协议。读取流程如下：
    1. Flink Doris Connector 从 FE 获取查询计划中的 Tablet ID 信息。
    2. 生成查询语句 `SELECT * FROM tbs TABLET(id1, id2, id3)`。
    3. 通过 FE 的 ADBC 端口执行查询。
    4. 由 BE 直接返回数据，避免数据流经 FE，从而消除 FE 单点瓶颈。

## 读取协议 {#protocols}

支持以下两种读取协议：

| 协议           | 说明                                                         | 推荐版本           |
| -------------- | ------------------------------------------------------------ | ------------------ |
| Thrift         | 通过调用 BE 的 thrift 接口读取数据                           | 兼容所有版本       |
| ArrowFlightSQL | 基于 Doris 2.1，通过 Arrow Flight SQL 协议高速读取大批量数据 | Connector 24.0.0+  |

- Thrift 详细流程参考 [通过 Thrift 接口读取数据](https://github.com/apache/doris/blob/master/samples/doris-demo/doris-source-demo/README.md)。
- ArrowFlightSQL 详细使用参考 [基于 Arrow Flight SQL 的高速数据传输链路](https://doris.apache.org/docs/dev/db-connect/arrow-flight-sql-connect/)。Doris 2.1 版本后，推荐使用 ArrowFlightSQL 方式。

## FlinkSQL 读取 {#flink-sql}

### Thrift 方式

```sql
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',  -- FE 的 host:HttpPort
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = ''
);

SELECT * FROM student;
```

### Arrow Flight SQL 方式

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

## DataStream API 读取

通过 `DorisSource` 读取的示例见 [DataStream API 读写](./datastream-api.md#source)。

## 配置项 {#options}

连接相关的通用配置项见 [连接配置与 TLS](./connection.md#common-options)，增量读取相关的配置项见 [增量读取 Doris Binlog](./incremental-read.md#options)。

| Key                         | Default Value | Required | Comment                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| doris.request.query.timeout | 21600s        | N        | 查询 Doris 的超时时间，默认值为 6 小时                                                                                                                 |
| doris.request.tablet.size   | 1             | N        | 一个 Partition 对应的 Doris Tablet 个数。此数值设置越小，则会生成越多的 Partition，从而提升 Flink 侧的并行度，但同时会对 Doris 造成更大的压力。         |
| doris.batch.size            | 4064          | N        | 一次从 BE 读取数据的最大行数。增大此数值可减少 Flink 与 Doris 之间建立连接的次数，从而减轻网络延迟所带来的额外时间开销。                               |
| doris.exec.mem.limit        | 8192mb        | N        | 单个查询的内存限制。默认为 8GB，单位为字节                                                                                                             |
| source.use-flight-sql       | TRUE          | N        | 是否使用 Arrow Flight SQL 读取                                                                                                                         |
| source.flight-sql-port      | -             | N        | 使用 Arrow Flight SQL 读取时，FE 的 `arrow_flight_sql_port`                                                                                            |

**DataStream 专有配置项**

| Key                | Default Value | Required | Comment                                                                                       |
| ------------------ | ------------- | -------- | --------------------------------------------------------------------------------------------- |
| doris.read.field   | --            | N        | 读取 Doris 表的列名列表，多列之间使用逗号分隔                                                 |
| doris.filter.query | --            | N        | 过滤读取数据的表达式，此表达式透传给 Doris。Doris 使用此表达式完成源端数据过滤。比如 `age=18` |
