---
{
    "title": "MODIFY BACKEND",
    "language": "zh-CN",
    "description": "该语句用于修改 BE 节点属性，修改 BE 节点属性后，会影响到当前的节点的查询、写入和数据分布。以下是支持修改的属性："
}
---

## 描述

该语句用于修改 BE 节点属性，修改 BE 节点属性后，会影响到当前的节点的查询、写入和数据分布。以下是支持修改的属性：

| 属性              | 影响                                                                                                                                                       |
|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `tag.location`  | BE 的标签名，默认值为`default`。修改后，会影响到同一标签组内的 BE 数据均衡，以及在建表时，数据分布的 BE 节点。更多信息可参考[Resource Group](../../../../admin-manual/workload-management/resource-group.md) |
| `disable_query` | 是否禁用查询，默认为`false`。设置为`true`后，将不会再有新的查询请求规划到这台 BE 节点上。                                                                                                    |
| `disable_load`  | 是否禁用导入，默认为`false`。设置为`true`后，将不会再有新的导入请求规划到这台 BE 节点上。                                                                                                    |

:::tip
存算分离模式暂不支持此命令。
:::

## 语法

```sql
ALTER SYSTEM MODIFY BACKEND <be_identifier> [, <be_identifier> [...] ]
SET (
     "<key>" = "<value>"
)
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

由于此操作是针对整个 BE 级别的，影响面较广，如果操作不慎，可能会影响到整个集群的正常查询、导入甚至是建表操作。请谨慎操作。

## 示例

1. 修改 BE 的资源标签

```sql
ALTER SYSTEM MODIFY BACKEND "127.0.0.1:9050" SET ("tag.location" = "group_a");
```

2. 修改 BE 的查询禁用属性
   
```sql
ALTER SYSTEM MODIFY BACKEND "10002" SET ("disable_query" = "true");
```

3. 修改 BE 的导入禁用属性
   
```sql
ALTER SYSTEM MODIFY BACKEND "127.0.0.1:9050" SET ("disable_load" = "true");
```
