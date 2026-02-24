---
{
    "title": "审计日志",
    "language": "zh-CN",
    "description": "Doris 提供了对于数据库操作的审计能力，可以记录用户对数据库的登陆、查询、修改操作。在 Doris 中，可以直接通过内置系统表查询审计日志，也可以直接查看 Doris 的审计日志文件。"
}
---

Doris 提供了对于数据库操作的审计能力，可以记录用户对数据库的登陆、查询、修改操作。在 Doris 中，可以直接通过内置系统表查询审计日志，也可以直接查看 Doris 的审计日志文件。

## 开启审计日志

通过全局变量 `enable_audit_plugin` 可以随时开启或关闭审计日志插件（默认为关闭状态），如：

`set global enable_audit_plugin = true;`

开启后，Doris 会将开启后的审计日志写入 `audit_log` 表。

可以随时关闭审计日志插件：

`set global enable_audit_plugin = false;`

关闭后，Doris 将会停止 `audit_log` 表的写入。已写入的审计日志不会变化。

## 查看审计日志表

:::caution 注意

在 2.1.8 版本之前，随着系统版本的升级，审计日志字段会有增加，在升级后需要根据审计日志表中的字段，通过 `ALTER TALBE` 命令为 `audit_log` 表增加字段。

:::

从 Doris 2.1 版本开始，Doirs 可以通过开启审计日志功能，将用户行为操作写入到 `__internal_schema` 库的 [`audit_log`](../admin-manual/system-tables/internal_schema/audit_log) 表中。

审计日志表是一张动态分区表，按天进行分区，默认保留最近 30 天的数据。可以通过 ALTER TABLE 语句修改动态分区的 `dynamic_partition.start` 属性调整动态分区的保留天数。

## 审计日志文件

在 fe.conf 中，`LOG_DIR` 定义了 FE 日志的存储路径。在 `${LOG_DIR}/fe.audit.log` 中记录了这台 FE 节点执行的所有数据库操作。如果需要查看集群所有的操作，需要遍历每一台 FE 的审计日志。

## 审计日志格式

在 3.0.7 之前的版本的版本中，用户执行语句中的 `\n`, `\t`, `\r` 符号会把替换成 `\\n`, `\\t`, `\\r`。之后存储在 `fe.audit.log` 日志和 `audit_log` 表中。

3.0.7 开始，对于 `fe.audit.log` 日志，用户执行语句中仅 `\n` 会被替换成 `\\n`。而 `audit_log` 表存储的是原始的语句格式。

## 审计日志相关配置

**全局变量：**

可以通过 `set [global] <var_name> = <var_value>` 修改审计日志变量。

| 变量                                    | 默认值   | 说明               |
| ------------------------------------- | ----- | ---------------- |
| `audit_plugin_max_batch_interval_sec` | 60 秒  | 审计日志表的最大写入间隔。    |
| `audit_plugin_max_batch_bytes`        | 50MB  | 审计日志表每批次最大写入数据量  |
| `audit_plugin_max_sql_length`         | 4096  | 审计日志表里记录的语句的最大长度 |
| `audit_plugin_load_timeout`           | 600 秒 | 审计日志导入作业的默认超时时间  |
| `audit_plugin_max_insert_stmt_length` | Int.MAX | 针对 `INSERT` 语句最大长度限制。如果大于 `audit_plugin_max_sql_length`，则使用 `audit_plugin_max_sql_length` 的值。该参数自 3.0.6 支持。 |

因为某些 `INSERT INTO VALUES` 语句可能过长切提交频繁，导致设计日志膨胀。因此，Doris 在 3.0.6 版本新增了 `audit_plugin_max_insert_stmt_length` 用于单独限制 `INSERT` 语句的审计长度。避免审计日志膨胀，同时可以保证 SQL 语句被完整审计。

**FE 配置项：**

通过修改 fe.conf 目录可以修改 FE 配置项。

| 配置项                    | 说明                                                                           |
| ---------------------- | ---------------------------------------------------------------------------- |
| `skip_audit_user_list` | 如果不希望某些用户的操作被审计日志记录，可以通过这个配置修改（自 3.0.01 支持）。如通过以下配置屏蔽 user1 与 user2 的审计日志记录： `skip_audit_user_list=user1,user2`|

