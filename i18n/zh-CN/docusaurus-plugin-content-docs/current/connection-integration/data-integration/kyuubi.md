---
{
    "title": "Kyuubi",
    "language": "zh-CN",
    "description": "通过 Apache Kyuubi 对接 Apache Doris 的完整配置指南，涵盖 JDBC Engine 配置、MySQL 驱动安装与 Thrift 协议查询使用方法。"
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: Apache Kyuubi 对接 Apache Doris 作为 JDBC 数据源 -->

[Apache Kyuubi](https://kyuubi.apache.org/) 是一个分布式和多租户网关，用于在 Lakehouse 上提供 Serverless SQL，可连接 Spark、Flink、Hive、JDBC 等引擎，并对外提供 Thrift、Trino 等接口协议以灵活对接下游应用。Apache Kyuubi 实现了 JDBC Engine 并支持 Doris 方言，可作为 Doris 的统一接入网关，提供高可用、服务发现、租户隔离、统一认证、生命周期管理等特性。

## 适用场景

- 需要为 Doris 提供统一接入网关，实现服务发现与高可用
- 需要在多租户环境下进行租户隔离与统一认证
- 需要通过 Thrift 协议（兼容 HiveServer2）访问 Doris
- 需要将 Doris 与 Spark、Flink、Hive 等引擎统一在 Lakehouse 网关之下

## 环境要求

| 项目                | 要求                                       |
| ------------------- | ------------------------------------------ |
| Apache Kyuubi 版本  | 1.6.0 及以上                               |
| Doris 接入端口      | FE MySQL 协议端口（默认 9030）             |
| Kyuubi 监听端口     | Thrift 协议端口（默认 10009）              |
| 依赖驱动            | MySQL JDBC 驱动 `mysql-connector-j-8.x.x.jar` |

## 部署步骤

整体流程如下：

1. 下载并解压 Apache Kyuubi
2. 配置 Doris 作为 Kyuubi 的 JDBC 数据源
3. 添加 MySQL JDBC 驱动
4. 启动 Kyuubi 服务

### 1. 下载 Apache Kyuubi

从官网下载 Apache Kyuubi 1.6.0 或以上版本的安装包，并解压至部署目录。

下载地址：<https://kyuubi.apache.org/releases.html>

### 2. 配置 Doris 作为 Kyuubi 数据源

修改配置文件 `$KYUUBI_HOME/conf/kyuubi-defaults.conf`，添加以下内容：

```properties
kyuubi.engine.type=jdbc
kyuubi.engine.jdbc.type=doris
kyuubi.engine.jdbc.driver.class=com.mysql.cj.jdbc.Driver
kyuubi.engine.jdbc.connection.url=jdbc:mysql://xxx:xxx
kyuubi.engine.jdbc.connection.user=***
kyuubi.engine.jdbc.connection.password=***
```

配置项说明：

| 配置项                                   | 说明                                                            |
| ---------------------------------------- | --------------------------------------------------------------- |
| `kyuubi.engine.type`                     | 引擎类型，请使用 `jdbc`                                         |
| `kyuubi.engine.jdbc.type`                | JDBC 服务类型，这里请指定为 `doris`                             |
| `kyuubi.engine.jdbc.driver.class`        | 连接 JDBC 服务使用的驱动类名，请使用 `com.mysql.cj.jdbc.Driver` |
| `kyuubi.engine.jdbc.connection.url`      | JDBC 服务连接地址，这里请指定 Doris FE 上的 MySQL Server 连接地址 |
| `kyuubi.engine.jdbc.connection.user`     | JDBC 服务用户名                                                 |
| `kyuubi.engine.jdbc.connection.password` | JDBC 服务密码                                                   |

更多相关配置请参考 [Apache Kyuubi 配置说明](https://kyuubi.readthedocs.io/en/master/configuration/settings.html)。

### 3. 添加 MySQL 驱动

将 MySQL JDBC 驱动 `mysql-connector-j-8.x.x.jar` 复制到 `$KYUUBI_HOME/externals/engines/jdbc` 目录下。

### 4. 启动 Kyuubi 服务

执行以下命令启动 Kyuubi：

```shell
$KYUUBI_HOME/bin/kyuubi start
```

启动成功后，Kyuubi 默认监听 `10009` 端口并提供 Thrift 协议接入。

## 使用示例

以下示例展示如何通过 Apache Kyuubi 自带的 beeline 工具，经 Thrift 协议查询 Doris 数据。

### 1. 建立连接

使用 beeline 连接 Kyuubi 服务：

```shell
$KYUUBI_HOME/bin/beeline -u "jdbc:hive2://xxxx:10009/"
```

### 2. 执行查询

执行查询语句 `select * from demo.example_tbl;`，预期输出如下：

```shell
0: jdbc:hive2://xxxx:10009/> select * from demo.example_tbl;

2023-03-07 09:29:14.771 INFO org.apache.kyuubi.operation.ExecuteStatement: Processing anonymous's query[bdc59dd0-ceea-4c02-8c3a-23424323f5db]: PENDING_STATE -> RUNNING_STATE, statement:
select * from demo.example_tbl
2023-03-07 09:29:14.786 INFO org.apache.kyuubi.operation.ExecuteStatement: Query[bdc59dd0-ceea-4c02-8c3a-23424323f5db] in FINISHED_STATE
2023-03-07 09:29:14.787 INFO org.apache.kyuubi.operation.ExecuteStatement: Processing anonymous's query[bdc59dd0-ceea-4c02-8c3a-23424323f5db]: RUNNING_STATE -> FINISHED_STATE, time taken: 0.015 seconds
+----------+-------------+-------+------+------+------------------------+-------+-----------------+-----------------+
| user_id  |    date     | city  | age  | sex  |    last_visit_date     | cost  | max_dwell_time  | min_dwell_time  |
+----------+-------------+-------+------+------+------------------------+-------+-----------------+-----------------+
| 10000    | 2017-10-01  | 北京   | 20   | 0    | 2017-10-01 07:00:00.0  | 70    | 10              | 2               |
| 10001    | 2017-10-01  | 北京   | 30   | 1    | 2017-10-01 17:05:45.0  | 4     | 22              | 22              |
| 10002    | 2017-10-02  | 上海   | 20   | 1    | 2017-10-02 12:59:12.0  | 400   | 5               | 5               |
| 10003    | 2017-10-02  | 广州   | 32   | 0    | 2017-10-02 11:20:00.0  | 60    | 11              | 11              |
| 10004    | 2017-10-01  | 深圳   | 35   | 0    | 2017-10-01 10:00:15.0  | 200   | 3               | 3               |
| 10004    | 2017-10-03  | 深圳   | 35   | 0    | 2017-10-03 10:20:22.0  | 22    | 6               | 6               |
+----------+-------------+-------+------+------+------------------------+-------+-----------------+-----------------+
6 rows selected (0.068 seconds)
```
