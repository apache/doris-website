---
{
    "title": "Compute Group 管理：创建、授权与扩缩容",
    "sidebar_label": "Compute Group",
    "language": "zh-CN",
    "description": "在存算分离架构下，通过 Compute Group 实现负载物理隔离，支持创建、授权、切换与弹性扩缩容。",
    "keywords": ["Compute Group", "存算分离", "计算集群", "负载隔离", "弹性扩缩容", "workload management", "Compute Cluster", "BE 管理", "默认计算组"]
}
---

<!-- 知识类型: 概念 + 操作步骤 -->
<!-- 适用场景: 存算分离架构下的负载隔离与资源管理 -->

**Compute Group**（3.0.2 之前版本称为"计算集群/Compute Cluster"）是存算分离架构下实现不同负载之间物理隔离的机制。一个或多个 BE 节点组成一个 Compute Group，多个 Compute Group 通过共享存储层访问同一份数据。

![compute_group](/images/compute_group_workload_management.png)

**核心特点**：

- BE 节点本地无状态，数据存储在共享存储上
- 多个 Compute Group 共享同一份数据，无需额外副本
- 增减 Compute Group 无需数据迁移，只需查询时缓存预热

与 Resource Group 相比，Compute Group 的优势如下：

| 维度 | Compute Group | Resource Group |
|------|--------------|----------------|
| 存储成本 | 数据在共享存储中，Compute Group 数量不受副本限制，成本不随组数增加 | 增加副本数意味着存储成本线性增长 |
| 扩展灵活性 | 新增 Compute Group 只需缓存预热，无需数据迁移 | 新增副本需迁移大量数据 |
| 隔离彻底性 | 共享存储层保证多副本，单个 Compute Group 内 BE 宕机不影响导入 | BE 宕机可能导致导入失败 |

:::caution 注意
3.0.2 之前的版本中，Compute Group 称为计算集群（Compute Cluster）。
:::

## 查看 Compute Group

<!-- 知识类型: 操作步骤 -->

查看当前仓库下所有 Compute Group：

```sql
SHOW COMPUTE GROUPS;
```

## 添加 Compute Group

<!-- 知识类型: 操作步骤 -->

使用 [ADD BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) 命令添加 BE 节点并指定所属 Compute Group。

**指定 Compute Group**：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

**不指定 Compute Group**（默认加入 `default_compute_group`）：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

## 管理 Compute Group 访问权限

<!-- 知识类型: 操作步骤 -->

### 授予访问权限

将指定 Compute Group 的使用权限授予某个用户：

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user};
```

### 撤销访问权限

撤销指定用户对某个 Compute Group 的使用权限：

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user};
```

## 设置默认 Compute Group

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 用户未配置默认 Compute Group 时出现读写报错 -->

### 设置与查看默认 Compute Group

| 操作 | 命令 | 权限要求 |
|------|------|---------|
| 为当前用户设置默认 Compute Group | `SET PROPERTY 'default_compute_group' = '{clusterName}';` | 无需额外权限 |
| 为其他用户设置默认 Compute Group | `SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';` | 需要 Admin 权限 |
| 查看当前用户默认 Compute Group | `SHOW PROPERTY;` | 无需额外权限 |
| 查看其他用户默认 Compute Group | `SHOW PROPERTY FOR {user};` | 需要相关查看权限 |

返回结果中 `default_compute_group` 字段的值即为当前默认 Compute Group。

### 权限说明

**Admin 用户**（如 `CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`）：

- 可为自身及其他用户设置默认 Compute Group
- 可查看自身及其他用户的 `PROPERTY`

**普通用户**（如 `CREATE USER jack1 IDENTIFIED BY '123456'`）：

- 只能为自身设置默认 Compute Group
- 只能查看自身的 `PROPERTY`
- 无法执行 `SHOW COMPUTE GROUPS`（该操作需要 `GRANT ADMIN` 权限）

### 常见问题

#### Q: 执行数据读写时报错
当前用户未配置默认 Compute Group。执行 `use @cluster` 指定当前会话的 Compute Group，或使用 `SET PROPERTY` 设置默认值。

#### Q: 已设置默认 Compute Group，但读写仍报错
之前指定的 Compute Group 已被删除。执行 `use @cluster` 重新指定，或用 `SET PROPERTY` 更新默认设置。

## 默认 Compute Group 自动选择机制

<!-- 知识类型: 概念 -->

当用户未明确设置默认 Compute Group 时，系统会自动选取一个满足以下条件的 Compute Group：

- 存在 Active BE 节点
- 当前用户具有使用权限

同一会话期间，默认 Compute Group 保持不变。跨会话时，以下情况会导致系统重新自动选择：

| 触发情况 | 是否必定更改 |
|----------|------------|
| 用户失去上次所选 Compute Group 的使用权限 | 必定更改 |
| 有 Compute Group 被添加或移除 | 必定更改 |
| 上次所选 Compute Group 不再具有 Active BE | 可能更改 |

## 切换 Compute Group

<!-- 知识类型: 操作步骤 -->

在存算分离架构中，可在同一语句中指定数据库和 Compute Group：

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

若数据库或 Compute Group 名称包含保留关键字，需用反引号（`` ` ``）将对应名称括起来。

## Compute Group 扩缩容

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 弹性伸缩、负载调整 -->

通过添加或删除 BE 节点实现 Compute Group 的弹性扩缩容：

- **扩容**：`ALTER SYSTEM ADD BACKEND` 将新 BE 加入指定 Compute Group
- **缩容**：`ALTER SYSTEM DECOMMISSION BACKEND` 从 Compute Group 中下线 BE

详细操作参考[存算分离相关操作](../../install/choosing-deployment-mode)。
