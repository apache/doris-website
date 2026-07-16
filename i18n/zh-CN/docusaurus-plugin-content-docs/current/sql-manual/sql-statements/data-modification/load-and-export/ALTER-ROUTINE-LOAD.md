---
{
    "title": "ALTER ROUTINE LOAD",
    "language": "zh-CN",
    "description": "修改已创建的 Routine Load 作业，说明作业属性、Kafka 与 Kinesis 数据源属性的修改要求、消费进度行为，以及仅单表 Kafka 作业支持的目标表切换语法、权限、表兼容性和使用限制。"
}
---

## 描述

`ALTER ROUTINE LOAD` 用于修改已创建的 Routine Load 作业。对于单表 Kafka 作业，可以在一条语句中切换目标表，并同时修改支持的作业属性和 Kafka 数据源属性。Kinesis 作业支持修改作业属性和数据源属性，但不支持切换目标表。

只能修改处于 `PAUSED` 状态的作业。推荐按照 `PAUSE ROUTINE LOAD`、`ALTER ROUTINE LOAD`、`RESUME ROUTINE LOAD` 的顺序执行。

## 语法

```sql
ALTER ROUTINE LOAD FOR [<db_name>.]<job_name>
[
    SET TARGET TABLE = "<table_name>"
    | <load_property> [, <load_property> ...]
]
[PROPERTIES (
    "<job_property>" = "<value>"
    [, ...]
)]
[FROM <KAFKA | KINESIS> (
    "<data_source_property>" = "<value>"
    [, ...]
)];
```

语句中至少需要指定一项修改。

指定 `SET TARGET TABLE` 时，原作业必须是 Kafka 作业，可选的 `FROM` 子句也必须是 `FROM KAFKA`。Kinesis 作业可以使用其他 ALTER 形式，但不能指定 `SET TARGET TABLE`。

## 必选参数

### `[<db_name>.]<job_name>`

指定要修改的 Routine Load 作业。

- 如果省略 `<db_name>`，Doris 使用当前数据库。
- 作业名称可以使用反引号包围。

## 可选参数

### `SET TARGET TABLE`

将单表 Kafka Routine Load 作业的目标表切换为 `<table_name>`。

目标表名称必须写成字符串字面量，例如 `SET TARGET TABLE = "new_table"`。不支持旧的 `ON new_table` 写法，也不支持省略引号的 `SET TARGET TABLE = new_table`。

目标表必须满足以下要求：

- 与 Routine Load 作业位于同一数据库。`<table_name>` 中不能指定其他数据库。
- 是非临时 OLAP 表。
- 作业的数据源类型是 Kafka。Kinesis 作业不支持切换目标表。
- 作业是单表 Routine Load 作业；不支持 multi-table 作业。
- 当前用户对原目标表和新目标表都具有 `LOAD_PRIV` 权限。
- 新表兼容作业已有的列映射、过滤条件、固定分区、合并或删除条件、sequence 列以及部分列更新模式。Doris 会使用已有导入配置在新表上重新生成导入计划，无法生成计划时拒绝修改。
- 如果作业创建时启用了 `load_to_single_tablet=true`，新表必须使用 Random Distribution。

`SET TARGET TABLE` 可以与 `PROPERTIES` 和 `FROM KAFKA` 组合使用，但不能与 `FROM KINESIS` 或 `<load_property>` 组合使用。

### `<load_property>`

修改已有的导入子句。支持的子句包括：

- `COLUMNS TERMINATED BY`
- `COLUMNS (...)`
- `PRECEDING FILTER`
- `WHERE`
- `DELETE ON`
- `ORDER BY`
- `PARTITION (...)`

这些子句可以与 `PROPERTIES` 和 `FROM` 组合使用，但不能与 `SET TARGET TABLE` 出现在同一条语句中。切换目标表时，Doris 会直接复用原作业的这些导入子句。

### `<job_property>`

在 `PROPERTIES` 子句中按键修改 Routine Load 作业属性。仅修改本次显式指定的键，未指定的键保持原值。

