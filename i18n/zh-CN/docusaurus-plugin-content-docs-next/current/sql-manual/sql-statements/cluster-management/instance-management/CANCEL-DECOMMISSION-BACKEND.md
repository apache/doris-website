---
{
    "title": "CANCEL DECOMMISSION BACKEND",
    "language": "zh-CN",
    "description": "该语句用于撤销一个 BE 节点下线操作。"
}
---

## 描述

该语句用于撤销一个 BE 节点下线操作。

:::tip
存算分离模式下不支持此命令
:::

## 语法

```sql
CANCEL DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```

其中：

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## 必选参数

**1. <be_host>**

> 可以是 BE 节点的主机名或 IP 地址

**2. <heartbeat_port>**

> BE 节点的心跳端口，默认为 9050 

**3. <backend_id>**

> BE 节点的 ID

:::tip
`<be_host>`、`<be_heartbeat_port>`及`<backend_id>`均可通过[SHOW BACKENDS](./SHOW-BACKENDS.md)语句查询获得。
:::

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限        | 对象 | 说明 |
|-----------|----|----|
| NODE_PRIV |    |    |

## 注意事项

1. 执行此命令后，可以通过[SHOW BACKENDS](./SHOW-BACKENDS.md)语句查看下线状态（`SystemDecommissioned`列的值为`false`）和下线进度（`TabletNum`列的值不再缓慢下降）
2. 集群会重新慢慢的把其他节点的 tablet 迁移回当前 BE，使得最终每台 BE 的 tablet 数量趋于相近

## 示例

1. 根据 BE 的 Host 和 HeartbeatPort 从集群中安全下线两个节点
   ```sql
   CANCEL DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. 根据 BE 的 ID 从集群中安全下线一个节点
   ```sql
   CANCEL DECOMMISSION BACKEND "10002";
   ```
