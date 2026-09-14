---
{
    "title": "快速开始",
    "language": "zh-CN",
    "description": "从部署 Flink 集群开始，使用 Flink Doris Connector 通过 FlinkSQL 完成一次 Doris 表的读取和写入。"
}
---

# 快速开始

通过一个完整示例演示从部署 Flink 集群到使用 FlinkSQL 完成 Doris 数据读写的全流程。开始前请根据 [版本说明](./overview.md#version-notes) 选择与 Flink 和 Doris 版本匹配的 Connector，并参考 [安装方式](./overview.md#installation) 获取 Jar 包。

## 1. 部署 Flink 集群

以 Standalone 集群为例：

1. 下载 [Flink 1.18.1](https://archive.apache.org/dist/flink/flink-1.18.1/flink-1.18.1-bin-scala_2.12.tgz) 安装包。
2. 解压后，将 Flink Doris Connector Jar 包放到 `<FLINK_HOME>/lib` 下。
3. 进入 `<FLINK_HOME>` 目录，运行 `bin/start-cluster.sh` 启动 Flink 集群。
4. 通过 `jps` 命令验证 Flink 集群是否成功启动。

## 2. 初始化 Doris 表

执行以下 SQL 创建 Doris 表并写入测试数据：

```sql
CREATE DATABASE test;

CREATE TABLE test.student (
    `id` INT,
    `name` VARCHAR(256),
    `age` INT
)
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);

INSERT INTO test.student values(1, "James", 18);
INSERT INTO test.student values(2, "Emily", 28);

CREATE TABLE test.student_trans (
    `id` INT,
    `name` VARCHAR(256),
    `age` INT
)
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

## 3. 运行 FlinkSQL 任务

启动 FlinkSQL Client：

```shell
bin/sql-client.sh
```

执行如下 FlinkSQL：

```sql
CREATE TABLE Student (
    id STRING,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = ''
);

CREATE TABLE StudentTrans (
    id STRING,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student_trans',
    'username' = 'root',
    'password' = '',
    'sink.label-prefix' = 'doris_label'
);

INSERT INTO StudentTrans SELECT id, concat('prefix_', name), age + 1 FROM Student;
```

## 4. 查询结果

```text
mysql> select * from test.student_trans;
+------+--------------+------+
| id   | name         | age  |
+------+--------------+------+
|    1 | prefix_James |   19 |
|    2 | prefix_Emily |   29 |
+------+--------------+------+
2 rows in set (0.02 sec)
```

## 下一步

- [读取 Doris 数据](./read.md) 和 [写入 Doris 数据](./write.md)：了解读取协议、写入模式和相关配置项。
- [整库同步](./cdc-sync.md)：一条命令把 MySQL 等数据库同步到 Doris。