| 属性 | 修改要求 |
| --- | --- |
| `desired_concurrent_number` | 大于 `0`。实际并发数仍受 BE 数量、分区或 shard 数量以及集群配置限制。 |
| `max_error_number` | 大于等于 `0`。 |
| `max_filter_ratio` | 取值范围为 `[0, 1]`。 |
| `max_batch_interval` | 大于等于 `1`，单位为秒。 |
| `max_batch_rows` | 大于等于 `200000`。 |
| `max_batch_size` | 取值范围为 100 MiB 到 10 GiB，单位为字节。 |
| `strict_mode` | `true` 或 `false`。 |
| `timezone` | 合法的时区名称。该时区也用于解析同一条语句中的 Kafka datetime offset。 |
| `workload_group` | 非空的 Workload Group 名称。 |
| `partial_columns` | 兼容旧版本的属性。对于 Kafka 作业，`true` 会把 `UPSERT` 映射为 `UPDATE_FIXED_COLUMNS`；`false` 不会把已有的部分更新模式切回 `UPSERT`。对于 Kinesis 作业，不要同时指定本属性和 `unique_key_update_mode`。 |
| `unique_key_update_mode` | 仅支持 `UPSERT`、`UPDATE_FIXED_COLUMNS`、`UPDATE_FLEXIBLE_COLUMNS`。对于 Kafka 作业，如果同时指定 `partial_columns`，本属性优先。对于 Kinesis 作业，关闭部分更新或切换模式时只使用本属性，以避免歧义。 |
| `jsonpaths` | 修改 JSON 路径。不能通过 ALTER 修改作业的文件格式。 |
| `json_root` | 修改 JSON 根节点。 |
| `strip_outer_array` | `true` 或 `false`。 |
| `num_as_string` | `true` 或 `false`。 |
| `fuzzy_parse` | `true` 或 `false`。 |
| `enclose` | 当前版本会接受并记录此键，但不会更新运行时任务使用的 CSV 包围符。不要通过 ALTER 修改该字符；需要修改时应重建作业。 |
| `escape` | 当前版本会接受并记录此键，但不会更新运行时任务使用的 CSV 转义符。不要通过 ALTER 修改该字符；需要修改时应重建作业。 |
| `empty_field_as_null` | `true` 或 `false`。 |

部分列更新还受目标表和已有导入配置约束：

- `UPDATE_FIXED_COLUMNS` 要求目标表为 Merge-on-Write 的 Unique Key 表。
- `UPDATE_FLEXIBLE_COLUMNS` 要求目标表支持灵活部分列更新，且应用本次 ALTER 后的有效配置必须使用 JSON 格式、未启用 `fuzzy_parse`、未配置非空 `jsonpaths`，也未配置 `COLUMNS` 映射。例如，可以在同一条语句中把 `fuzzy_parse` 改为 `false` 或清空 `jsonpaths`。
- multi-table 作业不支持部分列更新模式。

以下创建期属性不在 ALTER 白名单中，不能通过本语句修改：

- `format`
- `exec_mem_limit`
- `send_batch_parallelism`
- `load_to_single_tablet`
- `partial_update_new_key_behavior`

其他未知属性也会被拒绝。属性名按白名单进行大小写敏感匹配，必须使用文档列出的全小写名称。

### Kafka `<data_source_property>`

Kafka 作业必须使用 `FROM KAFKA (...)`。显式数据源类型必须与原作业一致，不能把 Kafka 作业转换为 Kinesis 作业。

| 属性 | 修改要求 |
| --- | --- |
| `kafka_broker_list` | Kafka broker 地址列表。ALTER 时不需要重复提供原值。仅修改 broker 不重置消费进度。 |
| `kafka_topic` | 非空的新 topic。只要在 ALTER 中显式提供非空值，Doris 就会按 topic 切换流程重置消费进度，即使值与原值相同。空值不会清除原 topic。 |
| `kafka_partitions` | 逗号分隔的 partition 列表。必须与 `kafka_offsets` 或默认 offset 同时指定。 |
| `kafka_offsets` | 与 `kafka_partitions` 一一对应。每项可为非负整数、`OFFSET_BEGINNING`、`OFFSET_END` 或 datetime。同一列表不能混用 datetime 和普通 offset。 |
| `kafka_default_offsets` | 默认 offset，可取 `OFFSET_BEGINNING`、`OFFSET_END` 或 datetime。不能与 `kafka_offsets` 同时指定。 |
| `property.kafka_default_offsets` | `kafka_default_offsets` 的兼容写法；两种写法不能同时使用。 |
| `property.*` | 传递给 Kafka 客户端的自定义属性。`property.` 前缀在内部会被移除；同名键覆盖，其他已有自定义属性保留。 |
| `aws.*` | Doris 的 AWS MSK IAM 属性命名空间。相关认证属性必须在本次 ALTER 中满足依赖关系。 |

