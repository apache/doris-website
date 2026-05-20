---
{
    "title": "Amazon RDS PostgreSQL",
    "language": "zh-CN",
    "description": "在 Amazon RDS PostgreSQL 上开启逻辑复制并配置同步用户与 Publication，为 Doris 持续导入做好前置准备。",
    "keywords": [
        "Amazon RDS PostgreSQL",
        "Doris 持续导入",
        "逻辑复制",
        "Logical Replication",
        "rds.logical_replication",
        "rds_replication",
        "Publication",
        "dbz_publication",
        "CDC 同步"
    ]
}
---

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 部署前检查 / 环境准备 -->

Doris 持续导入支持从 **Amazon RDS PostgreSQL 14 及以上版本** 同步数据。在启动同步任务之前，需要在 RDS 实例上启用 **逻辑复制（Logical Replication）**，并完成同步用户、权限与 Publication 的配置。

本文档面向 RDS PostgreSQL 实例管理员，介绍 Doris 持续导入所需的前置准备步骤。

### 前置检查清单

在开始配置前，请确认以下条件：

| 检查项 | 要求 |
| --- | --- |
| RDS PostgreSQL 版本 | 14 及以上 |
| 操作权限 | 拥有修改参数组、重启实例的 AWS 权限 |
| 数据库权限 | 拥有创建用户、授权及创建 Publication 的权限 |
| 维护窗口 | 已规划业务低峰期（修改逻辑复制参数需要重启实例）|

### 配置流程总览

整体配置流程如下：

1. 检查 `rds.logical_replication` 当前状态
2. 创建并配置自定义参数组（若未开启）
3. 将参数组应用到实例并重启
4. 创建 Doris 同步用户并授权
5. 创建供 Doris 订阅的 Publication

---

## 步骤一：检查当前配置

<!-- 知识类型: 操作步骤 -->

**目的**：确认 RDS 实例当前是否已启用逻辑复制，决定是否需要修改参数组。

连接到 RDS 实例后，执行以下 SQL：

```sql
SHOW rds.logical_replication;
```

根据结果选择后续路径：

