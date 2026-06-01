---
{
    "title": "Workload Group 绑定 Compute Group：实现多业务资源隔离",
    "sidebar_label": "Workload Group 绑定 Compute Group",
    "language": "zh-CN",
    "description": "介绍如何在 Apache Doris 中将 Workload Group 绑定到指定 Compute Group，实现不同业务独立的资源配额管理，适用于存算分离与存算一体架构。",
    "keywords": ["Workload Group", "Compute Group", "Resource Group", "资源隔离", "多租户", "资源管理", "存算分离"]
}
---

<!-- 知识类型: 概念 + 操作步骤 -->

## 为什么需要绑定 Workload Group 到 Compute Group

Doris 支持通过 **Compute Group** 对集群内的 BE 节点进行逻辑分组，形成独立的子集群，从而实现不同业务的计算资源隔离。

在旧版本中，**Workload Group 全局生效于所有 Compute Group**，导致不同业务被迫共享同一套资源配额配置。例如：

- 业务 A 和业务 B 各自创建了 Workload Group，两者资源配额之和已达 100%
- 业务 A 无法再创建新的 Workload Group
- 两个业务的 Workload Group 配置需求差异显著，但旧架构无法按业务独立管理

为解决此问题，当前版本引入 **Workload Group 绑定 Compute Group** 机制，允许每个 Compute Group 维护一套独立的 Workload Group 配置。

## Compute Group 与 Resource Group 的关系

<!-- 知识类型: 概念定义 -->

| 架构类型 | 对应概念 | 说明 |
|---------|---------|------|
| 存算分离 | Compute Group | 独立子集群的逻辑划分单元 |
| 存算一体 | Resource Group | 与 Compute Group 功能等价 |

在讨论资源管理时，可将两者视为逻辑等价的概念。**本文中所有关于 Workload Group 绑定 Compute Group 的说明，同时适用于存算分离和存算一体两种架构。**

## 工作原理

<!-- 知识类型: 概念 -->

### 旧版本设计

假设集群中有 Compute Group A（服务业务 A）和 Compute Group B（服务业务 B），以及 `group_a`、`group_b` 两个 Workload Group，其资源配额之和为 100%。

在旧版本中，`group_a` 和 `group_b` 会在**所有 BE 节点**上生效，不受 Compute Group 分组限制，如下图所示：

![旧版本：Workload Group 全局生效](/images/wg_bind_cg1.png)

这导致：

- 业务 A 创建 `group_a` 后，资源配额已满，无法再创建新的 Workload Group
- 两个业务的 Workload Group 配置相互影响，难以实现差异化管理

### 当前版本设计

当前版本中，Workload Group 支持绑定到指定 Compute Group，**不同的 Compute Group 拥有各自独立的 Workload Group 配置**，如下图所示：

![当前版本：Workload Group 按 Compute Group 隔离](/images/wg_bind_cg2.png)

## 使用方法

<!-- 知识类型: 操作步骤 -->

:::tip 默认 Compute Group 说明
Doris 中存在默认 Compute Group 机制：新增 BE 节点未指定归属时，该节点自动划入默认 Compute Group。

| 架构类型 | 默认 Compute Group 名称 |
|---------|----------------------|
| 存算分离 | `default_compute_group` |
| 存算一体 | `default` |
:::

:::caution `FOR` 子句在两种架构下的行为差异
- **存算分离模式（Cloud 模式）**：CREATE / ALTER / DROP WORKLOAD GROUP 必须显式带上 `FOR <compute_group>` 子句。省略该子句将报错：`Must specify compute group via 'FOR <compute_group>' in cloud mode.`
- **存算一体模式（非 Cloud 模式）**：`FOR <compute_group>` 子句可选。此处的取值实际指代 Resource Group（Tag），并非真正的 Compute Group，语法与存算分离模式保持一致只是为了形式统一。省略时默认作用于默认 Resource Group（`default`）。
:::

### 创建 Workload Group

**绑定到指定 Compute Group：**

```sql
CREATE WORKLOAD GROUP group_a FOR compute_group_a PROPERTIES ('cpu_share'='1024');
```

**不指定 Compute Group（仅适用于存算一体模式，绑定到默认 Resource Group）：**

```sql
CREATE WORKLOAD GROUP group_a PROPERTIES ('cpu_share'='1024');
```

### 删除 Workload Group

**从指定 Compute Group 中删除：**

```sql
DROP WORKLOAD GROUP group_a FOR compute_group_a;
```

**不指定 Compute Group（仅适用于存算一体模式，从默认 Resource Group 中删除）：**

```sql
DROP WORKLOAD GROUP group_a;
```

### 修改 Workload Group 属性

**修改指定 Compute Group 中的 Workload Group 属性：**

```sql
ALTER WORKLOAD GROUP group_a FOR compute_group_a PROPERTIES ('cpu_share'='2048');
```

**不指定 Compute Group（仅适用于存算一体模式，修改默认 Resource Group 中的 Workload Group）：**

```sql
ALTER WORKLOAD GROUP group_a PROPERTIES ('cpu_share'='2048');
```

:::note
`ALTER` 语句仅用于修改 Workload Group 的属性，**不能修改 Workload Group 与 Compute Group 之间的绑定关系**。
:::

### Workload Policy 中引用 Workload Group

在 [CREATE WORKLOAD POLICY](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY) / [ALTER WORKLOAD POLICY](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-POLICY) 的 `workload_group` 属性中，由于 Workload Group 归属于 Compute Group，需要按以下规则书写：

- **存算分离模式（Cloud 模式）**：必须使用 `<compute_group>.<workload_group>` 完整限定形式，例如：

    ```sql
    CREATE WORKLOAD POLICY p1 CONDITIONS(query_time > 3000) ACTIONS(cancel_query)
    PROPERTIES('workload_group'='compute_group_a.wg1');
    ```

- **存算一体模式（非 Cloud 模式）**：支持 `<workload_group>`（默认 Resource Group）或 `<resource_group>.<workload_group>` 两种形式。

## 注意事项

<!-- 知识类型: 约束与限制 -->

1. **绑定关系不可修改**：Workload Group 自创建时即归属于固定的 Compute Group，无法在不同 Compute Group 之间迁移。

2. **版本升级行为**：从旧版本升级到当前版本时，系统会基于已有的 Workload Group，为每个 Compute Group 自动创建同名但 ID 不同的新 Workload Group。例如，若旧版本有两个 Compute Group 且存在 `group_a`，升级后每个 Compute Group 各自获得一个名为 `group_a` 的新 Workload Group，原来未归属任何 Compute Group 的 `group_a` 将被自动删除。

3. **权限管理不变**：Workload Group 的权限鉴权仍通过 Workload Group 名称关联实现，管理方式与旧版本一致。

4. **`normal` Workload Group 的生命周期**：Doris 中存在名为 `normal` 的默认 Workload Group。每当新建 Compute Group 时，系统自动为其创建对应的 `normal` Workload Group；删除 Compute Group 时，关联的 `normal` Workload Group 也会被自动删除。`normal` Workload Group 的生命周期完全由系统自动管理，无需手动操作。