Kafka offset 修改还需要满足以下要求：

- `kafka_partitions` 与 `kafka_offsets` 的项目数量必须一致。
- 不切换 topic 时，只能修改作业当前已消费范围内的 partition，不能通过 ALTER 增加新的消费 partition。
- `kafka_offsets` 与 `kafka_default_offsets` 或 `property.kafka_default_offsets` 互斥。
- `kafka_default_offsets` 与 `property.kafka_default_offsets` 互斥。
- 单独修改默认 offset 时，新值用于后续新发现的 partition；与 `kafka_partitions` 一起指定时，该默认值同时用于列出的 partition。
- 未显式指定默认 offset 时，Doris 保留原默认值，不会自动写入 `OFFSET_END`。

以下 Kafka multi-table 路由属性只能在创建作业时设置，不能通过 ALTER 修改：

- `kafka_table_name_location`
- `kafka_table_name_format`
- `kafka_text_table_name_field_delimiter`
- `kafka_text_table_name_field_index`

修改 AWS MSK IAM 配置时，本次 `FROM KAFKA` 子句需要提供一组自洽的配置。例如，需要提供 `aws.region`、`property.security.protocol=SASL_SSL` 和 `property.sasl.mechanism=OAUTHBEARER`；使用 external ID 时还需要 role ARN；本次 ALTER 同时指定公网 broker 和显式凭据时，access key 和 secret key 必须成对提供。

### Kinesis `<data_source_property>`

Kinesis 作业必须使用 `FROM KINESIS (...)`。显式数据源类型必须与原作业一致，不能把 Kinesis 作业转换为 Kafka 作业。Kinesis 作业支持下列属性修改，但不支持 `SET TARGET TABLE`。

| 属性 | 修改要求 |
| --- | --- |
| `aws.region` | AWS region，例如 `us-east-1`。ALTER 时不需要重复提供原值。 |
| `aws.endpoint` | 自定义 Kinesis endpoint。兼容旧键 `kinesis_endpoint`。 |
| `kinesis_stream` | 非空的新 stream。只要在 ALTER 中显式提供非空值，Doris 就会按 stream 切换流程重置消费进度和已发现的 shard 状态，即使值与原值相同。空值不会清除原 stream。 |
| `kinesis_shards` | 逗号分隔的 shard ID。必须与 `kinesis_shards_pos` 或默认 position 同时指定。 |
| `kinesis_shards_pos` | 与 `kinesis_shards` 一一对应。每项可为 `TRIM_HORIZON`、`LATEST` 或数字 sequence number。 |
| `property.kinesis_default_pos` | 默认 position，可为 `TRIM_HORIZON`、`LATEST` 或数字 sequence number。必须保留 `property.` 前缀。 |
| `aws.access_key` | AWS access key。与 `aws.secret_key` 成对提供。 |
| `aws.secret_key` | AWS secret key。与 `aws.access_key` 成对提供。 |
| `aws.session_key` | 可选的 AWS session token。 |
| `aws.role_arn` | 可选的 IAM role ARN。 |
| `property.*` | 传递给 Kinesis 客户端的自定义属性。同名键覆盖，其他已有自定义属性保留。 |

Kinesis position 修改还需要满足以下要求：

- `kinesis_shards` 与 `kinesis_shards_pos` 的项目数量必须一致。
- 不切换 stream 时，只能修改当前已消费 shard 的 position。
- `kinesis_shards_pos` 与 `property.kinesis_default_pos` 互斥。
- Kinesis position 不支持 datetime。
- 单独修改默认 position 时，新值用于后续新发现的 shard；与 `kinesis_shards` 一起指定时，该默认值同时用于列出的 shard。
- 如果一条 `FROM KINESIS` ALTER 既未指定 `kinesis_shards_pos`，也未指定 `property.kinesis_default_pos`，Doris 会合成 `LATEST` 并将其记录为新的默认 position。仅修改 region、endpoint、stream、凭据或其他自定义属性时，如果需要保留一个非 `LATEST` 的默认值，必须在同一条语句中重复提供当前的 `property.kinesis_default_pos`。
- access key 与 secret key 必须在同一条 ALTER 中成对提供；使用 `property.aws.external.id` 时还需要提供 role ARN。

