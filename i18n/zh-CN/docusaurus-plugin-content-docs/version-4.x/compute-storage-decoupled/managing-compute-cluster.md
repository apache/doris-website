---
{
    "title": "计算组管理：创建、授权、切换与扩缩容操作指南",
    "sidebar_label": "管理 Compute Group",
    "language": "zh-CN",
    "description": "介绍存算分离架构下计算组（Compute Group）的创建、权限授予、默认组设置、切换及扩缩容等全部管理操作。",
    "keywords": ["计算组", "Compute Group", "存算分离", "计算组授权", "计算组扩缩容", "读写隔离", "负载均衡"]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 集群管理 / 资源隔离 / 负载分配 -->

在存算分离架构下，可以将一个或多个计算节点（BE）组成一个**计算组**（Compute Group）。本文档介绍计算组的完整管理操作，包括查看、添加、授权、设置默认组、切换以及扩缩容。

:::note 版本说明
3.0.2 之前的版本中，计算组称为**计算集群**（Compute Cluster）。
:::

## 计算组使用场景

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 多租户隔离 / 读写分离 / 负载隔离 -->

在多计算组架构下，可以通过 `USE @<compute_group_name>` 语句将特定负载分配到指定计算组，实现多种负载的物理隔离。

以下场景均以存在两个计算组 C1 和 C2 为例：

| 场景 | 说明 | 操作方式 |
| :--- | :--- | :--- |
| **读读隔离** | 两个大型查询分别在不同计算节点上运行，避免 CPU/内存资源竞争 | 查询 1 使用 `USE @c1`，查询 2 使用 `USE @c2` |
| **读写隔离** | 避免导入与查询之间的资源竞争，C1 可访问 C2 中新导入的数据 | 查询使用 `USE @c1`，导入使用 `USE @c2` |
| **写写隔离** | 高频小量导入与大批量导入分开执行，避免相互干扰 | 小量导入使用 `USE @c1`，批量导入使用 `USE @c2` |

## 默认计算组的选择机制

<!-- 知识类型: 系统行为说明 -->

当用户未明确[设置默认计算组](#设置默认计算组)时，系统将自动为用户选择一个满足以下条件的计算组：

- 该计算组存在存活的计算节点
- 当前用户对该计算组具有使用权限（USAGE_PRIV）

在同一会话期间，默认计算组保持不变，除非用户显式更改。跨会话时，若出现以下任一情况，系统可能自动更换默认计算组：

| 触发条件 | 是否必定更换 |
| :--- | :---: |
| 用户失去上次所选计算组的使用权限 | 是 |
| 有计算组被添加或移除 | 是 |
| 上次所选计算组不再有存活计算节点 | 可能 |

## 查看所有计算组

<!-- 知识类型: 操作步骤 -->

**目的**：查看当前仓库中所有计算组。

**命令**：

```sql
SHOW COMPUTE GROUPS;
```

**说明**：返回结果根据用户权限级别不同而有所差异：

- 具有 `ADMIN` 权限的用户可查看所有计算组
- 普通用户只能查看其拥有 `USAGE_PRIV` 权限的计算组
- 若用户无任何计算组的使用权限，则返回结果为空

## 添加计算组

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 集群初始化 / 新增计算资源 -->

**前置条件**：需要具备 `OPERATOR` 权限（节点管理权限）。默认仅 root 账号拥有该权限，可通过 `GRANT` 命令授予其他账号。详见[权限管理](../sql-manual/sql-statements/account-management/GRANT-TO)。

**目的**：添加 BE 节点并指定其所属计算组。

**命令（指定计算组）**：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

**命令（使用默认计算组）**：不指定计算组时，节点默认加入 `default_compute_group`：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

详见 [ADD BACKEND SQL 手册](../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND)。

## 授予计算组访问权限

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 多用户权限管理 -->

**前置条件**：当前操作用户具备 `ADMIN` 权限，或当前用户属于 admin role。

**目的**：向指定用户授予某计算组的使用权限。

**命令**：

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user};
```

## 撤销计算组访问权限

<!-- 知识类型: 操作步骤 -->

**前置条件**：当前操作用户具备 `ADMIN` 权限，或当前用户属于 admin role。

**目的**：撤销指定用户对某计算组的使用权限。

**命令**：

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user};
```

## 设置默认计算组

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 用户级资源隔离 -->

### 为当前用户设置

**前置条件**：当前用户已拥有目标计算组的使用权限。

```sql
SET PROPERTY 'default_compute_group' = '{clusterName}';
```

### 为其他用户设置

**前置条件**：当前用户具备 Admin 权限。

```sql
SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';
```

### 查看默认计算组

查看当前用户的默认计算组，返回结果中 `default_compute_group` 的值即为默认计算组：

```sql
SHOW PROPERTY;
```

查看其他用户的默认计算组（需要 admin 权限）：

```sql
SHOW PROPERTY FOR {user};
```

### 权限说明

| 用户角色 | 可操作范围 |
| :--- | :--- |
| Admin 用户（如 `CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`） | 可为自身及其他用户设置默认计算组；可查看自身及其他用户的 `PROPERTY` |
| 普通用户（如 `CREATE USER jack1 IDENTIFIED BY '123456'`） | 只能为自身设置默认计算组；只能查看自身的 `PROPERTY`；无法查看所有计算组（需要 `GRANT ADMIN` 权限） |

:::caution 注意

- 若当前用户未配置默认计算组，在执行数据读写操作时将触发错误。可通过 `USE @cluster` 命令指定当前会话所用的计算组，或使用 `SET PROPERTY` 语句设置默认计算组。
- 若当前用户已配置默认计算组，但该计算组随后被删除，则执行数据读写操作时同样会触发错误。可通过 `USE @cluster` 命令重新指定计算组，或使用 `SET PROPERTY` 更新默认计算组设置。

:::

## 切换计算组

<!-- 知识类型: 操作步骤 -->

**目的**：在存算分离架构中指定当前会话使用的数据库和计算组。

**语法**：

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

**说明**：若数据库名或计算组名包含保留关键字，需用反引号（`` ` ``）将相应名称括起来。

## 计算组扩缩容

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 弹性扩缩容 / 容量规划 -->

通过以下命令添加或删除 BE 节点，实现计算组的扩缩容：

- **扩容**：`ALTER SYSTEM ADD BACKEND`
- **缩容**：`ALTER SYSTEM DECOMMISSION BACKEND`

### 扩缩容后的负载重均衡

Cloud Rebalance 是 Doris 存算分离架构下的负载均衡机制。当计算组中的 BE 节点发生扩缩容（长时间节点下线视为缩容）后，系统自动重新均衡集群的读写流量分配。

#### Balance 策略类型

<!-- 知识类型: 配置参数 -->

:::caution 版本支持

`balance_type` 功能自 **Doris 3.1.3** 和 **Doris 4.0.2** 版本起支持。在此之前，仅支持通过 FE 全局配置 `enable_cloud_warm_up_for_rebalance` 控制 rebalance 时是否执行 warm up 任务。

:::

以下以向计算组扩容节点为例，说明三种策略类型：

| 策略类型 | 新节点可服务时间 | 性能波动 | 技术原理 | 适用场景 |
| :--- | :---: | :---: | :--- | :--- |
| `without_warmup` | 最快 | 最大 | FE 直接修改分片映射；首次读写无 file cache，需从 S3 拉取数据 | 需要新节点快速上线，对性能抖动不敏感 |
| `async_warmup` | 较快 | 可能出现 cache miss | 下发 warm up 任务，成功或超时后再修改映射；映射切换时尽力拉取 file cache，部分场景首次读仍可能 miss | 通用场景，性能可接受 |
| `sync_warmup` | 较慢 | 基本无 cache miss | 下发 warm up 任务，FE 确认任务完成后才修改映射，确保 cache 迁移完成 | 对扩容后性能要求极高，希望新节点一定存在 file cache |

#### 配置方式

##### 全局默认 balance type

通过 FE 配置文件（`fe.conf`）设置全局默认值：

```
cloud_default_rebalance_type = "async_warmup"
```

##### 计算组级别配置

支持为每个计算组单独配置 balance type：

```sql
ALTER COMPUTE GROUP cg1 PROPERTIES("balance_type"="async_warmup");
```

##### 配置优先级规则

1. 若计算组未配置 `balance_type`，则使用全局默认值 `async_warmup`。
2. 若计算组已配置 `balance_type`，执行 rebalance 时优先使用该计算组的配置。

## 重命名计算组

<!-- 知识类型: 操作步骤 -->

**目的**：将现有计算组更名为新名称。

**命令**：

```sql
ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>;
```

:::caution 注意

重命名后，原计算组名称（`old_name`）关联的用户权限及默认计算组设置**不会**自动更新为新名称（`new_name`）。需由具有管理员权限的账户手动重新授权。此行为与 MySQL 权限体系保持一致。

:::

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 故障排查 / 权限问题 / 性能调优 -->

### 如何查看与修改全局 rebalance type？

- **查看**：
    ```sql
    ADMIN SHOW FRONTEND CONFIG LIKE "cloud_default_rebalance_type";
    ```
- **修改**（修改后无需重启 FE 即可生效）：
    ```sql
    ADMIN SET FRONTEND CONFIG ("cloud_warm_up_for_rebalance_type" = "without_warmup");
    ```

### 如何查询计算组的 balance type？

执行 `SHOW COMPUTE GROUPS;`，结果中的 `properties` 列包含计算组的属性信息，其中可查看 `balance_type` 配置。

### 如何判断集群是否处于 tablet 稳定态？

**方法一：通过 `SHOW BACKENDS` 查看**

检查各 BE 的 tablet 数是否接近均衡。参考范围：

```
(集群所有 tablet 数 / Compute Group BE 数) × 0.95
~
(集群所有 tablet 数 / Compute Group BE 数) × 1.05
```

其中 0.05 为 FE 配置项 `cloud_rebalance_percent_threshold` 的默认值。如需让各 BE 承载的 tablet 更加均匀，可调小该配置值。

**方法二：通过 FE metrics 观察**

查看 FE metrics 中的 `doris_fe_cloud_.*_balance_num` 系列指标。若长时间无变化，说明计算组已趋于均衡状态。建议在监控面板配置这些 metrics 以便持续观察：

```bash
curl "http://feip:fe_http_port/metrics" | grep '_balance_num'
```

### 执行数据读写时报错"未配置默认计算组"怎么办？

通过以下任一方式解决：

1. 使用 `USE @cluster` 命令临时指定当前会话的计算组。
2. 使用 `SET PROPERTY 'default_compute_group' = '{clusterName}'` 永久设置默认计算组。

### 默认计算组被删除后报错怎么办？

计算组被删除后，依赖该计算组的用户在读写时会报错。解决方式：

1. 使用 `USE @cluster` 命令重新指定当前会话的计算组。
2. 使用 `SET PROPERTY` 更新默认计算组为其他有效计算组。
