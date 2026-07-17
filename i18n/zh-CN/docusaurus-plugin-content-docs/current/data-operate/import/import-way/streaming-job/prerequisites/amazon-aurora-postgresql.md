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
        "publication_name",
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
5. 根据 Doris 版本配置 Publication

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

## 步骤五：配置 Publication

<!-- 知识类型: 操作步骤 -->

### Doris 4.0

需要预先创建名为 `dbz_publication` 的 Publication，且必须使用 `FOR ALL TABLES`：

```sql
CREATE PUBLICATION dbz_publication FOR ALL TABLES;
```

如果同步用户拥有 superuser 权限（如 `rds_superuser` 角色），Doris 可以在任务启动时自动创建 `dbz_publication`，无需手动执行该语句。Doris 4.0 不支持自定义 Publication 名称或仅指定部分表。

### Doris 4.1.0 及之后版本

默认情况下，无需手动创建 Publication。未设置 `publication_name` 时，Doris 会使用同步账号创建名为 `doris_pub_<job_id>` 的 Publication，并在删除作业时清理，因此同步账号需要具有创建 Publication 的权限。

如果在创建 Streaming Job 时显式设置 `publication_name`，则需要预先创建同名 Publication。自定义 Publication 必须包含作业同步的全部源表，并由用户负责维护和清理。例如：

```sql
CREATE PUBLICATION doris_pub_custom
FOR TABLE public.orders, public.customers;
```

创建作业时配置 `"publication_name" = "doris_pub_custom"`。名称只能包含小写字母、数字和下划线，不能以数字开头，最长 63 个字符。

## FAQ

<!-- 知识类型: 常见问题 -->

**Q1：执行 `SHOW rds.logical_replication;` 返回 `on`，还需要做什么？**

无需修改集群参数组，也不需要重启实例。直接从 [步骤四：创建同步用户](#步骤四创建同步用户) 开始即可。

**Q2：Aurora PostgreSQL 13 或更早版本支持吗？**

不支持。Doris 持续导入要求 Aurora PostgreSQL 14 及以上版本。

**Q3：可以使用自定义名称的 Publication 吗？**

Doris 4.0 不支持，只能使用 `dbz_publication FOR ALL TABLES`。自 4.1.0 版本起，可以通过 `publication_name` 指定自定义名称，但必须在创建作业前创建该 Publication，并确保其包含所有同步表。

**Q4：必须使用 superuser 账号同步吗？**

不必须。Doris 4.0 中，普通同步用户需要手动创建 `dbz_publication`，拥有 superuser 权限时可由 Doris 自动创建。自 4.1.0 版本起，省略 `publication_name` 时 Doris 会自动创建和管理默认 Publication；只有使用自定义 Publication 时才需要预先创建。

## Troubleshooting

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 同步前置检查失败 -->

| 问题现象 | 可能原因 | 解决方法 |
| --- | --- | --- |
| `SHOW rds.logical_replication;` 仍返回 `off` | 未将新参数组绑定集群，或未重启写入实例 | 确认 **DB cluster parameter group** 已切换为新参数组，并重启写入实例 |
| 创建用户或授权失败 | 当前登录账号权限不足 | 使用具备 `rds_superuser` 或等价权限的账号登录后操作 |
| `GRANT rds_replication` 报错 | 当前 Aurora 版本过低或集群非 Aurora PostgreSQL | 升级到 Aurora PostgreSQL 14 及以上版本 |
| Doris 4.0 报 `dbz_publication` 不存在 | 未创建 `dbz_publication`，且同步账号无 superuser 权限 | 执行 `CREATE PUBLICATION dbz_publication FOR ALL TABLES;`，或使用具有相应权限的账号 |
| Doris 4.1.0 及之后版本创建默认 Publication 失败 | 同步账号缺少创建 Publication 的权限 | 为同步账号授予所需权限，或由管理员预先创建自定义 Publication 并配置 `publication_name` |
| Doris 4.1.0 及之后版本报自定义 Publication 不存在 | 配置了 `publication_name`，但未预先创建同名 Publication | 按[步骤五](#步骤五配置-publication)创建 Publication，或删除 `publication_name` 配置 |
