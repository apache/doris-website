---
{
    "title": "通用 MySQL",
    "language": "zh-CN",
    "description": "为 Doris 持续导入配置自建 MySQL 数据源。",
    "keywords": [
        "MySQL",
        "Doris 持续导入",
        "binlog",
        "binlog_row_image",
        "CDC"
    ]
}
---

:::caution 实验性功能

Doris 持续导入为实验性功能，自 Doris 4.1.5 版本起支持。

:::

本文介绍如何将自建 MySQL 配置为 Doris 持续导入的数据源。使用托管 MySQL 时，请在[支持的数据源](../continuous-load-overview.md#支持的数据源与同步模式)中查找对应服务的准备文档。

## 前置检查清单

| 检查项 | 要求 |
| --- | --- |
| Binlog | `log_bin = ON`、`binlog_format = ROW`、`binlog_row_image = FULL` |
| Binlog 保留时间 | 覆盖预期的最长中断时间和同步延迟 |
| 同步用户 | 有源库的 `SELECT` 权限以及全局 `REPLICATION SLAVE`、`REPLICATION CLIENT` 权限 |
| 源表 | 每张待同步的表都有主键 |
| 网络 | Doris FE 和部署在 BE 上的 CDC Client 可访问源库的配置端口，通常为 `3306` |

## 步骤一：检查当前 Binlog 配置

新建 MySQL 连接并执行以下 SQL。

```sql
SHOW GLOBAL VARIABLES
WHERE Variable_name IN (
    'server_id', 'log_bin', 'binlog_format', 'binlog_row_image',
    'binlog_expire_logs_seconds', 'expire_logs_days'
);
SHOW SESSION VARIABLES WHERE Variable_name IN ('binlog_format', 'binlog_row_image');
```

确认 `server_id` 非零，且在复制拓扑中唯一。`binlog_format` 的全局值和会话值均应为 `ROW`，`binlog_row_image` 的全局值和会话值均应为 `FULL`。

## 步骤二：配置并验证 Binlog

需要修改参数时，编辑 MySQL 服务端配置文件的 `[mysqld]` 段，文件通常为 `my.cnf`。以下示例使用 `101` 作为服务器 ID，请选用复制拓扑中未使用的值。已启用 Binlog 的实例应沿用现有日志路径和文件名前缀。

```ini
[mysqld]
server-id = 101
log-bin = mysql-bin
binlog_format = ROW
binlog_row_image = FULL
```

在同一段配置 Binlog 保留时间。以保留 3 天为例，MySQL 8.0 及以上使用 `binlog_expire_logs_seconds = 259200`，MySQL 5.6 和 5.7 使用 `expire_logs_days = 3`。实际保留时间应覆盖预期的最长中断时间和同步延迟。如果已保存的位点所在文件被清理，Doris 将无法从该位点恢复。参见 [MySQL Binlog 参数](https://dev.mysql.com/doc/refman/8.4/en/replication-options-binary-log.html)。

在维护窗口重启 MySQL 以应用配置文件，再执行步骤一的查询。运行期间修改全局 `binlog_format` 或 `binlog_row_image` 时，新会话会使用修改后的值。如果通过这种方式生效且未重启，请重新建立已有的写入连接。

## 步骤三：创建同步用户

使用 MySQL 管理员执行以下 SQL。将 `source_db` 替换为待同步的源库，`192.0.2.10` 替换为 MySQL 看到的客户端 IP，并设置账号密码。如果 Doris 从多个客户端 IP 连接，请放行所需的每个地址。

```sql
CREATE USER 'doris_sync'@'192.0.2.10' IDENTIFIED BY '<password>';
GRANT SELECT ON source_db.* TO 'doris_sync'@'192.0.2.10';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'192.0.2.10';
```

以同步用户连接 MySQL。MySQL 8.4 及以上执行 `SHOW BINARY LOG STATUS;`，较早版本执行 `SHOW MASTER STATUS;`，预期返回 Binlog 文件名和位点。再用同一账号对源表执行 `SELECT`，确认具备全量读取权限。

完成源库准备后，参照 [MySQL CDC 自动建表同步](../continuous-load-mysql-database.md)或 [MySQL CDC SQL 映射同步](../continuous-load-mysql-table.md)创建作业。

## 故障排查

| 现象 | 检查项 |
| --- | --- |
| 连接器报告 Binlog 格式或行镜像不符合要求 | 检查全局参数和写入会话中实际生效的值。 |
| 同步用户无法读取 Binlog | 检查账号的主机限制和全局复制权限。 |
| 作业无法从已保存的位点恢复 | 用 `SHOW BINARY LOGS;` 检查所需日志文件是否仍存在，并核对保留时间。 |
