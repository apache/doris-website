---
{
    "title": "Flink",
    "language": "zh-CN",
    "description": "如何使用 Flink Doris Connector 将 Flink 实时数据（Kafka、MySQL 等）导入 Doris？包含建表、同步、验证完整步骤。",
    "keywords": [
        "Flink 导入 Doris",
        "Flink Doris Connector",
        "Flink CDC 同步 Doris",
        "FlinkSQL 写入 Doris",
        "实时数据导入 Doris",
        "Kafka MySQL 同步 Doris"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 实时数据导入 / 流式 ETL -->

使用 **Flink Doris Connector** 可以实时地将 Flink 产生的数据（如：Flink 读取 Kafka、MySQL 中的数据）导入到 Doris 中，适用于实时数据接入与流式 ETL 场景。

## 适用场景

| 场景 | 说明 |
| --- | --- |
| 实时数据接入 | 从 Kafka、Pulsar 等消息队列将数据实时写入 Doris |
| 数据库同步 | 通过 Flink CDC 将 MySQL、Oracle 等数据库的数据同步至 Doris |
| 流式 ETL | 利用 Flink 完成实时计算后将结果写入 Doris |

## 使用限制

- 需要依赖用户已部署的 **Flink 集群**。
- 需要在 Flink 中部署对应版本的 **Flink Doris Connector**。

## 操作步骤

使用 Flink 导入数据的完整说明可参考 [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md)。下文以一个最小示例演示如何通过 Flink 快速完成导入。

整体流程包含以下三步：

1. 在 Doris 中创建目标表
2. 在 Flink 中通过 FlinkSQL 写入数据
3. 在 Doris 中验证数据是否导入成功

### 第 1 步：在 Doris 中创建表

在 Doris 中创建目标表 `students`，用于接收来自 Flink 的数据：

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

### 第 2 步：使用 Flink 导入数据

运行 `bin/sql-client.sh` 打开 FlinkSQL 的控制台，并执行以下语句创建 Sink 表并写入数据：

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

其中关键参数说明如下：

| 参数 | 说明 |
| --- | --- |
| `connector` | 固定为 `doris`，表示使用 Flink Doris Connector |
| `fenodes` | Doris FE 的 HTTP 地址，格式为 `host:http_port` |
| `table.identifier` | 目标表的标识，格式为 `database.table` |
| `username` | Doris 登录用户名 |
| `password` | Doris 登录密码 |
| `sink.label-prefix` | Stream Load 导入任务的 Label 前缀，需保证全局唯一 |

### 第 3 步：检查导入数据

在 Doris 中查询目标表，确认数据已成功导入：

```sql
select * from test.students;
+------+----------+------+
| id   | name     | age  |
+------+----------+------+
|  1   | zhangsan |  123 |
+------+----------+------+
```

## 常见问题（FAQ）

**Q1：Flink Doris Connector 支持哪些数据源？**

理论上 Flink 所支持的所有数据源（Kafka、MySQL CDC、文件系统、消息队列等）都可以作为上游，经 Flink 处理后写入 Doris。

**Q2：`sink.label-prefix` 为什么需要保证唯一？**

Flink Doris Connector 基于 Doris 的 Stream Load 实现导入，每个事务都需要唯一的 Label 来保证 Exactly-Once 语义，重复的 Label 会导致导入冲突。

**Q3：`fenodes` 应该填写哪个端口？**

`fenodes` 填写的是 Doris FE 的 **HTTP 端口**（默认 `8030`），而非 MySQL 协议端口（默认 `9030`）。

**Q4：如何同步 MySQL/Oracle 等数据库的数据到 Doris？**

可结合 Flink CDC 使用，详细方案请参考 [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md) 文档。

## 相关文档

- [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md)
