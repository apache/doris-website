---
{
    "title": "DROP OBSERVER",
    "language": "zh-CN",
    "description": "该语句是删除 FRONTEND 的 OBSERVER 角色的节点，（仅管理员使用！）"
}
---

## 描述

该语句是删除 FRONTEND 的 OBSERVER 角色的节点，（仅管理员使用！）

## 语法

```sql
ALTER SYSTEM DROP OBSERVER "<observer_host>:<edit_log_port>"
```

## 必选参数

**1. `<observer_host>`**

> 可以是 FE 节点的主机名或 IP 地址

**2. `<edit_log_port>`**

> FE 节点的 bdbje 通信端口，默认为 9010

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限        | 对象 | 说明 |
|-----------|----|----|
| NODE_PRIV |    |    |

## 注意事项

1. 删除 OBSERVER 节点后，使用[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md)命令验证它们是否已成功删除。

## 示例

1. 删除一个 OBSERVER 节点

   ```sql
   ALTER SYSTEM DROP OBSERVER "host_ip:9010"
   ```
   此命令是删除集群中的一个 OBSERVER 节点（ IP host_ip，端口 9010）
