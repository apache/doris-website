---
{
    "title": "SHOW COMPUTE GROUPS",
    "language": "zh-CN",
    "description": "在存算分离模式中，显示当前用户有集群使用权限的计算集群列表"
}
---

## 描述

在存算分离模式中，显示当前用户有集群使用权限的计算集群列表

## 语法

```sql
SHOW COMPUTE GROUPS
```

## 返回值

返回当前拥有计算集群权限的集群列表

- Name - 计算集群 compute group 名字
- IsCurrent 当前用户是否正在使用这个 compute group
- Users 将此项 compute group 设置为 default compute group 的用户名
- BackendNum 此项 compute group 拥有的 backend 个数

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

## 注意事项（Usage Note）

若当前用户无任何 compute group 权限，show compute group 将返回空列表