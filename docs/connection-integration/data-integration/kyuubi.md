---
{
    "title": "Kyuubi",
    "language": "en",
    "description": "A complete configuration guide for integrating Apache Doris with Apache Kyuubi, covering JDBC Engine setup, MySQL driver installation, and query usage over the Thrift protocol."
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Integrating Apache Kyuubi with Apache Doris as a JDBC data source -->

[Apache Kyuubi](https://kyuubi.apache.org/) is a distributed and multi-tenant gateway that provides Serverless SQL on Lakehouse. It can connect to engines such as Spark, Flink, Hive, and JDBC, and exposes interface protocols such as Thrift and Trino so that downstream applications can integrate with it flexibly. Apache Kyuubi implements a JDBC Engine and supports the Doris dialect, which lets it serve as a unified access gateway for Doris and provide features such as high availability, service discovery, tenant isolation, unified authentication, and lifecycle management.

## Use Cases

- You need a unified access gateway for Doris that provides service discovery and high availability.
- You need tenant isolation and unified authentication in a multi-tenant environment.
- You need to access Doris over the Thrift protocol (compatible with HiveServer2).
- You need to unify Doris with engines such as Spark, Flink, and Hive under a single Lakehouse gateway.

## Environment Requirements

| Item                   | Requirement                                       |
| ---------------------- | ------------------------------------------------- |
| Apache Kyuubi version  | 1.6.0 or above                                    |
| Doris access port      | FE MySQL protocol port (default `9030`)           |
| Kyuubi listening port  | Thrift protocol port (default `10009`)            |
| Required driver        | MySQL JDBC driver `mysql-connector-j-8.x.x.jar`   |

## Deployment Steps

The overall procedure is as follows:

1. Download and extract Apache Kyuubi.
2. Configure Doris as a JDBC data source for Kyuubi.
3. Add the MySQL JDBC driver.
4. Start the Kyuubi service.

### 1. Download Apache Kyuubi

Download the Apache Kyuubi 1.6.0 or later installation package from the official website and extract it to your deployment directory.

Download URL: <https://kyuubi.apache.org/releases.html>

### 2. Configure Doris as a Kyuubi data source

Modify the configuration file `$KYUUBI_HOME/conf/kyuubi-defaults.conf` and add the following content:

```properties
kyuubi.engine.type=jdbc
kyuubi.engine.jdbc.type=doris
kyuubi.engine.jdbc.driver.class=com.mysql.cj.jdbc.Driver
kyuubi.engine.jdbc.connection.url=jdbc:mysql://xxx:xxx
kyuubi.engine.jdbc.connection.user=***
kyuubi.engine.jdbc.connection.password=***
```

Configuration item descriptions:

| Configuration item                       | Description                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `kyuubi.engine.type`                     | Engine type. Use `jdbc`.                                                                     |
| `kyuubi.engine.jdbc.type`                | JDBC service type. Specify `doris` here.                                                     |
| `kyuubi.engine.jdbc.driver.class`        | Driver class name used to connect to the JDBC service. Use `com.mysql.cj.jdbc.Driver`.       |
| `kyuubi.engine.jdbc.connection.url`      | JDBC service connection URL. Specify the MySQL Server address on Doris FE here.              |
| `kyuubi.engine.jdbc.connection.user`     | JDBC service username.                                                                       |
| `kyuubi.engine.jdbc.connection.password` | JDBC service password.                                                                       |

For more related configurations, see the [Apache Kyuubi configuration reference](https://kyuubi.readthedocs.io/en/master/configuration/settings.html).

### 3. Add the MySQL driver

Copy the MySQL JDBC driver `mysql-connector-j-8.x.x.jar` to the `$KYUUBI_HOME/externals/engines/jdbc` directory.

### 4. Start the Kyuubi service

Run the following command to start Kyuubi:

```shell
$KYUUBI_HOME/bin/kyuubi start
```

After startup succeeds, Kyuubi listens on port `10009` by default and provides access over the Thrift protocol.

## Usage Example

The following example shows how to query Doris data over the Thrift protocol using the beeline tool that ships with Apache Kyuubi.

### 1. Establish a connection

Use beeline to connect to the Kyuubi service:

```shell
$KYUUBI_HOME/bin/beeline -u "jdbc:hive2://xxxx:10009/"
```

### 2. Execute a query

Run the query `select * from demo.example_tbl;`. The expected output is as follows:

```shell
0: jdbc:hive2://xxxx:10009/> select * from demo.example_tbl;

2023-03-07 09:29:14.771 INFO org.apache.kyuubi.operation.ExecuteStatement: Processing anonymous's query[bdc59dd0-ceea-4c02-8c3a-23424323f5db]: PENDING_STATE -> RUNNING_STATE, statement:
select * from demo.example_tbl
2023-03-07 09:29:14.786 INFO org.apache.kyuubi.operation.ExecuteStatement: Query[bdc59dd0-ceea-4c02-8c3a-23424323f5db] in FINISHED_STATE
2023-03-07 09:29:14.787 INFO org.apache.kyuubi.operation.ExecuteStatement: Processing anonymous's query[bdc59dd0-ceea-4c02-8c3a-23424323f5db]: RUNNING_STATE -> FINISHED_STATE, time taken: 0.015 seconds
+----------+-------------+-----------+------+------+------------------------+-------+-----------------+-----------------+
| user_id  |    date     |   city    | age  | sex  |    last_visit_date     | cost  | max_dwell_time  | min_dwell_time  |
+----------+-------------+-----------+------+------+------------------------+-------+-----------------+-----------------+
| 10000    | 2017-10-01  | Beijing   | 20   | 0    | 2017-10-01 07:00:00.0  | 70    | 10              | 2               |
| 10001    | 2017-10-01  | Beijing   | 30   | 1    | 2017-10-01 17:05:45.0  | 4     | 22              | 22              |
| 10002    | 2017-10-02  | Shanghai  | 20   | 1    | 2017-10-02 12:59:12.0  | 400   | 5               | 5               |
| 10003    | 2017-10-02  | Guangzhou | 32   | 0    | 2017-10-02 11:20:00.0  | 60    | 11              | 11              |
| 10004    | 2017-10-01  | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15.0  | 200   | 3               | 3               |
| 10004    | 2017-10-03  | Shenzhen  | 35   | 0    | 2017-10-03 10:20:22.0  | 22    | 6               | 6               |
+----------+-------------+-----------+------+------+------------------------+-------+-----------------+-----------------+
6 rows selected (0.068 seconds)
```
