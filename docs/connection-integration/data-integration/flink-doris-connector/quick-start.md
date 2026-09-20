---
{
    "title": "Quick Start",
    "language": "en",
    "description": "Deploy a Flink cluster and use Flink Doris Connector to read from and write to a Doris table with FlinkSQL."
}
---

# Quick Start

This page walks through a complete example, from deploying a Flink cluster to using FlinkSQL to read and write Doris data. Before you start, pick a Connector release that matches your Flink and Doris versions according to the [Version Notes](./overview.md#version-notes), and obtain the Jar package as described in [Installation](./overview.md#installation).

## 1. Deploy a Flink Cluster

Take a Standalone cluster as an example:

1. Download the [Flink 1.18.1](https://archive.apache.org/dist/flink/flink-1.18.1/flink-1.18.1-bin-scala_2.12.tgz) installation package.
2. After extracting, place the Flink Doris Connector Jar package under `<FLINK_HOME>/lib`.
3. Enter the `<FLINK_HOME>` directory and run `bin/start-cluster.sh` to start the Flink cluster.
4. Use the `jps` command to verify that the Flink cluster started successfully.

## 2. Initialize the Doris Table

Run the following SQL to create Doris tables and write test data:

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

## 3. Run a FlinkSQL Job

Start the FlinkSQL Client:

```shell
bin/sql-client.sh
```

Execute the following FlinkSQL:

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

## 4. Query the Result

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

## Next Steps

- [Reading Data from Doris](./read.md) and [Writing Data to Doris](./write.md): read protocols, write modes, and their options.
- [Full-Database Sync](./cdc-sync.md): sync MySQL and other databases to Doris with one command.
