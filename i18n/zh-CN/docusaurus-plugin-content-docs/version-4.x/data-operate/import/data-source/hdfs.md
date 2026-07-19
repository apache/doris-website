---
{
    "title": "从 HDFS 导入数据",
    "language": "zh-CN",
    "description": "介绍如何使用 HDFS Load（异步）和 TVF（同步）两种方式将 HDFS 文件导入 Apache Doris，包含完整步骤与示例。",
    "sidebar_label": "HDFS",
    "keywords": [
        "Doris HDFS 导入",
        "HDFS Load",
        "HDFS TVF",
        "Broker Load",
        "Hadoop 数据导入",
        "异步导入",
        "同步导入",
        "fs.defaultFS",
        "hadoop.username"
    ]
}
---

<!-- 知识类型: 操作步骤 / 数据导入 -->
<!-- 适用场景: 从 HDFS 导入数据到 Doris -->

Apache Doris 提供两种方式从 HDFS 导入文件，分别适用于不同的业务场景。

## 方案选型

在开始操作前，建议根据数据量、时延要求与业务场景选择合适的导入方式：

| 导入方式 | 执行模式 | 适用场景 | 参考文档 |
|----------|----------|----------|----------|
| **HDFS Load** | 异步 | 大批量、定时离线任务，导入完成后无需阻塞当前会话 | [Broker Load 手册](../import-way/broker-load-manual.md) |
| **TVF（Table-Valued Function）** | 同步 | 小批量数据导入、Ad-hoc 查询场景，可与 `INSERT INTO ... SELECT` 灵活组合 | 本文档下方示例 |

> 提示：两种方式都依赖正确的 HDFS 连接参数（`fs.defaultFS`、`hadoop.username` 等），请确保 Doris 集群与 HDFS 网络可达。

---

## 方式一：使用 HDFS Load 导入（异步）

<!-- 知识类型: 操作步骤 -->

HDFS Load 是基于 Broker Load 的异步导入方式，适合大批量数据加载。完整能力请参考 [Broker Load 手册](../import-way/broker-load-manual.md)。

### 第 1 步：准备 HDFS 数据文件

在 HDFS 上创建 CSV 文件 `hdfsload_example.csv`，内容如下：

```text
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

### 第 2 步：在 Doris 中创建目标表

```sql
CREATE TABLE test_hdfsload(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 第 3 步：提交 HDFS Load 任务

```sql
LOAD LABEL hdfs_load_2022_04_01
(
    DATA INFILE("hdfs://127.0.0.1:8020/tmp/hdfsload_example.csv")
    INTO TABLE test_hdfsload
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (user_id, name, age)
)
with HDFS
(
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",
    "hadoop.username" = "user"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

关键参数说明：

| 参数 | 说明 |
|------|------|
| `LABEL` | 导入任务的唯一标识，用于追踪与去重 |
| `DATA INFILE` | HDFS 文件路径 |
| `COLUMNS TERMINATED BY` | 列分隔符，与源文件保持一致 |
| `FORMAT AS` | 文件格式，此处为 `CSV` |
| `fs.defaultFS` | HDFS NameNode 地址 |
| `hadoop.username` | 访问 HDFS 的用户名 |
| `timeout` | 任务超时时间（秒） |

### 第 4 步：检查导入结果

```sql
SELECT * FROM test_hdfsload;
```

预期输出：

```text
mysql> select * from test_hdfsload;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

---

## 方式二：使用 TVF 导入（同步）

<!-- 知识类型: 操作步骤 -->

TVF（Table-Valued Function）是一种同步导入方式，适合通过 `INSERT INTO ... SELECT` 灵活地从 HDFS 读取并写入 Doris。

### 第 1 步：准备 HDFS 数据文件

在 HDFS 上创建 CSV 文件 `hdfsload_example.csv`，内容如下：

```text
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

### 第 2 步：在 Doris 中创建目标表

```sql
CREATE TABLE test_hdfsload(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 第 3 步：通过 TVF 同步导入数据

```sql
INSERT INTO test_hdfsload
SELECT * FROM hdfs (
    "uri" = "hdfs://127.0.0.1:8020/tmp/hdfsload_example.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",
    "hadoop.username" = "doris",
    "format" = "csv",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

关键参数说明：

| 参数 | 说明 |
|------|------|
| `uri` | HDFS 文件的完整路径 |
| `fs.defaultFS` | HDFS NameNode 地址 |
| `hadoop.username` | 访问 HDFS 的用户名 |
| `format` | 文件格式，例如 `csv` |
| `csv_schema` | CSV 文件的列定义，格式 `列名:类型;列名:类型` |

### 第 4 步：检查导入结果

```sql
SELECT * FROM test_hdfsload;
```

预期输出：

```text
mysql> select * from test_hdfsload;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

---

## 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 导入失败排查 / 参数选择 -->

### Q1：HDFS Load 与 TVF 该如何选择？

- 数据量较大、可接受异步执行：选择 **HDFS Load**。
- 数据量较小、需要立即拿到导入结果，或希望与 `INSERT INTO ... SELECT` 组合做转换：选择 **TVF**。

### Q2：连接 HDFS 时常见的必填参数有哪些？

- `fs.defaultFS`：HDFS NameNode 地址，必填。
- `hadoop.username`：访问 HDFS 的用户名，必填。
- 如启用 Kerberos 等认证，需补充对应的认证配置。

### Q3：TVF 中 `csv_schema` 怎么写？

格式为 `列名:类型;列名:类型`，例如 `user_id:int;name:string;age:int`，需与 CSV 文件的实际列顺序、类型一致。

### Q4：HDFS Load 任务超时怎么办？

可调整 `PROPERTIES` 中的 `timeout`（单位：秒），默认 3600。对于大文件可适当调大。

### Q5：导入结果为什么顺序与源文件不一致？

Doris 是分布式存储引擎，`SELECT *` 默认不保证顺序。如需有序输出，请显式添加 `ORDER BY`。

