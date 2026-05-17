---
{
    "title": "Amazon Aurora PostgreSQL",
    "language": "zh-CN",
    "description": "如何在 Amazon Aurora PostgreSQL 开启逻辑复制并配置同步用户，满足 Doris 持续导入前置条件。",
    "keywords": [
        "Amazon Aurora PostgreSQL",
        "逻辑复制",
        "Logical Replication",
        "rds.logical_replication",
        "Doris 持续导入",
        "Publication",
        "dbz_publication",
        "CDC 前置配置"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 部署前检查 / 环境准备 -->

Doris 持续导入支持从 **Amazon Aurora PostgreSQL-Compatible Edition 14 及以上版本** 同步数据。同步前需要在 Aurora 集群侧开启逻辑复制（Logical Replication）并完成相关授权。本文档面向 DBA 与数据工程师，提供完整的前置配置步骤。

### 前置检查清单

在开始配置前，请确认以下信息：

| 检查项 | 要求 |
| --- | --- |
| Aurora PostgreSQL 版本 | 14 及以上 |
| 操作权限 | 拥有 AWS RDS 控制台修改集群参数组的权限 |
| 数据库权限 | 拥有创建用户、授权及创建 Publication 的权限 |
| 维护窗口 | 可接受重启 Aurora 写入实例（修改逻辑复制参数后需要重启） |

### 配置流程

整个配置流程包含 5 个步骤：

1. 检查当前逻辑复制配置状态
2. 配置集群参数组
3. 应用集群参数组并重启实例
4. 创建 Doris 同步用户并授权
5. 创建 Publication

如果第 1 步检查发现逻辑复制已经开启，则可直接跳到 **步骤四** 创建同步用户。

## 步骤一：检查当前配置

<!-- 知识类型: 操作步骤 -->

**目的：** 判断 Aurora 集群是否已开启逻辑复制，决定是否需要修改参数组。

连接到 Aurora 写入实例，执行以下 SQL：

```sql
SHOW rds.logical_replication;
```

根据返回结果选择后续操作：

| 返回值 | 含义 | 后续操作 |
| --- | --- | --- |
| `on` | 逻辑复制已开启 | 跳至 [步骤四：创建同步用户](#步骤四创建同步用户) |
| `off` | 逻辑复制未开启 | 继续 [步骤二：配置集群参数组](#步骤二配置集群参数组) |

## 步骤二：配置集群参数组

<!-- 知识类型: 配置参数 -->

**目的：** 创建一个开启逻辑复制的 DB Cluster Parameter Group，供 Aurora 集群使用。

操作步骤：

1. 登录 [AWS RDS 控制台](https://console.aws.amazon.com/rds/)。
2. 在左侧导航栏选择 **Parameter groups**，点击 **Create parameter group**。
3. 类型选择 **DB Cluster Parameter Group**，并选择对应的 Aurora PostgreSQL 版本族。
4. 编辑刚刚创建的集群参数组，搜索 `rds.logical_replication`，将值设置为 `1`：

    ![PostgreSQL WAL Setting](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. 点击 **Save Changes** 保存。

关键参数说明：

| 参数 | 推荐值 | 说明 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 开启逻辑复制；`0` 表示关闭 |

## 步骤三：应用集群参数组并重启

<!-- 知识类型: 操作步骤 -->

**目的：** 将新建的参数组绑定到目标 Aurora 集群，并通过重启写入实例使配置生效。

操作步骤：

1. 在 RDS 控制台选择目标 Aurora 集群，点击 **Modify**。
2. 在 **DB cluster parameter group** 中选择步骤二创建的集群参数组。
3. 选择 **Apply immediately** 立即应用。
4. 重启 Aurora 写入实例，使配置生效。

:::caution
修改 `rds.logical_replication` 参数需要重启 Aurora 写入实例才能生效，请在业务低峰期进行操作。
:::

## 步骤四：创建同步用户

<!-- 知识类型: 操作步骤 -->

**目的：** 为 Doris 持续导入创建一个专用账号，并授予读取数据与执行复制所需的最小权限。

1. 创建专用用户：

    ```sql
    CREATE USER doris_sync PASSWORD '<password>';
    ```

2. 授予 Schema 与表的读取权限（以 `public` Schema 为例，请根据实际情况替换）：

    ```sql
    GRANT USAGE ON SCHEMA "public" TO doris_sync;
    GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO doris_sync;
    ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT ON TABLES TO doris_sync;
    ```

3. 授予复制权限：

    ```sql
    GRANT rds_replication TO doris_sync;
    ```

授权说明：

| 权限 | 作用 |
| --- | --- |
| `USAGE ON SCHEMA` | 允许访问指定 Schema |
| `SELECT ON ALL TABLES` | 允许读取 Schema 中现有所有表的数据 |
| `ALTER DEFAULT PRIVILEGES ... GRANT SELECT` | 自动授予该 Schema 中后续新建表的读取权限 |
| `rds_replication` | Aurora PostgreSQL 中执行逻辑复制所需的角色 |

## 步骤五：创建 Publication

<!-- 知识类型: 操作步骤 -->

**目的：** 创建供 Doris 订阅使用的 Publication。

执行以下 SQL：

```sql
CREATE PUBLICATION dbz_publication FOR ALL TABLES;
```

:::caution
目前 Doris 仅支持名为 `dbz_publication` 的 Publication，且必须为 `FOR ALL TABLES`，暂不支持自定义 Publication 名称或仅指定部分表。
:::

> **备注：** 如果同步用户拥有 superuser 权限（如 `rds_superuser` 角色），Doris 会自动创建 Publication，无需手动执行此步骤。

## FAQ

<!-- 知识类型: 常见问题 -->

**Q1：执行 `SHOW rds.logical_replication;` 返回 `on`，还需要做什么？**

无需修改集群参数组，也不需要重启实例。直接从 [步骤四：创建同步用户](#步骤四创建同步用户) 开始即可。

**Q2：Aurora PostgreSQL 13 或更早版本支持吗？**

不支持。Doris 持续导入要求 Aurora PostgreSQL 14 及以上版本。

**Q3：可以使用自定义名称的 Publication 吗？**

不可以。当前 Doris 仅支持名为 `dbz_publication` 且为 `FOR ALL TABLES` 的 Publication。

**Q4：必须使用 superuser 账号同步吗？**

不必须。推荐使用普通用户 `doris_sync` 并按本文档授权。仅当账号拥有 superuser 权限（如 `rds_superuser`）时，Doris 才会自动创建 Publication。

## Troubleshooting

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 同步前置检查失败 -->

| 问题现象 | 可能原因 | 解决方法 |
| --- | --- | --- |
| `SHOW rds.logical_replication;` 仍返回 `off` | 未将新参数组绑定集群，或未重启写入实例 | 确认 **DB cluster parameter group** 已切换为新参数组，并重启写入实例 |
| 创建用户或授权失败 | 当前登录账号权限不足 | 使用具备 `rds_superuser` 或等价权限的账号登录后操作 |
| `GRANT rds_replication` 报错 | 当前 Aurora 版本过低或集群非 Aurora PostgreSQL | 升级到 Aurora PostgreSQL 14 及以上版本 |
| 创建 Publication 报权限错误 | `doris_sync` 用户缺少创建 Publication 权限 | 使用 superuser 账号手动执行 `CREATE PUBLICATION`，或为同步账号临时授予所需权限 |
| Doris 启动同步报找不到 `dbz_publication` | 未创建 Publication，且同步账号无 superuser 权限不能自动创建 | 手动执行步骤五的 `CREATE PUBLICATION dbz_publication FOR ALL TABLES;` |
