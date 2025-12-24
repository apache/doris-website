---
{
    "title": "Compute Group",
    "language": "zh-CN",
    "description": "Compute Group 是存算分离架构下，实现不同的负载之间物理隔离的一种机制，它的基本原理如下图所示："
}
---

Compute Group 是存算分离架构下，实现不同的负载之间物理隔离的一种机制，它的基本原理如下图所示：

![compute_group](/images/compute_group_workload_management.png)

- 一个或多个 BE 可以组成一个 Compute Group；
- BE 节点本地无状态，数据都是存储在共享存储上；
- 多个 Compute Group 之间通过共享的存储的方式来访问数据。

在保持了 Resource Group 强隔离的优点的同时，Compute Group 与 Resource Group 相比，还有以下优势：

- 成本更低，由于采用了存算分离的架构，数据位于共享存储中，所以 Compute Group 的数量不再受限于副本的数量，用户可以根据需求创建任意多的 Compute Group，存储成本不会变多；
- 更灵活，在存算分离架构下，BE 本地的数据都是缓存，所以增加 Compute Group 时不需要做笨重的数据迁移过程，新的 Compute Group 只需在查询时缓存预热即可；
- 隔离更彻底，数据的多副本存储由共享的存储层解决，所以任何 Compute Group 内的 BE 宕机不会像 Resource Group 那样导致导入失败。

:::caution 注意
3.0.2 之前的版本中叫做计算集群（Compute Cluster）。
:::

## 查看所有 Compute Group

可通过 `SHOW COMPUTE GROUPS` 查看当前仓库拥有的所有 Compute Group。

```sql
SHOW COMPUTE GROUPS;
```

## 添加 Compute Group

使用[ADD BE ](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND.md)命令添加 BE 并为 BE 指定 Compute Group，示例：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

上面命令会将`host:9050`这台节点添加到`new_group`这个 Compute Group 中，您也可以不指定 Compute Group，默认会添加到`default_compute_group`组里，例如：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

## 授予 Compute Group 访问权限

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user};
```

## 撤销 Compute Group 访问权限

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user};
```

## 设置默认 Compute Group

为当前用户设置默认 Compute Group：

```sql
SET PROPERTY 'default_compute_group' = '{clusterName}';
```

为其他用户设置默认 Compute Group（此操作需要 Admin 权限）：

```sql
SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';
```

查看当前用户默认 Compute Group，返回结果中`default_compute_group` 的值即为默认 Compute Group：

```sql
SHOW PROPERTY;
```

查看其他用户默认 Compute Group，此操作需要当前用户具备相关权限，返回结果中`default_compute_group` 的值即为默认 Compute Group：

```sql
SHOW PROPERTY FOR {user};
```

查看当前仓库下所有可用的 Compute Group：

```sql
SHOW COMPUTE GROUPS;
```

:::info 备注

- 若当前用户拥有 Admin 角色，例如：`CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`，则：
    
    - 可以为自身以及其他用户设置默认 Compute Group；
    
    - 可以查看自身以及其他用户的 `PROPERTY`。

- 若当前用户无 Admin 角色，例如：`CREATE USER jack1 IDENTIFIED BY '123456'`，则：

    - 可以为自身设置默认 Compute Group；

    - 可以查看自身的 `PROPERTY`；

    - 无法查看所有 Compute Group，因该操作需要 `GRANT ADMIN` 权限。

- 若当前用户未配置默认 Compute Group，现有系统在执行数据读写操作时将会触发错误。为解决这一问题，用户可通过执行 `use @cluster` 命令来指定当前 Context 所使用的 Compute Group，或者使用 `SET PROPERTY` 语句来设置默认 Compute Group。

- 若当前用户已配置默认 Compute Group，但随后该集群被删除，则在执行数据读写操作时同样会触发错误。用户可通过执行 `use @cluster` 命令来重新指定当前 Context 所使用的 Compute Group，或者利用 `SET PROPERTY` 语句来更新默认集群设置。

:::

## 默认 Compute Group 的选择机制

当用户未明确设置默认 Compute Group 时，系统将自动为用户选择一个具有 Active BE 且用户具有使用权限的 Compute Group。在特定会话中确定默认 Compute Group 后，默认 Compute Group 将在该会话期间保持不变，除非用户显式更改了默认设置。

在不同次的会话中，若发生以下情况，系统可能会自动更改用户的默认 Compute Group：

- 用户失去了在上次会话中所选择默认 Compute Group 的使用权限
- 有 Compute Group 被添加或移除
- 上次所选择的默认 Compute Group 不再具有 Active BE

其中，情况一和情况二必定会导致系统自动选择的默认 Compute Group 更改，情况三可能会导致更改。

## 切换 Compute Group

用户可在存算分离架构中指定使用的数据库和 Compute Group。

**语法**

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

若数据库或 Compute Group 名称包含是保留关键字，需用反引号将相应的名称 ``` 包围。

## Compute Group 扩缩容

通过 `ALTER SYSTEM ADD BACKEND` 以及 `ALTER SYSTEM DECOMMISSION BACKEND` 添加或者删除 BE 实现 Compute Group 的扩缩容。


详细操作参考[存算分离相关操作](../../compute-storage-decoupled/overview.md)
