---
{
    "title": "SHOW COMPUTE GROUPS",
    "language": "zh-CN",
    "description": "在存算分离模式中，显示当前用户有集群使用权限的计算集群列表"
}
---

## 描述

显示当前用户有使用权限的计算组（Compute Group）列表。

- **存算分离模式**：返回当前用户有使用权限的计算集群列表。
- **存算一体模式**：自 4.1.4 版本起支持。此时把 BE 的资源组（`location` 标签）映射为计算组返回；4.1.4 之前执行会报错 `ERR_NOT_CLOUD_MODE`。

## 语法

```sql
SHOW COMPUTE GROUPS
```

## 返回值

返回当前拥有使用权限的计算组列表。两种模式下返回的列不同。

**存算分离模式：**

- Name - 计算集群 compute group 名字
- IsCurrent 当前用户是否正在使用这个 compute group
- Users 将此项 compute group 设置为 default compute group 的用户名
- BackendNum 此项 compute group 拥有的 backend 个数
- SubComputeGroups / Policy / Properties - 虚拟计算组相关信息

**存算一体模式（4.1.4+）：**

- Name - 计算组（即 BE 的资源组 / `location` 标签）名字
- BackendNum - 该计算组中处于存活且正常状态的 BE 个数

结果按计算组名字排序。

## 示例

指定使用该计算集群 compute_cluster

```sql
 show compute groups;
```

结果为

```sql
+-----------------+-----------+-------+------------+
| Name            | IsCurrent | Users | BackendNum |
+-----------------+-----------+-------+------------+
| compute_cluster | TRUE      |       | 3          |
+-----------------+-----------+-------+------------+
```

## 权限控制

自 4.1.4 版本起，存算一体模式下执行该语句**不再要求全局 `ADMIN_PRIV` 或 `NODE_PRIV`**，与存算分离模式保持一致：当前用户只能看到自己所属计算组允许使用的资源组。

## 注意事项（Usage Note）

- 若当前用户无任何 compute group 权限，`SHOW COMPUTE GROUPS` 将返回空列表。
- 存算一体模式下，如果当前会话的计算组为 `INVALID_COMPUTE_GROUP`，也会返回空结果集。
- `SHOW CLUSTERS` 是等价语句，存算一体模式下返回的列名为 `cluster` 和 `backend_num`。