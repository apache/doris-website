---
{
    "title": "Amazon Aurora PostgreSQL",
    "language": "zh-CN",
    "description": "在 Amazon Aurora PostgreSQL 上配置逻辑复制以支持 Doris 持续导入的前置步骤。"
}
---

## 概述

Doris 持续导入支持 Amazon Aurora PostgreSQL-Compatible Edition 14 及以上版本。在同步数据之前，需要确保 Aurora 集群已开启逻辑复制（Logical Replication）。本文档将指导您完成所有前置配置步骤。

## 步骤一：检查当前配置

首先检查逻辑复制是否已开启，连接到 Aurora 写入实例后执行以下 SQL：

```sql
SHOW rds.logical_replication;
```

如果结果为 `on`，则无需修改参数组，可直接跳到[步骤四：创建同步用户](#步骤四创建同步用户)。

如果结果为 `off`，请继续以下步骤。

## 步骤二：配置集群参数组

1. 登录 [AWS RDS 控制台](https://console.aws.amazon.com/rds/)。
2. 在左侧导航栏选择 **Parameter groups**，点击 **Create parameter group**。
3. 类型选择 **DB Cluster Parameter Group**，选择对应的 Aurora PostgreSQL 版本族。
4. 编辑集群参数组，搜索 `rds.logical_replication`，将值设置为 `1`：

![PostgreSQL WAL Setting](./images/pgwalsetting.png)

5. 点击 **Save Changes** 保存。

## 步骤三：应用集群参数组并重启

1. 在 RDS 控制台选择目标 Aurora 集群，点击 **Modify**。
2. 在 **DB cluster parameter group** 中选择新创建的集群参数组。
3. 选择 **Apply immediately** 立即应用。
4. 重启 Aurora 写入实例使配置生效。

:::caution
修改 `rds.logical_replication` 参数需要重启 Aurora 写入实例才能生效。请在业务低峰期进行操作。
:::

## 步骤四：创建同步用户

创建一个专用用户用于 Doris 持续导入：

```sql
CREATE USER doris_sync PASSWORD '<password>';
```

授予 Schema 访问权限（以 `public` Schema 为例，请根据实际情况替换）：

```sql
GRANT USAGE ON SCHEMA "public" TO doris_sync;
GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO doris_sync;
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT ON TABLES TO doris_sync;
```

授予复制权限：

```sql
GRANT rds_replication TO doris_sync;
```

## 步骤五：创建 Publication

执行以下 SQL 创建 Publication：

```sql
CREATE PUBLICATION dbz_publication FOR ALL TABLES;
```

:::caution
目前 Doris 仅支持名为 `dbz_publication` 的 Publication，且必须为 `FOR ALL TABLES`，暂不支持自定义 Publication 名称或指定部分表。
:::

> **备注：** 如果同步用户拥有 superuser 权限（如 `rds_superuser` 角色），Doris 会自动创建 Publication，无需手动执行此步骤。

