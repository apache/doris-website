---
{
    "title": "OceanBase CDC 自动建表同步",
    "language": "zh-CN",
    "sidebar_label": "自动建表同步",
    "description": "介绍如何通过 Doris Streaming Job 将 OceanBase MySQL 兼容模式下主键表的全量与增量数据持续同步到 Doris。",
    "keywords": [
        "OceanBase 自动建表同步",
        "OceanBase CDC",
        "OBBinlog",
        "Doris Streaming Job",
        "持续导入",
        "全量加增量同步",
        "自动建表"
    ]
}
---

<!-- 知识类型: 操作步骤 + 配置参数 -->
<!-- 适用场景: OceanBase MySQL 兼容模式整库镜像同步到 Doris -->

OceanBase CDC 自动建表同步通过 `FROM OCEANBASE (...) TO DATABASE (...)` 实现。Doris 从 OBBinlog 服务读取 OceanBase 的全量和增量数据，并根据上游表结构自动创建 Doris 主键表。可以通过 `include_tables` 同步一张、多张或全部表。

:::caution 实验性功能

OceanBase CDC 持续导入自 Doris 4.1.4 起作为实验性功能提供。目前仅支持 OceanBase 的 MySQL 兼容模式和自动建表同步，不支持 Oracle 兼容模式与 SQL 映射同步。

:::

### 适用场景

- 将 OceanBase 中的一组表或整个数据库镜像到 Doris。
- 由 Doris 根据上游表结构和主键自动创建目标表。
- 需要先完成全量初始化，再持续同步增量变更。
- 只需要目标表重命名或列裁剪，不需要 SQL 表达式、行过滤或数据转换。

### 能力与限制

| 项目 | 说明 |
| --- | --- |
| 兼容模式 | 仅支持 OceanBase MySQL 兼容模式 |
| 同步方式 | 仅支持自动建表同步，不支持 SQL 映射同步 |
| 一致性语义 | at-least-once |
| 表类型 | 上游表必须有主键；自动创建的 Doris 表为主键模型表（Unique Key） |
| 权限要求 | 需要 Load 权限；目标表不存在时还需要 Create 权限 |
| Schema Change | 支持同步 `ADD COLUMN` 和 `DROP COLUMN`，详见 [Schema Change 同步](./schema-change-oceanbase.md) |
| 数据类型 | 复用 MySQL 兼容类型映射，详见 [数据类型映射](./data-type-mapping-oceanbase.md) |

## 前置准备

创建作业前，请确认：

1. OceanBase 运行在 MySQL 兼容模式。Doris 创建作业时会执行 `SHOW VARIABLES LIKE 'ob_compatibility_mode'` 进行校验。
2. OBBinlog 服务已部署并可用，通过其 MySQL 协议地址执行 `SHOW MASTER STATUS` 能返回有效的 Binlog 文件名和位点。
3. Doris FE、BE 与 CDC Client 均可访问 OBBinlog 服务。
4. 已准备兼容的 MySQL Connector/J 驱动；`jdbc_url` 必须以 `jdbc:mysql://` 开头。
5. 源端账号可以读取待同步表、表结构和 Binlog。
6. 待同步的上游表具有主键。

## 快速上手

### 第一步：创建导入作业

以下示例同步 `source_db` 中的 `users` 和 `orders` 表：

```sql
CREATE JOB oceanbase_db_sync
ON STREAMING
FROM OCEANBASE (
    "jdbc_url" = "jdbc:mysql://127.0.0.1:2883",
    "driver_url" = "mysql-connector-j-8.4.0.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user" = "root@test",
    "password" = "123456",
    "database" = "source_db",
    "include_tables" = "users,orders",
    "offset" = "initial"
)
TO DATABASE target_db (
    "table.create.properties.replication_num" = "1"
);
```

- `jdbc_url` 应指向 OBBinlog 服务的 MySQL 协议端口，具体端口以实际部署为准。
- `offset = "initial"` 表示先同步存量数据，再持续同步 Binlog 增量。
- `include_tables` 未设置时，同步 `database` 中所有符合要求的表。
- 单 BE 部署需要将 `replication_num` 设为 `1`；生产环境请按集群规模设置副本数。

### 第二步：查看导入状态

```sql
SELECT Name, Status, CurrentOffset, ErrorMsg
FROM jobs("type" = "insert")
WHERE Name = "oceanbase_db_sync";
```

作业正常运行时，`Status` 为 `RUNNING`：

```text
+-------------------+---------+------------------------------------------------+----------+
| Name              | Status  | CurrentOffset                                  | ErrorMsg |
+-------------------+---------+------------------------------------------------+----------+
| oceanbase_db_sync | RUNNING | {"file":"binlog.000001","pos":"154", ...} | NULL     |
+-------------------+---------+------------------------------------------------+----------+
```

### 第三步：验证增量同步

在 OceanBase 源表执行 `INSERT`、`UPDATE` 或 `DELETE` 后，查询对应 Doris 表，确认变更已同步：

```sql
SELECT * FROM target_db.users ORDER BY id;
```

