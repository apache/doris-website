---
{
    "title": "Amazon Aurora MySQL",
    "language": "zh-CN",
    "description": "Amazon Aurora MySQL 开启 Binlog 并配置同步用户的前置步骤，支撑 Doris 持续导入。",
    "keywords": [
        "Amazon Aurora MySQL",
        "Aurora Binlog 配置",
        "Doris 持续导入",
        "binlog_format ROW",
        "binlog_row_image FULL",
        "binlog retention hours",
        "RDS Parameter Group",
        "MySQL CDC 前置步骤"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 部署前检查 / 数据源接入前置配置 -->

Doris 持续导入支持 Amazon Aurora MySQL-Compatible Edition **5.6、5.7、8.0.x** 版本。由于 Aurora MySQL 默认不开启 Binlog，在同步数据之前，需要先在 Aurora 集群上完成 Binlog 开启与配置、创建同步用户、设置 Binlog 保留时间等前置工作。

本文档面向准备将 Aurora MySQL 数据接入 Doris 持续导入的用户，提供端到端的配置流程。

### 前置检查清单

在开始接入 Doris 之前，请确认 Aurora 集群已满足以下条件：

| 检查项 | 期望值 | 校验方式 |
| :--- | :--- | :--- |
| Binlog 是否开启 | `log_bin = ON` | `SHOW VARIABLES LIKE 'log_bin';` |
| Binlog 格式 | `binlog_format = ROW` | `SHOW VARIABLES LIKE 'binlog_format';` |
| Binlog 行镜像 | `binlog_row_image = FULL` | `SHOW VARIABLES LIKE 'binlog_row_image';` |
| 同步用户 | 存在专用账户并具备复制权限 | 执行 `SHOW GRANTS FOR ...;` |
| Binlog 保留时间 | 不少于 72 小时 | `CALL mysql.rds_show_configuration;` |

满足全部条件即可直接进入 Doris 端的持续导入配置；若有任意一项不满足，请按照下面的步骤完成配置。

## 步骤一：检查当前 Binlog 配置

连接到 **Aurora 写入实例**，执行以下 SQL 检查 Binlog 状态：

```sql
-- Check if binlog is enabled
SHOW VARIABLES LIKE 'log_bin';

-- Check binlog format
SHOW VARIABLES LIKE 'binlog_format';

-- Check binlog row image
SHOW VARIABLES LIKE 'binlog_row_image';
```

根据返回结果选择后续路径：

- 若 `log_bin = ON`、`binlog_format = ROW`、`binlog_row_image = FULL` 三者全部满足，**可直接跳到** [步骤四：创建同步用户](#步骤四创建同步用户)。
- 否则，继续 [步骤二](#步骤二配置集群参数组) 通过集群参数组开启 Binlog。

## 步骤二：配置集群参数组

Aurora MySQL 不能直接修改运行参数，必须通过 **DB Cluster Parameter Group** 修改。

操作步骤：

1. 登录 [AWS RDS 控制台](https://console.aws.amazon.com/rds/)。
2. 在左侧导航栏选择 **Parameter groups**，点击 **Create parameter group**。
3. 类型选择 **DB Cluster Parameter Group**，并选择与目标集群匹配的 Aurora MySQL 版本族。
4. 编辑新建的集群参数组，搜索 `binlog_format`，将值设置为 `ROW`：

    ![MySQL Binlog Format Setting](/images/next/data-operate/streaming-job/mysql-binlog-setting.png)

5. 搜索 `binlog_row_image`，将值设置为 `FULL`。
6. 点击 **Save Changes** 保存。

需要修改的关键参数汇总如下：

| 参数名 | 推荐值 | 说明 |
| :--- | :--- | :--- |
| `binlog_format` | `ROW` | 必须使用行级日志才能用于 CDC 同步 |
| `binlog_row_image` | `FULL` | 保证 Binlog 包含所有列的完整镜像 |

## 步骤三：应用集群参数组并重启

新建的参数组需要绑定到目标集群并重启写入实例后才能生效。

1. 在 RDS 控制台选择目标 Aurora 集群，点击 **Modify**。
2. 在 **DB cluster parameter group** 中选择 [步骤二](#步骤二配置集群参数组) 创建的集群参数组。
3. 勾选 **Apply immediately** 立即应用。
4. 重启 Aurora **写入实例** 使配置生效。

:::caution
修改 `binlog_format` 参数需要重启 Aurora 写入实例才能生效。请在业务低峰期进行操作。
:::

重启完成后，重新执行 [步骤一](#步骤一检查当前-binlog-配置) 中的 SQL 进行确认，三项参数均应符合期望值。

## 步骤四：创建同步用户

为 Doris 持续导入创建一个专用账户，便于权限管理与审计。

1. 创建用户：

    ```sql
    CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>';
    ```

2. 授予同步所需的权限：

    ```sql
    GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
    ```

所需权限说明：

| 权限 | 用途 |
| :--- | :--- |
| `SELECT` | 全量阶段读取业务表数据 |
| `REPLICATION SLAVE` | 作为复制客户端读取 Binlog 流 |
| `REPLICATION CLIENT` | 查询 Binlog 文件位点等元信息 |

## 步骤五：配置 Binlog 保留时间

Aurora 默认会较快回收 Binlog，可能导致复制中断后无法续传。建议将 Binlog 保留时间设置为 **至少 72 小时**，以保证在故障场景下二进制日志仍然可用。

使用 `mysql.rds_set_configuration` 存储过程设置：

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 72);
```

可使用以下 SQL 验证当前配置：

```sql
CALL mysql.rds_show_configuration;
```

:::caution
如果未设置此配置项，或将其设置为过短的间隔，可能会导致二进制日志中出现空缺，从而影响 Doris 恢复复制的能力。
:::

## FAQ

**Q1：为什么修改了 `binlog_format` 后查询仍然不是 `ROW`？**

A：Aurora MySQL 不能直接修改运行参数，必须通过 [步骤二](#步骤二配置集群参数组) 创建并绑定 **DB Cluster Parameter Group**，再重启 **写入实例** 才会生效。修改默认参数组不会生效。

**Q2：是否必须在写入实例上检查与配置？**

A：是的。Binlog 仅在 Aurora 写入实例上生成，所有 SQL 检查与同步用户创建建议都在写入实例上完成。

**Q3：`binlog retention hours` 设置过大有什么影响？**

A：会占用更多存储空间。建议结合实际故障恢复时间窗口设定，最低不少于 72 小时。

## Troubleshooting

| 现象 | 可能原因 | 解决方案 |
| :--- | :--- | :--- |
| `log_bin` 仍为 `OFF` | 未绑定自定义集群参数组，或未重启写入实例 | 按 [步骤三](#步骤三应用集群参数组并重启) 绑定参数组并重启写入实例 |
| `binlog_format` 不是 `ROW` | 修改了实例参数组而非集群参数组 | 在 **DB Cluster Parameter Group** 中修改 `binlog_format = ROW` |
| Doris 同步报找不到 Binlog 文件 | `binlog retention hours` 过小，Binlog 已被回收 | 通过 `mysql.rds_set_configuration` 调大保留时长，至少 72 小时 |
| 同步用户认证失败 | 用户主机限制或权限不足 | 确认用户主机为 `'%'` 或 Doris BE 出口 IP，并已授予 `REPLICATION SLAVE, REPLICATION CLIENT` |
