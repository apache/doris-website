---
{
    "title": "ADD BACKEND",
    "language": "zh-CN",
    "description": "ADD BACKEND 命令用于向 Doris 集群中添加一个或多个 BE 节点。此命令允许管理员指定新 BE 节点的主机和端口，以及可选的属性来配置它们的行为。"
}
---

## 描述

ADD BACKEND 命令用于向 Doris 集群中添加一个或多个 BE 节点。此命令允许管理员指定新 BE 节点的主机和端口，以及可选的属性来配置它们的行为。

## 语法

```sql
ALTER SYSTEM ADD BACKEND "<host>:<heartbeat_port>"[,"<host>:<heartbeat_port>"...] [PROPERTIES ("<key>"="<value>" [, ...] )]
```

## 必选参数

**1. `<host>`**

> 可以是 BE 节点的主机名或 IP 地址

**2. `<heartbeat_port>`**

> BE 节点的心跳端口，默认为 9050

## 可选参数

**1. PROPERTIES ("key"="value", ...)**

> 一组键值对，用于定义 BE 节点的附加属性。这些属性可用于自定义正在添加的 BE 的配置。可用属性包括：
> - `tag.location`：存算一体模式下用于指定 BE 节点所属的资源组。
> - `tag.compute_group_name`：存算分离模式下用于指定 BE 节点所属的计算组。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限        | 对象 | 说明 |
|-----------|----|----|
| NODE_PRIV |    |    |

## 注意事项

1. 在添加新的 BE 节点之前，确保节点已正确配置并运行。
2. 使用[Resource Group](../../../../admin-manual/workload-management/resource-group.md)可以帮助您更好地管理和组织集群中的 BE 节点。
3. 添加多个 BE 节点时，可以在一个命令中指定它们，以提高效率。
4. 添加 BE 节点后，使用[`SHOW BACKENDS`](./SHOW-BACKENDS.md)命令验证它们是否已成功添加并处于正常状态。
5. 考虑在不同的物理位置或机架上添加 BE 节点，以提高集群的可用性和容错能力。
6. 定期检查和平衡集群中的负载，确保新添加的 BE 节点得到适当利用。

## 示例

1. 不带附加属性添加 BE
   ```sql
   ALTER SYSTEM ADD BACKEND "192.168.0.1:9050,192.168.0.2:9050";
   ```
   此命令向集群添加两个 BE 节点：
   * 192.168.0.1，端口 9050
   * 192.168.0.2，端口 9050
   未指定附加属性，因此将应用默认设置。

2. 存算一体模式下，添加指定资源组的 BE
   ```sql
   ALTER SYSTEM ADD BACKEND "doris-be01:9050" PROPERTIES ("tag.location" = "groupb");
   ```
   此命令将单个 BE 节点（主机名 doris-be01，端口 9050）添加到集群中的资源组`groupb`。

3. 存算分离模式下，添加指定计算组的 BE
   ```sql
   ALTER SYSTEM ADD BACKEND "192.168.0.3:9050" PROPERTIES ("tag.compute_group_name" = "cloud_groupc");
   ```
   此命令将单个 BE 节点（IP 192.168.0.3，端口 9050）添加到集群中的计算组`cloud_groupc`。