| 返回值 | 含义 | 后续步骤 |
| --- | --- | --- |
| `on` | 已启用逻辑复制 | 跳转到 [步骤四：创建同步用户](#步骤四创建同步用户) |
| `off` | 未启用逻辑复制 | 继续执行 [步骤二](#步骤二配置参数组) |

---

## 步骤二：配置参数组

<!-- 知识类型: 操作步骤 / 配置参数 -->

**目的**：创建自定义参数组并将 `rds.logical_replication` 设置为开启状态。

操作步骤：

1. 登录 [AWS RDS 控制台](https://console.aws.amazon.com/rds/)。
2. 在左侧导航栏选择 **Parameter groups**，点击 **Create parameter group**。
3. 选择与目标实例匹配的 PostgreSQL 版本族，创建新的参数组。
4. 编辑参数组，搜索 `rds.logical_replication`，将其值设置为 `1`：

    ![PostgreSQL WAL Setting](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. 点击 **Save Changes** 保存。

关键参数说明：

| 参数 | 设置值 | 说明 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 启用逻辑复制；等价于将 `wal_level` 设为 `logical` |

---

## 步骤三：应用参数组并重启

<!-- 知识类型: 操作步骤 -->

**目的**：将新参数组绑定到 RDS 实例，并通过重启使配置生效。

操作步骤：

1. 在 RDS 控制台选择目标实例，点击 **Modify**。
2. 在 **DB parameter group** 中选择 [步骤二](#步骤二配置参数组) 中创建的参数组。
3. 选择 **Apply immediately**，立即应用变更。
4. 重启 RDS 实例使配置生效。

:::caution
修改 `rds.logical_replication` 参数需要重启 RDS 实例才能生效，请在业务低峰期进行操作。
:::

---

## 步骤四：创建同步用户

<!-- 知识类型: 操作步骤 / 配置参数 -->

**目的**：创建专用于 Doris 持续导入的数据库账号，并授予所需的读权限与复制权限。

### 1. 创建用户

```sql
CREATE USER doris_sync PASSWORD '<password>';
```

### 2. 授予 Schema 访问权限

以 `public` Schema 为例，请根据实际需要替换为目标 Schema：

```sql
GRANT USAGE ON SCHEMA "public" TO doris_sync;
GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO doris_sync;
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT ON TABLES TO doris_sync;
```

### 3. 授予复制权限

```sql
GRANT rds_replication TO doris_sync;
```

:::tip
Amazon RDS PostgreSQL 使用 `rds_replication` 角色来授予复制权限，而非标准 PostgreSQL 的 `REPLICATION` 属性。
:::

权限一览：

| 权限项 | 作用 |
| --- | --- |
| `USAGE ON SCHEMA` | 允许访问指定 Schema |
| `SELECT ON ALL TABLES` | 允许读取 Schema 下所有现有表 |
| `ALTER DEFAULT PRIVILEGES ... SELECT` | 自动对未来新增的表赋予 `SELECT` 权限 |
| `rds_replication` | 在 RDS 中执行逻辑复制所需的角色 |

---

## 步骤五：创建 Publication

<!-- 知识类型: 操作步骤 / 配置参数 -->

**目的**：创建 Doris 订阅所使用的 Publication。

执行以下 SQL：

```sql
CREATE PUBLICATION dbz_publication FOR ALL TABLES;
```

:::caution
目前 Doris 仅支持名为 `dbz_publication` 的 Publication，且必须为 `FOR ALL TABLES`，暂不支持自定义 Publication 名称或仅指定部分表。
:::

> **备注**：如果同步用户拥有 superuser 权限（如 `rds_superuser` 角色），Doris 会在任务启动时自动创建该 Publication，无需手动执行此步骤。

---

## FAQ

<!-- 知识类型: 常见问题 -->

**Q1：执行 `SHOW rds.logical_replication;` 返回 `on`，是否还需要重启实例？**

不需要。`on` 表示逻辑复制已经生效，可以直接跳到 [步骤四：创建同步用户](#步骤四创建同步用户)。

**Q2：可以使用其他名称的 Publication 吗？**

不可以。Doris 当前仅支持名为 `dbz_publication` 的 Publication，且必须为 `FOR ALL TABLES`。

**Q3：是否必须使用 `rds_replication` 角色？**

是的。RDS PostgreSQL 出于安全限制不允许使用标准 PostgreSQL 的 `REPLICATION` 属性，必须通过 `GRANT rds_replication` 授权。

**Q4：是否一定要手动创建 Publication？**

不一定。如果同步用户拥有 `rds_superuser` 等 superuser 权限，Doris 会自动创建 `dbz_publication`，可省略 [步骤五](#步骤五创建-publication)。

---

## Troubleshooting

<!-- 知识类型: 故障排查 -->

| 现象 | 可能原因 | 解决方案 |
| --- | --- | --- |
| `SHOW rds.logical_replication;` 仍为 `off` | 参数组未绑定到实例 / 未重启 | 检查实例是否使用了新的参数组，并执行重启 |
| 创建用户报权限错误 | 当前账号权限不足 | 使用具有创建用户权限的管理员账号执行 |
| `GRANT rds_replication` 报错 | 当前账号无权授予该角色 | 使用 `rds_superuser` 账号或具备授予权限的账号执行 |
| Doris 任务报 Publication 不存在 | 未创建 `dbz_publication` 或权限不足 | 手动执行 [步骤五](#步骤五创建-publication)，或为同步用户授予 superuser 权限 |
| 修改参数后未生效 | 未选择 **Apply immediately** 或未重启 | 重新执行 [步骤三](#步骤三应用参数组并重启) |
