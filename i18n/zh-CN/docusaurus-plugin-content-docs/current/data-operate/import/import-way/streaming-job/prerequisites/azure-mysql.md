---
{
    "title": "Azure MySQL",
    "language": "zh-CN",
    "description": "为 Doris 持续导入配置 Azure Database for MySQL 灵活服务器。",
    "keywords": [
        "Azure Database for MySQL",
        "Doris 持续导入",
        "binlog_row_image",
        "CDC"
    ]
}
---

:::caution 实验性功能

Doris 持续导入为实验性功能，自 Doris 4.1.5 版本起支持。

:::

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 部署前检查 / 环境配置 -->

本文介绍如何将 Azure Database for MySQL 灵活服务器配置为 Doris 持续导入的数据源。

## 前置检查清单

| 检查项 | 期望值 |
| --- | --- |
| `log_bin` | `ON` |
| `binlog_format` | `ROW` |
| `binlog_row_image` | `FULL` |
| 同步用户 | 有源库 `SELECT` 权限和全局 `REPLICATION SLAVE`、`REPLICATION CLIENT` 权限 |
| Binlog 保留时间 | 覆盖预期的最长中断时间和同步延迟 |
| 网络和 TLS | Doris FE 和 BE 上的 CDC Client 可通过 TLS 访问源实例的 `3306` 端口。使用公网时，在 [Azure 防火墙](https://learn.microsoft.com/zh-cn/azure/mysql/security/security-how-to-manage-firewall-portal)中放行其出口 IP。使用私网时，检查路由和 DNS。 |

## 步骤一：检查当前 Binlog 配置

新建 MySQL 连接，检查参数的生效值。

```sql
SHOW GLOBAL VARIABLES WHERE Variable_name IN ('log_bin', 'binlog_format', 'binlog_row_image', 'binlog_expire_logs_seconds');
SHOW SESSION VARIABLES LIKE 'binlog_row_image';
```

预期 `log_bin = ON`、`binlog_format = ROW`，且全局和新会话的 `binlog_row_image` 均为 `FULL`。

## 步骤二：配置服务器参数

1. 在 Azure 门户打开 MySQL 灵活服务器，进入 **设置 → 服务器参数（Server parameters）**。
2. 搜索 `binlog_row_image`，将值设置为 `FULL` 并保存。Azure 已启用 Binlog，并使用行格式记录变更。

    ![Azure MySQL 服务器参数页面，显示 binlog_row_image 设置为 full 和保存按钮](/images/next/data-operate/streaming-job/azure-mysql-binlog-settings.png)

3. 重新连接 MySQL，再次检查全局和新会话的 `binlog_row_image`。

具体操作见[配置服务器参数](https://learn.microsoft.com/zh-cn/azure/mysql/flexible-server/how-to-configure-server-parameters-portal)。

## 步骤三：创建同步用户

使用服务器管理员账号连接，将 `source_db` 替换为源数据库名，并为同步用户设置密码。

```sql
CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>' REQUIRE SSL;
GRANT SELECT ON source_db.* TO 'doris_sync'@'%';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
```

`SELECT` 用于读取全量数据，`REPLICATION SLAVE` 用于读取 Binlog 事件，`REPLICATION CLIENT` 用于查询 Binlog 状态。

MySQL 8.4 上使用同步用户执行 `SHOW BINARY LOG STATUS;`，预期返回 Binlog 文件名和位点。较早的 MySQL 版本使用 `SHOW MASTER STATUS;`。[MySQL 8.4 Binlog 状态参考](https://dev.mysql.com/doc/refman/8.4/en/show-binary-log-status.html)

## 步骤四：配置 Binlog 保留时间

在 Azure 门户的 **服务器参数**中设置 `binlog_expire_logs_seconds`。该参数以秒为单位。步骤二的截图以 `864000` 秒（10 天）为例。根据预期的最长中断时间和同步延迟设值，使 Doris 可以从已保存的位点恢复。[Azure MySQL Binlog 保留配置](https://learn.microsoft.com/zh-cn/azure/mysql/flexible-server/concepts-server-parameters#binlog_expire_logs_seconds)

完成准备工作后，参照 [MySQL CDC 自动建表同步](../continuous-load-mysql-database.md)创建作业并配置 TLS。

## 常见问题（FAQ）

**Q1：修改 `binlog_row_image` 后需要重启实例吗？**

`binlog_row_image` 是动态参数。保存后新建连接验证生效值，若 Azure 门户提示重启，请按提示操作。

**Q2：为什么需要 `binlog_row_image = FULL`？**

Doris 持续导入需要完整的行镜像来处理更新和删除。`MINIMAL` 可能省略未变更的列。

## 故障排查（Troubleshooting）

| 现象 | 检查项 |
| --- | --- |
| 连接器拒绝 `MINIMAL` 或 `NOBLOB` | 确认全局和新会话的 `binlog_row_image` 均为 `FULL`。 |
| 无法查询 Binlog 状态 | 检查同步用户是否有 `REPLICATION CLIENT` 权限。MySQL 8.4 使用 `SHOW BINARY LOG STATUS`。 |
| Doris 无法从已保存的位点恢复 | 检查 Azure 是否已清理所需 Binlog，并核对保留时间。 |
