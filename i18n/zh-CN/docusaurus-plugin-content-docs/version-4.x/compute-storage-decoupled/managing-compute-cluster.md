---
{
    "title": "计算组操作",
    "language": "zh-CN",
    "description": "在存算分离架构下，可以将一个或多个计算节点 (BE) 组成一个计算组 (Compute Group)。本文档介绍如何使用计算组，其中涉及的操作包括："
}
---

在存算分离架构下，可以将一个或多个计算节点 (BE) 组成一个计算组 (Compute Group)。本文档介绍如何使用计算组，其中涉及的操作包括：

- 查看所有计算组
- 计算组授权
- 在用户级别绑定计算组 (`default_compute_group`) 以达到用户级别的隔离效果

*注意*
3.0.2 之前的版本中叫做计算集群（Compute Cluster）。

## 计算组使用场景

在多计算组的架构下，可以通过将一个或多个无状态的 BE 节点组成计算集群，利用计算集群指定语句 (use @<compute_group_name>) 将特定负载分配到特定的计算集群中，从而实现多导入和查询负载的物理隔离。

假设当前有两个计算集群：C1 和 C2。

- **读读隔离**：在发起两个大型查询之前，分别使用 `use @c1` 和 `use @c2`，确保两个查询在不同的计算节点上运行，从而避免在访问相同数据集时因 CPU 和内存等资源竞争而相互干扰。

- **读写隔离**：Doris 的数据导入会消耗大量资源，尤其是在大数据量和高频导入的场景中。为了避免查询和导入之间的资源竞争，可以通过 `use @c1` 和 `use @c2` 指定查询在 C1 上执行，导入在 C2 上执行。同时，C1 计算集群可以访问 C2 计算集群中新导入的数据。

- **写写隔离**：与读写隔离类似，导入之间也可以进行隔离。例如，当系统中存在高频小量导入和大批量导入时，批量导入通常耗时较长且重试成本高，而高频小量导入耗时短且重试成本低。为了避免小量导入对批量导入的干扰，可以通过 `use @c1` 和 `use @c2`，将小量导入指定到 C1 上执行，批量导入指定到 C2 上执行。


## 默认计算组的选择机制

当用户未明确[设置默认计算组](#设置默认计算组)时，系统将自动为用户选择一个具有存活计算节点且用户具有使用权限的计算组。在特定会话中确定默认计算组后，默认计算组将在该会话期间保持不变，除非用户显式更改了默认设置。

在不同次的会话中，若发生以下情况，系统可能会自动更改用户的默认计算组：

- 用户失去了在上次会话中所选择默认计算组的使用权限
- 有计算组被添加或移除
- 上次所选择的默认计算组不再具有存活计算节点

其中，情况一和情况二必定会导致系统自动选择的默认计算组更改，情况三可能会导致更改。

## 查看所有计算组

使用 `SHOW COMPUTE GROUPS` 命令可以查看当前仓库中的所有计算组。返回结果会根据用户权限级别显示不同内容：

- 具有 `ADMIN` 权限的用户可以查看所有计算组
- 普通用户只能查看其拥有使用权限（USAGE_PRIV）的计算组
- 如果用户没有任何计算组的使用权限，则返回结果为空

```sql
SHOW COMPUTE GROUPS;
```

## 添加计算组

操作计算组需要具备 `OPERATOR` 权限，即节点管理权限。有关详细信息，请参阅[权限管理](../sql-manual/sql-statements/account-management/GRANT-TO)。默认情况下，只有 root 账号拥有 `OPERATOR` 权限，但可以通过 `GRANT` 命令将此权限授予其他账号。
要添加 BE 并为其指定计算组，请使用 [Add BE](../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) 命令。例如：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

上面命令会将`host:9050`这台节点添加到`new_group`这个计算组中，您也可以不指定计算组，默认会添加到`default_compute_group`组里，示例：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

## 授予计算组访问权限

前置条件：当前操作用户具备 `ADMIN` 权限，或者当前用户属于 admin role。
```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user}
```

## 撤销计算组访问权限
前置条件：当前操作用户具备 `ADMIN` 权限，或者当前用户属于 admin role。
```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user}
```

## 设置默认计算组 

为当前用户设置默认计算组（此操作需要当前用户已经拥有计算组的使用权限）：

```sql
SET PROPERTY 'default_compute_group' = '{clusterName}';
```

为其他用户设置默认计算组（此操作需要 Admin 权限）：

```sql
SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';
```

查看当前用户默认计算组，返回结果中`default_compute_group` 的值即为默认计算组：

```sql
SHOW PROPERTY;
```

查看其他用户默认计算组，此操作需要当前用户具备 admin 权限，返回结果中`default_compute_group` 的值即为默认计算组：

```sql
SHOW PROPERTY FOR {user};
```

查看当前仓库下所有可用的计算组：

```sql
SHOW COMPUTE GROUPS;
```

:::info 备注

- 若当前用户拥有 Admin 角色，例如：`CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`，则：
  - 可以为自身以及其他用户设置默认计算组；
  - 可以查看自身以及其他用户的 `PROPERTY`。
- 若当前用户无 Admin 角色，例如：`CREATE USER jack1 IDENTIFIED BY '123456'`，则：
  - 可以为自身设置默认计算组；
  - 可以查看自身的 `PROPERTY`；
  - 无法查看所有计算组，因该操作需要 `GRANT ADMIN` 权限。
- 若当前用户未配置默认计算组，现有系统在执行数据读写操作时将会触发错误。为解决这一问题，用户可通过执行 `use @cluster` 命令来指定当前 Context 所使用的计算组，或者使用 `SET PROPERTY` 语句来设置默认计算组。
- 若当前用户已配置默认计算组，但随后该集群被删除，则在执行数据读写操作时同样会触发错误。用户可通过执行 `use @cluster` 命令来重新指定当前 Context 所使用的计算组，或者利用 `SET PROPERTY` 语句来更新默认集群设置。

:::


## 切换计算组

用户可在存算分离架构中指定使用的数据库和计算组。

**语法**

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

若数据库或计算组名称包含是保留关键字，需用反引号将相应的名称 ``` 包围。

## 计算组扩缩容

通过 `ALTER SYSTEM ADD BACKEND` 以及 `ALTER SYSTEM DECOMMISION BACKEND` 添加或者删除 BE 实现计算组的扩缩容。


## 重命名计算组

您可以使用 `ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>` 命令来重命名现有的计算组。请参阅[重命名计算组 SQL 手册](../sql-manual/sql-statements/cluster-management/instance-management/ALTER-SYSTEM-RENAME-COMPUTE-GROUP)

*注意*
在重命名计算组后，拥有旧名称（old_name）计算组权限的用户，或将旧名称设置为默认计算组（default_compute_group）的用户，其权限不会自动更新为新名称（new_name）。需要由具有管理员权限的账户重新设置权限。这与 MySQL 数据库的权限体系保持一致。
