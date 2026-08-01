---
{
    "title": "ALTER ROUTINE LOAD",
    "language": "zh-CN",
    "description": "修改已暂停的 Routine Load 作业，说明 Kafka 单表作业切换目标表、修改作业属性、更新 Kafka 数据源属性与消费 offset 的语法、权限要求和使用示例。"
}
---

## 描述

该语法用于修改已经创建的 Routine Load 导入作业。只能修改处于 `PAUSED` 状态的作业。您可以通过 [PAUSE ROUTINE LOAD](./PAUSE-ROUTINE-LOAD.md) 暂停 Routine Load 导入作业。

修改成功后，您可以：

- 通过 [SHOW ROUTINE LOAD](./SHOW-ROUTINE-LOAD.md) 检查修改后的作业详情。
- 通过 [RESUME ROUTINE LOAD](./RESUME-ROUTINE-LOAD.md) 重启该导入作业。

## 语法

```sql
ALTER ROUTINE LOAD FOR [<db>.]<job_name>
[SET TARGET TABLE = "<new_table_name>"]
[PROPERTIES (
    "<job_property>" = "<value>"
    [, ...]
)]
[FROM <data_source> (
    "<data_source_property>" = "<value>"
    [, ...]
)];
```

## 参数说明

### 1. `[<db>.]<job_name>`

指定要修改的作业名称。标识符必须以字母字符开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来。

标识符不能使用保留关键字。有关更多详细信息，请参阅[标识符要求](../../../basic-element/object-identifiers.md)和[保留关键字](../../../basic-element/reserved-keywords.md)。

### 2. `SET TARGET TABLE = "<new_table_name>"`

指定要切换到的导入目标表。

纯切表不会搬迁历史数据。旧批次仍保留在旧表中；作业恢复后，Doris 从保留的 Kafka offset 继续消费，并把新批次写入新表。

目标表必须与作业位于同一数据库，且为非临时 OLAP 表。只有单表 Kafka Routine Load 作业支持切换目标表。

### 3. `<job_properties>`

指定需要修改的作业参数。目前支持修改的参数包括：

- `desired_concurrent_number`
- `max_error_number`
- `max_batch_interval`
- `max_batch_rows`
- `max_batch_size`
- `jsonpaths`
- `json_root`
- `strip_outer_array`
- `strict_mode`
- `timezone`
- `num_as_string`
- `fuzzy_parse`
- `partial_columns`
- `max_filter_ratio`

### 4. `<data_source>`

数据源的类型。与 `SET TARGET TABLE` 组合使用时，当前仅支持：

- `KAFKA`

### 5. `<data_source_properties>`

数据源的相关属性。目前仅支持：

- `kafka_broker_list`
- `kafka_topic`
- 自定义 `property`，如 `property.group.id`
- `kafka_partitions` 和 `kafka_offsets`，用于修改待消费的 Kafka partition 的 offset。未修改 `kafka_topic` 时，仅能修改当前已经消费的 partition，不能新增 partition。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限 | 对象 | 说明 |
| --- | --- | --- |
| `LOAD_PRIV` | 当前目标表 | 修改单表 Routine Load 作业时需要。 |
| `LOAD_PRIV` | 数据库 | 修改 multi-table Routine Load 作业时需要。 |
| `LOAD_PRIV` | 新目标表 | 使用 `SET TARGET TABLE` 时还需要此权限。 |

## 示例

### 将 `desired_concurrent_number` 修改为 `1`

```sql
ALTER ROUTINE LOAD FOR db1.label1
PROPERTIES
(
    "desired_concurrent_number" = "1"
);
```

### 将 `desired_concurrent_number` 修改为 `10`，并修改 partition offset 和 group ID

```sql
ALTER ROUTINE LOAD FOR db1.label1
PROPERTIES
(
    "desired_concurrent_number" = "10"
)
FROM KAFKA
(
    "kafka_partitions" = "0, 1, 2",
    "kafka_offsets" = "100, 200, 100",
    "property.group.id" = "new_group"
);
```

### 将目标表修改为 `new_table_name`

```sql
ALTER ROUTINE LOAD FOR db1.label1
SET TARGET TABLE = "new_table_name";
```
