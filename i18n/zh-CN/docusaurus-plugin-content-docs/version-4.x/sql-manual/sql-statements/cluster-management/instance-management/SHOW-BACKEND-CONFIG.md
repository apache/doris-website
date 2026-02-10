---
{
    "title": "SHOW BACKEND CONFIG",
    "language": "zh-CN",
    "description": "展示 BACKEND（即 BE）的配置项和其当前值。"
}
---

## 描述

展示 BACKEND（即 BE）的配置项和其当前值。

## 语法

```sql
[ ADMIN ] SHOW BACKEND CONFIG [ LIKE <config_key_pattern> ] [ FROM <backend_id> ]
```

## 可选参数

**<config_key_pattern>**

> 提供一个通配符模式，用于匹配 BE 配置项。匹配规则与 LIKE 表达式相同。书写规则请参考“匹配表达式”章节。

**<backend_id>**

> BE 的 ID。用于查看指定 ID 的 BE 的配置。BE 的 ID 可以通过 SHOW BACKENDS 命令获得。具体请参阅“SHOW BACKENDS”命令

## 返回值（Return Value）

- BackendId: BE 的 ID
- Host: BE 的主机地址
- Key: 配置项的名称
- Value: 配置项对应的值
- Type: 配置值的类型

## 权限控制（Access Control Requirements）

执行此 SQL 命令的用户必须至少具有 ADMIN_PRIV 权限。

## 示例（Examples）

### 查询所有配置项

```sql
SHOW BACKEND CONFIG
```

结果为

```sql
+-----------+--------------+--------------------------------+-------+--------------------------+-----------+
| BackendId | Host         | Key                            | Value | Type                     | IsMutable |
+-----------+--------------+--------------------------------+-------+--------------------------+-----------+
| 12793     | 172.16.123.1 | LZ4_HC_compression_level       | 9     | int64_t                  | true      |
| 12793     | 172.16.123.1 | agent_task_trace_threshold_sec | 2     | int32_t                  | true      |
...
| 12794     | 172.16.123.2 | zone_map_row_num_threshold     | 20    | int32_t                  | true      |
+-----------+--------------+--------------------------------+-------+--------------------------+-----------+
```

### 查询指定 ID 的 BE 的配置项

```sql
SHOW BACKEND CONFIG FROM 12793
```

结果为

```sql
+-----------+--------------+--------------------------------+-------+--------------------------+-----------+
| BackendId | Host         | Key                            | Value | Type                     | IsMutable |
+-----------+--------------+--------------------------------+-------+--------------------------+-----------+
| 12793     | 172.16.123.1 | LZ4_HC_compression_level       | 9     | int64_t                  | true      |
| 12793     | 172.16.123.1 | agent_task_trace_threshold_sec | 2     | int32_t                  | true      |
...
| 12793     | 172.16.123.1 | zone_map_row_num_threshold     | 20    | int32_t                  | true      |
+-----------+--------------+--------------------------------+-------+--------------------------+-----------+
```

### 查询符合指定模式的配置项

```sql
SHOW BACKEND CONFIG LIKE '%compression_level%'
```

结果为

```sql
+-----------+--------------+--------------------------+-------+---------+-----------+
| BackendId | Host         | Key                      | Value | Type    | IsMutable |
+-----------+--------------+--------------------------+-------+---------+-----------+
| 12793     | 172.16.123.1 | LZ4_HC_compression_level | 9     | int64_t | true      |
| 12794     | 172.16.123.2 | LZ4_HC_compression_level | 9     | int64_t | true      |
+-----------+--------------+--------------------------+-------+---------+-----------+
```