更多暂停、恢复、删除和 Task 查询操作请参见[持续导入概览](./continuous-load-overview.md#通用操作)。

## 数据源参数

| 参数 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `jdbc_url` | 是 | - | OBBinlog 服务的 JDBC 连接串，必须以 `jdbc:mysql://` 开头。 |
| `driver_url` | 是 | - | MySQL Connector/J 驱动 jar 包路径，支持文件名、本地绝对路径或 HTTP URL。 |
| `driver_class` | 是 | - | MySQL JDBC 驱动类名，例如 `com.mysql.cj.jdbc.Driver`。 |
| `user` | 是 | - | OceanBase 用户名；租户信息按 OceanBase 的用户名格式填写。 |
| `password` | 是 | - | OceanBase 用户密码。 |
| `database` | 是 | - | OceanBase 数据库名。 |
| `include_tables` | 否 | - | 要同步的表名，多个表用逗号分隔；不设置时同步数据库中的全部表。 |
| `exclude_tables` | 否 | - | 不同步的表名，多个表用逗号分隔；仅在未设置 `include_tables` 时生效。 |
| `table.<table_name>.target_table` | 否 | 源表名 | 为指定源表设置 Doris 目标表名。 |
| `table.<table_name>.exclude_columns` | 否 | - | 排除指定源表中的非主键列，多个列用逗号分隔。列必须存在，且不能排除主键列。 |
| `offset` | 否 | `latest` | `initial`：全量 + 增量；`snapshot`：仅全量；`earliest`：从当前可用的最早 Binlog 位点开始；`latest`：仅同步作业启动后的增量；也可使用 `{"file":"binlog.000001","pos":"154"}` 形式的精确位点。 |
| `snapshot_split_size` | 否 | `40960` | 全量阶段每个 split 包含的行数，必须为正整数。 |
| `snapshot_parallelism` | 否 | `1` | 全量阶段单个 Task 最多并行调度的 split 数，必须为正整数。 |
| `skip_snapshot_backfill` | 否 | `true` | 是否跳过快照期间的 Binlog 回填。自动建表同步采用 at-least-once 语义。 |
| `server_id` | 否 | 自动生成 | CDC Reader 的 server ID，可设置单值（如 `5400`）或闭区间（如 `5400-5408`）；区间内 ID 数量不得小于 `snapshot_parallelism`。 |
| `ssl_mode` | 否 | `disable` | SSL 模式，可选值为 `disable`、`require`、`verify-ca`。 |
| `ssl_rootcert` | 条件必填 | - | `ssl_mode` 为 `verify-ca` 时必填，格式为 `FILE:<file_name>`；需先通过 [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) 上传。 |

不支持 `schema`、`slot_name` 和 `publication_name` 参数。指定这些参数时，作业创建失败。

## 参考手册

### 导入命令

```sql
CREATE JOB <job_name>
[job_properties]
ON STREAMING
[COMMENT <comment>]
FROM OCEANBASE (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
);
```

| 模块 | 说明 |
| --- | --- |
| `job_name` | 作业名称。 |
| `job_properties` | Job 通用参数，例如 `max_interval`。 |
| `comment` | 作业备注。 |
| `source_properties` | OceanBase 数据源参数。 |
| `target_properties` | Doris 目标库参数。 |

### Doris 目标库参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `table.create.properties.*` | - | 自动建表时附加的表属性，例如 `table.create.properties.replication_num`。 |
| `load.strict_mode` | `false` | 是否为 Stream Load 开启严格模式。 |
| `load.max_filter_ratio` | `0` | 采样窗口内允许的最大过滤率，范围为 `[0, 1]`；超过该值时作业暂停。 |

## 注意事项与最佳实践

- 生产作业建议先用少量表验证 OBBinlog 连通性、类型映射和增量延迟，再扩大同步范围。
- 使用 `include_tables` 明确限定同步范围，避免数据库中新增的无关表进入作业。
- 对不支持的列类型，可通过 `table.<table_name>.exclude_columns` 排除；不能排除主键列。
- 修改不受支持的表结构前，先暂停作业，在 Doris 端完成兼容变更后再恢复。
- 定期检查 `CurrentOffset`、`LagBytes` 和 `ErrorMsg`，确认作业持续推进且没有被自动暂停。

## FAQ

**Q1：是否支持 OceanBase Oracle 兼容模式？**

不支持。创建作业时 Doris 会检查 `ob_compatibility_mode`，非 MySQL 兼容模式会直接拒绝创建。

**Q2：是否支持 SQL 映射同步？**

不支持。OceanBase 当前仅支持 `FROM OCEANBASE (...) TO DATABASE (...)` 自动建表同步。

**Q3：如何只同步作业启动后的增量数据？**

将 `offset` 设置为 `latest`。在作业进入 `RUNNING` 后再写入的数据会被同步，已有数据不会执行快照导入。

**Q4：目标表已存在时会被覆盖吗？**

不会。自动建表阶段会跳过已存在的目标表；请确保其主键和列类型与源表兼容。

## 相关文档

- [持续导入概览](./continuous-load-overview.md)
- [OceanBase Schema Change 同步](./schema-change-oceanbase.md)
- [OceanBase 数据类型映射](./data-type-mapping-oceanbase.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
