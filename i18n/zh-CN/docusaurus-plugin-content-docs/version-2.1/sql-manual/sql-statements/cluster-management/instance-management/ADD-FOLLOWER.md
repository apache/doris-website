---
{
    "title": "ADD FOLLOWER",
    "language": "zh-CN"
}
---

## 描述

该语句是增加 FRONTEND 的 FOLLOWER 角色的节点，（仅管理员使用！）

## 语法：

```sql
ALTER SYSTEM ADD FOLLOWER "<follower_host>:<edit_log_port>"
```

## 必选参数

**1. `<follower_host>`**

> 可以是 FE 节点的主机名或 IP 地址

**2. `<edit_log_port>`**

> FE 节点的 bdbje 通信端口，默认为 9010

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限        | 对象 | 说明 |
|-----------|----|----|
| NODE_PRIV |    |    |

## 注意事项

1. 在添加新的 FOLLOWER 节点之前，确保节点已正确配置。
2. 在添加 FOLLOWER 节点之前，确保集群中 FOLLOWER 节点在新增之后数量为奇数个。
3. 添加 FOLLOWER 节点后，使用[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md)命令验证它们是否已成功添加并处于正常状态。

## 示例

1. 添加一个 FOLLOWER 节点

   ```sql
   ALTER SYSTEM ADD FOLLOWER "host_ip:9010"
   ```
   此命令向集群添加一个 FOLLOWER 节点（ IP host_ip，端口 9010）
