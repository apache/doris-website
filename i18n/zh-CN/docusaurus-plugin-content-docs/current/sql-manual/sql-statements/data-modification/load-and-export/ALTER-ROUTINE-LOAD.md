---
{
    "title": "ALTER ROUTINE LOAD",
    "language": "zh-CN",
    "description": "该语法用于修改已经创建的例行导入作业。只能修改处于 PAUSED 状态的作业。"
}
---

## 描述

该语法用于修改已经创建的例行导入作业。只能修改处于 PAUSED 状态的作业。

## 语法

```sql
ALTER ROUTINE LOAD FOR [<db>.]<job_name>
[<job_properties>]
FROM [<data_source>]
[<data_source_properties>]
```

## 必选参数

**1. `[<db>.]<job_name>`**

> 指定要修改的作业名称。标识符必须以字母字符开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来。
>
> 标识符不能使用保留关键字。有关更多详细信息，请参阅标识符要求和保留关键字。

## 可选参数

**1. `<job_properties>`**

> 指定需要修改的作业参数。目前支持修改的参数包括：
> 
> - desired_concurrent_number
> - max_error_number
> - max_batch_interval
> - max_batch_rows
> - max_batch_size
> - jsonpaths
> - json_root
> - strip_outer_array
> - strict_mode
> - timezone
> - num_as_string
> - fuzzy_parse
> - partial_columns
> - max_filter_ratio

**2. `<data_source_properties>`**

> 数据源的相关属性。目前支持：
> 
> - kafka_partitions
> - kafka_offsets
> - kafka_broker_list
> - kafka_topic
> - 自定义 property，如 property.group.id

**3. `<data_source>`**

> 数据源的类型。当前支持：
> 
> - KAFKA

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV         | 表（Table）    | SHOW ROUTINE LOAD 需要对表有LOAD权限 |

## 注意事项

-  `kafka_partitions` 和 `kafka_offsets` 用于修改待消费的 kafka partition 的 offset，仅能修改当前已经消费的 partition。不能新增 partition。

## 示例

- 将 `desired_concurrent_number` 修改为 1

    ```sql
    ALTER ROUTINE LOAD FOR db1.label1
    PROPERTIES
    (
        "desired_concurrent_number" = "1"
    );
    ```

- 将 `desired_concurrent_number` 修改为 10，修改 partition 的 offset，修改 group id

    ```sql
    ALTER ROUTINE LOAD FOR db1.label1
    PROPERTIES
    (
        "desired_concurrent_number" = "10"
    )
    FROM kafka
    (
        "kafka_partitions" = "0, 1, 2",
        "kafka_offsets" = "100, 200, 100",
        "property.group.id" = "new_group"
    );
    ```