## 属性修改语义

`job_properties`、Kafka properties 和 Kinesis properties 通常采用按键增量修改语义：

- 只修改本次显式提供的键，未提供的键保持原值，但上文所述的 Kinesis 默认 position 行为除外。
- `property.*` 自定义属性与现有属性合并；同名键覆盖。
- 当前没有通用的 `UNSET` 或删除属性语法。省略一个键不代表删除它。
- 如果需要修改具有依赖关系的认证属性，应在同一条 ALTER 中提供完整的一组属性。
- 不要重复提交没有变化的非空 `kafka_topic` 或 `kinesis_stream`，否则会触发对应的数据源切换和进度重置。

## 权限控制

执行此命令的用户至少需要以下权限：

| 权限 | 对象 | 说明 |
| --- | --- | --- |
| `LOAD_PRIV` | 当前目标表 | 修改 Routine Load 作业需要对当前目标表具有 `LOAD_PRIV` 权限。 |
| `LOAD_PRIV` | 新目标表 | 使用 `SET TARGET TABLE` 时，还需要对新目标表具有 `LOAD_PRIV` 权限。 |

## 进度和数据行为

- 仅切换 Kafka 作业的目标表不会重置 Kafka offset。旧表中的历史数据不会迁移；恢复作业后，新消费的数据写入新表。
- 修改普通作业属性、Kafka broker、Kinesis region 或 endpoint、以及自定义 `property.*` 不会重置消费进度。
- 显式提供非空 `kafka_topic` 会重置 Kafka progress。
- 显式提供非空 `kinesis_stream` 会重置 Kinesis progress、已发现的 shard 和 lag cache。
- 如果同一条语句同时切换目标表并提供非空 `kafka_topic`，进度会因为 topic 切换而重置，不能视为纯目标表切换。

## 示例

### 切换 Kafka 作业的目标表并保留消费进度

本例中的 `db1.job1` 是单表 Kafka Routine Load 作业。

```sql
PAUSE ROUTINE LOAD FOR db1.job1;

ALTER ROUTINE LOAD FOR db1.job1
SET TARGET TABLE = "new_table";

RESUME ROUTINE LOAD FOR db1.job1;
```

已消费的数据仍保留在原表中。恢复后，新数据写入 `new_table`。

### 同时切换目标表和修改属性

以下示例切换目标表、修改错误阈值，并更新 Kafka client ID。由于没有显式修改 `kafka_topic`，Kafka progress 保持不变。

```sql
PAUSE ROUTINE LOAD FOR db1.job1;

ALTER ROUTINE LOAD FOR db1.job1
SET TARGET TABLE = "new_table"
PROPERTIES (
    "max_error_number" = "10"
)
FROM KAFKA (
    "property.client.id" = "target-switch"
);

RESUME ROUTINE LOAD FOR db1.job1;
```

### 修改 Kafka partition offset

```sql
PAUSE ROUTINE LOAD FOR db1.job1;

ALTER ROUTINE LOAD FOR db1.job1
FROM KAFKA (
    "kafka_partitions" = "0,1,2",
    "kafka_offsets" = "100,200,100"
);

RESUME ROUTINE LOAD FOR db1.job1;
```

### 修改 Kinesis shard position

```sql
PAUSE ROUTINE LOAD FOR db1.kinesis_job;

ALTER ROUTINE LOAD FOR db1.kinesis_job
FROM KINESIS (
    "kinesis_shards" = "shardId-000000000000,shardId-000000000001",
    "kinesis_shards_pos" = "TRIM_HORIZON,LATEST"
);

RESUME ROUTINE LOAD FOR db1.kinesis_job;
```

修改后可以使用 `SHOW ROUTINE LOAD FOR <job_name>` 检查目标表、作业属性、数据源属性和消费进度。
