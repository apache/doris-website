---
{
    "title": "Amazon RDS MySQL",
    "language": "zh-CN",
    "description": "如何在 Amazon RDS MySQL 上开启 Binlog、配置参数组并创建同步用户，为 Doris 持续导入提供前置条件。",
    "keywords": [
        "Amazon RDS MySQL",
        "Doris 持续导入",
        "MySQL Binlog",
        "binlog_format ROW",
        "binlog_row_image FULL",
        "RDS 参数组",
        "binlog retention hours",
        "CDC 同步"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 部署前检查 / 环境配置 -->

Doris 持续导入支持从 Amazon RDS MySQL 同步数据，兼容版本包括 **MySQL 5.6、5.7、8.0.x**。在启动同步任务之前，必须确保 RDS 实例已开启 Binlog 并以正确的格式记录变更日志。

本文档面向需要将 Amazon RDS MySQL 数据通过 Doris 持续导入（CDC）进行同步的用户，按场景顺序指导您完成所有前置配置。

## 前置检查清单

在开始操作之前，请先确认以下条件：

| 检查项 | 期望值 | 说明 |
| --- | --- | --- |
| `log_bin` | `ON` | Binlog 已开启 |
| `binlog_format` | `ROW` | 以行模式记录变更 |
| `binlog_row_image` | `FULL` | 记录完整的行镜像 |
| 同步用户 | 已创建 | 拥有 `SELECT`、`REPLICATION SLAVE`、`REPLICATION CLIENT` 权限 |
| Binlog 保留时间 | 至少 72 小时 | 防止日志过早清理导致同步中断 |

如果以上任一项不满足，请按下方步骤逐一配置。

## 步骤一：检查当前 Binlog 配置

**目的**：确认 RDS 实例当前的 Binlog 状态，决定是否需要修改参数组。

连接到 RDS 实例后执行以下 SQL：

```sql
-- Check if binlog is enabled
SHOW VARIABLES LIKE 'log_bin';

-- Check binlog format
SHOW VARIABLES LIKE 'binlog_format';

-- Check binlog row image
SHOW VARIABLES LIKE 'binlog_row_image';
```

**判断方式**：

-   若 `log_bin = ON`、`binlog_format = ROW`、`binlog_row_image = FULL`，则无需额外配置，可直接跳至 [步骤四：创建同步用户](#步骤四创建同步用户)。
-   若任一项不满足，请继续执行步骤二与步骤三。

## 步骤二：创建并配置参数组

**目的**：在 AWS 控制台创建自定义参数组，将 Binlog 相关参数调整为 Doris 持续导入所要求的值。

操作步骤如下：

1.  登录 [AWS RDS 控制台](https://console.aws.amazon.com/rds/)。
2.  在左侧导航栏选择 **Parameter groups**，点击 **Create parameter group**。
3.  选择对应的 MySQL 版本族，创建一个新的参数组。
4.  编辑参数组，搜索 `binlog_format`，将值设置为 `ROW`：

    ![MySQL Binlog Format Setting](/images/next/data-operate/streaming-job/mysql-binlog-setting.png)

5.  同样搜索 `binlog_row_image`，将值设置为 `FULL`。
6.  点击 **Save Changes** 保存。

需要修改的参数汇总如下：

| 参数名 | 目标值 | 作用 |
| --- | --- | --- |
| `binlog_format` | `ROW` | 以行级别记录数据变更，CDC 同步必备 |
| `binlog_row_image` | `FULL` | 记录变更前后的完整行数据 |

## 步骤三：应用参数组并重启实例

**目的**：将新的参数组绑定到目标 RDS 实例，并通过重启使配置生效。

操作步骤如下：

1.  在 RDS 控制台选择目标实例，点击 **Modify**。
2.  在 **DB parameter group** 中选择新创建的参数组。
3.  选择 **Apply immediately** 立即应用。
4.  重启 RDS 实例使配置生效。

:::caution
修改 `binlog_format` 参数需要重启 RDS 实例才能生效。请在业务低峰期进行操作。
:::

## 步骤四：创建同步用户

**目的**：创建一个专用账号供 Doris 持续导入使用，遵循最小权限原则。

1.  创建专用用户：

    ```sql
    CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>';
    ```

2.  授予同步所需的权限：

    ```sql
    GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
    ```

所需权限说明：

| 权限 | 用途 |
| --- | --- |
| `SELECT` | 读取存量数据（全量阶段） |
| `REPLICATION SLAVE` | 以从库身份拉取 Binlog |
| `REPLICATION CLIENT` | 查询主库 Binlog 状态 |

## 步骤五：配置 Binlog 保留时间

**目的**：默认情况下，Amazon RDS MySQL 会尽快清理二进制日志。建议将 Binlog 保留时间设置为至少 **72 小时**，以确保在故障场景下用于复制的 Binlog 文件仍然可用。

使用 `mysql.rds_set_configuration` 存储过程设置保留时间：

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 72);
```

:::caution
如果未设置此配置项，或将其设置为过短的间隔，可能会导致二进制日志中出现空缺，从而影响 Doris 恢复复制的能力。
:::

## 常见问题（FAQ）

**Q1：修改 `binlog_format` 后是否必须重启实例？**

是的。`binlog_format` 是静态参数，必须重启 RDS 实例才能生效。请在业务低峰期进行操作。

**Q2：为什么 `binlog_row_image` 必须设置为 `FULL`？**

Doris 持续导入需要变更前后的完整行数据，以正确还原 `UPDATE` 与 `DELETE` 操作。若设置为 `MINIMAL` 或 `NOBLOB`，将导致同步出错或数据不完整。

**Q3：可以为多个 RDS 实例复用同一个参数组吗？**

可以。同一版本族下的多个 RDS 实例可以共用一个参数组，只要它们都需要相同的 Binlog 配置。

**Q4：Binlog 保留时间能否设置得更长？**

可以。`binlog retention hours` 支持 1 到 168 小时（即最多 7 天）。保留时间越长，故障恢复窗口越大，但会占用更多存储空间。

## 故障排查（Troubleshooting）

| 现象 | 可能原因 | 解决方案 |
| --- | --- | --- |
| `SHOW VARIABLES LIKE 'log_bin'` 返回 `OFF` | 实例未开启自动备份，Binlog 未启用 | 在 RDS 控制台为实例启用自动备份，Binlog 会自动开启 |
| `binlog_format` 修改后仍为 `MIXED` 或 `STATEMENT` | 实例未重启，或绑定的参数组不正确 | 确认绑定的是新参数组，并重启实例 |
| Doris 同步报错 `binary log not found` | Binlog 已被清理 | 调大 `binlog retention hours`，并重启 Doris 同步任务 |
| 同步用户连接失败 | 主机白名单或密码错误 | 检查 `'doris_sync'@'%'` 主机限定是否匹配 Doris 节点出口 IP |
| 权限不足报错 | 缺少 `REPLICATION SLAVE` 等权限 | 重新执行步骤四中的 `GRANT` 语句 |
