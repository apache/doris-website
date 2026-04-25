---
{
    "title": "Amazon RDS MySQL",
    "language": "zh-CN",
    "description": "在 Amazon RDS MySQL 上配置 Binlog 以支持 Doris 持续导入的前置步骤。"
}
---

## 概述

Doris 持续导入支持 Amazon RDS MySQL 5.6、5.7、8.0.x 版本。在同步数据之前，需要确保 RDS 实例已开启 Binlog 并正确配置。本文档将指导您完成所有前置配置步骤。

## 步骤一：检查当前配置

首先检查 Binlog 是否已开启以及格式是否正确，连接到 RDS 实例后执行以下 SQL：

```sql
-- Check if binlog is enabled
SHOW VARIABLES LIKE 'log_bin';

-- Check binlog format
SHOW VARIABLES LIKE 'binlog_format';

-- Check binlog row image
SHOW VARIABLES LIKE 'binlog_row_image';
```

如果 `log_bin` 为 `ON`、`binlog_format` 为 `ROW`、`binlog_row_image` 为 `FULL`，则无需额外配置，可直接跳到[步骤四：创建同步用户](#步骤四创建同步用户)。

否则，请继续以下步骤。

## 步骤二：配置参数组

1. 登录 [AWS RDS 控制台](https://console.aws.amazon.com/rds/)。
2. 在左侧导航栏选择 **Parameter groups**，点击 **Create parameter group**。
3. 选择对应的 MySQL 版本族，创建一个新的参数组。
4. 编辑参数组，搜索 `binlog_format`，将值设置为 `ROW`：

![MySQL Binlog Format Setting](./images/mysql-binlog-setting.png)

5. 同样搜索 `binlog_row_image`，将值设置为 `FULL`。
6. 点击 **Save Changes** 保存。

## 步骤三：应用参数组并重启

1. 在 RDS 控制台选择目标实例，点击 **Modify**。
2. 在 **DB parameter group** 中选择新创建的参数组。
3. 选择 **Apply immediately** 立即应用。
4. 重启 RDS 实例使配置生效。

:::caution
修改 `binlog_format` 参数需要重启 RDS 实例才能生效。请在业务低峰期进行操作。
:::

## 步骤四：创建同步用户

创建一个专用用户用于 Doris 持续导入：

```sql
CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>';
```

授予同步所需的权限：

```sql
GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
```


## 步骤五：配置 Binlog 保留时间

默认情况下，Amazon RDS MySQL 会尽快清理二进制日志。建议将 Binlog 保留时间设置为至少 72 小时，以确保在故障场景下用于复制的二进制日志文件仍然可用。

使用 `mysql.rds_set_configuration` 存储过程设置保留时间：

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 72);
```

:::caution
如果未设置此配置项，或将其设置为过短的间隔，可能会导致二进制日志中出现空缺，从而影响 Doris 恢复复制的能力。
:::
